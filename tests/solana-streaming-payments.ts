

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
  getOrCreateAssociatedTokenAccount
} from "@solana/spl-token";
import { assert } from "chai";

describe("solana-streaming-payments", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolanaStreamingPayments as Program<SolanaStreamingPayments>;
  
  // Keypairs and addresses
  let mint: PublicKey;
  const payer = provider.wallet.publicKey;
  const payee = anchor.web3.Keypair.generate();  // Generate a new wallet for the payee
  const feeWallet = anchor.web3.Keypair.generate();  // Separate fee wallet for fee collection

  // Token accounts
  let payerToken: PublicKey;
  let payeeToken: PublicKey;
  let feeAccount: PublicKey;

  // PDAs
  let streamPda: PublicKey;
  let escrowPda: PublicKey;

  before(async () => {
    // --- Setup Wallets ---
    // Airdrop SOL to the payee and fee wallet so they can pay for account creation
    const sig1 = await provider.connection.requestAirdrop(payee.publicKey, 1 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(
      { signature: sig1, ...(await provider.connection.getLatestBlockhash()) },
      "confirmed"
    );

    const sig2 = await provider.connection.requestAirdrop(feeWallet.publicKey, 1 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(
      { signature: sig2, ...(await provider.connection.getLatestBlockhash()) },
      "confirmed"
    );
    
    // --- Setup Tokens ---
    // Create a new token mint
    mint = await createMint(
      provider.connection,
      provider.wallet.payer, // Payer of fees
      payer, // Mint authority
      null, // Freeze authority
      9 // Decimals
    );
    
    // Create associated token accounts for each wallet
    payerToken = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        mint,
        payer
      )
    ).address;

    payeeToken = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer, // Payer of fees
      mint,
      payee.publicKey
    );

    feeAccount = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer, // Payer of fees
      mint,
      feeWallet.publicKey
    );

    // Mint some tokens to the payer's account so they can fund the stream
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mint,
      payerToken,
      payer,
      100 * LAMPORTS_PER_SOL
    );

    // --- Derive PDA Addresses ---
    // Derive the PDA for the stream state account
    [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stream"), payer.toBuffer(), payee.publicKey.toBuffer()],
      program.programId
    );

    // Derive the PDA for the program-controlled escrow token account
    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), payer.toBuffer(), payee.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Creates a stream", async () => {
    const streamAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);
    const ratePerMinute = new anchor.BN(1 * LAMPORTS_PER_SOL); // 1 token per minute
    const durationMinutes = new anchor.BN(10);
    const feePercentage = 5; // 5%

    await program.methods
      .createStream(streamAmount, ratePerMinute, durationMinutes, feePercentage)
      .accounts({
        stream: streamPda,
        escrowToken: escrowPda,
        payer: payer,
        payee: payee.publicKey,
        mint: mint,
        payerToken: payerToken,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // --- Verification ---
    const streamAccount = await program.account.stream.fetch(streamPda);
    assert.equal(streamAccount.payer.toString(), payer.toString());
    assert.equal(streamAccount.payee.toString(), payee.publicKey.toString());
    assert.equal(streamAccount.amount.toString(), streamAmount.toString());
    assert.equal(
      streamAccount.ratePerMinute.toString(),
      ratePerMinute.toString()
    );
    assert.equal(streamAccount.feePercentage, feePercentage);
    assert.isNotNull(streamAccount.streamBump);
    assert.isNotNull(streamAccount.escrowBump);

    // Check that the escrow PDA now holds the funds
    const escrowTokenAccount = await getAccount(provider.connection, escrowPda);
    assert.equal(
      escrowTokenAccount.amount.toString(),
      streamAmount.toString()
    );
  });

  it("Redeems from the stream as the payee", async () => {
    // Wait for 1 minute to ensure there are tokens available to redeem
    console.log(
      "Waiting for 65 seconds to ensure tokens are available for redemption..."
    );
    await new Promise((resolve) => setTimeout(resolve, 65000));

    // The `redeemStream` method no longer takes arguments
    await program.methods
      .redeemStream()
      .accounts({
        stream: streamPda,
        escrowToken: escrowPda,
        payee: payee.publicKey,
        payer: payer, // Payer pubkey is still needed for seed derivation
        payeeToken: payeeToken,
        feeAccount: feeAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payee]) // Only the payee needs to sign
      .rpc();

    // --- Verification ---
    const payeeTokenAccount = await getAccount(provider.connection, payeeToken);
    const feeTokenAccount = await getAccount(provider.connection, feeAccount);
    const streamAccount = await program.account.stream.fetch(streamPda);

    // Expected amounts for 1 minute (rate is 1 SOL/min)
    const expectedRedeemed = new anchor.BN(1 * LAMPORTS_PER_SOL);
    const expectedFee = expectedRedeemed.muln(5).divn(100); // 5% fee
    const expectedToPayee = expectedRedeemed.sub(expectedFee);

    console.log(`Payee should receive: ${expectedToPayee}`);
    console.log(`Fee account should receive: ${expectedFee}`);

    assert.equal(
      payeeTokenAccount.amount.toString(),
      expectedToPayee.toString(),
      "Payee did not receive the correct amount"
    );
    assert.equal(
      feeTokenAccount.amount.toString(),
      expectedFee.toString(),
      "Fee account did not receive the correct amount"
    );
    assert.equal(
      streamAccount.redeemed.toString(),
      expectedRedeemed.toString(),
      "Stream redeemed amount was not updated correctly"
    );
  });
});