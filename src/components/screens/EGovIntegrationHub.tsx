import React, { useState } from "react";
import {
  Activity,
  Bot,
  Brain,
  Building2,
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

export function EGovIntegrationHub() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("blockchain");
  const [loading, setLoading] = useState(false);
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [curlCommand, setCurlCommand] = useState<string>("");

  // SSO state
  const [exchangeCode, setExchangeCode] = useState("generated_exchange_code");
  const [partnerCode, setPartnerCode] = useState("HACKATHON_SSO");
  const [partnerSecret, setPartnerSecret] = useState("0d77fba530ee49f5b00e36fe947bd384");
  const [ssoToken, setSsoToken] = useState("");

  // eVerify state
  const [firstName, setFirstName] = useState("Juan");
  const [lastName, setLastName] = useState("Dela Cruz");
  const [birthDate, setBirthDate] = useState("1989-09-12");
  const [qrValue, setQrValue] = useState("RAW_QR_CODE_VALUE_PHILSYS_9639954762664080");

  // AI state
  const [aiPrompt, setAiPrompt] = useState("how can i get my digital tin id here in egov");
  const [aiCategory, setAiCategory] = useState("PH");
  const [translateSource, setTranslateSource] = useState("en");
  const [translateTarget, setTranslateTarget] = useState("fil");

  // Blockchain state
  const [recordId, setRecordId] = useState("GL-DSWD-2026-04821");
  const [recordHash, setRecordHash] = useState("0xd8f2910c5d12a8f9104b2819c5b201f8");

  // Pay & Compass
  const [settleAmount, setSettleAmount] = useState(50000);
  const [programCode, setProgramCode] = useState("DSWD-AICS");

  const runApiCall = async (fn: () => Promise<any>, curlSnippet: string) => {
    setLoading(true);
    setCurlCommand(curlSnippet);
    try {
      const res = await fn();
      setResponseOutput(res);
    } catch (err: any) {
      setResponseOutput({ error: err.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head
        over="REPUBLIC OF THE PHILIPPINES · OFFICIAL API CATALOG"
        title="eGov Full API Integration Hub"
        text="Interactive developer testing center for all 9 eGov API catalog services, including zero-fee Hyperledger Besu Blockchain JSON-RPC, PhilSys eVerify, Face Liveness, and eGov AI."
        action={<Status tone="green">9 eGov API Services Active</Status>}
      />

      {/* Tab Selector Buttons */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {[
          { id: "blockchain", label: "eGovChain (Besu Blockchain)", Icon: Network, tone: "#4338ca" },
          { id: "sso", label: "eGov SSO", Icon: Lock, tone: "#2563eb" },
          { id: "everify", label: "eVerify (PhilSys)", Icon: UserCheck, tone: "#059669" },
          { id: "liveness", label: "Face Liveness REST/SDK", Icon: ShieldCheck, tone: "#d97706" },
          { id: "ai", label: "eGov AI (7 Endpoints)", Icon: Brain, tone: "#7c3aed" },
          { id: "pay", label: "eGovPay Settlement", Icon: Wallet, tone: "#0284c7" },
          { id: "message", label: "eMessage Notice", Icon: MessageSquare, tone: "#e11d48" },
          { id: "report", label: "eReport Complaints", Icon: Layers, tone: "#475569" },
          { id: "compass", label: "Compass Budget DBM", Icon: Database, tone: "#0d9488" },
        ].map((tab) => {
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
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Left Column: API Endpoint Controls & Form Inputs */}
        <div style={{ background: "#ffffff", border: "2.5px solid #1e1b4b", borderRadius: 24, padding: "1.5rem", boxShadow: "0 6px 0 #1e1b4b" }}>
          
          {/* TAB 1: eGovChain Hyperledger Besu Blockchain */}
          {activeTab === "blockchain" && (
            <div>
              <div style={{ background: "#e0e7ff", color: "#1e1b4b", padding: "0.3rem 0.8rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
                HYPERLEDGER BESU ZERO-FEE BLOCKCHAIN OVER JSON-RPC
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem" }}>eGovChain Ledger Integration</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                Anchor state transitions & medical guarantee letters directly to the zero-fee government Hyperledger Besu network over JSON-RPC.
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
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Cryptographic Payload Hash (SHA-256)</label>
                  <input
                    value={recordHash}
                    onChange={(e) => setRecordHash(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700, fontFamily: "monospace" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginTop: "0.5rem" }}>
                  <button
                    className="primary"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.besuAnchorRecord(recordId, recordHash),
                        `curl -X POST http://localhost:8000/api/v1/egovchain/anchor -H "Content-Type: application/json" -d '{"record_id":"${recordId}","hash":"${recordHash}"}'`
                      )
                    }
                    style={{ padding: "0.75rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                  >
                    <Network size={16} /> Anchor Record on Besu
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.besuJsonRpc("eth_blockNumber", []),
                        `curl -X POST http://localhost:8000/api/v1/egovchain/rpc -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`
                      )
                    }
                    style={{ padding: "0.75rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                  >
                    <Cpu size={16} /> Query eth_blockNumber
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: eGov SSO */}
          {activeTab === "sso" && (
            <div>
              <div style={{ background: "#dbeafe", color: "#1e40af", padding: "0.3rem 0.8rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
                POST /api/token & POST /api/partner/sso_authentication
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem" }}>eGov Single Sign-On (SSO)</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                Exchange authorization code for JWT access token and retrieve full verified citizen profile data.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Exchange Code</label>
                  <input value={exchangeCode} onChange={(e) => setExchangeCode(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Partner Code</label>
                    <input value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Partner Secret</label>
                    <input value={partnerSecret} onChange={(e) => setPartnerSecret(e.target.value)} type="password" style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginTop: "0.5rem" }}>
                  <button
                    className="primary"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        async () => {
                          const res = await api.ssoToken(exchangeCode, partnerCode, partnerSecret);
                          if (res.access_token) setSsoToken(res.access_token);
                          return res;
                        },
                        `curl -X POST http://localhost:8000/api/token -H "Content-Type: application/json" -d '{"exchange_code":"${exchangeCode}","scope":"SSO_AUTHENTICATION","partner_code":"${partnerCode}","partner_secret":"${partnerSecret}"}'`
                      )
                    }
                    style={{ padding: "0.75rem", fontSize: "0.85rem" }}
                  >
                    1. Generate Token
                  </button>

                  <button
                    className="outline"
                    disabled={loading || !ssoToken}
                    onClick={() =>
                      runApiCall(
                        () => api.ssoAuthentication(ssoToken),
                        `curl -X POST http://localhost:8000/api/partner/sso_authentication -H "Authorization: Bearer ${ssoToken.substring(0, 20)}..."`
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
                NIDAS eVERIFY REST API (TIER I & II)
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem" }}>PhilSys Identity Verification</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                Verify citizen demographics and scanned National ID QR code against PhilSys central database.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>First Name</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Last Name</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>Scanned QR String Value</label>
                  <input value={qrValue} onChange={(e) => setQrValue(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700, fontFamily: "monospace" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginTop: "0.5rem" }}>
                  <button
                    className="primary"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.eVerifyQuery({ first_name: firstName, last_name: lastName, birth_date: birthDate, face_liveness_session_id: "a1b3fae6-af74-4896-bd58-32a81604de01" }),
                        `curl -X POST http://localhost:8000/api/query -H "Content-Type: application/json" -d '{"first_name":"${firstName}","last_name":"${lastName}","birth_date":"${birthDate}","face_liveness_session_id":"a1b3fae6-af74-4896-bd58-32a81604de01"}'`
                      )
                    }
                    style={{ padding: "0.75rem", fontSize: "0.82rem" }}
                  >
                    Demographics Check
                  </button>

                  <button
                    className="outline"
                    disabled={loading}
                    onClick={() =>
                      runApiCall(
                        () => api.eVerifyQrCheck(qrValue),
                        `curl -X POST http://localhost:8000/api/query/qr/check -H "Content-Type: application/json" -d '{"value":"${qrValue}"}'`
                      )
                    }
                    style={{ padding: "0.75rem", fontSize: "0.82rem" }}
                  >
                    National ID QR Check
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Face Liveness */}
          {activeTab === "liveness" && (
            <div>
              <div style={{ background: "#fef3c7", color: "#92400e", padding: "0.3rem 0.8rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
                BIOMETRIC LIVENESS SDK & REST API
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem" }}>Face Liveness Detection</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                Create liveness sessions, run Web SDK verification, and query confidence score thresholds.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <button
                  className="primary wide"
                  disabled={loading}
                  onClick={() =>
                    runApiCall(
                      () => api.createLivenessSession("redirect", "https://your-app.com/callback", 3000),
                      `curl -X POST http://localhost:8000/v1/liveness/session -H "x-api-key: 9e31b23d-eeb4-ae08-ff13-cdf8380e5307" -d '{"action":"redirect","callback_url":"https://your-app.com/callback","delay":3000}'`
                    )
                  }
                  style={{ padding: "0.8rem" }}
                >
                  Create Liveness Session (POST /v1/liveness/session)
                </button>

                {responseOutput?.url && (
                  <a
                    href={responseOutput.url}
                    target="_blank"
                    rel="noreferrer"
                    className="primary wide"
                    style={{
                      background: "#059669",
                      borderColor: "#1e1b4b",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "0.8rem",
                    }}
                  >
                    <ShieldCheck size={18} /> Open Verification Session URL
                  </a>
                )}

                <button
                  className="outline wide"
                  disabled={loading}
                  onClick={() =>
                    runApiCall(
                      () => api.getLivenessResult(responseOutput?.token || "a1b3fae6-af74-4896-bd58-32a81604de01"),
                      `curl -X GET http://localhost:8000/v1/liveness/result/${responseOutput?.token || "a1b3fae6-af74-4896-bd58-32a81604de01"} -H "x-api-key: 9e31b23d-eeb4-ae08-ff13-cdf8380e5307"`
                    )
                  }
                  style={{ padding: "0.8rem" }}
                >
                  Get Verification Result (GET /v1/liveness/result/{'{sessionToken}'})
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: eGov AI */}
          {activeTab === "ai" && (
            <div>
              <div style={{ background: "#f3e8ff", color: "#6b21a8", padding: "0.3rem 0.8rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
                7 AI ENDPOINTS (ASSISTANT, TRANSLATOR, LAWS, EXTRACTOR, SPEECH, TOURISM)
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem" }}>eGov AI Intelligence Services</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                Document extraction, AI assistant, laws & regulations lookup, and language translation.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, display: "block", marginBottom: "0.3rem" }}>AI Prompt / Instruction</label>
                  <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.85rem", border: "2px solid #1e1b4b", borderRadius: 12, fontWeight: 700 }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  <button
                    className="primary"
                    onClick={() =>
                      runApiCall(
                        () => api.generateAiAssistant(aiPrompt, aiCategory),
                        `curl -X POST http://localhost:8000/api/v1/egov/integration/ai_assistant/generate -d '{"prompt":"${aiPrompt}","category":"PH"}'`
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
                        () => api.generateLawsAndRegulations(aiPrompt, aiCategory),
                        `curl -X POST http://localhost:8000/api/v1/egov/integration/laws_and_regulations/generate -d '{"prompt":"${aiPrompt}","category":"PH"}'`
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
                        () => api.translateText(aiPrompt, translateSource, translateTarget),
                        `curl -X POST http://localhost:8000/api/v1/egov/integration/translator/generate -d '{"prompt":"${aiPrompt}","source_lang":"en","target_lang":"fil"}'`
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
                INTEGRATED GATEWAYS & CITIZEN SERVICES
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "0.4rem" }}>eGov Digital Gateways</h3>
              <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
                eGovPay direct hospital settlement, eMessage citizen alerts, eReport complaints, and DBM Compass transparency.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {activeTab === "pay" && (
                  <button
                    className="primary wide"
                    onClick={() =>
                      runApiCall(
                        () => api.paySettle("GL-DSWD-2026-04821", settleAmount, "Manila General Hospital"),
                        `curl -X POST http://localhost:8000/api/v1/pay/settle -d '{"gl_number":"GL-DSWD-2026-04821","amount":50000}'`
                      )
                    }
                    style={{ padding: "0.8rem" }}
                  >
                    Initiate eGovPay Settlement (₱50,000.00)
                  </button>
                )}

                {activeTab === "message" && (
                  <button
                    className="primary wide"
                    onClick={() =>
                      runApiCall(
                        () => api.sendEMessage("Guarantee Letter Issued", "Your DSWD guarantee letter GL-DSWD-2026-04821 has been issued to Manila General Hospital."),
                        `curl -X POST http://localhost:8000/api/v1/emessage/send -d '{"title":"Guarantee Letter Issued"}'`
                      )
                    }
                    style={{ padding: "0.8rem" }}
                  >
                    Dispatch eMessage SMS / Email Notification
                  </button>
                )}

                {activeTab === "report" && (
                  <button
                    className="primary wide"
                    onClick={() =>
                      runApiCall(
                        () => api.submitEReport("CITIZEN_AUDIT_LOG", { case_number: "MGL-2026-001284" }),
                        `curl -X POST http://localhost:8000/api/v1/ereport/submit -d '{"action":"CITIZEN_AUDIT_LOG"}'`
                      )
                    }
                    style={{ padding: "0.8rem" }}
                  >
                    Submit eReport Case Log
                  </button>
                )}

                {activeTab === "compass" && (
                  <button
                    className="primary wide"
                    onClick={() =>
                      runApiCall(
                        () => api.getCompassBudget(programCode),
                        `curl -X GET http://localhost:8000/api/v1/compass/budget?program_code=DSWD-AICS`
                      )
                    }
                    style={{ padding: "0.8rem" }}
                  >
                    Fetch DBM Compass Budget Execution Data
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Output & Curl Command Viewer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Curl Command Box */}
          <div style={{ background: "#1e1b4b", color: "#a5b4fc", border: "2.5px solid #1e1b4b", borderRadius: 20, padding: "1.25rem", boxShadow: "0 6px 0 #1e1b4b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#fef08a", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <Terminal size={16} /> EXECUTED CURL COMMAND
              </span>
            </div>
            <code style={{ fontSize: "0.78rem", fontFamily: "monospace", wordBreak: "break-all", color: "#ffffff", display: "block", background: "rgba(255,255,255,0.08)", padding: "0.65rem 0.85rem", borderRadius: 10 }}>
              {curlCommand || "# Select an API endpoint on the left panel to execute"}
            </code>
          </div>

          {/* Response Payload Box */}
          <div style={{ background: "#0f172a", color: "#38bdf8", border: "2.5px solid #1e1b4b", borderRadius: 20, padding: "1.25rem", minHeight: 320, boxShadow: "0 6px 0 #1e1b4b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", borderBottom: "1.5px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#4ade80", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <Code2 size={16} /> LIVE API JSON RESPONSE
              </span>
              <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.1)", padding: "0.15rem 0.5rem", borderRadius: 6, color: "#cbd5e1", fontWeight: 800 }}>
                HTTP 200 OK
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>
                Executing API call...
              </div>
            ) : responseOutput ? (
              <pre style={{ fontSize: "0.78rem", fontFamily: "monospace", color: "#e2e8f0", overflowX: "auto", margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(responseOutput, null, 2)}
              </pre>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontWeight: 700, fontSize: "0.85rem" }}>
                Click any endpoint button to trigger a live call and inspect the JSON payload.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
