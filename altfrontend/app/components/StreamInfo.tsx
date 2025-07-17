"use client";
import React from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import BN from "bn.js";

const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const PROGRAM_ID = new PublicKey("RMTdcrr5L5M32zBy86nQRghzfcBWVLQZ5AzFwiwsL62");

// Helper to decode Stream account data (layout from IDL)
function decodeStreamAccount(data: Buffer) {
  // Discriminator (8 bytes) + fields
  return {
    payer: new PublicKey(data.slice(8, 40)),
    payee: new PublicKey(data.slice(40, 72)),
    mint: new PublicKey(data.slice(72, 104)),
    amount: new BN(data.slice(104, 112), 'le'),
    rate_per_minute: new BN(data.slice(112, 120), 'le'),
    start_time: data.readBigInt64LE(120),
    duration_minutes: new BN(data.slice(128, 136), 'le'),
    fee_percentage: data.readUInt8(136),
    redeemed: new BN(data.slice(137, 145), 'le'),
    stream_bump: data.readUInt8(145),
    escrow_bump: data.readUInt8(146),
    escrow_authority_bump: data.readUInt8(147),
  };
}

export default function StreamInfo() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [payeeInput, setPayeeInput] = useState("");
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStreams([]);
    if (!publicKey) {
      setError("Connect your wallet first.");
      return;
    }
    setLoading(true);
    try {
      const payee = new PublicKey(payeeInput.trim());
      const [streamPda] = await PublicKey.findProgramAddress(
        [Buffer.from("stream"), publicKey.toBuffer(), payee.toBuffer()],
        PROGRAM_ID
      );
      const acc = await connection.getAccountInfo(streamPda);
      if (acc && acc.data.length > 0) {
        const decoded = decodeStreamAccount(acc.data);
        setStreams([{ pubkey: streamPda.toBase58(), ...decoded }]);
      } else {
        setStreams([]);
        setError("No stream found for this payer/payee pair.");
      }
    } catch (e: any) {
      setError("Invalid payee address or error fetching stream.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "32px auto",
        padding: 24,
        borderRadius: 16,
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        background: "#fff",
      }}
    >
      <h2 style={{ marginBottom: 16, textAlign: "center", color: "#222" }}>My Streams</h2>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={payeeInput}
          onChange={e => setPayeeInput(e.target.value)}
          placeholder="Enter payee address"
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1.5px solid #bbb", fontSize: 16 }}
        />
        <button
          type="submit"
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 16 }}
        >
          Search
        </button>
      </form>
      {loading ? (
        <div style={{ textAlign: "center", color: "#888" }}>Loading...</div>
      ) : error ? (
        <div style={{ textAlign: "center", color: "#dc2626" }}>{error}</div>
      ) : streams.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888" }}>No streams found for this payer/payee pair.</div>
      ) : (
        <table style={{ width: "100%", fontSize: 14, marginTop: 12 }}>
          <thead>
            <tr style={{ color: "#555" }}>
              <th align="left">Stream</th>
              <th align="left">Payee</th>
              <th align="right">Amount</th>
              <th align="right">Rate/min</th>
              <th align="right">Redeemed</th>
              <th align="right">Duration</th>
              <th align="right">Fee %</th>
            </tr>
          </thead>
          <tbody>
            {streams.map((s) => (
              <tr key={s.pubkey}>
                <td>{s.pubkey.slice(0, 6)}...{s.pubkey.slice(-4)}</td>
                <td>{s.payee.toBase58().slice(0, 6)}...{s.payee.toBase58().slice(-4)}</td>
                <td align="right">{(Number(s.amount) / 1_000_000).toLocaleString()}</td>
                <td align="right">{(Number(s.rate_per_minute) / 1_000_000).toLocaleString()}</td>
                <td align="right">{(Number(s.redeemed) / 1_000_000).toLocaleString()}</td>
                <td align="right">{s.duration_minutes.toString()}</td>
                <td align="right">{s.fee_percentage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 