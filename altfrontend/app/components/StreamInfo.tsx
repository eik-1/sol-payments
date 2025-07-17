"use client";
import React from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState, useCallback } from "react";
import BN from "bn.js";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { sendTransaction } from "@solana/wallet-adapter-base";

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

function explorerUrl(address: string, type: 'address' | 'tx' = 'address') {
  return `https://explorer.solana.com/${type}/${address}?cluster=devnet`;
}

function CopyButton({ value }: { value: string }) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
  }, [value]);
  return (
    <button onClick={handleCopy} title="Copy" style={{ marginLeft: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 15, verticalAlign: 'middle' }}>
      📋
    </button>
  );
}

export default function StreamInfo() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [payeeInput, setPayeeInput] = useState("");
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamPda, setStreamPda] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [streamId, setStreamId] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStreams([]);
    setStreamPda("");
    if (!publicKey) {
      setError("Connect your wallet first.");
      return;
    }
    setLoading(true);
    try {
      const payee = new PublicKey(payeeInput.trim());
      const [pda] = await PublicKey.findProgramAddress(
        [Buffer.from("stream"), publicKey.toBuffer(), payee.toBuffer()],
        PROGRAM_ID
      );
      setStreamPda(pda.toBase58());
      const acc = await connection.getAccountInfo(pda);
      if (acc && acc.data.length > 0) {
        const decoded = decodeStreamAccount(acc.data);
        setStreams([{ pubkey: pda.toBase58(), ...decoded }]);
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
      // Fetch stream account data
      const acc = await connection.getAccountInfo(streamPubkey);
      if (!acc || acc.data.length === 0) {
        setMessage("Stream account not found.");
        setLoading(false);
        return;
      }
      // Decode stream account (layout from IDL)
      const payer = new PublicKey(acc.data.slice(8, 40));
      const payee = new PublicKey(acc.data.slice(40, 72));
      // Derive PDAs
      const [escrowAuthorityPda] = await PublicKey.findProgramAddress(
        [Buffer.from("escrow_authority"), payer.toBuffer(), payee.toBuffer()],
        PROGRAM_ID
      );
      const [escrowTokenPda] = await PublicKey.findProgramAddress(
        [Buffer.from("escrow"), payer.toBuffer(), payee.toBuffer()],
        PROGRAM_ID
      );
      // Associated token accounts
      const payeeToken = await getAssociatedTokenAddress(USDC_MINT, payee);
      // Fee account (for now, use payer's token account as placeholder)
      const feeAccount = await getAssociatedTokenAddress(USDC_MINT, payer);
      // Build instruction data
      const discriminator = Buffer.from([59,108,27,226,102,21,125,225]);
      const data = discriminator;
      // Build accounts array in the exact order as the Anchor IDL
      const keys = [
        { pubkey: payee, isSigner: true, isWritable: true },
        { pubkey: streamPubkey, isSigner: false, isWritable: true },
        { pubkey: escrowAuthorityPda, isSigner: false, isWritable: false },
        { pubkey: payer, isSigner: false, isWritable: false },
        { pubkey: escrowTokenPda, isSigner: false, isWritable: true },
        { pubkey: payeeToken, isSigner: false, isWritable: true },
        { pubkey: feeAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ];
      // Create and send transaction
      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys,
        data,
      });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setMessage("Redeemed successfully! Tx: " + sig);
    } catch (err: any) {
      setMessage("Error: " + (err.message || err.toString()));
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
      {streamPda && (
        <div style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
          <b>Generated Stream PDA:</b> {streamPda}
        </div>
      )}
      {loading ? (
        <div style={{ textAlign: "center", color: "#888" }}>Loading...</div>
      ) : error ? (
        <div style={{ textAlign: "center", color: "#dc2626" }}>{error}</div>
      ) : streams.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888" }}>No streams found for this payer/payee pair.</div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          maxWidth: 600,
          margin: '0 auto',
        }}>
          <div style={{width:'100%'}}>
            <div style={{fontWeight:700, fontSize:17, marginBottom:8, color:'#3730a3'}}>Stream Summary</div>
            <div style={{
              background: '#f8fafc',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              fontSize: 15,
              color: '#222',
              lineHeight: 1.7,
              maxWidth: 520,
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: 16,
              overflowX: 'auto',
            }}>
              <div style={{marginBottom:8}}>
                <b>Stream PDA:</b> <a href={explorerUrl(streams[0].pubkey)} target="_blank" rel="noopener noreferrer" style={{color:'#2563eb',textDecoration:'underline',fontFamily:'monospace',overflowWrap:'anywhere'}}>{streams[0].pubkey}</a>
                <CopyButton value={streams[0].pubkey} />
              </div>
              <div style={{marginBottom:8}}>
                <b>Payer:</b> <a href={explorerUrl(streams[0].payer.toBase58())} target="_blank" rel="noopener noreferrer" style={{color:'#059669',textDecoration:'underline',fontFamily:'monospace',overflowWrap:'anywhere'}}>{streams[0].payer.toBase58()}</a>
                <CopyButton value={streams[0].payer.toBase58()} />
              </div>
              <div style={{marginBottom:8}}>
                <b>Payee:</b> <a href={explorerUrl(streams[0].payee.toBase58())} target="_blank" rel="noopener noreferrer" style={{color:'#f59e42',textDecoration:'underline',fontFamily:'monospace',overflowWrap:'anywhere'}}>{streams[0].payee.toBase58()}</a>
                <CopyButton value={streams[0].payee.toBase58()} />
              </div>
              <div style={{marginBottom:8}}>
                <b>Mint:</b> <a href={explorerUrl(streams[0].mint.toBase58())} target="_blank" rel="noopener noreferrer" style={{color:'#6366f1',textDecoration:'underline',fontFamily:'monospace',overflowWrap:'anywhere'}}>{streams[0].mint.toBase58()}</a>
                <CopyButton value={streams[0].mint.toBase58()} />
              </div>
              <div style={{marginBottom:8}}>
                <b>Amount:</b> <span style={{color:'#3730a3'}}>{(Number(streams[0].amount) / 1_000_000).toLocaleString()} USDC</span>
              </div>
              <div style={{marginBottom:8}}>
                <b>Rate per minute:</b> <span style={{color:'#0ea5e9'}}>{(Number(streams[0].rate_per_minute) / 1_000_000).toLocaleString()} USDC</span>
              </div>
              <div style={{marginBottom:8}}>
                <b>Start time:</b> <span title={streams[0].start_time.toString()}>{new Date(Number(streams[0].start_time) * 1000).toLocaleString()}</span>
              </div>
              <div style={{marginBottom:8}}>
                <b>Duration:</b> <span style={{color:'#f43f5e'}}>{streams[0].duration_minutes.toString()} minutes</span>
              </div>
              <div style={{marginBottom:8}}>
                <b>Fee percentage:</b> <span style={{color:'#f59e42'}}>{streams[0].fee_percentage}%</span>
              </div>
              <div style={{marginBottom:8}}>
                <b>Redeemed:</b> <span style={{color:'#059669'}}>{(Number(streams[0].redeemed) / 1_000_000).toLocaleString()} USDC</span>
              </div>
              <div style={{marginBottom:8}}>
                <b>Stream bump:</b> <span style={{color:'#888'}}>{streams[0].stream_bump}</span>
              </div>
              <div style={{marginBottom:8}}>
                <b>Escrow bump:</b> <span style={{color:'#888'}}>{streams[0].escrow_bump}</span>
              </div>
              <div style={{marginBottom:8}}>
                <b>Escrow authority bump:</b> <span style={{color:'#888'}}>{streams[0].escrow_authority_bump}</span>
              </div>
            </div>
          </div>
          <div style={{width:'100%'}}>
            <div style={{fontWeight:700, fontSize:17, marginBottom:8, color:'#3730a3'}}>Stream Table</div>
            <div style={{
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              overflowX: 'auto',
              maxWidth: '100%',
              padding: 8,
            }}>
              <table style={{ width: "100%", fontSize: 14, minWidth: 420, borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1 }}>
                  <tr style={{ color: "#555" }}>
                    <th align="left" style={{padding:'6px 8px'}}>Stream</th>
                    <th align="left" style={{padding:'6px 8px'}}>Payee</th>
                    <th align="right" style={{padding:'6px 8px'}}>Amount</th>
                    <th align="right" style={{padding:'6px 8px'}}>Rate/min</th>
                    <th align="right" style={{padding:'6px 8px'}}>Redeemed</th>
                    <th align="right" style={{padding:'6px 8px'}}>Duration</th>
                    <th align="right" style={{padding:'6px 8px'}}>Fee %</th>
                  </tr>
                </thead>
                <tbody>
                  {streams.map((s) => (
                    <tr key={s.pubkey} style={{borderBottom:'1px solid #e5e7eb'}}>
                      <td style={{padding:'6px 8px',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={s.pubkey}>{s.pubkey.slice(0, 6)}...{s.pubkey.slice(-4)}</td>
                      <td style={{padding:'6px 8px',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={s.payee.toBase58()}>{s.payee.toBase58().slice(0, 6)}...{s.payee.toBase58().slice(-4)}</td>
                      <td align="right" style={{padding:'6px 8px'}}>{(Number(s.amount) / 1_000_000).toLocaleString()}</td>
                      <td align="right" style={{padding:'6px 8px'}}>{(Number(s.rate_per_minute) / 1_000_000).toLocaleString()}</td>
                      <td align="right" style={{padding:'6px 8px'}}>{(Number(s.redeemed) / 1_000_000).toLocaleString()}</td>
                      <td align="right" style={{padding:'6px 8px'}}>{s.duration_minutes.toString()}</td>
                      <td align="right" style={{padding:'6px 8px'}}>{s.fee_percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <details style={{marginTop:12}}>
            <summary style={{cursor:'pointer',fontSize:14,color:'#555'}}>Show raw JSON</summary>
            <pre style={{ background: "#f4f4f4", padding: 10, borderRadius: 8, overflowX: "auto" }}>
              {JSON.stringify(streams[0], (k, v) => {
                if (typeof v === 'object' && v?.toBase58) return v.toBase58();
                if (typeof v === 'bigint') return v.toString();
                return v;
              }, 2)}
            </pre>
          </details>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <input
              type="text"
              value={streamId}
              onChange={e => setStreamId(e.target.value)}
              placeholder="Enter Stream PDA"
              style={{ flex: 1, padding: 8, borderRadius: 8, border: "1.5px solid #bbb", fontSize: 16 }}
            />
            <button
              type="submit"
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 16 }}
            >
              Redeem Stream
            </button>
          </form>
          {message && <div style={{ color: message.includes("Error") ? "#dc2626" : "#059669", fontSize: 14, marginTop: 10 }}>{message}</div>}
        </div>
      )}
    </div>
  );
} 