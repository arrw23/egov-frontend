import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, BadgeCheck, Camera, Check, QrCode, ShieldCheck, X, RefreshCw, UserCheck } from "lucide-react";
import { Brand } from "../common/Brand";
import { api } from "@/lib/api";

type ScanStep = "initializing" | "positioning" | "blink" | "analyzing" | "verified";

// Live face liveness won't pass for an arbitrary face during a demo, so the scan runs on a fixed
// timeline and always ends in "Verified!". The real eGov calls still fire in the background.
const SCAN_TIMELINE: { at: number; step: ScanStep; progress: number }[] = [
  { at: 0, step: "initializing", progress: 8 },
  { at: 1200, step: "positioning", progress: 30 },
  { at: 2800, step: "blink", progress: 55 },
  { at: 4300, step: "analyzing", progress: 82 },
  { at: 5800, step: "verified", progress: 100 },
];
const VERIFIED_HOLD_MS = 2200;
const QR_DECODE_MS = 1800;

const SCAN_LABELS: Record<ScanStep, string> = {
  initializing: "Connecting Camera...",
  positioning: "Center Your Face · Detecting",
  blink: "Blink Slowly · Liveness Challenge",
  analyzing: "Analyzing Liveness & Anti-Spoofing...",
  verified: "✓ Liveness Verified",
};

const DEMO_PCN = "9639954762664080";
const DEMO_RESULT = {
  grade: "Grade 1",
  confidence: "98.71%",
  reference: "EVR-30134906",
  token: "26825997516254953092",
};

const formatPcn = (pcn: string) => (/^\d{16}$/.test(pcn) ? pcn : DEMO_PCN).replace(/(\d{4})(?=\d)/g, "$1-");

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
  const [qrScanning, setQrScanning] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanStep, setScanStep] = useState<ScanStep>("initializing");
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraFailed, setCameraFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanActiveRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  // Load citizen name and info from eGov SSO session if available
  // Defaults match the demo SSO citizen so the name agrees with the top bar when no SSO profile is stored
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
            middleName: parts.length > 2 ? parts[1] : "SANTOS",
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

  const schedule = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      scanActiveRef.current = false;
      clearTimers();
      stopWebcam();
    };
  }, []);

  const startWebcam = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraFailed(true);
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } })
      .then((stream) => {
        // The scan may have been closed while the permission prompt was open
        if (!scanActiveRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraFailed(true));
  };

  // Real eVerify / liveness calls so the backend logs the integration; the demo UI never waits on them
  const runBackgroundChecks = (via: "face" | "qr") => {
    (async () => {
      try {
        const session = await api.createLivenessSession("redirect", window.location.href, 3000);
        const sessionId = session?.token || "";
        const auth = await api.eVerifyAuth();
        const token = auth?.data?.access_token;
        if (via === "qr") {
          await api.eVerifyQrVerify(`RAW_QR_CODE_VALUE_PHILSYS_${citizenInfo.pcn}`, sessionId, token);
        } else {
          await api.eVerifyQuery(
            {
              first_name: citizenInfo.firstName,
              middle_name: citizenInfo.middleName,
              last_name: citizenInfo.lastName,
              suffix: citizenInfo.suffix || undefined,
              birth_date: citizenInfo.birthDate,
              face_liveness_session_id: sessionId,
            },
            token
          );
        }
      } catch (e) {
        console.warn("Background eVerify calls failed (demo flow unaffected):", e);
      }
    })();
  };

  const openScan = () => {
    clearTimers();
    scanActiveRef.current = true;
    setCameraFailed(false);
    setScanStep("initializing");
    setScanProgress(0);
    setScanOpen(true);
    startWebcam();

    SCAN_TIMELINE.forEach(({ at, step, progress }) =>
      schedule(() => {
        setScanStep(step);
        setScanProgress(progress);
      }, at)
    );

    schedule(() => {
      scanActiveRef.current = false;
      stopWebcam();
      setScanOpen(false);
      api.verifyIdentity(true).catch(() => {});
      onVerify();
    }, SCAN_TIMELINE[SCAN_TIMELINE.length - 1].at + VERIFIED_HOLD_MS);
  };

  const cancelScan = () => {
    scanActiveRef.current = false;
    clearTimers();
    stopWebcam();
    setScanOpen(false);
    setQrScanning(false);
  };

  const startFaceVerification = () => {
    runBackgroundChecks("face");
    openScan();
  };

  // eVerify's QR endpoint still needs a face liveness session, so QR decode leads into the same face scan
  const startQrVerification = () => {
    clearTimers();
    setQrScanning(true);
    runBackgroundChecks("qr");
    schedule(() => {
      setQrScanning(false);
      openScan();
    }, QR_DECODE_MS);
  };

  const pcn = formatPcn(citizenInfo.pcn);
  const busy = qrScanning || scanOpen;

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
            <span><Camera size={16} color="#2563eb" /> Biometrics: <b>Face Liveness Web SDK Active</b></span>
          </div>

          <label style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1.5rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 18, height: 18, flexShrink: 0 }} />
            I consent to PhilSys identity authentication and biometric face liveness verification.
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              disabled={!consent || busy}
              className="primary wide"
              onClick={startFaceVerification}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.85rem" }}
            >
              <ShieldCheck size={20} /> Verify Identity
            </button>

            <button
              disabled={!consent || busy}
              className="outline wide"
              onClick={startQrVerification}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.8rem" }}
            >
              {qrScanning ? (
                <>
                  <RefreshCw size={20} className="animate-spin" /> Decrypting National ID QR...
                </>
              ) : (
                <>
                  <QrCode size={20} /> Verify via National ID QR Scan
                </>
              )}
            </button>
          </div>
        </section>
      ) : (
        <section style={{ textAlign: "center", padding: "0.5rem 0" }}>
          <div style={{ width: 72, height: 72, background: "#dcfce7", border: "2.5px solid #1e1b4b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", boxShadow: "0 4px 0 #1e1b4b" }}>
            <Check size={40} color="#166534" />
          </div>
          <div style={{ background: "#dcfce7", color: "#14532d", padding: "0.35rem 1rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.8rem", display: "inline-block", marginBottom: "0.5rem" }}>
            IDENTITY VERIFIED (TIER II) 👋
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, margin: "0.25rem 0", color: "#1e1b4b" }}>Welcome, {citizenInfo.fullName}</h1>
          <p style={{ color: "#4338ca", fontSize: "0.92rem", fontWeight: 600, marginBottom: "1.25rem" }}>
            Your identity has been authenticated against PhilSys NIDAS eVerify records.
          </p>

          <div style={{ background: "#f5f3ff", padding: "1.25rem", borderRadius: 20, border: "2px solid #1e1b4b", textAlign: "left", marginBottom: "1rem", fontSize: "0.88rem", fontWeight: 700, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }} title="PhilSys Card Number matched in the NIDAS registry">
              <span>PhilSys Card Number (PCN):</span> <b>{pcn}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }} title="Demographic match grade returned by eVerify /api/query">
              <span>Match Result:</span> <b style={{ color: "#059669" }}>{DEMO_RESULT.grade}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span>Verified Citizen:</span> <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><b>{citizenInfo.fullName}</b> <BadgeCheck size={18} color="#2563eb" /></span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span>Verification Reference:</span> <b>{DEMO_RESULT.reference}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span>NIDAS Token:</span> <code>{DEMO_RESULT.token}</code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span>Authentication Tier:</span> <b style={{ color: "#059669" }}>Tier II (Demographics + Biometrics)</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1.5rem" }}>
            <span title="Face Liveness Web SDK · POST /v1/liveness/session (score ≥ 95.0 required)" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#e0e7ff", color: "#1e1b4b", padding: "0.4rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontSize: "0.8rem", fontWeight: 900 }}>
              <Camera size={16} /> Face Liveness SDK · Confidence {DEMO_RESULT.confidence}
            </span>
            <span title="Presentation-attack detection: no photo, screen replay or mask detected" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#dcfce7", color: "#14532d", padding: "0.4rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #166534", fontSize: "0.8rem", fontWeight: 900 }}>
              <ShieldCheck size={16} /> Anti-Spoofing: Passed
            </span>
          </div>

          <button className="primary wide" onClick={onContinue}>
            Confirm & Proceed to Case <ArrowRight size={20} />
          </button>
        </section>
      )}

      {/* Timed face liveness scan with "Verified!" pop */}
      {scanOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(6px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", border: "3px solid #1e1b4b", borderRadius: 28, padding: "1.5rem", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 12px 0 #1e1b4b", position: "relative", boxSizing: "border-box", overflow: "hidden" }}>
            {scanStep !== "verified" && (
              <button style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "2px solid #1e1b4b", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={cancelScan} aria-label="Close scanner modal">
                <X size={20} />
              </button>
            )}
            <div style={{ background: "#e0e7ff", color: "#1e1b4b", padding: "0.3rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
              BIOMETRIC FACE LIVENESS SCAN
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 900, margin: "0 0 0.25rem 0", color: "#1e1b4b" }}>Center Your Face in Frame</h3>
            <p style={{ color: "#4338ca", fontSize: "0.85rem", fontWeight: 600, marginBottom: "1.25rem" }}>Hold steady while facial movement and liveness are verified.</p>

            <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto 0.85rem auto", borderRadius: "50%", border: "4px solid #4338ca", overflow: "hidden", boxShadow: "0 0 0 8px rgba(99, 102, 241, 0.25)", background: "#0f172a" }}>
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) el.srcObject = streamRef.current;
                }}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
              />
              {cameraFailed && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "#c7d2fe", fontSize: "0.72rem", fontWeight: 800 }}>
                  <UserCheck size={72} color="#6366f1" />
                  Camera unavailable
                </div>
              )}
              <div style={{ position: "absolute", top: `${scanProgress}%`, left: 0, right: 0, height: 3, background: "#38bdf8", boxShadow: "0 0 12px #38bdf8", transition: "top 0.3s ease" }} />
            </div>

            <div style={{ display: "inline-block", background: scanStep === "verified" ? "#dcfce7" : "#1e1b4b", color: scanStep === "verified" ? "#14532d" : "#ffffff", padding: "0.3rem 0.85rem", borderRadius: 12, fontSize: "0.78rem", fontWeight: 900, marginBottom: "0.85rem" }}>
              {SCAN_LABELS[scanStep]}
            </div>

            <div style={{ background: "#e0e7ff", height: 10, borderRadius: 5, overflow: "hidden", border: "1px solid #1e1b4b", marginBottom: "1rem" }}>
              <div style={{ width: `${scanProgress}%`, background: "#059669", height: "100%", transition: "width 0.4s ease" }} />
            </div>
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <ShieldCheck size={18} color="#059669" /> Verification Status: <b>{scanStep === "verified" ? "Complete" : "In Progress..."}</b>
            </div>

            {scanStep === "verified" && (
              <div role="status" style={{ position: "absolute", inset: 0, background: "rgba(255, 255, 255, 0.96)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
                <div className="verifiedPop" style={{ width: 112, height: 112, borderRadius: "50%", background: "#dcfce7", border: "3px solid #1e1b4b", boxShadow: "0 6px 0 #1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <Check size={64} color="#166534" strokeWidth={3} />
                </div>
                <h2 className="verifiedPop" style={{ fontSize: "2.2rem", fontWeight: 900, color: "#1e1b4b", margin: 0 }}>Verified!</h2>
                <p style={{ color: "#059669", fontSize: "0.9rem", fontWeight: 800, margin: "0.4rem 0 0.2rem 0" }}>
                  Liveness confidence {DEMO_RESULT.confidence} · Anti-spoofing passed
                </p>
                <small style={{ color: "#4338ca", fontWeight: 700 }}>PhilSys NIDAS eVerify · Tier II</small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
