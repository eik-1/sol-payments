"use client";
import React, { useState } from "react";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import BN from "bn.js";

const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const PROGRAM_ID = new PublicKey("RMTdcrr5L5M32zBy86nQRghzfcBWVLQZ5AzFwiwsL62");

function encodeU64(num: number | string | bigint) {
  return new BN(num).toArrayLike(Buffer, "le", 8);
}

export default function CreateStreamForm() {
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [duration, setDuration] = useState("");
  const [fee, setFee] = useState("");
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
    background: "#fff",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border 0.2s",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.border = "2px solid #6366f1";
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
      const payeeKey = payee.trim();
      if (!payeeKey || !amount || !rate || !duration || !fee) {
        setMessage("All fields are required.");
        setLoading(false);
        return;
      }
      const payer = publicKey;
      const payeePubkey = new PublicKey(payeeKey);
      // Derive PDAs
      const [streamPda] = await PublicKey.findProgramAddress(
        [Buffer.from("stream"), payer.toBuffer(), payeePubkey.toBuffer()],
        PROGRAM_ID
      );
      const [escrowAuthorityPda] = await PublicKey.findProgramAddress(
        [Buffer.from("escrow_authority"), payer.toBuffer(), payeePubkey.toBuffer()],
        PROGRAM_ID
      );
      const [escrowTokenPda] = await PublicKey.findProgramAddress(
        [Buffer.from("escrow"), payer.toBuffer(), payeePubkey.toBuffer()],
        PROGRAM_ID
      );
      // Create transaction instance before adding any instructions
      const tx = new Transaction();
      // Associated token accounts
      let payerToken = await getAssociatedTokenAddress(USDC_MINT, payer);
      try {
        await getAccount(connection, payerToken);
      } catch (e) {
        // Token account does not exist, create it
        const ataIx = createAssociatedTokenAccountInstruction(
          payer, // payer
          payerToken, // ata
          payer, // owner
          USDC_MINT
        );
        tx.add(ataIx);
      }
      // Build instruction data
      const discriminator = Buffer.from([71,188,111,127,108,40,229,158]);
      const amountBuf = encodeU64(Math.floor(parseFloat(amount) * 1_000_000));
      const rateBuf = encodeU64(Math.floor(parseFloat(rate) * 1_000_000));
      const durationBuf = encodeU64(parseInt(duration));
      const feeBuf = Buffer.from([parseInt(fee)]);
      const data = Buffer.concat([discriminator, amountBuf, rateBuf, durationBuf, feeBuf]);
      // Build accounts array in the exact order as the Anchor IDL
      const keys = [
        { pubkey: streamPda, isSigner: false, isWritable: true },
        { pubkey: escrowAuthorityPda, isSigner: false, isWritable: false },
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: payeePubkey, isSigner: false, isWritable: false },
        { pubkey: USDC_MINT, isSigner: false, isWritable: false },
        { pubkey: payerToken, isSigner: false, isWritable: true },
        { pubkey: escrowTokenPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];
      // Add the main instruction
      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys,
        data,
      });
      tx.add(ix);
      // Create and send transaction
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setMessage("Stream created successfully! Tx: " + sig);
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
      <h2 style={{ marginBottom: 8, textAlign: "center", color: "#222" }}>Create Stream</h2>
      <label style={{ fontWeight: 600, color: "#222" }}>
        Payee Address
        <input
          value={payee}
          onChange={e => setPayee(e.target.value)}
          required
          placeholder="Enter recipient's wallet address"
          style={inputStyle}
          title="The Solana address of the payee who will receive the stream."
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </label>
      <label style={{ fontWeight: 600, color: "#222" }}>
        Amount (USDC)
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
          min={0}
          placeholder="Total amount to stream (in USDC)"
          style={inputStyle}
          title="Total amount of tokens to lock in the stream."
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </label>
      <label style={{ fontWeight: 600, color: "#222" }}>
        Rate per Minute (USDC)
        <input
          type="number"
          value={rate}
          onChange={e => setRate(e.target.value)}
          required
          min={0}
          placeholder="Tokens released per minute (in USDC)"
          style={inputStyle}
          title="How many tokens are released to the payee per minute."
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </label>
      <label style={{ fontWeight: 600, color: "#222" }}>
        Duration (minutes)
        <input
          type="number"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          required
          min={1}
          placeholder="How long the stream lasts"
          style={inputStyle}
          title="Total duration of the stream in minutes."
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </label>
      <label style={{ fontWeight: 600, color: "#222" }}>
        Fee Percentage
        <input
          type="number"
          value={fee}
          onChange={e => setFee(e.target.value)}
          required
          min={0}
          max={100}
          placeholder="Fee % (e.g. 5)"
          style={inputStyle}
          title="Percentage fee taken from each redemption."
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
          background: loading ? "#a5b4fc" : "#6366f1",
          color: "#fff",
          fontWeight: 600,
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
        disabled={loading}
        onMouseOver={e => { if (!loading) e.currentTarget.style.background = "#4f46e5"; }}
        onMouseOut={e => { if (!loading) e.currentTarget.style.background = "#6366f1"; }}
      >
        {loading ? "Creating..." : "Create Stream"}
      </button>
      {message && (
        <div style={{ color: message.startsWith("Error") ? "#dc2626" : "#059669", marginTop: 8, textAlign: "center" }}>
          {message}
        </div>
      )}
    </form>
  );
} 