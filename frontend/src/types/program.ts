import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface StreamAccount {
  payer: PublicKey;
  payee: PublicKey;
  amount: BN;
  ratePerMinute: BN;
  startTime: BN;
  durationMinutes: BN;
  feePercentage: number;
  redeemed: BN;
  bump: number;
}

export interface CreateStreamParams {
  amount: BN;
  ratePerMinute: BN;
  durationMinutes: BN;
  feePercentage: number;
}

export interface StreamData {
  publicKey: PublicKey;
  account: StreamAccount;
}