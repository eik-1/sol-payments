

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaStreamingPayments } from "../target/types/solana_streaming_payments";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  mintTo, 
  getAccount, 
  createAssociatedTokenAccount,
  getOrCreateAssociatedTokenAccount,
  createInitializeAccountInstruction
} from "@solana/spl-token";
import { assert } from "chai";

describe("solana-streaming-payments", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolanaStreamingPayments as Program<SolanaStreamingPayments>;
  
  let mint: PublicKey;
  let payer: PublicKey;
  let payee: Keypair;
  let payerToken: PublicKey;
  let payeeToken: PublicKey;
  let escrowToken: PublicKey;
  let feeAccount: PublicKey;
  let streamPda: PublicKey;
  let streamBump: number;
  
  before(async () => {
    // Setup accounts and tokens
    payer = provider.wallet.publicKey;
    payee = anchor.web3.Keypair.generate();
    
    // Airdrop SOL to payee for rent
    const signature = await provider.connection.requestAirdrop(
      payee.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
    
    // Create mint
    mint = await createMint(
      provider.connection,
      provider.wallet.payer,
      payer,
      null,
      9
    );
    
    // Create token accounts
    payerToken = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mint,
      payer
    );
    
    payeeToken = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mint,
      payee.publicKey
    );
    
    // Create a second token account for the payer to use as escrow
    // We'll create a regular token account with a new keypair
    const escrowKeypair = Keypair.generate();
    
    // Create the token account
    const tx = new anchor.web3.Transaction().add(
      // Create account
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: escrowKeypair.publicKey,
        space: 165, // Size of token account
        lamports: await provider.connection.getMinimumBalanceForRentExemption(165),
        programId: TOKEN_PROGRAM_ID,
      }),
      // Initialize token account
      createInitializeAccountInstruction(
        escrowKeypair.publicKey,
        mint,
        payer
      )
    );
    
    await provider.sendAndConfirm(tx, [escrowKeypair]);
    escrowToken = escrowKeypair.publicKey;
    
    // Create fee account (reuse payer token account for simplicity)
    feeAccount = payerToken;
    
    // Mint tokens to payer
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mint,
      payerToken,
      payer,
      100 * LAMPORTS_PER_SOL
    );
    
    // Find PDA for stream
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("stream"), payer.toBuffer(), payee.publicKey.toBuffer()],
      program.programId
    );
    streamPda = pda;
    streamBump = bump;
  });

  it("Creates a stream", async () => {
    await program.methods
      .createStream(
        new anchor.BN(10 * LAMPORTS_PER_SOL), 
        new anchor.BN(5 * LAMPORTS_PER_SOL), // 5 tokens per minute
        new anchor.BN(60), 
        5
      )
      .accounts({
        stream: streamPda,
        payer: payer,
        payee: payee.publicKey,
        payerToken: payerToken,
        escrowToken: escrowToken,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const streamAccount = await program.account.stream.fetch(streamPda);
    assert.equal(streamAccount.payer.toString(), payer.toString());
    assert.equal(streamAccount.payee.toString(), payee.publicKey.toString());
    assert.equal(streamAccount.amount.toString(), (10 * LAMPORTS_PER_SOL).toString());
    assert.equal(streamAccount.ratePerMinute.toString(), (5 * LAMPORTS_PER_SOL).toString());
    assert.equal(streamAccount.feePercentage, 5);
    assert.equal(streamAccount.bump, streamBump);
    
    // Check escrow token balance
    const escrowTokenAccount = await getAccount(provider.connection, escrowToken);
    assert.equal(escrowTokenAccount.amount.toString(), (10 * LAMPORTS_PER_SOL).toString());
  });

  it("Redeems a stream", async () => {
    // Wait for at least 1 minute to ensure there are tokens available to redeem
    console.log("Waiting for 65 seconds to ensure tokens are available for redemption...");
    await new Promise(resolve => setTimeout(resolve, 65000));

    await program.methods
      .redeemStream(new anchor.BN(1))
      .accounts({
        stream: streamPda,
        payer: payer,
        payee: payee.publicKey,
        payeeToken: payeeToken,
        escrowToken: escrowToken,
        feeAccount: feeAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payee])
      .rpc();

    // Check payee token balance
    const payeeTokenAccount = await getAccount(provider.connection, payeeToken);
    console.log(`Payee received: ${payeeTokenAccount.amount.toString()} tokens`);
    assert(Number(payeeTokenAccount.amount) > 0, "Payee should have received tokens");
    
    // Check stream account was updated
    const streamAccount = await program.account.stream.fetch(streamPda);
    assert(streamAccount.redeemed > 0, "Stream should have recorded redemption");
  });

  it("Reclaims a stream after expiration", async () => {
    // Create a new stream with a very short duration
    const shortStreamPayee = anchor.web3.Keypair.generate();
    const shortStreamPayeeToken = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mint,
      shortStreamPayee.publicKey
    );
    
    // Create a new escrow token account for this stream
    const shortStreamEscrowKeypair = Keypair.generate();
    
    // Create the token account
    const tx = new anchor.web3.Transaction().add(
      // Create account
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: shortStreamEscrowKeypair.publicKey,
        space: 165, // Size of token account
        lamports: await provider.connection.getMinimumBalanceForRentExemption(165),
        programId: TOKEN_PROGRAM_ID,
      }),
      // Initialize token account
      createInitializeAccountInstruction(
        shortStreamEscrowKeypair.publicKey,
        mint,
        payer
      )
    );
    
    await provider.sendAndConfirm(tx, [shortStreamEscrowKeypair]);
    const shortStreamEscrowToken = shortStreamEscrowKeypair.publicKey;
    
    // Mint tokens to the payer's token account
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mint,
      payerToken,
      payer,
      10 * LAMPORTS_PER_SOL
    );
    
    // Find PDA for the new stream
    const [shortStreamPda, shortStreamBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("stream"), payer.toBuffer(), shortStreamPayee.publicKey.toBuffer()],
      program.programId
    );
    
    // Transfer tokens to the escrow
    await program.methods
      .createStream(
        new anchor.BN(5 * LAMPORTS_PER_SOL), 
        new anchor.BN(5 * LAMPORTS_PER_SOL), // High rate to ensure full redemption
        new anchor.BN(1), // 1 minute duration
        5
      )
      .accounts({
        stream: shortStreamPda,
        payer: payer,
        payee: shortStreamPayee.publicKey,
        payerToken: payerToken,
        escrowToken: shortStreamEscrowToken,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    // Wait for the stream to expire (a bit more than 1 minute)
    console.log("Waiting for 65 seconds for stream to expire...");
    await new Promise(resolve => setTimeout(resolve, 65000));
    
    // Reclaim the stream
    await program.methods
      .reclaimStream(new anchor.BN(1))
      .accounts({
        stream: shortStreamPda,
        payer: payer,
        payee: shortStreamPayee.publicKey,
        escrowToken: shortStreamEscrowToken,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    // Check stream account was updated
    const streamAccount = await program.account.stream.fetch(shortStreamPda);
    assert.equal(
      streamAccount.redeemed.toString(), 
      streamAccount.amount.toString(),
      "Stream should be fully redeemed after reclaim"
    );
  });
});