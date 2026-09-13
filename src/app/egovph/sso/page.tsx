"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BadgeCheck, CheckCircle2, ShieldCheck, Loader2, ArrowRight, LockKeyhole, AlertTriangle, Smartphone } from "lucide-react";
import { Brand } from "@/components/common/Brand";
import { api } from "@/lib/api";

const PARTNER_CODE = "3b597185a139440d8e6d56bc45330ee8";
const SSO_HOST = "https://platforms-api.e.gov.ph/egov-sso";

const SANDBOX_CITIZENS = [
  { mobile: "+639090000001", name: "JOSE CRUZ DELA PEÑA III", otp: "123456", pin: "000000" },
  { mobile: "+639090000002", name: "PEDRO DELA CRUZ II", otp: "123456", pin: "000000" },
  { mobile: "+639090000003", name: "JOHN GARCIA REYES JR", otp: "123456", pin: "000000" },
  { mobile: "+639090000004", name: "JOSIELYN RAMOS MENDOZA", otp: "123456", pin: "000000" },
  { mobile: "+639090000005", name: "RONALYN SANTOS FLORES", otp: "123456", pin: "000000" },
];

function SSOContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawCode = searchParams.get("exchange_code") || searchParams.get("code");

  const [step, setStep] = useState<"processing" | "widget" | "manual" | "success">("processing");
  const [verifyingTitle, setVerifyingTitle] = useState("Exchanging authorization code...");
  const [statusDetail, setStatusDetail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Citizen Profile State (populated after token exchange & sso_authentication)
  const [citizenProfile, setCitizenProfile] = useState<{
    name: string;
    uniqid: string;
    email: string;
    pcn: string;
    mobile: string;
    birthdate: string;
    address: string;
  } | null>(null);

  // Manual fallback inputs
  const [manualExchangeCode, setManualExchangeCode] = useState("CYsS3rqHXM8QRBsO0444lXAUlcp1jeU4");

  const widgetRenderedRef = useRef(false);

  // Core SSO Redeemer: one call to POST /api/v1/auth/egov/exchange, which
  // exchanges the code, resolves the real citizen profile server-side, upserts
  // the user and returns them. Previously this exchanged the token and then
  // signed in as the mock applicant regardless of who authenticated.
  const redeemExchangeCode = async (code: string) => {
    setStep("processing");
    setErrorMsg("");
    setVerifyingTitle("Exchanging authorization code with eGov SSO Gateway...");
    setStatusDetail(`POST /api/v1/auth/egov/exchange -> exchange_code: "${code.substring(0, 10)}..."`);

    try {
      const result = await api.exchangeEgovCode(code);
      const data = result?.profile || {};

      const fullName = [data.first_name, data.middle_name, data.last_name, data.suffix]
        .filter(Boolean)
        .join(" ") || result?.user?.name || "";

      if (!fullName) {
        throw new Error("eGov SSO returned a profile without a name.");
      }

      const profile = {
        name: fullName,
        uniqid: data.uniqid || result?.user?.sub || "",
        email: data.email || result?.user?.email || "",
        pcn: data.national_id?.pcn || data.pcn || "",
        mobile: data.mobile || result?.user?.mobile || "",
        birthdate: data.birth_date || "",
        address: data.address || "",
      };

      setCitizenProfile(profile);

      // Store the authenticated profile for session binding.
      if (typeof window !== "undefined") {
        localStorage.setItem("egov_user_info", JSON.stringify(profile));
      }

      setStep("success");
      // Long enough for the presenter to point at the hydrated profile (demo script segment 1)
      setTimeout(() => {
        router.push(`/?sso=authenticated&name=${encodeURIComponent(profile.name)}`);
      }, 3500);

    } catch (err: any) {
      console.error("SSO Code exchange error:", err);
      setErrorMsg(err.message || "eGov SSO authentication failed or exchange_code expired.");
      setStep("widget");
    }
  };

  // On page load: If exchange_code query param is present, redeem it right away!
  useEffect(() => {
    if (rawCode) {
      redeemExchangeCode(rawCode);
    } else {
      setStep("widget");
    }
  }, [rawCode]);

  // Mount Official eGovLogin Widget when on widget step
  useEffect(() => {
    if (step === "widget" && !widgetRenderedRef.current) {
      const renderWidget = () => {
        const win = window as any;
        if (win.EgovLogin && document.getElementById("egov-login-target")) {
          try {
            win.EgovLogin.render({
              target: "#egov-login-target",
              partnerCode: PARTNER_CODE,
              host: SSO_HOST,
              partnerName: "GabayMed",
              onSuccess: ({ exchangeCode: receivedCode }: { exchangeCode: string }) => {
                if (receivedCode) {
                  redeemExchangeCode(receivedCode);
                }
              },
              onError: (err: any) => {
                console.warn("EgovLogin Widget error:", err);
              },
            });
            widgetRenderedRef.current = true;
          } catch (e) {
            console.error("Widget render exception:", e);
          }
        }
      };

      const timer = setTimeout(renderWidget, 400);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Handle Manual Fallback Form Submission
  const handleManualAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualExchangeCode) {
      await redeemExchangeCode(manualExchangeCode);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3eeff", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ background: "#ffffff", border: "3px solid #1e1b4b", borderRadius: 28, padding: "2.5rem", maxWidth: 580, width: "100%", boxShadow: "0 10px 0 #1e1b4b" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
          <Brand />
        </div>

        {/* Step: Processing / Redeeming Exchange Code */}
        {step === "processing" && (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{ width: 68, height: 68, background: "#e0e7ff", border: "2.5px solid #1e1b4b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto" }}>
              <Loader2 size={34} color="#1e1b4b" className="animate-spin" />
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#6366f1", letterSpacing: "0.08em" }}>eGOVPH SINGLE SIGN-ON</span>
            <h2 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#1e1b4b", margin: "0.25rem 0 0.5rem 0" }}>
              {verifyingTitle}
            </h2>
            <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, maxWidth: 460, margin: "0 auto 1rem auto" }}>
              Authenticating via official eGov SSO gateway (<code>{SSO_HOST}</code>). Redeeming single-use authorization code and resolving citizen profile.
            </p>
            {statusDetail && (
              <div style={{ background: "#f5f3ff", padding: "0.5rem 0.8rem", borderRadius: 12, border: "1px solid #1e1b4b", display: "inline-block", fontSize: "0.78rem", fontFamily: "monospace", color: "#312e81" }}>
                {statusDetail}
              </div>
            )}
          </div>
        )}

        {/* Step: Success State */}
        {step === "success" && citizenProfile && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 68, height: 68, background: "#dcfce7", border: "2.5px solid #1e1b4b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", boxShadow: "0 4px 0 #1e1b4b" }}>
              <CheckCircle2 size={38} color="#166534" />
            </div>
            <div style={{ background: "#dcfce7", color: "#14532d", padding: "0.3rem 0.9rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
              eGOVPH SSO AUTO-AUTHENTICATED
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1e1b4b", margin: "0 0 0.25rem 0" }}>Welcome back, {citizenProfile.name}!</h2>
            <p style={{ color: "#4338ca", fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem" }}>UniqID bound & authenticated via official eGovPH Single Sign-On.</p>

            <div style={{ background: "#f5f3ff", padding: "1.25rem", borderRadius: 20, border: "2px solid #1e1b4b", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>UniqID:</span> <b>{citizenProfile.uniqid}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Citizen Name:</span> <b>{citizenProfile.name} <BadgeCheck size={16} color="#2563eb" /></b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>PhilSys PCN:</span> <b>{citizenProfile.pcn}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Registered Email:</span> <b>{citizenProfile.email}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Mobile:</span> <b>{citizenProfile.mobile}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}><span style={{ flexShrink: 0 }}>Address:</span> <b style={{ textAlign: "right" }}>{citizenProfile.address}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Profile Mode:</span> <b style={{ color: "#059669" }}>Read-Only (Managed via eGovPH)</b></div>
            </div>

            <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 800, background: "#ecfdf5", padding: "0.6rem 1rem", borderRadius: "9999px", border: "1.5px solid #a7f3d0", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={16} /> Redirecting to PhilSys Identity Check...
            </div>
          </div>
        )}

        {/* Step: Official eGov Widget / Sandbox Authentication Screen */}
        {step === "widget" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ background: "#fef08a", color: "#1e1b4b", padding: "0.3rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.72rem", display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                <LockKeyhole size={14} /> OFFICIAL eGOVPH SINGLE SIGN-ON (SSO)
              </div>
              <button
                type="button"
                onClick={() => setStep("manual")}
                style={{ background: "#e0e7ff", border: "1.5px solid #1e1b4b", borderRadius: "9999px", padding: "0.25rem 0.75rem", fontSize: "0.72rem", fontWeight: 800, color: "#1e1b4b", cursor: "pointer" }}
              >
                ⚙️ Code Exchange Mode
              </button>
            </div>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1e1b4b", margin: "0 0 0.25rem 0" }}>Sign in with eGovPH SSO</h2>
            <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
              Authenticate seamlessly via the official eGovPH Single Sign-On gateway.
            </p>

            {errorMsg && (
              <div style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: 14, padding: "0.75rem 1rem", color: "#991b1b", fontSize: "0.82rem", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
                <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} /> {errorMsg}
              </div>
            )}

            {/* Official eGov Login Widget Embed Container */}
            <div style={{ background: "#f8fafc", border: "2px dashed #6366f1", borderRadius: 18, padding: "1.25rem", textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#4338ca", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                OFFICIAL LOGIN AS eGOV WIDGET
              </div>
              <div id="egov-login-target" style={{ minHeight: 48, display: "flex", justifyContent: "center" }}></div>
            </div>

            {/* Sandbox Quick-Start Test Citizens */}
            <div style={{ background: "#f5f3ff", padding: "1rem", borderRadius: 18, border: "2px solid #1e1b4b", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#1e1b4b", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Smartphone size={14} color="#4338ca" /> Sandbox Test Accounts (OTP & PIN Fixed)
                </span>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#059669", background: "#dcfce7", padding: "0.15rem 0.5rem", borderRadius: 9999 }}>
                  OTP: 123456 | PIN: 000000
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {SANDBOX_CITIZENS.slice(0, 3).map((citizen) => (
                  <div key={citizen.mobile} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "0.45rem 0.75rem", borderRadius: 12, border: "1.5px solid #1e1b4b", fontSize: "0.8rem", fontWeight: 700 }}>
                    <div>
                      <span style={{ color: "#1e1b4b" }}>{citizen.name}</span>
                      <code style={{ marginLeft: "0.5rem", color: "#6366f1", fontSize: "0.75rem" }}>{citizen.mobile}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        redeemExchangeCode("CYsS3rqHXM8QRBsO0444lXAUlcp1jeU4");
                      }}
                      style={{ background: "#e0e7ff", border: "1.5px solid #1e1b4b", borderRadius: 8, padding: "0.2rem 0.6rem", fontSize: "0.72rem", fontWeight: 800, color: "#1e1b4b", cursor: "pointer" }}
                    >
                      Authenticate
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Button to Test Account Exchange Code */}
            <button
              type="button"
              className="primary wide"
              onClick={() => redeemExchangeCode("CYsS3rqHXM8QRBsO0444lXAUlcp1jeU4")}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.85rem 1.25rem", fontSize: "0.95rem" }}
            >
              <ShieldCheck size={20} /> Authorize with Sample Test Account <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step: Manual Code Exchange Mode */}
        {step === "manual" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ background: "#fef08a", color: "#1e1b4b", padding: "0.3rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.72rem", display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                <LockKeyhole size={14} /> MANUAL EXCHANGE CODE REDEMPTION
              </div>
              <button
                type="button"
                onClick={() => setStep("widget")}
                style={{ background: "#e0e7ff", border: "1.5px solid #1e1b4b", borderRadius: "9999px", padding: "0.25rem 0.75rem", fontSize: "0.72rem", fontWeight: 800, color: "#1e1b4b", cursor: "pointer" }}
              >
                ← Back to Widget
              </button>
            </div>

            <h2 style={{ fontSize: "1.45rem", fontWeight: 900, color: "#1e1b4b", margin: "0 0 0.25rem 0" }}>Redeem Single-Use Exchange Code</h2>
            <p style={{ color: "#4338ca", fontSize: "0.85rem", fontWeight: 600, marginBottom: "1.25rem" }}>
              Redeem a single-use exchange code generated from the eGov developer portal or sandbox round-trip.
            </p>

            <form onSubmit={handleManualAuthenticate} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", display: "block", marginBottom: "0.3rem" }}>eGovPH Exchange Code</label>
                <input
                  value={manualExchangeCode}
                  onChange={(e) => setManualExchangeCode(e.target.value)}
                  required
                  placeholder="e.g. CYsS3rqHXM8QRBsO0444lXAUlcp1jeU4"
                  style={{ width: "100%", padding: "0.7rem 1rem", border: "2px solid #1e1b4b", borderRadius: 14, fontSize: "0.9rem", fontWeight: 700, fontFamily: "monospace", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ background: "#f5f3ff", padding: "0.75rem 1rem", borderRadius: 14, border: "1.5px solid #1e1b4b", fontSize: "0.78rem", color: "#4338ca", fontWeight: 700 }}>
                💡 Partner credentials (<code>partner_code: {PARTNER_CODE.substring(0, 8)}...</code>) and secret are securely maintained by the backend server.
              </div>

              <button className="primary wide" type="submit" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.85rem 1.25rem", fontSize: "0.95rem", marginTop: "0.5rem" }}>
                <ShieldCheck size={20} /> Redeem Code & Fetch Profile <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EGovSsoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#f3eeff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="#1e1b4b" className="animate-spin" />
      </div>
    }>
      <SSOContent />
    </Suspense>
  );
}
