import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { IDL, SolanaStreamingPayments } from '../idl/solana_streaming_payments';

const PROGRAM_ID = new PublicKey('294BsSNNf6Nt5T7xQZWSSQ5nAcPhcmkdtgkuUj2woCox');

export const useProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      AnchorProvider.defaultOptions()
    );

    return new Program<SolanaStreamingPayments>(
      IDL as Idl,
      PROGRAM_ID,
      provider
    );
  }, [connection, wallet]);

  return { program, programId: PROGRAM_ID };
};