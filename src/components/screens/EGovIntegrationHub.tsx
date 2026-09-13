import React, { useState } from "react";
import {
  Activity,
  Bot,
  Brain,
  Building2,
  Camera,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Database,
  FileCheck2,
  Globe,
  Key,
  Layers,
  Lock,
  MessageSquare,
  Network,
  QrCode,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserCheck,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { Head, Status } from "../common/Ui";

type ActiveTab =
  | "sso"
  | "everify"
  | "liveness"
  | "ai"
  | "blockchain"
  | "pay"
  | "message"
  | "report"
  | "compass";

type SummaryRow = { label: string; value: string; highlight?: boolean };

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

// 7514252280701.64 -> "₱7.51 Trillion"
const pesoCompact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `₱${(n / 1e12).toFixed(2)} Trillion`;
  if (abs >= 1e9) return `₱${(n / 1e9).toFixed(2)} Billion`;
  if (abs >= 1e6) return `₱${(n / 1e6).toFixed(2)} Million`;
  return `₱${n.toLocaleString("en-PH")}`;
};

// Readable card for DBM Compass responses so the presenter can point at figures instead of raw JSON
const compassSummary = (res: unknown): { title: string; rows: SummaryRow[] } | null => {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const cascade = r.cascade as Record<string, unknown> | undefined;
  if (cascade && isNum(cascade.totalAvailable)) {
    const rates = (r.rates as Record<string, unknown> | undefined) ?? {};
    const { totalAvailable, allotments, obligations, disbursements } = cascade;
    const rate = isNum(rates.obligationRate)
      ? rates.obligationRate
      : isNum(obligations) && isNum(allotments) && allotments > 0
      ? obligations / allotments
      : null;
    return {
      title: `SAAODB BUDGET CASCADE${r.reportYear ? ` · FY ${r.reportYear}` : ""}`,
      rows: [
        { label: "Total Available", value: pesoCompact(totalAvailable), highlight: true },
        ...(isNum(allotments) ? [{ label: "Allotments", value: pesoCompact(allotments) }] : []),
        ...(isNum(obligations) ? [{ label: "Obligations", value: pesoCompact(obligations), highlight: true }] : []),
        ...(isNum(disbursements) ? [{ label: "Disbursements", value: pesoCompact(disbursements) }] : []),
        ...(rate !== null ? [{ label: "Utilization Rate (obligations ÷ allotments)", value: `${(rate * 100).toFixed(1)}%`, highlight: true }] : []),
      ],
    };
  }
  if (isNum(r.total_allocation)) {
    return {
      title: `GAA 2026 TRANSPARENCY METRICS${r.program_code ? ` · ${r.program_code}` : ""}`,
      rows: [
        { label: "Total Allocation", value: pesoCompact(r.total_allocation), highlight: true },
        ...(isNum(r.utilized_amount) ? [{ label: "Utilized", value: pesoCompact(r.utilized_amount), highlight: true }] : []),
        ...(isNum(r.remaining_balance) ? [{ label: "Remaining Balance", value: pesoCompact(r.remaining_balance) }] : []),
        ...(isNum(r.disbursements) ? [{ label: "Disbursements", value: pesoCompact(r.disbursements) }] : []),
        ...(typeof r.fund_source === "string" ? [{ label: "Fund Source", value: r.fund_source }] : []),
        ...(typeof r.status === "string" ? [{ label: "Status", value: r.status }] : []),
      ],
    };
  }
  return null;
};

export function EGovIntegrationHub() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("blockchain");
  const [loading, setLoading] = useState(false);
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [curlCommand, setCurlCommand] = useState<string>("");

  // SSO state
  const [exchangeCode, setExchangeCode] = useState("CYsS3rqHXM8QRBsO0444lXAUlcp1jeU4");
  const [partnerCode, setPartnerCode] = useState("3b597185a139440d8e6d56bc45330ee8");
  const [partnerSecret, setPartnerSecret] = useState("1cdace2a179b4bf6917f6068c683b417");
  const [ssoToken, setSsoToken] = useState("");

  // eVerify state
  const [firstName, setFirstName] = useState("Juan");
  const [lastName, setLastName] = useState("Dela Cruz");
  const [birthDate, setBirthDate] = useState("1989-09-12");
  const [qrValue, setQrValue] = useState("RAW_QR_CODE_VALUE_PHILSYS_9639954762664080");
  const [livenessSessionId, setLivenessSessionId] = useState("");
  const [livenessAction, setLivenessAction] = useState<"redirect" | "post" | "close">("redirect");
  const [livenessCallbackUrl, setLivenessCallbackUrl] = useState("https://your-app.com/callback");
  const [livenessDelay, setLivenessDelay] = useState(3000);

  // AI state
  const [aiAccessCode, setAiAccessCode] = useState("666d079fc10443d595c32af87eacbc8b");
  const [aiTokenValue, setAiTokenValue] = useState("");
  const [aiPrompt, setAiPrompt] = useState("how can i get my digital tin id here in egov");
  const [aiCategory, setAiCategory] = useState("PH");

  // Blockchain state
  const [recordId, setRecordId] = useState("GL-DSWD-2026-04821");
  const [recordHash, setRecordHash] = useState("0xd8f2910c5d12a8f9104b2819c5b201f8");

  // Pay & Compass
  const [settleAmount, setSettleAmount] = useState(1000);
  const [payTransactionUuid, setPayTransactionUuid] = useState("");
  const [payTxnId, setPayTxnId] = useState("TESTREF123");
  const [programCode, setProgramCode] = useState("DSWD-AICS");

  // eMessage SMS state
  const [smsNumber, setSmsNumber] = useState("+639090000000");
  const [smsMessage, setSmsMessage] = useState("GabayMed Notice: Your DSWD guarantee letter GL-DSWD-2026-04821 has been issued to Manila General Hospital.");

  // eReport state
  const [ereportAccessCode, setEreportAccessCode] = useState("2a72bdcac1b0405fb2c679d029f03cfb");
  const [ereportTokenVal, setEreportTokenVal] = useState("");
  const [ereportViewTokenVal, setEreportViewTokenVal] = useState("");
  const [ereportEmail, setEreportEmail] = useState("josie@yopmail.com");
  const [ereportOtp, setEreportOtp] = useState("000000");
  const [ereportCaseNumber, setEreportCaseNumber] = useState("PFM-090326-1489");
  const [ereportRegionCode, setEreportRegionCode] = useState("040000000");
  const [ereportProvinceCode, setEreportProvinceCode] = useState("042100000");
  const [ereportMuniCode, setEreportMuniCode] = useState("042111000");

  // DBM Compass state
  const [compassReportYear, setCompassReportYear] = useState(2026);
  const [compassSheetScope, setCompassSheetScope] = useState<"summary" | "agency" | "sucs">("summary");
  const [compassPeriod, setCompassPeriod] = useState("FY");
  const [compassClass, setCompassClass] = useState("PS");
  const [compassEntityName, setCompassEntityName] = useState("Agriculture");
  const [compassLgsfProgram, setCompassLgsfProgram] = useState("FALGU");
  const [compassProvince, setCompassProvince] = useState("Bulacan");
  const [compassMuni, setCompassMuni] = useState("Malolos");
  const [compassDeptCode, setCompassDeptCode] = useState("010000000000");
  const [compassAgencyCode, setCompassAgencyCode] = useState("010010000000");
  const [compassOperatingCode, setCompassOperatingCode] = useState("010010000001");
  const [compassExpenseClass, setCompassExpenseClass] = useState("5020000000");
  const [compassSaroNo, setCompassSaroNo] = useState("SARO-BMB-A-26-0000001");

  const runApiCall = async (fn: () => Promise<any>, curlSnippet: string) => {
    setLoading(true);
    setCurlCommand(curlSnippet);
    try {
      const res = await fn();
      setResponseOutput(res);
      return res;
    } catch (err: any) {
      setResponseOutput({ error: err.message || "Request failed" });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head
        over="REPUBLIC OF THE PHILIPPINES · SYSTEM SERVICES"
        title="System Integration & Service Testing Hub"
        text="Test and verify integrated government services including tamper-evident record verification, identity cross-checking, biometrics, and automated case summaries."
        action={<Status tone="green">9 Integrated Services Active</Status>}
      />

      {/* Tab Selector Buttons */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {[
          { id: "blockchain", label: "Ledger Verification", Icon: Network, tone: "#4338ca" },
          { id: "sso", label: "Single Sign-On", Icon: Lock, tone: "#2563eb" },
          { id: "everify", label: "PhilSys Identity", Icon: UserCheck, tone: "#059669" },
          { id: "liveness", label: "Face Liveness Check", Icon: ShieldCheck, tone: "#d97706" },
          { id: "ai", label: "AI Intelligence", Icon: Brain, tone: "#7c3aed" },
          { id: "pay", label: "Payment Settlement", Icon: Wallet, tone: "#0284c7" },
          { id: "message", label: "Citizen Notifications", Icon: MessageSquare, tone: "#e11d48" },
          { id: "report", label: "eReport Audit Logging", Icon: Layers, tone: "#475569" },
          { id: "compass", label: "DBM Compass Budget Transparency", Icon: Database, tone: "#0d9488" },
        ].map((tab, i) => {
          const Icon = tab.Icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ActiveTab);
                setResponseOutput(null);
              }}
              className={isActive ? "primary" : "outline"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.5rem 0.9rem",
                fontSize: "0.82rem",
                fontWeight: 800,
                borderRadius: "9999px",
                background: isActive ? tab.tone : "#ffffff",
                color: isActive ? "#ffffff" : "#1e1b4b",
                borderColor: "#1e1b4b",
              }}
            >
              {/* Tab numbers match the demo script's "Tab 8" / "Tab 9" references */}
              <span aria-hidden="true" style={{ minWidth: 18, height: 18, borderRadius: "50%", background: isActive ? "rgba(255,255,255,0.25)" : "#e0e7ff", fontSize: "0.7rem", fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {i + 1}
              </span>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="cols">
        {/* Left Column: Form Inputs & Actions */}
        <div style={{ background: "#ffffff", border: "2.5px solid #1e1b4b", borderRadius: 24, padding: "1.5rem", boxShadow: "0 6px 0 #1e1b4b" }}>
          
          {/* TAB 1: Blockchain */}
          {activeTab === "blockchain" && (
            <div>
              <div style={{ background: "#e0e7ff", color: "#1e1b4b", padding: "0.3rem 0.8rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
                TAMPER-EVIDENT RECORD LEDGER
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem", color: "#1e1b4b" }}>Record Verification Service</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                Verify and anchor guarantee letter states to the official tamper-evident government digital record ledger.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Guarantee / Case Reference ID</label>
                  <input
                    value={recordId}
                    onChange={(e) => setRecordId(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700, fontFamily: "monospace" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Record Hash (SHA-256)</label>
                  <input
                    value={recordHash}
                    onChange={(e) => setRecordHash(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700, fontFamily: "monospace" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.55rem", marginTop: "0.5rem" }}>
                  <button
                    className="primary"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.besuAnchorRecord(recordId, recordHash),
                        `POST /api/v1/egovchain/anchor -> {"record_id":"${recordId}","hash":"${recordHash}"}`
                      )
                    }
                    style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                  >
                    <Network size={15} /> Anchor Record
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.besuJsonRpc("eth_blockNumber", []),
                        `POST /api/v1/egovchain/rpc -> eth_blockNumber`
                      )
                    }
                    style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                  >
                    <Cpu size={15} /> Block Height
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.besuJsonRpc("rpc_modules", []),
                        `POST /api/v1/egovchain/rpc -> rpc_modules`
                      )
                    }
                    style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem" }}
                  >
                    RPC Modules
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.besuJsonRpc("eth_chainId", []),
                        `POST /api/v1/egovchain/rpc -> eth_chainId (13371)`
                      )
                    }
                    style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem" }}
                  >
                    Chain ID
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.besuJsonRpc("eth_gasPrice", []),
                        `POST /api/v1/egovchain/rpc -> eth_gasPrice (0x0 Zero Fee)`
                      )
                    }
                    style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem" }}
                  >
                    Gas Price (Zero)
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.besuJsonRpc("web3_clientVersion", []),
                        `POST /api/v1/egovchain/rpc -> web3_clientVersion`
                      )
                    }
                    style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem" }}
                  >
                    Besu Client
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.besuJsonRpc("txpool_besuStatistics", []),
                        `POST /api/v1/egovchain/rpc -> txpool_besuStatistics`
                      )
                    }
                    style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem" }}
                  >
                    TxPool Stats
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () =>
                          api.besuJsonRpc("eth_call", [
                            { to: "0x52B6c6ffc6b5413F09C2E3C9a85703f848EaF014", data: "0x7d0a5142" },
                            "latest",
                          ]),
                        `POST /api/v1/egovchain/rpc -> Guestbook teamCount()`
                      )
                    }
                    style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem" }}
                  >
                    Guestbook Call
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SSO */}
          {activeTab === "sso" && (
            <div>
              <div style={{ background: "#dbeafe", color: "#1e40af", padding: "0.3rem 0.8rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
                SINGLE SIGN-ON AUTHENTICATION
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem", color: "#1e1b4b" }}>eGov Single Sign-On</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                Authenticate user sessions and retrieve verified citizen profile records.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Exchange Code</label>
                  <input value={exchangeCode} onChange={(e) => setExchangeCode(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.65rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Partner Code</label>
                    <input value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Partner Secret</label>
                    <input value={partnerSecret} onChange={(e) => setPartnerSecret(e.target.value)} type="password" style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.65rem", marginTop: "0.5rem" }}>
                  <button
                    className="primary"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        async () => {
                          const res = await api.ssoToken(exchangeCode);
                          if (res.access_token) setSsoToken(res.access_token);
                          return res;
                        },
                        `POST /api/token -> exchange_code: "${exchangeCode}"`
                      )
                    }
                    style={{ padding: "0.75rem", fontSize: "0.85rem" }}
                  >
                    1. Authenticate Token
                  </button>

                  <button
                    className="outline"
                    disabled={loading || !ssoToken}
                    onClick={() =>
                      runApiCall(
                        () => api.ssoAuthentication(ssoToken),
                        `POST /api/partner/sso_authentication -> token verified`
                      )
                    }
                    style={{ padding: "0.75rem", fontSize: "0.85rem" }}
                  >
                    2. Fetch Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: eVerify */}
          {activeTab === "everify" && (
            <div>
              <div style={{ background: "#dcfce7", color: "#166534", padding: "0.3rem 0.8rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
                PHILSYS IDENTITY SERVICE (NIDAS eVERIFY)
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem", color: "#1e1b4b" }}>PhilSys NIDAS Identity Verification</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                Tier 1 & Tier 2 server-to-server identity verification with Demographics, National ID QR decoding, and Face Liveness SDK integration.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.65rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>First Name</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Last Name</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Birth Date</label>
                    <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Face Liveness Session ID</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input value={livenessSessionId} onChange={(e) => setLivenessSessionId(e.target.value)} style={{ flex: 1, padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700, fontFamily: "monospace" }} />
                    <button
                      type="button"
                      className="outline"
                      onClick={async () => {
                        if (typeof window !== "undefined" && (window as any).eKYC) {
                          try {
                            const res = await (window as any).eKYC().start({
                              pubKey: "eyJpdiI6InAzOGc3d1BZcVVZck1IY3plS0xscVE9PSIsInZhbHVlIjoiSlRESmdFYkZ4ZnV3M1ZkUjFiTHpDUT09IiwibWFjIjoiZTEzZjI5ZGRkZTVhNWNkNGU3ZmQ0NDY4MTAyZDY2Yjc1NjJiYmMxNTMwN2E2NzVlZmM5ZjhjZmEyZWM1ZmMwMCIsInRhZyI6IiJ9"
                            });
                            if (res?.result?.session_id) {
                              setLivenessSessionId(res.result.session_id);
                              setResponseOutput(res);
                            }
                          } catch (e: any) {
                            console.error(e);
                          }
                        }
                      }}
                      style={{ padding: "0.6rem 0.9rem", fontSize: "0.78rem", whiteSpace: "nowrap" }}
                    >
                      Launch Web SDK
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Scanned QR Value</label>
                  <input value={qrValue} onChange={(e) => setQrValue(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700, fontFamily: "monospace" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.65rem", marginTop: "0.5rem" }}>
                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.eVerifyAuth(),
                        `POST /api/auth -> Authenticate (Generate Access Token)`
                      )
                    }
                    style={{ padding: "0.75rem", fontSize: "0.8rem" }}
                  >
                    1. Generate Token
                  </button>

                  <button
                    className="primary"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.eVerifyQuery({ first_name: firstName, last_name: lastName, birth_date: birthDate, face_liveness_session_id: livenessSessionId }),
                        `POST /api/query -> {"first_name":"${firstName}","last_name":"${lastName}","face_liveness_session_id":"${livenessSessionId}"}`
                      )
                    }
                    style={{ padding: "0.75rem", fontSize: "0.8rem" }}
                  >
                    2. Demographics Verify
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.eVerifyQrCheck(qrValue),
                        `POST /api/query/qr/check -> {"value":"${qrValue}"}`
                      )
                    }
                    style={{ padding: "0.75rem", fontSize: "0.8rem" }}
                  >
                    3. QR Check
                  </button>

                  <button
                    className="primary"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.eVerifyQrVerify(qrValue, livenessSessionId),
                        `POST /api/query/qr -> {"value":"${qrValue}","face_liveness_session_id":"${livenessSessionId}"}`
                      )
                    }
                    style={{ padding: "0.75rem", fontSize: "0.8rem" }}
                  >
                    4. QR + Face Verify
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Liveness */}
          {activeTab === "liveness" && (
            <div>
              <div style={{ background: "#fef3c7", color: "#92400e", padding: "0.3rem 0.8rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
                OFFICIAL BIOMETRIC LIVENESS WEB SDK
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem", color: "#1e1b4b" }}>Face Liveness Verification</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                Execute biometric liveness via the official eVerify Face Liveness Web SDK or create server-side liveness sessions.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <button
                  className="primary wide"
                  disabled={loading}
                  onClick={async () => {
                    if (typeof window !== "undefined" && (window as any).eKYC) {
                      try {
                        const res = await (window as any).eKYC().start({
                          pubKey: "eyJpdiI6InAzOGc3d1BZcVVZck1IY3plS0xscVE9PSIsInZhbHVlIjoiSlRESmdFYkZ4ZnV3M1ZkUjFiTHpDUT09IiwibWFjIjoiZTEzZjI5ZGRkZTVhNWNkNGU3ZmQ0NDY4MTAyZDY2Yjc1NjJiYmMxNTMwN2E2NzVlZmM5ZjhjZmEyZWM1ZmMwMCIsInRhZyI6IiJ9"
                        });
                        setResponseOutput(res);
                        if (res?.result?.session_id) {
                          setLivenessSessionId(res.result.session_id);
                        }
                      } catch (e: any) {
                        setResponseOutput({ error: e?.message || "Liveness SDK cancelled or failed" });
                      }
                    } else {
                      runApiCall(
                        () => api.createLivenessSession("redirect", "https://your-app.com/callback", 3000),
                        `window.eKYC().start({ pubKey: "..." }) -> Official Face Liveness Web SDK`
                      );
                    }
                  }}
                  style={{ padding: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                >
                  <Camera size={20} /> Launch Official Face Liveness Web SDK
                </button>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                      Flow Action
                    </label>
                    <select
                      value={livenessAction}
                      onChange={(e) => setLivenessAction(e.target.value as any)}
                      style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700 }}
                    >
                      <option value="redirect">redirect</option>
                      <option value="post">post</option>
                      <option value="close">close</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                      Delay (ms)
                    </label>
                    <input
                      type="number"
                      value={livenessDelay}
                      onChange={(e) => setLivenessDelay(Number(e.target.value))}
                      style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                      Session Token
                    </label>
                    <input
                      value={livenessSessionId}
                      onChange={(e) => setLivenessSessionId(e.target.value)}
                      placeholder="session token"
                      style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.75rem", fontFamily: "monospace" }}
                    />
                  </div>
                </div>

                {livenessAction === "redirect" && (
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                      Callback Destination URL
                    </label>
                    <input
                      value={livenessCallbackUrl}
                      onChange={(e) => setLivenessCallbackUrl(e.target.value)}
                      placeholder="https://your-app.com/callback"
                      style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.8rem", fontFamily: "monospace" }}
                    />
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  <button
                    className="primary"
                    disabled={loading}
                    onClick={async () => {
                      try {
                        const res = await runApiCall(
                          () => api.createLivenessSession(livenessAction, livenessCallbackUrl, livenessDelay),
                          `POST /v1/liveness/session\nHeaders: x-api-key: 487398a26750489380dc5fcf86613865\nBody: { "action": "${livenessAction}", "callback_url": "${livenessCallbackUrl}", "delay": ${livenessDelay} }`
                        );
                        if (res?.token) {
                          setLivenessSessionId(res.token);
                        }
                      } catch (e) {
                        console.error("Failed to create liveness session", e);
                      }
                    }}
                    style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem" }}
                  >
                    1. Create Session
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.getLivenessResult(livenessSessionId || responseOutput?.token || "6b5e55ea-610d-4923-bf14-ecf02d4116bf"),
                        `GET /v1/liveness/result/${livenessSessionId || responseOutput?.token || "sessionToken"}\nHeaders: x-api-key: 487398a26750489380dc5fcf86613865`
                      )
                    }
                    style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem" }}
                  >
                    Verification Result
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={async () => {
                      const res = await runApiCall(
                        () => api.createLivenessSession("close", "https://your-app.com/callback", 3000),
                        `POST /v1/liveness/session\nBody: { "action": "close", "delay": 3000 }`
                      );
                      if (res?.token) {
                        setLivenessSessionId(res.token);
                      }
                    }}
                    style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem" }}
                  >
                    Close Flow
                  </button>

                  <button
                    className="outline"
                    disabled={loading || (!responseOutput?.url && !livenessSessionId)}
                    onClick={() => {
                      const targetUrl = responseOutput?.url || `https://hackathon-face-liveness.e.gov.ph/liveness?token=${livenessSessionId}&action=${livenessAction}&callbackUrl=${encodeURIComponent(livenessCallbackUrl)}&delay=${livenessDelay}`;
                      if (typeof window !== "undefined") {
                        window.open(targetUrl, "_blank", "width=600,height=750");
                      }
                    }}
                    style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem", background: "#fef08a", color: "#713f12", fontWeight: 800 }}
                  >
                    Open Live Biometric Window
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI */}
          {activeTab === "ai" && (
            <div>
              <div style={{ background: "#f3e8ff", color: "#6b21a8", padding: "0.3rem 0.8rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
                AI INTELLIGENCE ASSISTANT
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem", color: "#1e1b4b" }}>eGov AI Assistance</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                Document extraction, citizen AI assistance, laws & regulations lookup, and language translation.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>eGov AI Access Code</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input value={aiAccessCode} onChange={(e) => setAiAccessCode(e.target.value)} style={{ flex: 1, padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                    <button
                      className="outline"
                      onClick={async () => {
                        const res = await runApiCall(
                          () => api.aiToken(aiAccessCode),
                          `POST /api/v1/egov/integration/token -> Exchange Access Code`
                        );
                        if (res?.access_token) setAiTokenValue(res.access_token);
                      }}
                      style={{ padding: "0.6rem 0.8rem", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                    >
                      Get Token
                    </button>
                    <button
                      className="primary"
                      onClick={() =>
                        runApiCall(
                          () => api.getAiCredits(aiTokenValue),
                          `GET /api/v1/egov/integration/credits -> Check Remaining Credits`
                        )
                      }
                      style={{ padding: "0.6rem 0.8rem", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                    >
                      Check Credits
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>AI Prompt / Inquiry</label>
                  <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "0.5rem" }}>
                  <button
                    className="primary"
                    onClick={() =>
                      runApiCall(
                        () => api.generateAiAssistant(aiPrompt, aiCategory, aiTokenValue),
                        `POST /api/v1/egov/integration/ai_assistant/generate -> "${aiPrompt}"`
                      )
                    }
                    style={{ padding: "0.65rem 0.4rem", fontSize: "0.78rem" }}
                  >
                    AI Assistant
                  </button>

                  <button
                    className="outline"
                    onClick={() =>
                      runApiCall(
                        () => api.generateSpeechMaker(aiPrompt, aiCategory, aiTokenValue),
                        `POST /api/v1/egov/integration/speech_maker/generate`
                      )
                    }
                    style={{ padding: "0.65rem 0.4rem", fontSize: "0.78rem" }}
                  >
                    Speech Maker
                  </button>

                  <button
                    className="outline"
                    onClick={() =>
                      runApiCall(
                        () => api.generateTourism(aiPrompt, aiCategory, aiTokenValue),
                        `POST /api/v1/egov/integration/tourism/generate`
                      )
                    }
                    style={{ padding: "0.65rem 0.4rem", fontSize: "0.78rem" }}
                  >
                    Tourism
                  </button>

                  <button
                    className="outline"
                    onClick={() =>
                      runApiCall(
                        () => api.generateLawsAndRegulations(aiPrompt, aiCategory, aiTokenValue),
                        `POST /api/v1/egov/integration/laws_and_regulations/generate`
                      )
                    }
                    style={{ padding: "0.65rem 0.4rem", fontSize: "0.78rem" }}
                  >
                    Laws & Regs
                  </button>

                  <button
                    className="outline"
                    onClick={() =>
                      runApiCall(
                        () => api.translateText(aiPrompt, "en", "fil", aiTokenValue),
                        `POST /api/v1/egov/integration/translator/generate`
                      )
                    }
                    style={{ padding: "0.65rem 0.4rem", fontSize: "0.78rem" }}
                  >
                    Translator
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6, 7, 8, 9: Pay, Message, Report, Compass */}
          {(activeTab === "pay" || activeTab === "message" || activeTab === "report" || activeTab === "compass") && (
            <div>
              <div style={{ background: "#e0f2fe", color: "#0369a1", padding: "0.3rem 0.8rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
                DIGITAL GATEWAY & SERVICES
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem", color: "#1e1b4b" }}>eGov Service Gateways</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                Direct hospital settlement, citizen alerts, audit logging, and DBM budget transparency.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {activeTab === "pay" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                      <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Amount (PHP)</label>
                        <input
                          type="number"
                          value={settleAmount}
                          onChange={(e) => setSettleAmount(Number(e.target.value))}
                          style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Merchant Txn ID</label>
                        <input
                          value={payTxnId}
                          onChange={(e) => setPayTxnId(e.target.value)}
                          style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Transaction UUID (Generated or for Query/Void)</label>
                      <input
                        value={payTransactionUuid}
                        onChange={(e) => setPayTransactionUuid(e.target.value)}
                        placeholder="a2a83881-a1d3-4819-865c-2f2acc45cdec"
                        style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700, fontFamily: "monospace" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
                      <button
                        className="primary"
                        onClick={async () => {
                          const res = await runApiCall(
                            () =>
                              api.payCreateTransaction({
                                amount: settleAmount,
                                txnid: payTxnId || `TXN-${Date.now()}`,
                                name: "JOSIE SANTOS DELA CRUZ",
                                email: "josie@yopmail.com",
                                mobile: "09090000000",
                                callback_url: "https://your-app.com/callback",
                                redirect_url: "https://your-app.com/",
                                items: [
                                  {
                                    name: "Medical Hospital Assistance Settlement",
                                    amount: settleAmount,
                                  },
                                ],
                              }),
                            `POST /api/v1/transaction -> Generate Payment Link (₱${settleAmount})`
                          );
                          if (res?.data?.uuid) {
                            setPayTransactionUuid(res.data.uuid);
                          }
                        }}
                        style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem" }}
                      >
                        Generate Payment
                      </button>

                      <button
                        className="outline"
                        onClick={() =>
                          runApiCall(
                            () => api.payGetTransaction(payTransactionUuid || "a2a83881-a1d3-4819-865c-2f2acc45cdec"),
                            `GET /api/v1/transaction/${payTransactionUuid || "uuid"}`
                          )
                        }
                        style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem" }}
                      >
                        Check Status
                      </button>

                      <button
                        className="outline"
                        onClick={() =>
                          runApiCall(
                            () => api.payVoidTransaction(payTransactionUuid || "a2a83881-a1d3-4819-865c-2f2acc45cdec"),
                            `PUT /api/v1/transaction/${payTransactionUuid || "uuid"}/void`
                          )
                        }
                        style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem" }}
                      >
                        Void Txn
                      </button>

                      <button
                        className="outline"
                        onClick={() =>
                          runApiCall(
                            () => api.paySettle("GL-DSWD-2026-04821", settleAmount, "Manila General Hospital"),
                            `POST /api/v1/pay/settle -> Settle GL`
                          )
                        }
                        style={{ padding: "0.65rem 0.5rem", fontSize: "0.8rem" }}
                      >
                        Direct Settle
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "message" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>
                        Recipient Mobile Number (E.164 format)
                      </label>
                      <input
                        value={smsNumber}
                        onChange={(e) => setSmsNumber(e.target.value)}
                        placeholder="+639090000000"
                        style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700, fontFamily: "monospace" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>
                        SMS Content
                      </label>
                      <textarea
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        rows={3}
                        style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 600, fontSize: "0.85rem" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                      <button
                        className="primary"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.pushSms(smsNumber, smsMessage),
                            `POST /messaging/v1/sms/push\nHeader 'X-EMESSAGE-Auth: f906c6acf1e547209f088c98dff92b4a'\nBody: { "number": "${smsNumber}", "message": "${smsMessage}" }`
                          )
                        }
                        style={{ padding: "0.8rem", fontSize: "0.82rem" }}
                      >
                        Push SMS Alert
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.sendEMessage("Guarantee Letter Issued", smsMessage),
                            `POST /api/v1/emessage/send -> User In-App Notice`
                          )
                        }
                        style={{ padding: "0.8rem", fontSize: "0.82rem" }}
                      >
                        In-App Notification
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "report" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          Access Code
                        </label>
                        <input
                          value={ereportAccessCode}
                          onChange={(e) => setEreportAccessCode(e.target.value)}
                          placeholder="2a72bdcac1b0405fb2c679d029f03cfb"
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.78rem", fontFamily: "monospace" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          Case Number
                        </label>
                        <input
                          value={ereportCaseNumber}
                          onChange={(e) => setEreportCaseNumber(e.target.value)}
                          placeholder="PFM-090326-1489"
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.78rem", fontFamily: "monospace" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          Citizen Email (OTP)
                        </label>
                        <input
                          value={ereportEmail}
                          onChange={(e) => setEreportEmail(e.target.value)}
                          placeholder="josie@yopmail.com"
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.78rem" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          OTP Code
                        </label>
                        <input
                          value={ereportOtp}
                          onChange={(e) => setEreportOtp(e.target.value)}
                          placeholder="000000"
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.78rem", fontFamily: "monospace" }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                      <button
                        className="primary"
                        disabled={loading}
                        onClick={async () => {
                          const res = await runApiCall(
                            () => api.ereportToken(ereportAccessCode),
                            `POST /api/integration/token\nBody: { "access_code": "${ereportAccessCode}" }`
                          );
                          if (res?.access_token) {
                            setEreportTokenVal(res.access_token);
                          }
                        }}
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        Generate Token
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.ereportReportTypes(ereportTokenVal),
                            `GET /api/integration/datasets/report_types`
                          )
                        }
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        Report Types
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.ereportRegions(ereportTokenVal),
                            `GET /api/integration/datasets/regions`
                          )
                        }
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        Regions List
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.ereportProvinces(ereportRegionCode, ereportTokenVal),
                            `GET /api/integration/datasets/provinces?region_code=${ereportRegionCode}`
                          )
                        }
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        Provinces (04)
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.ereportMunicipalities(ereportProvinceCode, ereportTokenVal),
                            `GET /api/integration/datasets/municipalities?province_code=${ereportProvinceCode}`
                          )
                        }
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        Municipalities
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.ereportBarangays(ereportMuniCode, ereportTokenVal),
                            `GET /api/integration/datasets/barangays?municipality_code=${ereportMuniCode}`
                          )
                        }
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        Barangays
                      </button>

                      <button
                        className="primary"
                        disabled={loading}
                        onClick={async () => {
                          const res = await runApiCall(
                            () =>
                              api.ereportSubmitComplaint(
                                {
                                  mobile: "639090000000",
                                  first_name: "Josie",
                                  last_name: "Dela Cruz",
                                  gender: "Female",
                                  complainant_email: ereportEmail,
                                  report_type: "red_tape",
                                  subject: "Hospital Medical Clearance Delay",
                                  message: "Hospital social work assessment processing exceeded standard processing time.",
                                  region_code: ereportRegionCode,
                                  province_code: ereportProvinceCode,
                                  municipality_code: ereportMuniCode,
                                  barangay_code: "042111011",
                                  latitude: "14.60",
                                  longitude: "120.98",
                                },
                                ereportTokenVal
                              ),
                            `POST /api/integration/submit_complaint\nPayload: red_tape complaint for Josie Dela Cruz`
                          );
                          if (res?.case_number) {
                            setEreportCaseNumber(res.case_number);
                          }
                        }}
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        Submit Complaint
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.ereportRequestOtp(ereportEmail, ereportTokenVal),
                            `POST /api/integration/verify/request\nEmail: ${ereportEmail}`
                          )
                        }
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        Request OTP
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={async () => {
                          const res = await runApiCall(
                            () => api.ereportConfirmOtp(ereportEmail, ereportOtp, ereportTokenVal),
                            `POST /api/integration/verify/confirm\nEmail: ${ereportEmail}, OTP: ${ereportOtp}`
                          );
                          if (res?.report_view_token) {
                            setEreportViewTokenVal(res.report_view_token);
                          }
                        }}
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        Confirm OTP
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.ereportGetReports(ereportViewTokenVal || "mock-token"),
                            `GET /api/integration/reports\nHeader 'X-EReport-View-Token: ${ereportViewTokenVal || "view_token"}'`
                          )
                        }
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        Reports List
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.ereportGetReport(ereportCaseNumber, ereportViewTokenVal || "mock-token"),
                            `GET /api/integration/reports/${ereportCaseNumber}\nHeader 'X-EReport-View-Token: ${ereportViewTokenVal || "view_token"}'`
                          )
                        }
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        View Report
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.submitEReport("CITIZEN_AUDIT_LOG", { case_number: ereportCaseNumber }),
                            `POST /api/v1/ereport/submit -> Legacy Audit Hook`
                          )
                        }
                        style={{ padding: "0.6rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        Audit Hook
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "compass" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          Report Year
                        </label>
                        <input
                          type="number"
                          value={compassReportYear}
                          onChange={(e) => setCompassReportYear(Number(e.target.value))}
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          Sheet Scope
                        </label>
                        <select
                          value={compassSheetScope}
                          onChange={(e) => setCompassSheetScope(e.target.value as any)}
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700 }}
                        >
                          <option value="summary">summary</option>
                          <option value="agency">agency</option>
                          <option value="sucs">sucs</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          Period
                        </label>
                        <select
                          value={compassPeriod}
                          onChange={(e) => setCompassPeriod(e.target.value)}
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700 }}
                        >
                          <option value="FY">FY</option>
                          <option value="Q1">Q1</option>
                          <option value="Q2">Q2</option>
                          <option value="Q3">Q3</option>
                          <option value="Q4">Q4</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          Expense Class
                        </label>
                        <select
                          value={compassClass}
                          onChange={(e) => setCompassClass(e.target.value)}
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700 }}
                        >
                          <option value="PS">PS (Personal Services)</option>
                          <option value="MOOE">MOOE</option>
                          <option value="FINEX">FINEX</option>
                          <option value="CO">CO (Capital Outlays)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          Entity Filter (Partial Match)
                        </label>
                        <input
                          value={compassEntityName}
                          onChange={(e) => setCompassEntityName(e.target.value)}
                          placeholder="Agriculture or DSWD"
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          LGSF Program
                        </label>
                        <select
                          value={compassLgsfProgram}
                          onChange={(e) => setCompassLgsfProgram(e.target.value)}
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700 }}
                        >
                          <option value="FALGU">FALGU</option>
                          <option value="GEF">GEF</option>
                          <option value="GGG">GGG</option>
                          <option value="SBDP">SBDP</option>
                          <option value="SAFPB">SAFPB</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          Province
                        </label>
                        <input
                          value={compassProvince}
                          onChange={(e) => setCompassProvince(e.target.value)}
                          placeholder="Bulacan"
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.8rem" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 800, display: "block", marginBottom: "0.2rem" }}>
                          City / Municipality
                        </label>
                        <input
                          value={compassMuni}
                          onChange={(e) => setCompassMuni(e.target.value)}
                          placeholder="Malolos"
                          style={{ width: "100%", padding: "0.5rem 0.6rem", border: "2px solid #1e1b4b", borderRadius: 10, fontSize: "0.8rem" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem", marginTop: "0.3rem" }}>
                      <button
                        className="primary"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.getCompassSaaodbDashboard(compassReportYear, compassSheetScope),
                            `GET /api/v1/records/saaodb/dashboard?reportYear=${compassReportYear}&sheetScope=${compassSheetScope}\nHeader 'X-API-Key: 1ce90b98ea2e489db1d63eca982d155f'`
                          )
                        }
                        style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        1. SAAODB Dashboard
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.getCompassSaaodb({ reportYear: compassReportYear, period: compassPeriod, class: compassClass, sheetScope: compassSheetScope, entityName: compassEntityName, page: 1, limit: 100 }),
                            `GET /api/v1/records/saaodb?reportYear=${compassReportYear}&period=${compassPeriod}&class=${compassClass}&sheetScope=${compassSheetScope}&entityName=${compassEntityName}&page=1&limit=100`
                          )
                        }
                        style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        2. SAAODB Records
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.getCompassSaaodbEntities({ reportYear: compassReportYear, sheetScope: "agency", expandParent: "Department of Finance" }),
                            `GET /api/v1/records/saaodb/entities?reportYear=${compassReportYear}&sheetScope=agency&expandParent=Department of Finance`
                          )
                        }
                        style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        3. Entities Hierarchy
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.getCompassNca({ budgetYear: compassReportYear, deptCode: compassDeptCode, agencyCode: compassAgencyCode, operatingUnitCode: compassOperatingCode, expenseClass: compassExpenseClass, page: 1, limit: 100 }),
                            `GET /api/v1/records/nca?budgetYear=${compassReportYear}&deptCode=${compassDeptCode}&agencyCode=${compassAgencyCode}&operatingUnitCode=${compassOperatingCode}&expenseClass=${compassExpenseClass}&page=1&limit=100`
                          )
                        }
                        style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        4. NCA Records
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.getCompassSaro({ saroNo: compassSaroNo, deptCode: compassDeptCode, agencyCode: compassAgencyCode, expenseClass: compassExpenseClass, page: 1, limit: 100 }),
                            `GET /api/v1/records/saro?saroNo=${compassSaroNo}&deptCode=${compassDeptCode}&agencyCode=${compassAgencyCode}&expenseClass=${compassExpenseClass}&page=1&limit=100`
                          )
                        }
                        style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        5. SARO Records
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.getCompassLgsf({ fiscalYear: compassReportYear, programCode: compassLgsfProgram, province: compassProvince, cityMunicipality: compassMuni, page: 1, limit: 100 }),
                            `GET /api/v1/records/lgsf?fiscalYear=${compassReportYear}&programCode=${compassLgsfProgram}&province=${compassProvince}&cityMunicipality=${compassMuni}&page=1&limit=100`
                          )
                        }
                        style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        6. LGSF Records
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.getCompassLgsfDashboard({ programCode: compassLgsfProgram, reportYear: compassReportYear, province: compassProvince, municipality: compassMuni, page: 1, limit: 25 }),
                            `GET /api/v1/records/lgsf/dashboard?programCode=${compassLgsfProgram}&reportYear=${compassReportYear}&province=${compassProvince}&municipality=${compassMuni}&page=1&limit=25`
                          )
                        }
                        style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        7. LGSF Dashboard
                      </button>

                      <button
                        className="outline"
                        disabled={loading}
                        onClick={() =>
                          runApiCall(
                            () => api.getCompassBudget(programCode),
                            `GET /api/v1/compass/budget?program_code=DSWD-AICS`
                          )
                        }
                        style={{ padding: "0.65rem 0.4rem", fontSize: "0.76rem" }}
                      >
                        8. DSWD Live Budget
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Response Output Viewer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "#1e1b4b", color: "#a5b4fc", border: "2.5px solid #1e1b4b", borderRadius: 20, padding: "1.25rem", boxShadow: "0 6px 0 #1e1b4b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#fef08a", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <Terminal size={16} /> EXECUTED ACTION
              </span>
            </div>
            <code style={{ fontSize: "0.78rem", fontFamily: "monospace", wordBreak: "break-all", color: "#ffffff", display: "block", background: "rgba(255,255,255,0.08)", padding: "0.65rem 0.85rem", borderRadius: 10 }}>
              {curlCommand || "# Select a service on the left panel to test execution"}
            </code>
          </div>

          {!loading && activeTab === "compass" && (() => {
            const summary = compassSummary(responseOutput);
            return summary ? (
              <div style={{ background: "#ecfdf5", border: "2.5px solid #1e1b4b", borderRadius: 20, padding: "1.1rem 1.25rem", boxShadow: "0 6px 0 #1e1b4b", color: "#1e1b4b" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "#0f766e", letterSpacing: "0.08em", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Database size={15} /> {summary.title}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.6rem" }}>
                  {summary.rows.map((row) => (
                    <div key={row.label} style={{ background: "#ffffff", border: "2px solid #1e1b4b", borderRadius: 14, padding: "0.6rem 0.75rem" }}>
                      <span style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, color: "#4338ca" }}>{row.label}</span>
                      <b style={{ fontSize: row.highlight ? "1.15rem" : "0.9rem", fontWeight: 900, color: row.highlight ? "#0f766e" : "#1e1b4b" }}>{row.value}</b>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          <div style={{ background: "#0f172a", color: "#38bdf8", border: "2.5px solid #1e1b4b", borderRadius: 20, padding: "1.25rem", minHeight: 300, boxShadow: "0 6px 0 #1e1b4b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", borderBottom: "1.5px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#4ade80", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <Code2 size={16} /> SERVICE JSON RESPONSE
              </span>
              <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.1)", padding: "0.15rem 0.5rem", borderRadius: 6, color: "#cbd5e1", fontWeight: 800 }}>
                Status 200 OK
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>
                Processing service call...
              </div>
            ) : responseOutput ? (
              <pre style={{ fontSize: "0.78rem", fontFamily: "monospace", color: "#e2e8f0", overflowX: "auto", margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(responseOutput, null, 2)}
              </pre>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontWeight: 700, fontSize: "0.85rem" }}>
                Click any service button to trigger a live request and inspect the response payload.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
