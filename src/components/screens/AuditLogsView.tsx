import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search, ShieldCheck, Sparkles, Layers, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { AuditEvent, Screen, Selection } from "@/types";
import { Head, Status } from "../common/Ui";

/** Category pill derived from the backend's action code. */
function categoryOf(action: string): "auth" | "case" | "document" | "guarantee" | "payment" | "system" {
  const a = action.toUpperCase();
  if (a.includes("AUTH") || a.includes("IDENTITY") || a.includes("SSO")) return "auth";
  if (a.includes("GUARANTEE")) return "guarantee";
  if (a.includes("UTILIZ") || a.includes("PAY") || a.includes("SETTLE")) return "payment";
  if (a.includes("DOCUMENT") || a.includes("CERTIF")) return "document";
  if (a.includes("CASE") || a.includes("APPLICATION") || a.includes("HOSPITAL_REQUEST")) return "case";
  return "system";
}

const CATEGORY_TONE: Record<string, { bg: string; label: string }> = {
  auth: { bg: "#e0e7ff", label: "auth" },
  guarantee: { bg: "#dcfce7", label: "guarantee" },
  payment: { bg: "#e0f2fe", label: "payment" },
  document: { bg: "#fef08a", label: "document" },
  case: { bg: "#f5f3ff", label: "case" },
  system: { bg: "#f1f5f9", label: "system" },
};

interface TimelineVerification {
  verified: boolean;
  checked?: number;
  head_hash?: string;
  broken_at_event_id?: number | null;
  broken_action?: string;
  unverifiable_event_ids?: number[];
  ledger_simulated?: boolean;
}

export function AuditLogsView({ go, selection }: { go?: (s: Screen) => void; selection: Selection }) {
  const caseId = selection.caseId;

  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [verification, setVerification] = useState<TimelineVerification | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const load = useCallback(async () => {
    if (!caseId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.getCaseTimeline(caseId);
      setLogs(res.timeline || []);
    } catch (err: any) {
      setLogs([]);
      setError(err?.message || "The audit timeline could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Only claim tamper-evidence when the backend's chain check says so. */
  const verifyChain = async () => {
    if (!caseId) return;
    setVerifying(true);
    try {
      const res = await api.verifyCaseTimeline(caseId);
      setVerification(res.verification);
    } catch (err: any) {
      setVerification(null);
      setError(err?.message || "The audit chain could not be verified.");
    } finally {
      setVerifying(false);
    }
  };

  const handleTriggerTestLog = async () => {
    setTriggering(true);
    try {
      // Manual "file report" action — the only place submitEReport is still used.
      const res = await api.submitEReport("LIVE_EVALUATOR_TEST_AUDIT", {
        triggered_by: "Evaluator",
        case_id: caseId,
      });
      setToastMessage(`Audit report filed${res?.report_id ? ` · ${res.report_id}` : ""}.`);
      setTimeout(() => setToastMessage(""), 3500);
      await load();
    } catch (err: any) {
      setToastMessage(err?.message || "The audit report could not be filed.");
      setTimeout(() => setToastMessage(""), 3500);
    } finally {
      setTriggering(false);
    }
  };

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const category = categoryOf(log.action);
        const matchesCategory = filterCategory === "ALL" || category === filterCategory.toLowerCase();
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          log.action.toLowerCase().includes(q) ||
          (log.actor_name || "").toLowerCase().includes(q) ||
          (log.description || "").toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      }),
    [logs, filterCategory, searchQuery]
  );

  const ledgerSimulated = verification?.ledger_simulated ?? true;

  return (
    <>
      <Head
        over="REPUBLIC OF THE PHILIPPINES · CASE AUDIT REPOSITORY"
        title="Case Audit Trail"
        text="Audit events recorded against the selected case, chained so that editing any entry breaks the chain the server recomputes."
        action={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {caseId ? <Status tone="blue">Case #{caseId}</Status> : <Status tone="orange">No case selected</Status>}
          </div>
        }
      />

      {error && (
        <div role="alert" style={{ background: "#fef2f2", border: "2.5px solid #ef4444", borderRadius: 16, padding: "0.9rem 1.1rem", marginBottom: "1.5rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <AlertTriangle size={18} color="#dc2626" /> {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        <div style={{ background: "#ffffff", border: "2.5px solid #1e1b4b", borderRadius: 20, padding: "1.25rem", boxShadow: "0 4px 0 #1e1b4b" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#6366f1", letterSpacing: "0.05em" }}>TOTAL AUDIT EVENTS</span>
          <h3 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#1e1b4b", margin: "0.2rem 0" }}>{logs.length} Events</h3>
          <small style={{ color: "#4338ca", fontWeight: 700 }}>For the selected case</small>
        </div>

        <div style={{ background: "#ffffff", border: "2.5px solid #1e1b4b", borderRadius: 20, padding: "1.25rem", boxShadow: "0 4px 0 #1e1b4b" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#6366f1", letterSpacing: "0.05em" }}>CHAIN INTEGRITY</span>
          <h3 style={{ fontSize: "1.35rem", fontWeight: 900, color: verification?.verified ? "#059669" : verification ? "#b45309" : "#475569", margin: "0.2rem 0" }}>
            {verification ? (verification.verified ? "Verified" : "Broken link found") : "Not yet checked"}
          </h3>
          <small style={{ color: "#4338ca", fontWeight: 700 }}>
            {verification
              ? `${verification.checked ?? 0} event(s) checked${verification.broken_at_event_id ? ` · broken at #${verification.broken_at_event_id}` : ""}`
              : "Run the verification to check"}
          </small>
        </div>

        <div style={{ background: "#ffffff", border: "2.5px solid #1e1b4b", borderRadius: 20, padding: "1.25rem", boxShadow: "0 4px 0 #1e1b4b" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#6366f1", letterSpacing: "0.05em" }}>LEDGER MODE</span>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: ledgerSimulated ? "#b45309" : "#059669", margin: "0.2rem 0" }}>
            {ledgerSimulated ? "Simulated ledger" : "Configured ledger"}
          </h3>
          <small style={{ color: "#4338ca", fontWeight: 700 }}>
            {ledgerSimulated ? "No contract address configured — nothing is submitted on-chain" : "Anchors are submitted to the configured node"}
          </small>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "2.5px solid #1e1b4b", borderRadius: 24, padding: "1.25rem 1.5rem", boxShadow: "0 6px 0 #1e1b4b", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {["ALL", "AUTH", "CASE", "DOCUMENT", "GUARANTEE", "PAYMENT"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{ padding: "0.4rem 0.85rem", borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 800, border: "2px solid #1e1b4b", background: filterCategory === cat ? "#1e1b4b" : "#ffffff", color: filterCategory === cat ? "#ffffff" : "#1e1b4b", cursor: "pointer" }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", color: "#6366f1" }} />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: "0.55rem 0.85rem 0.55rem 2.2rem", border: "2px solid #1e1b4b", borderRadius: 14, fontSize: "0.85rem", fontWeight: 700, width: "220px" }}
              />
            </div>

            <button className="outline" onClick={verifyChain} disabled={verifying || !caseId}>
              <ShieldCheck size={16} className={verifying ? "animate-spin" : ""} /> {verifying ? "Verifying..." : "Verify chain"}
            </button>
            <button className="outline" onClick={load} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button className="primary" disabled={triggering} onClick={handleTriggerTestLog} style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.6rem 1rem", fontSize: "0.85rem", borderRadius: "9999px" }}>
              {triggering ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />} File audit report
            </button>
          </div>
        </div>

        {verification && (
          <div
            role="status"
            style={{
              marginTop: "1rem",
              background: verification.verified ? "#f0fdf4" : "#fef3c7",
              border: `2px solid ${verification.verified ? "#22c55e" : "#d97706"}`,
              borderRadius: 14,
              padding: "0.7rem 0.95rem",
              fontWeight: 800,
              fontSize: "0.82rem",
              color: verification.verified ? "#14532d" : "#92400e",
            }}
          >
            <ShieldCheck size={15} style={{ verticalAlign: "-2px", marginRight: "0.35rem" }} />
            {verification.verified
              ? `Audit chain verified across ${verification.checked ?? 0} event(s). Head hash ${verification.head_hash?.slice(0, 16) ?? "—"}…`
              : `Audit chain NOT verified — the first broken link is event #${verification.broken_at_event_id ?? "unknown"}${
                  verification.broken_action ? ` (${verification.broken_action})` : ""
                }.`}
            {Array.isArray(verification.unverifiable_event_ids) && verification.unverifiable_event_ids.length > 0
              ? ` ${verification.unverifiable_event_ids.length} event(s) predate chaining and cannot be verified.`
              : ""}
            {ledgerSimulated ? " Ledger anchoring is simulated: no contract address is configured." : ""}
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="toast" style={{ background: "#1e1b4b", color: "#fef08a", border: "2px solid #fef08a" }}>
          <CheckCircle2 size={18} /> {toastMessage}
        </div>
      )}

      {!caseId ? (
        <section className="card">
          <p style={{ fontWeight: 700, color: "#4338ca" }}>No case is selected, so there is no audit trail to show.</p>
          {go && (
            <button className="primary" onClick={() => go("dashboard")}>
              Open my case
            </button>
          )}
        </section>
      ) : (
        <div style={{ background: "#ffffff", border: "2.5px solid #1e1b4b", borderRadius: 24, padding: "1.5rem", boxShadow: "0 6px 0 #1e1b4b", overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1e1b4b", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={20} color="#4338ca" /> Case Audit Feed ({filteredLogs.length} Events)
            </h3>
          </div>

          {loading ? (
            <p style={{ color: "#4338ca", fontWeight: 700, display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <RefreshCw size={16} className="animate-spin" /> Loading audit events...
            </p>
          ) : filteredLogs.length === 0 ? (
            <p style={{ color: "#4338ca", fontWeight: 700 }}>
              {logs.length === 0 ? "No audit events have been recorded for this case yet." : "No events match the current filters."}
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem", textAlign: "left" }}>
              <thead>
                <tr style={{ fontSize: "0.75rem", fontWeight: 900, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "0.6rem 1rem" }}>Timestamp</th>
                  <th style={{ padding: "0.6rem 1rem" }}>Event Action</th>
                  <th style={{ padding: "0.6rem 1rem" }}>Actor</th>
                  <th style={{ padding: "0.6rem 1rem" }}>Description</th>
                  <th style={{ padding: "0.6rem 1rem" }}>Chain hash</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const category = categoryOf(log.action);
                  const isBroken = verification?.broken_at_event_id === log.id;
                  return (
                    <tr key={log.id} style={{ background: isBroken ? "#fef2f2" : "#fafafa", border: `1.5px solid ${isBroken ? "#ef4444" : "#1e1b4b"}` }}>
                      <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", fontWeight: 700, color: "#475569", whiteSpace: "nowrap" }}>
                        {new Date(log.created_at).toLocaleString("en-PH")}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                        <span style={{ background: CATEGORY_TONE[category].bg, color: "#1e1b4b", padding: "0.25rem 0.65rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontSize: "0.72rem", fontWeight: 900 }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                        <b style={{ fontSize: "0.85rem", color: "#1e1b4b", display: "block" }}>{log.actor_name || "—"}</b>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", fontSize: "0.83rem", fontWeight: 700, color: "#334155", maxWidth: "360px" }}>
                        {log.description}
                        {isBroken && (
                          <small style={{ display: "block", color: "#b91c1c", fontWeight: 900, marginTop: "0.25rem" }}>
                            Chain link broken at this event.
                          </small>
                        )}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <code style={{ background: "#f1f5f9", padding: "0.2rem 0.55rem", borderRadius: 8, border: "1px solid #1e1b4b", fontSize: "0.72rem", fontWeight: 800, color: "#4338ca", wordBreak: "break-all" }}>
                          {log.chain_hash ? `${log.chain_hash.slice(0, 20)}…` : "—"}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
