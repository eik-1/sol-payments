"use client";
import React, { useState } from "react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import BN from "bn.js";

const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const PROGRAM_ID = new PublicKey("RMTdcrr5L5M32zBy86nQRghzfcBWVLQZ5AzFwiwsL62");

function encodeU64(num: number | string | bigint) {
  return new BN(num).toArrayLike(Buffer, "le", 8);
}

export default function RedeemStreamForm() {
  const [streamId, setStreamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const inputStyle = {
    width: "100%",
    padding: 8,
    marginTop: 4,
    borderRadius: 8,
    border: "1.5px solid #bbb",
    color: "#222",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border 0.2s",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.border = "2px solid #10b981";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.border = "1.5px solid #bbb";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!publicKey) {
      setMessage("Connect your wallet first.");
      return;
    }
    setLoading(true);
    try {
      const streamPubkey = new PublicKey(streamId.trim());
      // Fetch stream account data to get payer/payee (optional, if you want to show info)
      // For now, assume payer/payee are known or can be derived
      // Derive PDAs
      // You may need to fetch the stream account to get payer/payee for correct PDA derivation
      // For this example, we'll assume the user is the payee and knows the payer
      // In production, fetch the stream account data to get payer/payee
      // For now, just use the streamPubkey as the stream account
      // Build instruction data
      const discriminator = Buffer.from([59,108,27,226,102,21,125,225]); // from IDL
      // redeem_stream takes no args, so only discriminator
      const data = discriminator;
      // You must provide all required accounts in the correct order
      // This is a placeholder; you must fill in the correct accounts for your program
      // For now, just show an error if not implemented
      setMessage("Manual redeem_stream not fully implemented. You must fetch the stream account and provide all required accounts.");
      setLoading(false);
      return;
      // Example (not complete):
      // const keys = [ ... ];
      // const ix = new TransactionInstruction({
      //   programId: PROGRAM_ID,
      //   keys,
      //   data,
      // });
      // const tx = new Transaction().add(ix);
      // const sig = await sendTransaction(tx, connection);
      // await connection.confirmTransaction(sig, "confirmed");
      // setMessage("Redeemed successfully! Tx: " + sig);
    } catch (err: any) {
      setMessage("Error: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 400,
        margin: "32px auto",
        padding: 24,
        borderRadius: 16,
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <h2 style={{ marginBottom: 8, textAlign: "center", color: "#222" }}>Redeem Stream</h2>
      <label style={{ fontWeight: 600, color: "#222" }}>
        Stream Address/ID
        <input
          value={streamId}
          onChange={e => setStreamId(e.target.value)}
          required
          placeholder="Enter stream address or ID"
          style={inputStyle}
          title="The address or ID of the stream you want to redeem from."
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </label>
      <button
        type="submit"
        style={{
          marginTop: 12,
          padding: "10px 0",
          borderRadius: 8,
          border: "none",
          background: loading ? "#a5b4fc" : "#10b981",
          color: "#fff",
          fontWeight: 600,
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
        disabled={loading}
        onMouseOver={e => { if (!loading) e.currentTarget.style.background = "#059669"; }}
        onMouseOut={e => { if (!loading) e.currentTarget.style.background = "#10b981"; }}
      >
        {loading ? "Redeeming..." : "Redeem"}
      </button>
      {message && (
        <div style={{ color: message.startsWith("Error") ? "#dc2626" : "#059669", marginTop: 8, textAlign: "center" }}>
          {message}
        </div>
      )}
    </form>
  );
} 