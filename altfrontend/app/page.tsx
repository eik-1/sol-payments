"use client";
import WalletConnectButton from "./components/WalletConnectButton";
import CreateStreamForm from "./components/CreateStreamForm";
import RedeemStreamForm from "./components/RedeemStreamForm";
import ReclaimStreamForm from "./components/ReclaimStreamForm";
import StreamInfo from "./components/StreamInfo";
import React, { useState } from "react";

const sections = [
  { label: "Create Stream", component: <CreateStreamForm /> },
  { label: "Redeem Stream", component: <RedeemStreamForm /> },
  { label: "Reclaim Stream", component: <ReclaimStreamForm /> },
  { label: "Stream Info", component: <StreamInfo /> },
];

export default function Home() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)",
        padding: "0 16px",
      }}
    >
      <header style={{ textAlign: "center", padding: "40px 0 16px 0" }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: -1,
          color: "#3730a3",
          marginBottom: 8,
        }}>
          Solana Streaming Payments
        </h1>
        <div style={{ margin: "0 auto", maxWidth: 400 }}>
          <WalletConnectButton />
        </div>
      </header>
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {sections.map((section, idx) => (
          <div key={section.label} style={{ width: "100%", maxWidth: 440 }}>
            <button
              onClick={() => setOpen(open === idx ? null : idx)}
              aria-expanded={open === idx}
              style={{
                width: "100%",
                textAlign: "left",
                background: "#6366f1",
                color: "#fff",
                fontWeight: 700,
                fontSize: 20,
                border: "none",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 0,
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: open === idx ? "0 2px 12px rgba(99,102,241,0.10)" : undefined,
                cursor: "pointer",
                outline: open === idx ? "2px solid #3730a3" : undefined,
                transition: "background 0.2s, box-shadow 0.2s",
              }}
            >
              <span>{section.label}</span>
              <span style={{ fontSize: 28, fontWeight: 900, marginLeft: 8 }}>
                {open === idx ? "-" : "+"}
              </span>
            </button>
            {open === idx && (
              <div style={{ marginTop: 0 }}>{section.component}</div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
