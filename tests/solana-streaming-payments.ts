import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaStreamingPayments } from "../target/types/solana_streaming_payments";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";
import { assert } from "chai";

describe("solana-streaming-payments", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolanaStreamingPayments as Program<SolanaStreamingPayments>;

  it("Creates a stream", async () => {
    const payer = provider.wallet.publicKey;
    const payee = anchor.web3.Keypair.generate().publicKey;
    const mint = await createMint(provider.connection, provider.wallet.payer, payer, null, 9);
    const payerToken = await createAccount(provider.connection, provider.wallet.payer, mint, payer);
    const escrowToken = await createAccount(provider.connection, provider.wallet.payer, mint, program.programId);
    await mintTo(provider.connection, provider.wallet.payer, mint, payerToken, provider.wallet.payer, 100 * LAMPORTS_PER_SOL);

    const [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stream"), payer.toBuffer(), payee.toBuffer()],
      program.programId
    );

    await program.methods
      .createStream(new anchor.BN(100 * LAMPORTS_PER_SOL), new anchor.BN(1 * LAMPORTS_PER_SOL), new anchor.BN(60), 5)
      .accounts({
        stream: streamPda,
        payer,
        payee,
        payerToken,
        escrowToken,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const streamAccount = await program.account.stream.fetch(streamPda);
    assert.equal(streamAccount.payer.toString(), payer.toString());
    assert.equal(streamAccount.payee.toString(), payee.toString());
    assert.equal(streamAccount.amount.toString(), (100 * LAMPORTS_PER_SOL).toString());
    assert.equal(streamAccount.ratePerMinute.toString(), (1 * LAMPORTS_PER_SOL).toString());
    assert.equal(streamAccount.feePercentage, 5);
  });

  it("Redeems a stream", async () => {
    const payer = provider.wallet.publicKey;
    const payee = anchor.web3.Keypair.generate();
    const mint = await createMint(provider.connection, provider.wallet.payer, payer, null, 9);
    const payerToken = await createAccount(provider.connection, provider.wallet.payer, mint, payer);
    const payeeToken = await createAccount(provider.connection, provider.wallet.payer, mint, payee.publicKey);
    const escrowToken = await createAccount(provider.connection, provider.wallet.payer, mint, program.programId);
    const feeAccount = await createAccount(provider.connection, provider.wallet.payer, mint, payer);
    await mintTo(provider.connection, provider.wallet.payer, mint, payerToken, provider.wallet.payer, 100 * LAMPORTS_PER_SOL);

    const [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stream"), payer.toBuffer(), payee.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createStream(new anchor.BN(100 * LAMPORTS_PER_SOL), new anchor.BN(1 * LAMPORTS_PER_SOL), new anchor.BN(60), 5)
      .accounts({
        stream: streamPda,
        payer,
        payee: payee.publicKey,
        payerToken,
        escrowToken,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    await new Promise(resolve => setTimeout(resolve, 1000));

    await program.methods
      .redeemStream(new anchor.BN(1))
      .accounts({
        stream: streamPda,
        payer,
        payee: payee.publicKey,
        payeeToken,
        escrowToken,
        feeAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payee])
      .rpc();

    const payeeTokenAccount = await getAccount(provider.connection, payeeToken);
    assert(payeeTokenAccount.amount > 0, "Payee should have received tokens");
  });
});