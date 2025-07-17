import { BN } from '@coral-xyz/anchor';
import { StreamAccount } from '../types/program';

export const calculateStreamProgress = (stream: StreamAccount): number => {
  const now = Math.floor(Date.now() / 1000);
  const startTime = stream.startTime.toNumber();
  const durationSeconds = stream.durationMinutes.toNumber() * 60;
  const endTime = startTime + durationSeconds;

  if (now < startTime) return 0;
  if (now >= endTime) return 100;

  const elapsed = now - startTime;
  return Math.min((elapsed / durationSeconds) * 100, 100);
};

export const calculateRedeemableAmount = (stream: StreamAccount): BN => {
  const now = Math.floor(Date.now() / 1000);
  const startTime = stream.startTime.toNumber();
  const elapsedMinutes = Math.floor((now - startTime) / 60);
  
  if (elapsedMinutes <= 0) return new BN(0);
  
  const totalRedeemable = new BN(elapsedMinutes).mul(stream.ratePerMinute);
  const availableToRedeem = totalRedeemable.sub(stream.redeemed);
  
  return BN.max(availableToRedeem, new BN(0));
};

export const getStreamStatus = (stream: StreamAccount): 'active' | 'completed' | 'expired' => {
  const now = Math.floor(Date.now() / 1000);
  const startTime = stream.startTime.toNumber();
  const endTime = startTime + (stream.durationMinutes.toNumber() * 60);
  
  if (stream.redeemed.gte(stream.amount)) return 'completed';
  if (now >= endTime) return 'expired';
  return 'active';
};

export const formatTokenAmount = (amount: BN, decimals: number = 9): string => {
  const divisor = new BN(10).pow(new BN(decimals));
  const quotient = amount.div(divisor);
  const remainder = amount.mod(divisor);
  
  if (remainder.isZero()) {
    return quotient.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmedRemainder = remainderStr.replace(/0+$/, '');
  
  return trimmedRemainder ? `${quotient}.${trimmedRemainder}` : quotient.toString();
};

export const parseTokenAmount = (amount: string, decimals: number = 9): BN => {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const fullAmount = whole + paddedFraction;
  return new BN(fullAmount);
};

export const getTimeRemaining = (stream: StreamAccount): string => {
  const now = Math.floor(Date.now() / 1000);
  const startTime = stream.startTime.toNumber();
  const endTime = startTime + (stream.durationMinutes.toNumber() * 60);
  
  if (now >= endTime) return 'Completed';
  
  const remainingSeconds = endTime - now;
  const minutes = Math.floor(remainingSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};