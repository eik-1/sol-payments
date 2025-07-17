import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

export const PROGRAM_ID = new PublicKey("RMTdcrr5L5M32zBy86nQRghzfcBWVLQZ5AzFwiwsL62");
export const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export async function getCreateStreamInstruction({
  payer,
  payee,
  amount,
  ratePerMinute,
  durationMinutes,
  feePercentage,
  connection,
}: {
  payer: PublicKey;
  payee: PublicKey;
  amount: number; // in UI units (e.g. 1.23 USDC)
  ratePerMinute: number; // in UI units
  durationMinutes: number;
  feePercentage: number;
  connection: any;
}): Promise<TransactionInstruction> {
  // Get decimals for mint
  const mintInfo = await connection.getParsedAccountInfo(USDC_MINT);
  const decimals = 6; // USDC is 6 decimals; you can parse from mintInfo if needed
  const amountTokens = Math.round(amount * 10 ** decimals);
  const rateTokens = Math.round(ratePerMinute * 10 ** decimals);

  // Derive PDAs
  const [streamPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("stream"), payer.toBuffer(), payee.toBuffer()],
    PROGRAM_ID
  );
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), payer.toBuffer(), payee.toBuffer()],
    PROGRAM_ID
  );
  const [escrowAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_authority"), payer.toBuffer(), payee.toBuffer()],
    PROGRAM_ID
  );
  const payerToken = await getAssociatedTokenAddress(USDC_MINT, payer);

  // Build instruction data (discriminator + args)
  const msg = "global:create_stream";
  const hash = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
  const discriminator = Buffer.from(hash).subarray(0, 8);
  const data = Buffer.alloc(8 + 8 + 8 + 8 + 1);
  discriminator.copy(data, 0);
  data.writeBigUInt64LE(BigInt(amountTokens), 8);
  data.writeBigUInt64LE(BigInt(rateTokens), 16);
  data.writeBigUInt64LE(BigInt(durationMinutes), 24);
  data.writeUInt8(feePercentage, 32);

  // Build instruction
  const keys = [
    { pubkey: streamPda, isSigner: false, isWritable: true },
    { pubkey: escrowPda, isSigner: false, isWritable: true },
    { pubkey: escrowAuthority, isSigner: false, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: payee, isSigner: false, isWritable: false },
    { pubkey: USDC_MINT, isSigner: false, isWritable: false },
    { pubkey: payerToken, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data,
  });
} 