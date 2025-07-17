import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { BN, Program } from '@coral-xyz/anchor';
import { SolanaStreamingPayments } from '../idl/solana_streaming_payments';
import { CreateStreamParams } from '../types/program';

export class StreamService {
  constructor(private program: Program<SolanaStreamingPayments>) {}

  async createStream(
    payee: PublicKey,
    mint: PublicKey,
    params: CreateStreamParams
  ) {
    if (!this.program.provider.publicKey) {
      throw new Error('Wallet not connected');
    }

    const payer = this.program.provider.publicKey;

    // Find stream PDA
    const [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stream'), payer.toBuffer(), payee.toBuffer()],
      this.program.programId
    );

    // Get token accounts
    const payerToken = await getAssociatedTokenAddress(mint, payer);
    
    // Create escrow token account (new keypair)
    const escrowKeypair = Keypair.generate();
    
    const tx = await this.program.methods
      .createStream(
        params.amount,
        params.ratePerMinute,
        params.durationMinutes,
        params.feePercentage
      )
      .accounts({
        stream: streamPda,
        payer,
        payee,
        payerToken,
        escrowToken: escrowKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .preInstructions([
        // Create escrow token account
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: escrowKeypair.publicKey,
          space: 165, // Token account size
          lamports: await this.program.provider.connection.getMinimumBalanceForRentExemption(165),
          programId: TOKEN_PROGRAM_ID,
        }),
        // Initialize token account
        // Note: You'll need to add the initialize instruction here
      ])
      .signers([escrowKeypair])
      .rpc();

    return { signature: tx, streamPda };
  }

  async redeemStream(
    streamPda: PublicKey,
    payer: PublicKey,
    payee: PublicKey,
    mint: PublicKey,
    escrowToken: PublicKey,
    feeAccount: PublicKey
  ) {
    if (!this.program.provider.publicKey) {
      throw new Error('Wallet not connected');
    }

    const payeeToken = await getAssociatedTokenAddress(mint, payee);

    const tx = await this.program.methods
      .redeemStream(new BN(1)) // seed parameter
      .accounts({
        stream: streamPda,
        payer,
        payee,
        payeeToken,
        escrowToken,
        feeAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  async reclaimStream(
    streamPda: PublicKey,
    payer: PublicKey,
    payee: PublicKey,
    escrowToken: PublicKey
  ) {
    if (!this.program.provider.publicKey) {
      throw new Error('Wallet not connected');
    }

    const tx = await this.program.methods
      .reclaimStream(new BN(1)) // seed parameter
      .accounts({
        stream: streamPda,
        payer,
        payee,
        escrowToken,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  findStreamPda(payer: PublicKey, payee: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('stream'), payer.toBuffer(), payee.toBuffer()],
      this.program.programId
    );
  }
}