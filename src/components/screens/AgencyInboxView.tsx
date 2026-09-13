import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Layers,
  MessageSquare,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Screen, Selection } from "@/types";
import { Head, Stat, Status } from "../common/Ui";
import { api } from "@/lib/api";

const money = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

/** `GET /agency/applications` row, plus the optional server-side rollups. */
interface AgencyApplicationRow {
  id: number;
  medical_case_id?: number;
  case_number?: string;
  patient_name?: string;
  applicant_name?: string;
  relationship?: string;
  hospital_name?: string;
  program_name?: string;
  requested_amount: number;
  approved_amount?: number;
  verified_bill?: number;
  status: string;
  financials?: { verified_bill?: number; total_approved_assistance?: number; total_utilized?: number; remaining_uncovered_balance?: number };
  created_at?: string;
  /** Added by AgencyController::index once the rollup ships. */
  documents?: { id?: number; document_type: string; title?: string; status: string }[];
  requirements?: { type: string; title: string; status: string; document_id?: number | null }[];
  completeness?: number;
}

const CERTIFIED_STATUSES = ["certified", "verified"];

/**
 * Uses the server's `completeness` when present, otherwise derives it from the
 * `requirements[]` rollup, and otherwise leaves it unknown (null) rather than
 * inventing a score. Tolerates the fields being absent while the backend adds them.
 */
function completenessOf(app: AgencyApplicationRow): number | null {
  if (typeof app.completeness === "number") return app.completeness;
  if (Array.isArray(app.requirements) && app.requirements.length > 0) {
    const satisfied = app.requirements.filter((r) => CERTIFIED_STATUSES.includes(r.status)).length;
    return Math.round((satisfied / app.requirements.length) * 100);
  }
  if (Array.isArray(app.documents) && app.documents.length > 0) {
    const satisfied = app.documents.filter((d) => CERTIFIED_STATUSES.includes(d.status)).length;
    return Math.round((satisfied / app.documents.length) * 100);
  }
  return null;
}

function requirementBlocks(app: AgencyApplicationRow): { title: string; status: string }[] {
  if (Array.isArray(app.requirements) && app.requirements.length > 0) {
    return app.requirements.map((r) => ({ title: r.title || r.type, status: r.status }));
  }
  if (Array.isArray(app.documents) && app.documents.length > 0) {
    return app.documents.map((d) => ({
      title: d.title || d.document_type.replace(/_/g, " "),
      status: d.status,
    }));
  }
  return [];
}

const blockTone = (status: string) =>
  CERTIFIED_STATUSES.includes(status) ? "verified" : status === "missing" ? "missing" : "pending";

export function AgencyInboxView({
  go,
  notify,
  select,
}: {
  go: (s: Screen) => void;
  notify?: (s: string) => void;
  select: (patch: Partial<Selection>) => void;
}) {
  const [applications, setApplications] = useState<AgencyApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState<any>(null);
  const [budgetError, setBudgetError] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const [sortOption, setSortOption] = useState<"completeness_desc" | "completeness_asc" | "requested_desc" | "recent">("completeness_desc");
  const [filterCategory, setFilterCategory] = useState<"all" | "ready" | "partial" | "incomplete">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getAgencyApplications();
      setApplications((res.applications || []) as AgencyApplicationRow[]);
    } catch (err: any) {
      setApplications([]);
      setError(err?.message || "The agency inbox could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // No fabricated fallback: when the budget feed is down the cards show "—".
    api
      .getCompassBudget("DSWD-AICS")
      .then((data) => {
        setBudget(data);
        setBudgetError(false);
      })
      .catch(() => {
        setBudget(null);
        setBudgetError(true);
      });
  }, [load]);

  const processed = useMemo(() => {
    return applications
      .filter((app) => {
        const score = completenessOf(app);
        if (filterCategory === "ready" && score !== 100) return false;
        if (filterCategory === "partial" && (score === null || score === 100 || score < 50)) return false;
        if (filterCategory === "incomplete" && (score === null || score >= 50)) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            (app.applicant_name || "").toLowerCase().includes(q) ||
            (app.patient_name || "").toLowerCase().includes(q) ||
            (app.case_number || "").toLowerCase().includes(q) ||
            (app.hospital_name || "").toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === "requested_desc") return b.requested_amount - a.requested_amount;
        if (sortOption === "recent") return (b.created_at || "").localeCompare(a.created_at || "");
        const sa = completenessOf(a) ?? -1;
        const sb = completenessOf(b) ?? -1;
        return sortOption === "completeness_asc" ? sa - sb : sb - sa;
      });
  }, [applications, filterCategory, searchQuery, sortOption]);

  const readyCount = applications.filter((a) => completenessOf(a) === 100).length;
  const partialCount = applications.filter((a) => {
    const s = completenessOf(a);
    return s !== null && s >= 50 && s < 100;
  }).length;
  const incompleteCount = applications.filter((a) => {
    const s = completenessOf(a);
    return s !== null && s < 50;
  }).length;

  // Approved-this-month is computed from the loaded list, never a fixed figure.
  const approvedThisMonth = applications
    .filter((a) => (a.status === "approved" || a.status === "partially_approved") && isThisMonth(a.created_at))
    .reduce((sum, a) => sum + (a.approved_amount || 0), 0);
  const approvedThisMonthCount = applications.filter(
    (a) => (a.status === "approved" || a.status === "partially_approved") && isThisMonth(a.created_at)
  ).length;

  const openReview = (app: AgencyApplicationRow) => {
    select({ applicationId: app.id, caseId: app.medical_case_id });
    go("agency_review");
  };

  const handleInstantApprove = async (e: React.MouseEvent, app: AgencyApplicationRow) => {
    e.stopPropagation();
    setApprovingId(app.id);
    try {
      const res = await api.submitDecision(app.id, "approve", app.requested_amount, "Complete requirements");
      const gl = res.guarantee_letter;
      if (gl) select({ guaranteeId: gl.id, applicationId: app.id, caseId: app.medical_case_id });
      notify?.(res.message || (gl ? `Guarantee letter ${gl.gl_number} issued.` : "Decision recorded."));
      await load();
    } catch (err: any) {
      notify?.(err?.message || "The approval could not be recorded.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <>
      <Head
        over="AGENCY EVALUATOR PORTAL"
        title="Pending Service Requests Inbox"
        text="Service requests sorted by completeness score for instant evaluator approval."
        action={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <button className="outline" onClick={load} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button className="primary" onClick={() => go("builder")} style={{ padding: "0.5rem 1.1rem", fontSize: "0.85rem", gap: "0.4rem" }}>
              <Layers size={16} /> Requirement Builder
            </button>
          </div>
        }
      />

      {error && (
        <div role="alert" style={{ background: "#fef2f2", border: "2.5px solid #ef4444", borderRadius: 16, padding: "0.9rem 1.1rem", marginBottom: "1.5rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <AlertTriangle size={18} color="#dc2626" /> {error}
        </div>
      )}

      {/* DBM Compass Budget Banner — "—" whenever the live feed is unavailable */}
      <div className="card" style={{ background: "#e0e7ff", marginBottom: "1.75rem", border: "2.5px solid #1e1b4b", boxShadow: "0 6px 0 #1e1b4b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#4338ca", letterSpacing: "0.08em" }}>DBM COMPASS LIVE ALLOCATION TRACKER</span>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 900, margin: "0.1rem 0", color: "#1e1b4b" }}>GAA DSWD AICS Medical Help Funds</h3>
          </div>
          {budgetError ? (
            <Status tone="orange">Compass feed unavailable · showing —</Status>
          ) : (
            <Status tone="green">{budget?.fund_source || "Compass API connected"}</Status>
          )}
        </div>
        <div className="formGrid" style={{ background: "#ffffff", padding: "1.1rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontSize: "0.9rem", fontWeight: 800, gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#6366f1", display: "block" }}>Total Allocated Fund</span>
            <b style={{ fontSize: "1.25rem", color: "#1e1b4b" }}>
              {typeof budget?.total_allocation === "number" ? money(budget.total_allocation) : "—"}
            </b>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#6366f1", display: "block" }}>Committed / Disbursed</span>
            <b style={{ fontSize: "1.25rem", color: "#d97706" }}>
              {typeof budget?.utilized_amount === "number" && typeof budget?.total_allocation === "number" && budget.total_allocation > 0
                ? `${money(budget.utilized_amount)} (${((budget.utilized_amount / budget.total_allocation) * 100).toFixed(0)}%)`
                : "—"}
            </b>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#6366f1", display: "block" }}>Available Help Fund Balance</span>
            <b style={{ fontSize: "1.25rem", color: "#059669" }}>
              {typeof budget?.remaining_balance === "number" && typeof budget?.total_allocation === "number" && budget.total_allocation > 0
                ? `${money(budget.remaining_balance)} (${((budget.remaining_balance / budget.total_allocation) * 100).toFixed(0)}%)`
                : "—"}
            </b>
          </div>
        </div>
      </div>

      <div className="stats three">
        <Stat Icon={CheckCircle2} label="100% Ready Approval" value={String(readyCount)} note="Instant GL issuance" tone="green" />
        <Stat Icon={Clock3} label="Pending Extra Docs" value={String(applications.length - readyCount)} note="Requirements not fully certified" tone="orange" />
        <Stat
          Icon={CircleDollarSign}
          label="Approved This Month"
          value={loading ? "—" : money(approvedThisMonth)}
          note={`${approvedThisMonthCount} application(s) approved this month`}
          tone="blue"
        />
      </div>

      <section className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderBottom: "2px solid #e0e7ff", paddingBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: 0 }}>Pending Service Requests</h2>
            <small style={{ color: "#6366f1", fontWeight: 700 }}>Sorted by completeness % for instant evaluation & approval</small>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 210 }}>
              <Search size={16} color="#64748b" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                placeholder="Search applicant or hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "0.45rem 0.75rem 0.45rem 2.2rem", borderRadius: 12, border: "2px solid #1e1b4b", fontSize: "0.82rem", fontWeight: 700 }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <ArrowUpDown size={16} color="#4338ca" />
              <select
                value={sortOption}
                onChange={(e: any) => setSortOption(e.target.value)}
                style={{ padding: "0.45rem 0.85rem", borderRadius: 12, border: "2px solid #1e1b4b", fontWeight: 800, fontSize: "0.82rem", background: "#ffffff", cursor: "pointer" }}
              >
                <option value="completeness_desc">Sort: Highest Completeness (100% → 0%)</option>
                <option value="completeness_asc">Sort: Lowest Completeness (0% → 100%)</option>
                <option value="requested_desc">Sort: Highest Requested Amount</option>
                <option value="recent">Sort: Most Recently Submitted</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className={filterCategory === "all" ? "primary" : "outline"} onClick={() => setFilterCategory("all")} style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem" }}>
            All Pending ({applications.length})
          </button>
          <button className={filterCategory === "ready" ? "primary" : "outline"} onClick={() => setFilterCategory("ready")} style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem", borderColor: "#16a34a" }}>
            ⚡ 100% Ready for Approval ({readyCount})
          </button>
          <button className={filterCategory === "partial" ? "primary" : "outline"} onClick={() => setFilterCategory("partial")} style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem" }}>
            🟡 Partial (50%-99%) ({partialCount})
          </button>
          <button className={filterCategory === "incomplete" ? "primary" : "outline"} onClick={() => setFilterCategory("incomplete")} style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem" }}>
            🔴 Incomplete (&lt;50%) ({incompleteCount})
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#4338ca", fontWeight: 700, display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <RefreshCw size={16} className="animate-spin" /> Loading applications...
          </p>
        ) : processed.length === 0 ? (
          <p style={{ color: "#4338ca", fontWeight: 700 }}>
            {applications.length === 0 ? "No agency applications have been submitted yet." : "No applications match the current filters."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {processed.map((app) => {
              const score = completenessOf(app);
              const blocks = requirementBlocks(app);
              const alreadyApproved = app.status === "approved" || app.status === "partially_approved";
              const busy = approvingId === app.id;

              return (
                <div
                  key={app.id}
                  onClick={() => openReview(app)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.85rem",
                    padding: "1.25rem",
                    border: "2.5px solid #1e1b4b",
                    borderRadius: 20,
                    background: alreadyApproved ? "#f0fdf4" : "white",
                    boxShadow: "0 4px 0 #1e1b4b",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                        <b style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1e1b4b" }}>{app.patient_name || "Patient name unavailable"}</b>
                        {score === 100 && (
                          <Status tone="green">
                            <Zap size={14} /> 100% Ready
                          </Status>
                        )}
                        {score !== null && score < 100 && score >= 50 && <Status tone="orange">Partial</Status>}
                        {score !== null && score < 50 && <Status tone="red">Incomplete</Status>}
                        {score === null && <Status tone="blue">Completeness unavailable</Status>}
                      </div>
                      <small style={{ color: "#4338ca", fontWeight: 700, display: "block", marginTop: "0.15rem" }}>
                        Case #{app.case_number || "—"} · Applicant: {app.applicant_name || "—"}
                        {app.relationship ? ` (${app.relationship})` : ""} · {app.hospital_name || "—"}
                      </small>
                      <small style={{ color: "#6366f1", fontWeight: 700, display: "block" }}>
                        Program: {app.program_name || "—"} · Status: {app.status.replace(/_/g, " ")}
                      </small>
                    </div>

                    <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.78rem", color: "#64748b", display: "block", fontWeight: 700 }}>
                          Bill: <b>{typeof app.verified_bill === "number" ? money(app.verified_bill) : "—"}</b>
                        </span>
                        <span style={{ fontSize: "0.95rem", color: "#1e1b4b", fontWeight: 900 }}>
                          Requested: <b>{money(app.requested_amount)}</b>
                        </span>
                      </div>

                      {score === 100 && !alreadyApproved && (
                        <button
                          className="primary"
                          disabled={busy}
                          onClick={(e) => handleInstantApprove(e, app)}
                          style={{ background: "#059669", borderColor: "#1e1b4b", padding: "0.5rem 1.1rem", fontSize: "0.85rem", gap: "0.4rem", fontWeight: 900 }}
                        >
                          <Zap size={16} /> {busy ? "Approving..." : "Instant Approve GL"}
                        </button>
                      )}

                      {alreadyApproved && (
                        <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#166534", background: "#dcfce7", padding: "0.4rem 0.85rem", borderRadius: 9999, border: "2px solid #166534" }}>
                          ✓ {app.status.replace(/_/g, " ")}
                        </span>
                      )}

                      <ArrowRight size={20} color="#1e1b4b" />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 800, color: "#475569" }}>
                      <span>
                        Requirement Completeness: <b>{score === null ? "—" : `${score}%`}</b>
                        {blocks.length > 0 ? ` (${blocks.filter((b) => blockTone(b.status) === "verified").length}/${blocks.length} blocks verified)` : ""}
                      </span>
                      <span>{app.created_at ? formatWhen(app.created_at) : ""}</span>
                    </div>
                    <div className="completenessBarBg">
                      <div
                        className="completenessBarFill"
                        style={{
                          width: `${score ?? 0}%`,
                          background: score === null ? "#cbd5e1" : score === 100 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444",
                        }}
                      />
                    </div>
                  </div>

                  {blocks.length > 0 && (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", paddingTop: "0.25rem" }}>
                      {blocks.map((b, i) => {
                        const tone = blockTone(b.status);
                        return (
                          <span
                            key={`${b.title}-${i}`}
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: 800,
                              padding: "0.25rem 0.65rem",
                              borderRadius: 10,
                              border: "1.5px solid #1e1b4b",
                              background: tone === "verified" ? "#dcfce7" : tone === "pending" ? "#fef3c7" : "#fee2e2",
                              color: tone === "verified" ? "#166534" : tone === "pending" ? "#92400e" : "#991b1b",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            {tone === "verified" ? "✓" : tone === "pending" ? "⏳" : "✕"} {b.title}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

/** "10 mins ago" style label for a backend ISO timestamp. */
function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function isThisMonth(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

const docTypeLabel = (type: string) => type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function AgencyReviewView({
  go,
  approve,
  selection,
  notify,
}: {
  go: (s: Screen) => void;
  approve: (amount: number, reason: string) => Promise<any>;
  selection: Selection;
  notify?: (s: string) => void;
}) {
  const applicationId = selection.applicationId;

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState<any>(null);
  const [budgetError, setBudgetError] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Eligible medical assistance under the AICS program");
  const [issueState, setIssueState] = useState<"idle" | "issuing" | "issued">("idle");
  const [decision, setDecision] = useState<any>(null);
  const [otherAssistance, setOtherAssistance] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!applicationId) {
      setApplication(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.getAgencyApplication(applicationId);
      setApplication(res.application);
      setAmount(String(res.application?.requested_amount ?? ""));
    } catch (err: any) {
      setApplication(null);
      setError(err?.message || "That application could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    load();
    api
      .getCompassBudget("DSWD-AICS")
      .then((data) => {
        setBudget(data);
        setBudgetError(false);
      })
      .catch(() => {
        setBudget(null);
        setBudgetError(true);
      });
  }, [load]);

  // Anti-double-dipping: only what the backend can actually answer — other
  // guarantee letters / applications already on record for the same patient.
  const caseId = application?.medical_case?.id;
  useEffect(() => {
    if (!caseId) return;
    let cancelled = false;
    api
      .getCase(caseId)
      .then((res) => {
        if (cancelled) return;
        const kase: any = res.case;
        const gls = (kase?.guarantee_letters || []).filter((gl: any) => gl.status !== "cancelled");
        const others = (kase?.agency_applications || []).filter(
          (a: any) => a.id !== application?.id && a.status !== "denied"
        );
        setOtherAssistance([
          ...gls.map((gl: any) => ({
            label: `Guarantee letter ${gl.gl_number}`,
            detail: `${money(Number(gl.approved_amount))} · ${gl.status?.replace(/_/g, " ")}`,
          })),
          ...others.map((a: any) => ({
            label: `Application #${a.id}`,
            detail: `${money(Number(a.requested_amount))} requested · ${a.status?.replace(/_/g, " ")}`,
          })),
        ]);
      })
      .catch(() => {
        if (!cancelled) setOtherAssistance([]);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, application?.id]);

  const handleApprove = async () => {
    setIssueState("issuing");
    const res = await approve(Number(amount), reason.trim() || "Eligible medical assistance");
    if (res) {
      setDecision(res);
      setIssueState("issued");
      await load();
    } else {
      setIssueState("idle");
    }
  };

  if (!applicationId) {
    return (
      <>
        <Head over="UNIFIED CASE REVIEW" title="No application selected" text="Open an application from the agency inbox to review it." />
        <section className="card">
          <p style={{ fontWeight: 700, color: "#4338ca" }}>Select an application from the inbox first.</p>
          <button className="primary" onClick={() => go("agency")}>
            Back to inbox
          </button>
        </section>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Head over="UNIFIED CASE REVIEW" title="Loading application..." text="Fetching the application record." />
        <p style={{ color: "#4338ca", fontWeight: 700, display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <RefreshCw size={16} className="animate-spin" /> Loading application...
        </p>
      </>
    );
  }

  if (error || !application) {
    return (
      <>
        <Head over="UNIFIED CASE REVIEW" title="Application unavailable" text="The application record could not be loaded." />
        <div role="alert" style={{ background: "#fef2f2", border: "2.5px solid #ef4444", borderRadius: 16, padding: "0.9rem 1.1rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <AlertTriangle size={18} color="#dc2626" /> {error || "Application not found."}
        </div>
        <button className="primary" style={{ marginTop: "1rem" }} onClick={() => go("agency")}>
          Back to inbox
        </button>
      </>
    );
  }

  const kase = application.medical_case || {};
  const financials = application.financials || {};
  const aiSummary = application.ai_summary || {};
  const program = application.agency_program || {};
  const documents: any[] = kase.documents || [];
  const existingGl = application.guarantee_letter;
  const sms = decision?.sms;

  return (
    <>
      <button
        style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontWeight: 900, marginBottom: "1rem", fontSize: "0.95rem" }}
        onClick={() => go("agency")}
      >
        ← Back to inbox
      </button>
      <Head
        over={`UNIFIED CASE REVIEW · ${kase.case_number || "—"}`}
        title={kase.patient_name || "Patient name unavailable"}
        text={`Submitted by ${kase.applicant?.name || application.applicant_name || "—"} · ${kase.provider?.name || "—"}`}
        action={<Status tone={application.status === "approved" ? "green" : "orange"}>{application.status?.replace(/_/g, " ")}</Status>}
      />

      <div className="cols">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <section className="card">
            <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900 }}>APPLICANT & PATIENT IDENTITY</label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900 }}>
                  {kase.applicant?.name || "—"} <BadgeCheck color="#2563eb" size={20} />
                </h3>
                <p style={{ margin: 0, color: "#4338ca", fontSize: "0.9rem", fontWeight: 600 }}>
                  {kase.relationship ? `${kase.relationship} of the patient` : "Relationship not stated"} · Patient: {kase.patient_name || "—"}
                </p>
              </div>
              <Status
                tone={
                  kase.applicant?.verified_identity === true
                    ? "green"
                    : kase.applicant?.verified_identity === false
                    ? "orange"
                    : "blue"
                }
              >
                {kase.applicant?.verified_identity === true
                  ? "PhilSys verified"
                  : kase.applicant?.verified_identity === false
                  ? "Identity not verified"
                  : "Identity status not reported"}
              </Status>
            </div>
          </section>

          <section className="card ai">
            <h3>
              <Sparkles size={20} /> eGov AI Medical Eligibility Summary
            </h3>
            <p>{aiSummary.summary || "No AI summary is available for this application yet."}</p>
            {Array.isArray(aiSummary.missing_requirements) && aiSummary.missing_requirements.length > 0 && (
              <p style={{ fontWeight: 800, color: "#92400e" }}>
                Outstanding requirements: {aiSummary.missing_requirements.map(docTypeLabel).join(", ")}
              </p>
            )}

            {/* Anti-double-dipping: only what the backend can actually support */}
            <div style={{ background: "#ffffff", border: "2px solid #1e1b4b", borderRadius: 16, padding: "0.85rem 1rem", margin: "0.85rem 0", fontSize: "0.85rem", fontWeight: 700, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <b style={{ fontSize: "0.75rem", letterSpacing: "0.08em", color: "#6366f1" }}>OTHER ACTIVE ASSISTANCE ON THIS PATIENT&apos;S RECORD</b>
              {otherAssistance.length === 0 ? (
                <div style={{ color: "#166534", display: "flex", gap: "0.35rem", alignItems: "center" }}>
                  <CheckCircle2 size={14} color="#059669" /> No other guarantee letter or application on record for this patient.
                </div>
              ) : (
                otherAssistance.map((item: any) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", color: "#1e1b4b" }}>
                    <span>{item.label}</span>
                    <span style={{ color: "#92400e" }}>{item.detail}</span>
                  </div>
                ))
              )}
              <small style={{ color: "#64748b", fontWeight: 700 }}>
                Limited to GabayMed records. PhilHealth, PCSO and DOH cross-checks are not performed by this system.
              </small>
            </div>
            <small>{aiSummary.disclaimer || "AI-generated summary — subject to evaluator review."}</small>
          </section>

          <section className="card">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "1rem" }}>Case & Requirement Audit</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", margin: "1rem 0", background: "#f5f3ff", padding: "1.25rem", borderRadius: 20, border: "2px solid #1e1b4b", fontSize: "0.9rem", fontWeight: 700 }}>
              <div><b>Condition:</b> {kase.condition_category || "—"}</div>
              <div><b>Provider:</b> {kase.provider?.name || "—"}</div>
              <div><b>Certified Bill:</b> {money(Number(kase.verified_bill || 0))}</div>
              <div><b>Program:</b> {program.name || "—"}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {documents.length === 0 ? (
                <p style={{ color: "#4338ca", fontWeight: 700 }}>No documents have been uploaded to this case yet.</p>
              ) : (
                documents.map((doc) => {
                  const certified = CERTIFIED_STATUSES.includes(doc.status);
                  return (
                    <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem", border: "2px solid #1e1b4b", borderRadius: 16, fontSize: "0.9rem", fontWeight: 700, background: "#ffffff", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span>
                        {doc.title || docTypeLabel(doc.document_type)}
                        <small style={{ display: "block", color: "#6366f1", fontWeight: 700 }}>{docTypeLabel(doc.document_type)}</small>
                      </span>
                      <Status tone={certified ? "green" : "orange"}>{doc.status?.replace(/_/g, " ") || "—"}</Status>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <section className="card">
            <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900 }}>FINANCIAL OVERVIEW</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", margin: "1rem 0", fontSize: "0.95rem", fontWeight: 700 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Verified Medical Bill</span>
                <b>{typeof financials.verified_bill === "number" ? money(financials.verified_bill) : "—"}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Existing Assistance</span>
                <b>{typeof financials.total_approved_assistance === "number" ? money(financials.total_approved_assistance) : "—"}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Already Utilized</span>
                <b>{typeof financials.total_utilized === "number" ? money(financials.total_utilized) : "—"}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Remaining Uncovered</span>
                <b>{typeof financials.remaining_uncovered_balance === "number" ? money(financials.remaining_uncovered_balance) : "—"}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #e0e7ff", paddingTop: "0.75rem" }}>
                <span>Requested Assistance</span>
                <strong style={{ color: "#1e1b4b", fontSize: "1.4rem", fontWeight: 900 }}>{money(Number(application.requested_amount || 0))}</strong>
              </div>
            </div>
          </section>

          <section className="card" style={{ background: "#e0e7ff" }}>
            <label style={{ fontSize: "0.75rem", color: "#4338ca", fontWeight: 900 }}>DBM COMPASS BUDGET ALLOCATION</label>
            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", fontWeight: 700, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <span>Fund Source:</span> <b>{budget?.fund_source || "—"}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <span>Remaining Allocation:</span>{" "}
                <b style={{ color: "#059669" }}>
                  {typeof budget?.remaining_balance === "number" && typeof budget?.total_allocation === "number"
                    ? `${money(budget.remaining_balance)} / ${money(budget.total_allocation)}`
                    : "—"}
                </b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <span>Compass Ref:</span> <code style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{budget?.compass_reference || "—"}</code>
              </div>
              {budgetError && <small style={{ color: "#92400e", fontWeight: 800 }}>Compass budget feed unavailable.</small>}
            </div>
          </section>

          <section className="card" style={{ background: "#fef08a" }}>
            <label style={{ fontSize: "0.75rem", color: "#1e1b4b", fontWeight: 900 }}>EVALUATOR DECISION</label>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: "0.25rem 0 1rem 0" }}>
              {existingGl ? "Guarantee Letter Issued" : "Issue Guarantee Letter"}
            </h2>

            {existingGl ? (
              <div style={{ background: "#ffffff", border: "2px solid #1e1b4b", borderRadius: 16, padding: "0.85rem 1rem", fontWeight: 800, fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <span>GL Number</span> <b>{existingGl.gl_number}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <span>Approved</span> <b>{money(Number(existingGl.approved_amount || 0))}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <span>Expires</span> <b>{existingGl.expiration_date || "—"}</b>
                </div>
                <button className="outline wide" style={{ marginTop: "0.5rem", background: "#ffffff" }} onClick={() => go("guarantee")}>
                  <QrCode size={20} /> Preview Guarantee Letter
                </button>
              </div>
            ) : (
              <>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800, marginBottom: "1rem" }}>
                  Approved Amount (₱)
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    style={{ padding: "0.75rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 800, background: "#ffffff" }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800, marginBottom: "1.5rem" }}>
                  Decision Reason / Remarks
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{ padding: "0.75rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 800, background: "#ffffff" }}
                  />
                </label>

                <button
                  className="primary wide"
                  disabled={issueState !== "idle" || !amount || !reason.trim()}
                  onClick={handleApprove}
                  style={{ background: "#059669" }}
                >
                  <ShieldCheck size={20} />{" "}
                  {issueState === "idle" ? "Approve & Issue Digital Guarantee Letter" : issueState === "issuing" ? "Issuing Guarantee Letter..." : "Guarantee Letter Issued"}
                </button>
              </>
            )}

            {/* The SMS card is rendered from the backend's own dispatch receipt. */}
            {sms && (
              <div role="status" style={{ marginTop: "1rem", background: "#1e1b4b", color: "#ffffff", borderRadius: 18, padding: "1rem 1.1rem", border: "2.5px solid #312e81" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "#818cf8", letterSpacing: "0.08em", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <MessageSquare size={14} /> eMESSAGE PUSH SMS
                  </span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 900, background: "#059669", padding: "0.15rem 0.55rem", borderRadius: 8 }}>
                    {sms.status === null || sms.status === undefined ? "ATTEMPTED" : `STATUS ${sms.status}`}
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: 800 }}>To: {sms.number}</div>
                <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.8rem", color: "#c7d2fe", fontWeight: 600, lineHeight: 1.45 }}>&ldquo;{sms.message}&rdquo;</p>
              </div>
            )}

            {decision && !sms && (
              <small style={{ display: "block", marginTop: "0.85rem", color: "#1e1b4b", fontWeight: 800 }}>
                No SMS was dispatched{decision.message ? ` — ${decision.message}` : "."}
              </small>
            )}

            {existingGl && (
              <button className="outline wide" style={{ marginTop: "1rem", background: "#ffffff" }} onClick={() => go("guarantee")}>
                <QrCode size={20} /> Preview Guarantee Letter
              </button>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
