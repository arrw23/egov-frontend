import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Filter,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Screen } from "@/types";
import { Head, Stat, Status } from "../common/Ui";

interface PendingServiceRequest {
  id: string;
  caseNumber: string;
  applicantName: string;
  patientName: string;
  relationship: string;
  hospitalName: string;
  billAmount: number;
  requestedAmount: number;
  submittedAt: string;
  blocks: { title: string; status: "verified" | "pending" | "missing" }[];
}

const MOCK_PENDING_REQUESTS: PendingServiceRequest[] = [
  {
    id: "req_1",
    caseNumber: "MGL-2026-001284",
    applicantName: "Maria Lourdes Santos",
    patientName: "Juan D. Santos",
    relationship: "Sister",
    hospitalName: "Manila General Hospital",
    billAmount: 150000,
    requestedAmount: 50000,
    submittedAt: "10 mins ago",
    blocks: [
      { title: "Valid Government ID", status: "verified" },
      { title: "Barangay Indigency", status: "verified" },
      { title: "Medical Abstract", status: "verified" },
      { title: "Hospital Bill", status: "verified" },
      { title: "Social Case Study", status: "verified" },
    ],
  },
  {
    id: "req_2",
    caseNumber: "MGL-2026-001281",
    applicantName: "Teresa M. Ramos",
    patientName: "Teresa M. Ramos",
    relationship: "Self",
    hospitalName: "Philippine General Hospital",
    billAmount: 86400,
    requestedAmount: 35000,
    submittedAt: "25 mins ago",
    blocks: [
      { title: "Valid Government ID", status: "verified" },
      { title: "Barangay Indigency", status: "verified" },
      { title: "Medical Abstract", status: "verified" },
      { title: "Hospital Bill", status: "verified" },
      { title: "Social Case Study", status: "pending" },
    ],
  },
  {
    id: "req_3",
    caseNumber: "NKTI-2026-00941",
    applicantName: "Eduardo V. Gomez",
    patientName: "Eduardo V. Gomez",
    relationship: "Self",
    hospitalName: "National Kidney & Transplant Inst.",
    billAmount: 210000,
    requestedAmount: 75000,
    submittedAt: "1 hour ago",
    blocks: [
      { title: "Valid Government ID", status: "verified" },
      { title: "Barangay Indigency", status: "verified" },
      { title: "Medical Abstract", status: "verified" },
      { title: "Hospital Bill", status: "verified" },
      { title: "Social Case Study", status: "verified" },
    ],
  },
  {
    id: "req_4",
    caseNumber: "SJMC-2026-00310",
    applicantName: "Rosa P. Mercado",
    patientName: "Gabriel P. Mercado",
    relationship: "Mother",
    hospitalName: "St. Jude Medical Center",
    billAmount: 45000,
    requestedAmount: 20000,
    submittedAt: "2 hours ago",
    blocks: [
      { title: "Valid Government ID", status: "verified" },
      { title: "Barangay Indigency", status: "verified" },
      { title: "Medical Abstract", status: "verified" },
      { title: "Hospital Bill", status: "missing" },
    ],
  },
  {
    id: "req_5",
    caseNumber: "LCP-2026-00752",
    applicantName: "Carlos H. Mendoza",
    patientName: "Carlos H. Mendoza",
    relationship: "Self",
    hospitalName: "Lung Center of the Philippines",
    billAmount: 320000,
    requestedAmount: 100000,
    submittedAt: "3 hours ago",
    blocks: [
      { title: "Valid Government ID", status: "verified" },
      { title: "Barangay Indigency", status: "verified" },
      { title: "Medical Abstract", status: "missing" },
      { title: "Hospital Bill", status: "missing" },
      { title: "Social Case Study", status: "missing" },
    ],
  },
];

export function AgencyInboxView({
  go,
  notify,
}: {
  go: (s: Screen) => void;
  notify?: (s: string) => void;
}) {
  const [sortOption, setSortOption] = useState<"completeness_desc" | "completeness_asc" | "requested_desc" | "recent">("completeness_desc");
  const [filterCategory, setFilterCategory] = useState<"all" | "ready" | "partial" | "incomplete">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [approvedIds, setApprovedIds] = useState<string[]>([]);

  const calculateCompleteness = (req: PendingServiceRequest) => {
    const verifiedCount = req.blocks.filter((b) => b.status === "verified").length;
    return Math.round((verifiedCount / req.blocks.length) * 100);
  };

  // Filter and Sort requests
  const processedRequests = MOCK_PENDING_REQUESTS.filter((req) => {
    const score = calculateCompleteness(req);
    if (filterCategory === "ready" && score < 100) return false;
    if (filterCategory === "partial" && (score === 100 || score < 50)) return false;
    if (filterCategory === "incomplete" && score >= 50) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        req.applicantName.toLowerCase().includes(q) ||
        req.patientName.toLowerCase().includes(q) ||
        req.caseNumber.toLowerCase().includes(q) ||
        req.hospitalName.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortOption === "completeness_desc") {
      return calculateCompleteness(b) - calculateCompleteness(a);
    }
    if (sortOption === "completeness_asc") {
      return calculateCompleteness(a) - calculateCompleteness(b);
    }
    if (sortOption === "requested_desc") {
      return b.requestedAmount - a.requestedAmount;
    }
    return 0;
  });

  const handleInstantApprove = (e: React.MouseEvent, req: PendingServiceRequest) => {
    e.stopPropagation();
    setApprovedIds((prev) => [...prev, req.id]);
    if (notify) {
      notify(`100% Complete! Guarantee Letter GL-${req.caseNumber} approved instantly for ₱${req.requestedAmount.toLocaleString()}!`);
    }
  };

  return (
    <>
      <Head
        over="DSWD NCR · AICS PROGRAM"
        title="Pending Service Requests Inbox"
        text="Service requests sorted by completeness score for instant evaluator approval."
        action={
          <button
            className="primary"
            onClick={() => go("builder")}
            style={{ padding: "0.5rem 1.1rem", fontSize: "0.85rem", gap: "0.4rem" }}
          >
            <Layers size={16} /> Requirement Builder
          </button>
        }
      />

      {/* DBM Compass Budget Banner */}
      <div
        className="card"
        style={{
          background: "#e0e7ff",
          marginBottom: "1.75rem",
          border: "2.5px solid #1e1b4b",
          boxShadow: "0 6px 0 #1e1b4b",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.85rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 900,
                color: "#4338ca",
                letterSpacing: "0.08em",
              }}
            >
              DBM COMPASS LIVE ALLOCATION TRACKER
            </span>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 900, margin: "0.1rem 0", color: "#1e1b4b" }}>
              GAA 2026 DSWD AICS Medical Help Funds
            </h3>
          </div>
          <Status tone="green">Compass API Active (dbm_live_571b...)</Status>
        </div>
        <div
          className="formGrid"
          style={{
            background: "#ffffff",
            padding: "1.1rem",
            borderRadius: 16,
            border: "2.5px solid #1e1b4b",
            fontSize: "0.9rem",
            fontWeight: 800,
            gap: "1rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", color: "#6366f1", display: "block" }}>
              Total Allocated Fund
            </span>
            <b style={{ fontSize: "1.25rem", color: "#1e1b4b" }}>₱20,000,000.00</b>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#6366f1", display: "block" }}>
              Committed / Disbursed
            </span>
            <b style={{ fontSize: "1.25rem", color: "#d97706" }}>₱5,200,000.00 (26%)</b>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#6366f1", display: "block" }}>
              Available Help Fund Balance
            </span>
            <b style={{ fontSize: "1.25rem", color: "#059669" }}>₱14,800,000.00 (74%)</b>
          </div>
        </div>
      </div>

      <div className="stats three">
        <Stat
          Icon={CheckCircle2}
          label="100% Ready Approval"
          value={MOCK_PENDING_REQUESTS.filter((r) => calculateCompleteness(r) === 100).length.toString()}
          note="Instant GL issuance"
          tone="green"
        />
        <Stat
          Icon={Clock3}
          label="Pending Extra Docs"
          value={MOCK_PENDING_REQUESTS.filter((r) => calculateCompleteness(r) < 100).length.toString()}
          note="1.2 day avg response"
          tone="orange"
        />
        <Stat
          Icon={CircleDollarSign}
          label="Approved This Month"
          value="₱1.24M"
          note="38 beneficiaries supported"
          tone="blue"
        />
      </div>

      {/* Main Inbox List Card */}
      <section className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Controls Bar: Sort, Filter, Search */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            borderBottom: "2px solid #e0e7ff",
            paddingBottom: "1rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: 0 }}>Pending Service Requests</h2>
            <small style={{ color: "#6366f1", fontWeight: 700 }}>
              Sorted by completeness % for instant evaluation & approval
            </small>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Search Input */}
            <div style={{ position: "relative", width: 210 }}>
              <Search
                size={16}
                color="#64748b"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                placeholder="Search applicant or hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.75rem 0.45rem 2.2rem",
                  borderRadius: 12,
                  border: "2px solid #1e1b4b",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                }}
              />
            </div>

            {/* Sort Select */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <ArrowUpDown size={16} color="#4338ca" />
              <select
                value={sortOption}
                onChange={(e: any) => setSortOption(e.target.value)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: 12,
                  border: "2px solid #1e1b4b",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  background: "#ffffff",
                  cursor: "pointer",
                }}
              >
                <option value="completeness_desc">Sort: Highest Completeness (100% → 0%)</option>
                <option value="completeness_asc">Sort: Lowest Completeness (0% → 100%)</option>
                <option value="requested_desc">Sort: Highest Requested Amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            className={filterCategory === "all" ? "primary" : "outline"}
            onClick={() => setFilterCategory("all")}
            style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem" }}
          >
            All Pending ({MOCK_PENDING_REQUESTS.length})
          </button>
          <button
            className={filterCategory === "ready" ? "primary" : "outline"}
            onClick={() => setFilterCategory("ready")}
            style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem", borderColor: "#16a34a" }}
          >
            ⚡ 100% Ready for Approval (
            {MOCK_PENDING_REQUESTS.filter((r) => calculateCompleteness(r) === 100).length})
          </button>
          <button
            className={filterCategory === "partial" ? "primary" : "outline"}
            onClick={() => setFilterCategory("partial")}
            style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem" }}
          >
            🟡 Partial (50%-99%) (
            {
              MOCK_PENDING_REQUESTS.filter((r) => {
                const s = calculateCompleteness(r);
                return s >= 50 && s < 100;
              }).length
            }
            )
          </button>
          <button
            className={filterCategory === "incomplete" ? "primary" : "outline"}
            onClick={() => setFilterCategory("incomplete")}
            style={{ padding: "0.35rem 0.9rem", fontSize: "0.8rem" }}
          >
            🔴 Incomplete (&lt;50%) (
            {MOCK_PENDING_REQUESTS.filter((r) => calculateCompleteness(r) < 50).length})
          </button>
        </div>

        {/* List of Sorted Service Requests */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {processedRequests.map((req) => {
            const completeness = calculateCompleteness(req);
            const isFullyApproved = approvedIds.includes(req.id);
            const verifiedBlocksCount = req.blocks.filter((b) => b.status === "verified").length;

            return (
              <div
                key={req.id}
                onClick={() => go("agency_review")}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  padding: "1.25rem",
                  border: "2.5px solid #1e1b4b",
                  borderRadius: 20,
                  background: isFullyApproved ? "#f0fdf4" : "white",
                  boxShadow: "0 4px 0 #1e1b4b",
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                }}
              >
                {/* Top Row: Case info & Completeness gauge */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <b style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1e1b4b" }}>
                        {req.patientName}
                      </b>
                      {completeness === 100 && (
                        <Status tone="green">
                          <Zap size={14} /> 100% Ready
                        </Status>
                      )}
                      {completeness < 100 && completeness >= 50 && <Status tone="orange">Partial</Status>}
                      {completeness < 50 && <Status tone="red">Incomplete</Status>}
                    </div>
                    <small style={{ color: "#4338ca", fontWeight: 700, display: "block", marginTop: "0.15rem" }}>
                      Case #{req.caseNumber} · Applicant: {req.applicantName} ({req.relationship}) ·{" "}
                      {req.hospitalName}
                    </small>
                  </div>

                  {/* Financials & Action */}
                  <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.78rem", color: "#64748b", display: "block", fontWeight: 700 }}>
                        Bill: <b>₱{req.billAmount.toLocaleString()}</b>
                      </span>
                      <span style={{ fontSize: "0.95rem", color: "#1e1b4b", fontWeight: 900 }}>
                        Requested: <b>₱{req.requestedAmount.toLocaleString()}</b>
                      </span>
                    </div>

                    {completeness === 100 && !isFullyApproved && (
                      <button
                        className="primary"
                        onClick={(e) => handleInstantApprove(e, req)}
                        style={{
                          background: "#059669",
                          borderColor: "#1e1b4b",
                          padding: "0.5rem 1.1rem",
                          fontSize: "0.85rem",
                          gap: "0.4rem",
                          fontWeight: 900,
                        }}
                      >
                        <Zap size={16} /> Instant Approve GL
                      </button>
                    )}

                    {isFullyApproved && (
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 900,
                          color: "#166534",
                          background: "#dcfce7",
                          padding: "0.4rem 0.85rem",
                          borderRadius: 9999,
                          border: "2px solid #166534",
                        }}
                      >
                        ✓ GL Issued
                      </span>
                    )}

                    <ArrowRight size={20} color="#1e1b4b" />
                  </div>
                </div>

                {/* Completeness Bar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      color: "#475569",
                    }}
                  >
                    <span>
                      Requirement Completeness: <b>{completeness}%</b> ({verifiedBlocksCount}/
                      {req.blocks.length} Blocks Verified)
                    </span>
                    <span>{req.submittedAt}</span>
                  </div>
                  <div className="completenessBarBg">
                    <div
                      className="completenessBarFill"
                      style={{
                        width: `${completeness}%`,
                        background:
                          completeness === 100 ? "#22c55e" : completeness >= 50 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                </div>

                {/* Requirement Block Chips from Builder */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", paddingTop: "0.25rem" }}>
                  {req.blocks.map((b, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: 800,
                        padding: "0.25rem 0.65rem",
                        borderRadius: 10,
                        border: "1.5px solid #1e1b4b",
                        background:
                          b.status === "verified"
                            ? "#dcfce7"
                            : b.status === "pending"
                            ? "#fef3c7"
                            : "#fee2e2",
                        color:
                          b.status === "verified"
                            ? "#166534"
                            : b.status === "pending"
                            ? "#92400e"
                            : "#991b1b",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      {b.status === "verified" ? "✓" : b.status === "pending" ? "⏳" : "✕"} {b.title}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function AgencyReviewView({
  go,
  approve,
}: {
  go: (s: Screen) => void;
  approve: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("50000");

  return (
    <>
      <button
        style={{
          background: "none",
          border: "none",
          color: "#6366f1",
          cursor: "pointer",
          fontWeight: 900,
          marginBottom: "1rem",
          fontSize: "0.95rem",
        }}
        onClick={() => go("agency")}
      >
        ← Back to inbox
      </button>
      <Head
        over="UNIFIED CASE REVIEW · MGL-2026-001284"
        title="Juan D. Santos"
        text="Submitted by Maria Lourdes Santos · Manila General Hospital"
        action={<Status tone="orange">Under Review</Status>}
      />

      <div className="cols">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <section className="card">
            <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900 }}>
              APPLICANT & PATIENT IDENTITY
            </label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900 }}>
                  Maria Lourdes Santos <BadgeCheck color="#2563eb" size={20} />
                </h3>
                <p style={{ margin: 0, color: "#4338ca", fontSize: "0.9rem", fontWeight: 600 }}>
                  Sister & Authorized Patient Representative
                </p>
              </div>
              <Status tone="green">PhilSys Matched</Status>
            </div>
          </section>

          <section className="card ai">
            <h3>
              <Sparkles size={20} /> AI-Generated Case Summary
            </h3>
            <p>
              Patient <b>Juan D. Santos</b> requires a <b>laparoscopic appendectomy</b> at Manila General Hospital. The hospital-certified bill is <b>₱150,000.00</b>. No previous government assistance has been received. All documentary requirements are <b>100% complete and verified</b>. Applicant requests <b>₱50,000.00</b>.
            </p>
            <small>AI-generated summary — subject to evaluator review.</small>
          </section>

          <section className="card">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "1rem" }}>
              Requirement Blocks Audit
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                margin: "1rem 0",
                background: "#f5f3ff",
                padding: "1.25rem",
                borderRadius: 20,
                border: "2px solid #1e1b4b",
                fontSize: "0.9rem",
                fontWeight: 700,
              }}
            >
              <div><b>Diagnosis:</b> Acute appendicitis</div>
              <div><b>Provider:</b> Manila General Hospital</div>
              <div><b>Certified Bill:</b> ₱150,000.00</div>
              <div><b>eGovChain Reference:</b> HSP-A81E-5B20</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                "PhilSys Identity Match",
                "Certificate of Indigency",
                "Hospital Medical Abstract",
                "Certified Statement of Account",
                "Social Case Study",
              ].map((x) => (
                <div
                  key={x}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    border: "2px solid #1e1b4b",
                    borderRadius: 16,
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    background: "#ffffff",
                  }}
                >
                  <span>{x}</span>
                  <Status tone="green">Verified</Status>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <section className="card">
            <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900 }}>
              FINANCIAL OVERVIEW
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", margin: "1rem 0", fontSize: "0.95rem", fontWeight: 700 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Verified Medical Bill</span>
                <b>₱150,000</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Existing Assistance</span>
                <b>₱0</b>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "2px solid #e0e7ff",
                  paddingTop: "0.75rem",
                }}
              >
                <span>Requested Assistance</span>
                <strong style={{ color: "#1e1b4b", fontSize: "1.4rem", fontWeight: 900 }}>₱50,000</strong>
              </div>
            </div>
          </section>

          <section className="card" style={{ background: "#e0e7ff" }}>
            <label style={{ fontSize: "0.75rem", color: "#4338ca", fontWeight: 900 }}>
              DBM COMPASS BUDGET ALLOCATION
            </label>
            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", fontWeight: 700, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Fund Source:</span> <b>GAA 2026 DSWD AICS Budget</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Remaining Allocation:</span> <b style={{ color: "#059669" }}>₱14.80M / ₱20.00M</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Compass Ref:</span> <code style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>DBM-COMPASS-2026-AICS</code>
              </div>
            </div>
          </section>

          <section className="card" style={{ background: "#fef08a" }}>
            <label style={{ fontSize: "0.75rem", color: "#1e1b4b", fontWeight: 900 }}>
              EVALUATOR DECISION
            </label>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: "0.25rem 0 1rem 0" }}>
              Issue Guarantee Letter
            </h2>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
                fontSize: "0.9rem",
                fontWeight: 800,
                marginBottom: "1rem",
              }}
            >
              Approved Amount (₱)
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  padding: "0.75rem",
                  borderRadius: 16,
                  border: "2.5px solid #1e1b4b",
                  fontWeight: 800,
                  background: "#ffffff",
                }}
              />
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
                fontSize: "0.9rem",
                fontWeight: 800,
                marginBottom: "1.5rem",
              }}
            >
              Decision Reason / Remarks
              <input
                defaultValue="Eligible medical assistance under DSWD AICS Program"
                style={{
                  padding: "0.75rem",
                  borderRadius: 16,
                  border: "2.5px solid #1e1b4b",
                  fontWeight: 800,
                  background: "#ffffff",
                }}
              />
            </label>

            <button
              className="primary wide"
              onClick={() => {
                approve(Number(amount));
                go("guarantee");
              }}
            >
              <ShieldCheck size={20} /> Approve & Issue Guarantee Letter
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
