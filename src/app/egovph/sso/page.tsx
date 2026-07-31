"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BadgeCheck, CheckCircle2, ShieldCheck, Loader2, ArrowRight, LockKeyhole, AlertTriangle } from "lucide-react";
import { Brand } from "@/components/common/Brand";
import { api } from "@/lib/api";

function SSOContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const exchangeCode = searchParams.get("exchange_code") || searchParams.get("code") || "HACKATHON_SSO_LIVE";

  const [step, setStep] = useState<"form" | "verifying" | "success">("form");
  const [name, setName] = useState("");
  const [uniqid, setUniqid] = useState("MVPCBEUVCGPZR");
  const [pcn, setPcn] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [address, setAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fillDemoData = () => {
    setErrorMsg("");
    setName("JOSIE SANTOS DELA CRUZ");
    setUniqid("MVPCBEUVCGPZR");
    setPcn("9639954762664080");
    setEmail("josie@yopmail.com");
    setPhone("9090000000");
    setBirthdate("1990-01-01");
    setAddress("1123 RIZAL ST., POBLACION, CITY OF ALAMINOS, PANGASINAN");
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim().toUpperCase();
    const cleanPcn = pcn.replace(/\D/g, "");
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "");

    const isValidEmail = cleanEmail === "josie@yopmail.com";
    const isValidName = cleanName.includes("JOSIE") && (cleanName.includes("DELA CRUZ") || cleanName.includes("CRUZ"));
    const isValidPcn = cleanPcn === "9639954762664080";
    const isValidPhone = cleanPhone === "9090000000";

    if (!isValidEmail || !isValidName || !isValidPcn || !isValidPhone) {
      setErrorMsg("Authentication Rejected: Invalid eGovPH Citizen Credentials. Credentials do not match any verified citizen in the eGovPH Registry.");
      return;
    }

    setStep("verifying");
    const formattedPhone = `+63 ${cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}`;

    const userInfo = { 
      name, 
      uniqid, 
      pcn, 
      email, 
      phone: formattedPhone, 
      birthdate: birthdate || "1990-01-01", 
      address: address || "1123 RIZAL ST., POBLACION, CITY OF ALAMINOS, PANGASINAN", 
      exchangeCode 
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("egov_user_info", JSON.stringify(userInfo));
    }

    try {
      const tokenRes = await api.ssoToken(exchangeCode);
      if (tokenRes?.access_token) {
        await api.ssoAuthentication(tokenRes.access_token);
      }
      await api.mockLogin("applicant");
    } catch (err) {}

    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        router.push(`/?sso=authenticated&name=${encodeURIComponent(userInfo.name)}`);
      }, 1600);
    }, 1200);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3eeff", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ background: "#ffffff", border: "3px solid #1e1b4b", borderRadius: 28, padding: "2.5rem", maxWidth: 560, width: "100%", boxShadow: "0 10px 0 #1e1b4b" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
          <Brand />
        </div>

        {step === "form" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ background: "#fef08a", color: "#1e1b4b", padding: "0.3rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.72rem", display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                <LockKeyhole size={14} /> OFFICIAL eGOVPH SINGLE SIGN-ON (SSO)
              </div>
              <button
                type="button"
                onClick={fillDemoData}
                style={{ background: "#e0e7ff", border: "1.5px solid #1e1b4b", borderRadius: "9999px", padding: "0.25rem 0.75rem", fontSize: "0.72rem", fontWeight: 800, color: "#1e1b4b", cursor: "pointer" }}
              >
                ✨ Auto-fill Demo Details
              </button>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1e1b4b", margin: "0 0 0.25rem 0" }}>Sign in with eGovPH Credentials</h2>
            <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
              Enter your citizen account details below. Partner integration codes and exchange tokens are automatically pre-filled by the system.
            </p>

            <form onSubmit={handleAuthenticate} style={{ display: "flex", flexDirection: "column", gap: "0.85rem", textAlign: "left" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", display: "block", marginBottom: "0.3rem" }}>Citizen Account (eGov Identity / Email)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="e.g. josie@yopmail.com"
                  style={{ width: "100%", padding: "0.7rem 1rem", border: "2px solid #1e1b4b", borderRadius: 14, fontSize: "0.9rem", fontWeight: 700, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", display: "block", marginBottom: "0.3rem" }}>Citizen Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. JOSIE SANTOS DELA CRUZ"
                  style={{ width: "100%", padding: "0.7rem 1rem", border: "2px solid #1e1b4b", borderRadius: 14, fontSize: "0.88rem", fontWeight: 700, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", display: "block", marginBottom: "0.3rem" }}>PhilSys PCN Code</label>
                  <input
                    value={pcn}
                    onChange={(e) => setPcn(e.target.value)}
                    required
                    placeholder="e.g. 9639954762664080"
                    style={{ width: "100%", padding: "0.7rem 1rem", border: "2px solid #1e1b4b", borderRadius: 14, fontSize: "0.88rem", fontWeight: 700, boxSizing: "border-box", fontFamily: "monospace" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", display: "block", marginBottom: "0.3rem" }}>Date of Birth</label>
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    required
                    style={{ width: "100%", padding: "0.7rem 1rem", border: "2px solid #1e1b4b", borderRadius: 14, fontSize: "0.88rem", fontWeight: 700, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", display: "block", marginBottom: "0.3rem" }}>Mobile Number</label>
                <div style={{ display: "flex", alignItems: "center", border: "2px solid #1e1b4b", borderRadius: 14, overflow: "hidden", background: "#ffffff" }}>
                  <span style={{ padding: "0.7rem 0.85rem", background: "#e0e7ff", borderRight: "2px solid #1e1b4b", fontWeight: 900, fontSize: "0.88rem", color: "#1e1b4b", display: "flex", alignItems: "center", gap: "0.35rem", userSelect: "none" }}>
                    🇵🇭 +63
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const cleaned = val.startsWith("0") ? val.slice(1) : val;
                      setPhone(cleaned.slice(0, 10));
                    }}
                    required
                    placeholder="9090000000"
                    style={{ flex: 1, padding: "0.7rem 1rem", border: "none", outline: "none", fontSize: "0.9rem", fontWeight: 700, width: "100%" }}
                  />
                </div>
              </div>

              {errorMsg && (
                <div style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: 14, padding: "0.75rem 1rem", color: "#991b1b", fontSize: "0.82rem", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} /> {errorMsg}
                </div>
              )}

              <div style={{ background: "#f5f3ff", padding: "0.75rem 1rem", borderRadius: 14, border: "1.5px solid #1e1b4b", fontSize: "0.78rem", color: "#4338ca", fontWeight: 700 }}>
                💡 <b>Manual Authentication:</b> Enter registered citizen details above to authenticate via eGovPH Single Sign-On.
              </div>

              <button className="primary wide" type="submit" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.85rem 1.25rem", fontSize: "0.95rem", marginTop: "0.5rem" }}>
                <ShieldCheck size={20} /> Authorize & Authenticate via eGovPH <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {step === "verifying" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, background: "#e0e7ff", border: "2.5px solid #1e1b4b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto" }}>
              <Loader2 size={32} color="#1e1b4b" className="animate-spin" />
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#6366f1", letterSpacing: "0.08em" }}>eGOVPH SSO TOKEN EXCHANGE</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1e1b4b", margin: "0.25rem 0 0.5rem 0" }}>POST /api/token & /sso_authentication...</h2>
            <p style={{ color: "#4338ca", fontSize: "0.9rem", fontWeight: 600 }}>Exchanging exchange code for Bearer token: <code style={{ background: "#f5f3ff", padding: "0.2rem 0.5rem", borderRadius: 8, border: "1px solid #1e1b4b" }}>{exchangeCode}</code></p>
          </div>
        )}

        {step === "success" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 68, height: 68, background: "#dcfce7", border: "2.5px solid #1e1b4b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", boxShadow: "0 4px 0 #1e1b4b" }}>
              <CheckCircle2 size={38} color="#166534" />
            </div>
            <div style={{ background: "#dcfce7", color: "#14532d", padding: "0.3rem 0.9rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
              eGOVPH SSO AUTO-AUTHENTICATED
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1e1b4b", margin: "0 0 0.25rem 0" }}>Welcome back, {name}!</h2>
            <p style={{ color: "#4338ca", fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem" }}>UniqID bound & authenticated via eGovPH Single Sign-On.</p>

            <div style={{ background: "#f5f3ff", padding: "1.25rem", borderRadius: 20, border: "2px solid #1e1b4b", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>UniqID:</span> <b>{uniqid}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Citizen Name:</span> <b>{name} <BadgeCheck size={16} color="#2563eb" /></b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>PhilSys PCN:</span> <b>{pcn}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Registered Email:</span> <b>{email}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Mobile:</span> <b>{phone}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Profile Mode:</span> <b style={{ color: "#059669" }}>Read-Only (Managed via eGovPH)</b></div>
            </div>

            <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 800, background: "#ecfdf5", padding: "0.6rem 1rem", borderRadius: "9999px", border: "1.5px solid #a7f3d0", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={16} /> Redirecting to GabayMed Portal...
            </div>
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
