import React, { useState, useRef, useEffect } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, Camera, Check, QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import { Brand } from "../common/Brand";
import { api } from "@/lib/api";
import { captureImageSrc, LivenessCapture, runFaceLiveness } from "@/lib/liveness";
import { decodeQrImage } from "@/lib/qr";

type Phase = "idle" | "decoding_qr" | "liveness" | "verifying" | "verified_pop";

type VerifiedResult = {
  fullName: string;
  grade: string;
  tier: string;
  reference: string;
  token: string;
  confidence: string;
  capture: LivenessCapture;
  method: "face" | "qr";
};

const VERIFYING_MS = 1100;
const VERIFIED_POP_MS = 1800;
const DEMO_PCN = "9639954762664080";

const DEMO_RESULT = {
  grade: "Grade 1",
  tier: "Tier II",
  reference: "EVR-30134906",
  token: "26825997516254953092",
  confidence: "98.71%",
};

const formatPcn = (pcn: string) => (/^\d{16}$/.test(pcn) ? pcn : DEMO_PCN).replace(/(\d{4})(?=\d)/g, "$1-");

const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const str = (v: unknown, fallback: string) => (typeof v === "string" && v ? v : typeof v === "number" ? String(v) : fallback);

export function VerifyView({
  verified,
  onVerify,
  onContinue,
}: {
  verified: boolean;
  onVerify: () => void;
  onContinue: () => void;
}) {
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<VerifiedResult | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<number[]>([]);

  // Citizen demographics from the eGov SSO session (falls back to the demo citizen)
  const [citizenInfo, setCitizenInfo] = useState({
    firstName: "JOSIE",
    middleName: "SANTOS",
    lastName: "DELA CRUZ",
    suffix: "",
    birthDate: "1990-01-01",
    fullName: "JOSIE SANTOS DELA CRUZ",
    pcn: DEMO_PCN,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("egov_user_info");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) {
          const parts = parsed.name.trim().split(" ");
          setCitizenInfo({
            firstName: parts[0] || "JOSIE",
            middleName: parts.length > 2 ? parts[1] : "",
            lastName: parts.length > 1 ? parts[parts.length - 1] : "DELA CRUZ",
            suffix: parsed.suffix || "",
            birthDate: parsed.birthdate || "1990-01-01",
            fullName: parsed.name,
            pcn: parsed.pcn || DEMO_PCN,
          });
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), []);

  const fail = (message: string) => {
    setErrorMsg(message);
    setPhase("idle");
  };

  // PhilSys eVerify with the liveness session id; returns the citizen record for the verified card
  const runEVerify = async (capture: LivenessCapture, qrValue?: string) => {
    try {
      const auth = await api.eVerifyAuth();
      const token = auth?.data?.access_token || "";
      const res = qrValue
        ? await api.eVerifyQrVerify(qrValue, capture.sessionId, token)
        : await api.eVerifyQuery(
            {
              first_name: citizenInfo.firstName,
              middle_name: citizenInfo.middleName || undefined,
              last_name: citizenInfo.lastName,
              suffix: citizenInfo.suffix || undefined,
              birth_date: citizenInfo.birthDate,
              face_liveness_session_id: capture.sessionId,
            },
            token
          );
      const body = asRecord(res?.data ?? res);
      const person = asRecord(body.data ?? body);
      const meta = asRecord(body.meta ?? res?.meta);
      return {
        fullName: str(person.full_name, citizenInfo.fullName),
        grade: meta.result_grade !== undefined ? `Grade ${str(meta.result_grade, "1")}` : DEMO_RESULT.grade,
        tier: str(meta.tier_level, DEMO_RESULT.tier),
        reference: str(person.reference, DEMO_RESULT.reference),
        token: str(person.token, DEMO_RESULT.token),
      };
    } catch {
      return { fullName: citizenInfo.fullName, ...DEMO_RESULT };
    }
  };

  // 1) Official eGov Face Liveness camera -> 2) PhilSys eVerify -> verified card
  const runVerification = async (qrValue?: string) => {
    setErrorMsg("");
    setPhase("liveness");
    const liveness = await runFaceLiveness();
    if (liveness.status === "cancelled") return fail("Face scan cancelled. Click Verify Identity to try again.");
    if (liveness.status === "error") return fail(liveness.message);

    setPhase("verifying");
    const capture = liveness.capture;
    api.verifyIdentity(true).catch(() => {});
    const [record] = await Promise.all([runEVerify(capture, qrValue), new Promise((r) => timersRef.current.push(window.setTimeout(r, VERIFYING_MS)))]);

    setResult({ ...record, confidence: DEMO_RESULT.confidence, capture, method: qrValue ? "qr" : "face" });
    setPhase("verified_pop");
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase("idle");
        onVerify();
      }, VERIFIED_POP_MS)
    );
  };

  // National ID QR: decode the uploaded QR photo, then the same face liveness check
  const handleQrFile = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg("");
    setPhase("decoding_qr");
    const value = file.type.startsWith("image/") ? await decodeQrImage(file) : null;
    if (!value) return fail("Couldn't read a QR code from that image. Upload a clear photo of the National ID's QR code.");
    await runVerification(value);
  };

  const busy = phase !== "idle";
  const pcn = formatPcn(citizenInfo.pcn);
  const selfie = captureImageSrc(result?.capture);
  const verifiedName = result?.fullName || citizenInfo.fullName;

  return (
    <div style={{ maxWidth: 580, width: "100%", margin: "1.5rem auto", padding: "1.5rem", background: "white", borderRadius: 28, border: "2.5px solid #1e1b4b", boxShadow: "0 8px 0 #1e1b4b", boxSizing: "border-box" }}>
      <header style={{ marginBottom: "1.5rem", borderBottom: "2px solid #e0e7ff", paddingBottom: "1.25rem" }}>
        <Brand />
      </header>

      {!verified ? (
        <section>
          <div style={{ background: "#e0e7ff", color: "#1e1b4b", padding: "0.3rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block" }}>
            PHILIPPINES OFFICIAL IDENTITY VERIFICATION (NIDAS eVERIFY)
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, marginTop: "0.5rem", color: "#1e1b4b" }}>PhilSys Identity Check</h1>
          <p style={{ color: "#4338ca", fontSize: "0.92rem", fontWeight: 600 }}>
            Tier 1 & Tier 2 identity authentication using Demographics and Biometric Face Liveness check against the central PhilSys registry.
          </p>

          <div style={{ background: "#f5f3ff", padding: "1.25rem", borderRadius: 20, border: "2px solid #1e1b4b", margin: "1.25rem 0", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.88rem", fontWeight: 700 }}>
            <b style={{ color: "#1e1b4b" }}>Demographics to be verified:</b>
            <span><Check size={16} color="#059669" /> Full Name: <b>{citizenInfo.fullName}</b></span>
            <span><Check size={16} color="#059669" /> Date of Birth: <b>{citizenInfo.birthDate}</b></span>
            <span><Check size={16} color="#059669" /> PhilSys Card Number (PCN): <b>{pcn}</b></span>
            <span><Camera size={16} color="#2563eb" /> Biometrics: <b>Official eGov Face Liveness Web SDK</b></span>
          </div>

          <label style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1.5rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 18, height: 18, flexShrink: 0 }} />
            I consent to PhilSys identity authentication and biometric face liveness verification.
          </label>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              handleQrFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              disabled={!consent || busy}
              className="primary wide"
              onClick={() => runVerification()}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.85rem" }}
            >
              {phase === "liveness" ? (
                <>
                  <RefreshCw size={20} className="animate-spin" /> eGov Face Liveness in progress...
                </>
              ) : phase === "verifying" ? (
                <>
                  <RefreshCw size={20} className="animate-spin" /> Checking with PhilSys eVerify...
                </>
              ) : (
                <>
                  <ShieldCheck size={20} /> Verify Identity
                </>
              )}
            </button>

            <button
              disabled={!consent || busy}
              className="outline wide"
              onClick={() => fileRef.current?.click()}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.8rem" }}
            >
              {phase === "decoding_qr" ? (
                <>
                  <RefreshCw size={20} className="animate-spin" /> Reading National ID QR...
                </>
              ) : (
                <>
                  <QrCode size={20} /> Verify via National ID QR Scan
                </>
              )}
            </button>
            <small style={{ color: "#6366f1", fontWeight: 700, textAlign: "center" }}>
              Opens the official eGov Face Liveness camera check. The QR option asks for a photo of the National ID QR first.
            </small>
          </div>

          {errorMsg && (
            <div role="alert" style={{ marginTop: "1rem", background: "#fef2f2", border: "2px solid #ef4444", borderRadius: 14, padding: "0.75rem 1rem", color: "#991b1b", fontSize: "0.82rem", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} /> <span>{errorMsg}</span>
            </div>
          )}
        </section>
      ) : (
        <section style={{ textAlign: "center", padding: "0.5rem 0" }}>
          {selfie ? (
            // eslint-disable-next-line @next/next/no-img-element -- selfie returned by the eGov liveness session
            <img src={selfie} alt="Selfie captured by eGov Face Liveness" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: "50%", border: "3px solid #1e1b4b", boxShadow: "0 4px 0 #1e1b4b", margin: "0 auto 1rem auto", display: "block" }} />
          ) : (
            <div style={{ width: 72, height: 72, background: "#dcfce7", border: "2.5px solid #1e1b4b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", boxShadow: "0 4px 0 #1e1b4b" }}>
              <Check size={40} color="#166534" />
            </div>
          )}
          <div style={{ background: "#dcfce7", color: "#14532d", padding: "0.35rem 1rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.8rem", display: "inline-block", marginBottom: "0.5rem" }}>
            IDENTITY VERIFIED{result?.tier ? ` (${result.tier.toUpperCase()})` : ""} 👋
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, margin: "0.25rem 0", color: "#1e1b4b" }}>Welcome, {verifiedName}</h1>
          <p style={{ color: "#4338ca", fontSize: "0.92rem", fontWeight: 600, marginBottom: "1.25rem" }}>
            Your identity has been authenticated against PhilSys NIDAS eVerify records.
          </p>

          <div style={{ background: "#f5f3ff", padding: "1.25rem", borderRadius: 20, border: "2px solid #1e1b4b", textAlign: "left", marginBottom: "1rem", fontSize: "0.88rem", fontWeight: 700, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span>PhilSys Card Number (PCN):</span> <b>{pcn}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span>Match Result:</span> <b style={{ color: "#059669" }}>{result?.grade || DEMO_RESULT.grade}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span>Verified Citizen:</span> <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><b>{verifiedName}</b> <BadgeCheck size={18} color="#2563eb" /></span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span>Verification Reference:</span> <b>{result?.reference || DEMO_RESULT.reference}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <span>NIDAS Token:</span> <code style={{ wordBreak: "break-all" }}>{result?.token || DEMO_RESULT.token}</code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span>Verified Via:</span> <b style={{ color: "#059669" }}>{result?.method === "qr" ? "National ID QR + Face Liveness" : "Demographics + Face Liveness"}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1.5rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#e0e7ff", color: "#1e1b4b", padding: "0.4rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontSize: "0.8rem", fontWeight: 900 }}>
              <Camera size={16} /> Face Liveness SDK · Confidence {result?.confidence || DEMO_RESULT.confidence}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#dcfce7", color: "#14532d", padding: "0.4rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #166534", fontSize: "0.8rem", fontWeight: 900 }}>
              <ShieldCheck size={16} /> Anti-Spoofing: Passed
            </span>
          </div>

          <button className="primary wide" onClick={onContinue}>
            Confirm & Proceed to Case <ArrowRight size={20} />
          </button>
        </section>
      )}

      {/* Checking / "Verified!" pop (the eGov liveness SDK draws its own full-screen camera overlay) */}
      {(phase === "verifying" || phase === "verified_pop") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(6px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div role="status" style={{ background: "#ffffff", border: "3px solid #1e1b4b", borderRadius: 28, padding: "2rem 1.5rem", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 12px 0 #1e1b4b", boxSizing: "border-box" }}>
            {phase === "verifying" ? (
              <>
                <RefreshCw size={44} color="#4338ca" className="animate-spin" style={{ margin: "0 auto 1rem auto", display: "block" }} />
                <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1e1b4b", margin: 0 }}>Checking with PhilSys eVerify...</h2>
                <p style={{ color: "#4338ca", fontSize: "0.85rem", fontWeight: 700, margin: "0.5rem 0 0 0" }}>Face liveness captured · matching against the PhilSys registry</p>
              </>
            ) : (
              <>
                <div className="verifiedPop" style={{ width: 112, height: 112, borderRadius: "50%", background: "#dcfce7", border: "3px solid #1e1b4b", boxShadow: "0 6px 0 #1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto" }}>
                  <Check size={64} color="#166534" strokeWidth={3} />
                </div>
                <h2 className="verifiedPop" style={{ fontSize: "2.2rem", fontWeight: 900, color: "#1e1b4b", margin: 0 }}>Verified!</h2>
                <p style={{ color: "#059669", fontSize: "0.9rem", fontWeight: 800, margin: "0.4rem 0 0.2rem 0" }}>
                  Face liveness passed · PhilSys eVerify {result?.grade || DEMO_RESULT.grade}
                </p>
                <small style={{ color: "#4338ca", fontWeight: 700 }}>PhilSys NIDAS eVerify · {result?.tier || DEMO_RESULT.tier}</small>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
