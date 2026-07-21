"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BadgeCheck, CheckCircle2, ShieldCheck, Loader2, ArrowRight, LockKeyhole } from "lucide-react";
import { Brand } from "@/components/common/Brand";
import { api } from "@/lib/api";

function SSOContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const exchangeCode = searchParams.get("exchange_code") || searchParams.get("code") || "HACKATHON_SSO_LIVE";

  const [step, setStep] = useState<"form" | "verifying" | "success">("form");
  const [name, setName] = useState("JOSIE SANTOS DELA CRUZ");
  const [uniqid, setUniqid] = useState("MVPCBEUVCGPZR");
  const [pcn, setPcn] = useState("9639954762664080");
  const [email, setEmail] = useState("josie@yopmail.com");
  const [phone, setPhone] = useState("+63 909 000 0000");
  const [birthdate, setBirthdate] = useState("1990-01-01");
  const [address, setAddress] = useState("1123 RIZAL ST., POBLACION, CITY OF ALAMINOS, PANGASINAN");

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("verifying");

    const userInfo = { name, uniqid, pcn, email, phone, birthdate, address, exchangeCode };
    if (typeof window !== "undefined") {
      localStorage.setItem("egov_user_info", JSON.stringify(userInfo));
    }

    try {
      await api.mockLogin("applicant");
    } catch (err) {}

    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        router.push(`/?sso=authenticated&name=${encodeURIComponent(name)}`);
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
            <div style={{ background: "#fef08a", color: "#1e1b4b", padding: "0.3rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.72rem", display: "inline-flex", gap: "0.35rem", alignItems: "center", marginBottom: "0.75rem" }}>
              <LockKeyhole size={14} /> OFFICIAL eGOVPH SINGLE SIGN-ON (SSO)
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1e1b4b", margin: "0 0 0.25rem 0" }}>Sign in with eGovPH Credentials</h2>
            <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>
              Partner Code: <code style={{ background: "#f5f3ff", padding: "0.2rem 0.5rem", borderRadius: 8, border: "1px solid #1e1b4b" }}>HACKATHON_SSO</code>
            </p>

            <form onSubmit={handleAuthenticate} style={{ display: "flex", flexDirection: "column", gap: "0.85rem", textAlign: "left" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", display: "block", marginBottom: "0.3rem" }}>Citizen Account (eGov Identity)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="josie@yopmail.com"
                  style={{ width: "100%", padding: "0.7rem 1rem", border: "2px solid #1e1b4b", borderRadius: 14, fontSize: "0.9rem", fontWeight: 700, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", display: "block", marginBottom: "0.3rem" }}>Citizen Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ width: "100%", padding: "0.7rem 1rem", border: "2px solid #1e1b4b", borderRadius: 14, fontSize: "0.88rem", fontWeight: 700, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", display: "block", marginBottom: "0.3rem" }}>UniqID (eGov Identity)</label>
                  <input
                    value={uniqid}
                    onChange={(e) => setUniqid(e.target.value)}
                    required
                    style={{ width: "100%", padding: "0.7rem 1rem", border: "2px solid #1e1b4b", borderRadius: 14, fontSize: "0.88rem", fontWeight: 700, boxSizing: "border-box", fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", display: "block", marginBottom: "0.3rem" }}>PhilSys PCN Code</label>
                  <input
                    value={pcn}
                    onChange={(e) => setPcn(e.target.value)}
                    required
                    style={{ width: "100%", padding: "0.7rem 1rem", border: "2px solid #1e1b4b", borderRadius: 14, fontSize: "0.88rem", fontWeight: 700, boxSizing: "border-box", fontFamily: "monospace" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 900, color: "#1e1b4b", display: "block", marginBottom: "0.3rem" }}>Mobile Number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{ width: "100%", padding: "0.7rem 1rem", border: "2px solid #1e1b4b", borderRadius: 14, fontSize: "0.88rem", fontWeight: 700, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ background: "#f5f3ff", padding: "0.75rem 1rem", borderRadius: 14, border: "1.5px solid #1e1b4b", fontSize: "0.78rem", color: "#4338ca", fontWeight: 700 }}>
                💡 <b>Auto-Generated Case Data:</b> Hospital bill (₱150,000.00), barangay indigency certificate, and DSWD case record will be automatically populated & verified for <b>{name}</b>.
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
              <ShieldCheck size={16} /> Redirecting to eGov's eGuarantee Portal...
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
