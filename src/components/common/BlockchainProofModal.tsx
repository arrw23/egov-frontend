import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, X, Cpu, Hash, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { CaseDocument } from "@/types";

/**
 * Shows the backend's real `verify-blockchain` receipt for a document.
 *
 * The ledger is simulated unless a contract address is configured server-side,
 * so this modal renders whatever `simulated` / `verification_status` the
 * backend reports instead of asserting a tamper-evident on-chain record.
 */
export function BlockchainProofModal({
  doc,
  onClose,
}: {
  doc: Partial<CaseDocument>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [proofData, setProofData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doc.id) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setProofData(null);

    api
      .verifyDocumentBlockchain(Number(doc.id))
      .then((res) => {
        if (!cancelled) setProofData(res);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "The ledger receipt could not be retrieved.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [doc]);

  const extracted = (doc.extracted_json as any) || {};
  const blockchain = proofData?.blockchain || null;
  const simulated = blockchain?.simulated ?? extracted.ledger_simulated ?? null;
  const anchored = blockchain?.simulated === false && !!blockchain?.transaction_hash;

  const txHash = blockchain?.transaction_hash || extracted.blockchain_tx_hash || null;
  const blockNum = blockchain?.block_number || extracted.blockchain_block_number || null;
  const fullHash = proofData?.document?.full_sha256 || extracted.full_sha256 || doc.sha256_hash || null;
  const status = blockchain?.verification_status || (simulated ? "SIMULATED_NOT_ON_CHAIN" : null);

  const docStatus = proofData?.document?.status || doc.status;
  const certified = docStatus === "certified" || docStatus === "verified";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#ffffff",
          border: "3px solid #1e1b4b",
          borderRadius: 24,
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.3)",
          padding: "1.75rem",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close proof"
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "#f1f5f9",
            border: "2px solid #1e1b4b",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ padding: "0.6rem", background: certified ? "#dcfce7" : "#eff6ff", border: `2px solid ${certified ? "#166534" : "#1d4ed8"}`, borderRadius: 14 }}>
            <ShieldCheck size={28} color={certified ? "#15803d" : "#1e40af"} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1e1b4b", margin: 0 }}>
              Document Integrity Receipt
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#4338ca", fontWeight: 700 }}>
              {simulated === false ? "Ledger verification" : "Ledger status reported by the backend"}
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "#4338ca", fontWeight: 700 }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: "0.5rem" }} />
            <p>Requesting the document&apos;s ledger receipt...</p>
          </div>
        ) : error ? (
          <div role="alert" style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: 16, padding: "1rem 1.25rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <AlertTriangle size={18} color="#dc2626" /> {error}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Honest ledger-status banner, driven by the backend's `simulated` flag */}
            {simulated === true ? (
              <div style={{ background: "#fef3c7", border: "2px solid #d97706", borderRadius: 16, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <AlertTriangle size={24} color="#b45309" style={{ flexShrink: 0 }} />
                <div>
                  <b style={{ fontSize: "0.95rem", color: "#92400e", display: "block" }}>
                    SIMULATED LEDGER · NOT SUBMITTED TO ANY CHAIN
                  </b>
                  <span style={{ fontSize: "0.8rem", color: "#92400e", fontWeight: 600 }}>
                    No ledger contract address is configured, so no transaction exists on-chain. The SHA-256 digest below is a local integrity record only.
                  </span>
                </div>
              </div>
            ) : anchored ? (
              <div style={{ background: "#f0fdf4", border: "2px solid #22c55e", borderRadius: 16, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
                <div>
                  <b style={{ fontSize: "0.95rem", color: "#14532d", display: "block" }}>RECORD SUBMITTED TO THE CONFIGURED LEDGER</b>
                  <span style={{ fontSize: "0.8rem", color: "#15803d", fontWeight: 600 }}>
                    The node returned transaction {txHash}. Status: {status || "—"}.
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ background: "#eff6ff", border: "2px solid #3b82f6", borderRadius: 16, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Hash size={24} color="#2563eb" style={{ flexShrink: 0 }} />
                <div>
                  <b style={{ fontSize: "0.95rem", color: "#1e3a8a", display: "block" }}>
                    INTEGRITY DIGEST RECORDED {certified ? "· CERTIFIED BY HOSPITAL" : "· AWAITING HOSPITAL VERIFICATION"}
                  </b>
                  <span style={{ fontSize: "0.8rem", color: "#1d4ed8", fontWeight: 600 }}>
                    {certified
                      ? "Hospital staff certified this record. No on-chain claim is made."
                      : "Hospital staff review is still required for official certification."}
                  </span>
                </div>
              </div>
            )}

            <div style={{ background: "#f8fafc", border: "2px solid #e2e8f0", borderRadius: 16, padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                Target File & Reference
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0f172a" }}>{doc.title || "Document Record"}</div>
              <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600, marginTop: "0.2rem" }}>
                Type: <b style={{ textTransform: "capitalize" }}>{doc.document_type?.replace(/_/g, " ")}</b> · Ref:{" "}
                {proofData?.document?.verification_reference || doc.verification_reference || "—"}
              </div>
            </div>

            <div style={{ background: "#eff6ff", border: "2px solid #93c5fd", borderRadius: 16, padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#1e40af", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.3rem" }}>
                <Hash size={14} /> File Digest (SHA-256)
              </div>
              <code style={{ display: "block", wordBreak: "break-all", fontSize: "0.8rem", fontFamily: "monospace", background: "#ffffff", padding: "0.6rem 0.8rem", borderRadius: 10, border: "1.5px solid #bfdbfe", color: "#1e3a8a", fontWeight: 700 }}>
                {fullHash || "—"}
              </code>
            </div>

            <div style={{ border: "2px solid #1e1b4b", borderRadius: 16, padding: "1rem 1.25rem", background: "#fafafa" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Cpu size={16} /> Ledger Receipt Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.825rem" }}>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 700 }}>Network</span>
                  <b style={{ color: "#0f172a" }}>{blockchain?.network || extracted.chain_name || "—"}</b>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 700 }}>Consensus</span>
                  <b style={{ color: "#0f172a" }}>{blockchain?.consensus || "—"}</b>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 700 }}>Block Number</span>
                  <b style={{ color: "#2563eb", fontFamily: "monospace" }}>{blockNum || "—"}</b>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 700 }}>Ledger State</span>
                  <b style={{ color: simulated ? "#b45309" : "#16a34a" }}>{status || "—"}</b>
                </div>
              </div>

              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                  Transaction Hash
                </span>
                <code style={{ display: "block", wordBreak: "break-all", fontSize: "0.75rem", fontFamily: "monospace", background: "#f1f5f9", padding: "0.5rem", borderRadius: 8, color: "#334155" }}>
                  {txHash || "— (no transaction was submitted)"}
                </code>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button className="primary" onClick={onClose}>
                Done Viewing Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
