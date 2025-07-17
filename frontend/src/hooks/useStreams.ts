import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from './useProgram';
import { StreamData } from '../types/program';

export const useStreams = () => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStreams = useCallback(async () => {
    if (!program || !publicKey) {
      setStreams([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all stream accounts where user is either payer or payee
      const allStreams = await program.account.stream.all();
      
      const userStreams = allStreams.filter(stream => 
        stream.account.payer.equals(publicKey) || 
        stream.account.payee.equals(publicKey)
      );

      setStreams(userStreams);
    } catch (err) {
      console.error('Error fetching streams:', err);
      setError('Failed to fetch streams');
    } finally {
      setLoading(false);
    }
  }, [program, publicKey]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  return {
    streams,
    loading,
    error,
    refetch: fetchStreams
  };
};