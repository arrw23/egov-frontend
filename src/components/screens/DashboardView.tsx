import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileText,
  Network,
  QrCode,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  AlertTriangle,
} from "lucide-react";
import { AuditEvent, MedicalCase, NotificationItem, Screen, Selection } from "@/types";
import { Head, Stat, Status } from "../common/Ui";
import { getSavedRequirementRule } from "@/lib/requirementStore";
import { api } from "@/lib/api";

const money = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);

interface TimelineVerification {
  verified: boolean;
  checked?: number;
  head_hash?: string;
  broken_at_event_id?: number | null;
  unverifiable_event_ids?: number[];
  ledger_simulated?: boolean;
}

export function DashboardView({
  go,
  selection,
}: {
  go: (s: Screen) => void;
  selection: Selection;
}) {
  const rule = getSavedRequirementRule();
  const caseId = selection.caseId;

  const [activeCase, setActiveCase] = useState<MedicalCase | null>(null);
  const [timeline, setTimeline] = useState<AuditEvent[]>([]);
  const [latestNotice, setLatestNotice] = useState<NotificationItem | null>(null);
  const [verification, setVerification] = useState<TimelineVerification | null>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!caseId) {
      setActiveCase(null);
      setTimeline([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [caseRes, timelineRes] = await Promise.all([
        api.getCase(caseId),
        api.getCaseTimeline(caseId).catch(() => ({ status: "success", timeline: [] as AuditEvent[] })),
      ]);
      setActiveCase(caseRes.case);
      setTimeline(timelineRes.timeline || []);
    } catch (err: any) {
      setActiveCase(null);
      setTimeline([]);
      setError(err?.message || "The case could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
    api
      .getNotifications()
      .then((res) => setLatestNotice(res.notifications?.[0] || null))
      .catch(() => setLatestNotice(null));
  }, [load]);

  // Only claim tamper-evidence when the backend's chain verification says so.
  const verifyChain = async () => {
    if (!caseId) return;
    setVerifyingChain(true);
    try {
      const res = await api.verifyCaseTimeline(caseId);
      setVerification(res.verification);
    } catch (err: any) {
      setVerification(null);
      setError(err?.message || "The audit chain could not be verified.");
    } finally {
      setVerifyingChain(false);
    }
  };

  const financials = activeCase?.financials;
  const verifiedBill = Number(financials?.verified_bill ?? activeCase?.verified_bill ?? 0);
  const approvedAmount = Number(financials?.total_approved_assistance ?? 0);
  const utilized = Number(financials?.total_utilized ?? 0);
  const remainingUncovered = Number(financials?.remaining_uncovered_balance ?? 0);
  const guarantee = activeCase?.guarantee_letters?.[0] || null;

  const greeting = activeCase?.applicant_name ? activeCase.applicant_name.split(" ")[0].toUpperCase() : "";

  return (
    <>
      <Head
        over={greeting ? `MAGANDANG ARAW, ${greeting} 👋` : "YOUR MEDICAL ASSISTANCE"}
        title="Your Medical Assistance"
        text="Track your family's request from hospital document verification to guarantee letter utilization."
        action={
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <Status tone="green">9 Integrated Services Active</Status>
            <button className="primary" onClick={() => go("apply")}>
              <FileText size={20} /> New application
            </button>
          </div>
        }
      />

      {error && (
        <div role="alert" style={{ background: "#fef2f2", border: "2.5px solid #ef4444", borderRadius: 16, padding: "0.9rem 1.1rem", marginBottom: "1.5rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <AlertTriangle size={18} color="#dc2626" /> {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#4338ca", fontWeight: 700, display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <RefreshCw size={16} className="animate-spin" /> Loading your case...
        </p>
      ) : !activeCase ? (
        <section className="card">
          <p style={{ fontWeight: 700, color: "#4338ca" }}>
            No medical assistance case is selected. Start a new application to create one.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button className="primary" onClick={() => go("apply")}>
              <FileText size={20} /> Start an application
            </button>
            <button className="outline" onClick={load}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="case">
            <span>
              <label>CASE {activeCase.case_number}</label>
              <h2>
                {activeCase.patient_name} <BadgeCheck color="#2563eb" size={24} />
              </h2>
              <p>
                {activeCase.provider?.name || "Provider not set"} · {activeCase.condition_category}
              </p>
            </span>
            <Status tone={guarantee ? "green" : "orange"}>
              {guarantee ? "Guarantee letter issued" : activeCase.status.replace(/_/g, " ").toLowerCase()}
            </Status>
          </div>

          <div className="stats">
            <Stat
              Icon={FileCheck2}
              label="Verified Medical Bill"
              value={money(verifiedBill)}
              note={activeCase.provider?.name ? `On file with ${activeCase.provider.name}` : "Provider not set"}
              tone="blue"
            />
            <Stat
              Icon={CircleDollarSign}
              label="Assistance Approved"
              value={money(approvedAmount)}
              note={approvedAmount > 0 ? "Recorded by the agency decision" : "No approval recorded yet"}
              tone="green"
            />
            <Stat
              Icon={WalletCards}
              label="Remaining Uncovered"
              value={money(remainingUncovered)}
              note="Bill − Total Approved Assistance"
              tone="orange"
            />
            <Stat
              Icon={Activity}
              label="Amount Utilized"
              value={money(utilized)}
              note={utilized ? "Confirmed by hospital provider" : "Not yet recorded"}
              tone="purple"
            />
          </div>

          <div className="cols">
            <section className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: 0 }}>Case Journey Progress</h2>
                <button className="outline" onClick={verifyChain} disabled={verifyingChain} style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem" }}>
                  <ShieldCheck size={14} /> {verifyingChain ? "Verifying audit chain..." : "Verify audit chain"}
                </button>
              </div>

              {verification && (
                <div
                  role="status"
                  style={{
                    background: verification.verified ? "#f0fdf4" : "#fef3c7",
                    border: `2px solid ${verification.verified ? "#22c55e" : "#d97706"}`,
                    borderRadius: 14,
                    padding: "0.7rem 0.95rem",
                    marginBottom: "1rem",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    color: verification.verified ? "#14532d" : "#92400e",
                  }}
                >
                  {verification.verified
                    ? `Audit chain verified across ${verification.checked ?? 0} event(s).`
                    : `Audit chain NOT verified — first broken link at event ${verification.broken_at_event_id ?? "unknown"}.`}
                  {verification.ledger_simulated ? " Ledger anchoring is simulated (no contract address configured)." : ""}
                  {Array.isArray(verification.unverifiable_event_ids) && verification.unverifiable_event_ids.length > 0
                    ? ` ${verification.unverifiable_event_ids.length} event(s) predate chaining and cannot be verified.`
                    : ""}
                </div>
              )}

              <div className="timeline">
                {timeline.length === 0 ? (
                  <p style={{ color: "#4338ca", fontWeight: 700 }}>No audit events have been recorded for this case yet.</p>
                ) : (
                  timeline.map((event) => {
                    const tx = (event.metadata as any)?.besu_tx_hash as string | undefined;
                    const simulated = (event.metadata as any)?.ledger_simulated !== false;
                    return (
                      <div className="done" key={event.id}>
                        <i>
                          <Check size={18} />
                        </i>
                        <span>
                          <b style={{ fontSize: "1rem" }}>{event.action.replace(/_/g, " ")}</b>
                          <small style={{ color: "#4338ca", fontWeight: 600 }}>{event.description}</small>
                          {event.chain_hash && (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                background: "#e0e7ff",
                                color: "#4338ca",
                                padding: "0.2rem 0.65rem",
                                borderRadius: "9999px",
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                border: "1.5px solid #4338ca",
                                marginTop: "0.35rem",
                              }}
                            >
                              <Network size={12} />
                              <span>
                                {simulated ? "Simulated ledger digest" : "Ledger digest"}: {event.chain_hash}
                              </span>
                              {tx && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const result = await api.besuJsonRpc("egov_verifyRecord", [tx]);
                                      const state = result?.result?.state || "UNKNOWN";
                                      const simulatedResult = result?.simulated ?? result?.result?.simulated;
                                      alert(
                                        `Ledger check result\nState: ${state}\nSimulated: ${String(simulatedResult ?? "unknown")}${
                                          result?.result?.note ? `\n${result.result.note}` : ""
                                        }`
                                      );
                                    } catch (err: any) {
                                      alert(`Ledger check failed: ${err?.message || "unknown error"}`);
                                    }
                                  }}
                                  style={{
                                    background: "#4338ca",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "0.15rem 0.45rem",
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    marginLeft: "0.25rem",
                                  }}
                                >
                                  Check
                                </button>
                              )}
                            </div>
                          )}
                        </span>
                        <time>{new Date(event.created_at).toLocaleString("en-PH")}</time>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* The GL card only exists when the case actually has a guarantee letter */}
              {guarantee && (
                <div className="card" style={{ background: "#e0e7ff", color: "#1e1b4b" }}>
                  <label style={{ fontSize: "0.75rem", color: "#4338ca", fontWeight: 900, letterSpacing: "0.08em" }}>DIGITAL GUARANTEE LETTER</label>
                  <h3 style={{ fontSize: "1.35rem", fontWeight: 900, margin: "0.25rem 0" }}>{guarantee.gl_number}</h3>
                  <strong style={{ fontSize: "2rem", fontWeight: 900, display: "block", color: "#1e1b4b", margin: "0.25rem 0" }}>
                    {money(Number(guarantee.approved_amount || 0))}
                  </strong>
                  <small style={{ color: "#4338ca", fontWeight: 800, display: "block", marginBottom: "1.25rem" }}>
                    {guarantee.expiration_date ? `Valid until ${String(guarantee.expiration_date).slice(0, 10)}` : "No expiration recorded"} · {guarantee.status?.replace(/_/g, " ")}
                  </small>
                  <button className="primary wide" onClick={() => go("guarantee")}>
                    <QrCode size={20} /> View Guarantee Letter
                  </button>
                </div>
              )}

              <div className="card" style={{ background: "#ffffff", border: "2.5px solid #1e1b4b", boxShadow: "0 4px 0 #1e1b4b" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.72rem", color: "#6366f1", fontWeight: 900 }}>AGENCY EVALUATOR RULE</label>
                    <h4 style={{ fontSize: "1rem", fontWeight: 900, margin: 0, color: "#1e1b4b" }}>
                      {rule.serviceTitle} ({rule.agencyName})
                    </h4>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {rule.blocks.map((b) => (
                    <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", fontWeight: 700, padding: "0.35rem 0.6rem", background: b.alreadyInWallet ? "#f0fdf4" : "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
                      <span style={{ color: "#1e1b4b" }}>{b.title}</span>
                      {b.alreadyInWallet ? (
                        <span style={{ color: "#166534", fontSize: "0.72rem", fontWeight: 800 }}>✓ Wallet Auto-Verified</span>
                      ) : (
                        <span style={{ color: "#d97706", fontSize: "0.72rem", fontWeight: 800 }}>Upload Required</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ background: "#dcfce7", color: "#14532d" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: "0 0 0.5rem 0", color: "#14532d" }}>Latest eMessage Notice</h3>
                {latestNotice ? (
                  <>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#166534", display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
                      <CheckCircle2 size={18} /> {latestNotice.title}: {latestNotice.message}
                    </span>
                    <small style={{ display: "block", marginTop: "0.4rem", color: "#166534", fontWeight: 700 }}>
                      {new Date(latestNotice.created_at).toLocaleString("en-PH")} · {latestNotice.read_at ? "read" : "unread"}
                    </small>
                  </>
                ) : (
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#166534", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <Clock3 size={18} /> No notifications yet.
                  </span>
                )}
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
