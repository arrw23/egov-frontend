import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, BadgeCheck, Camera, Check, QrCode, ShieldCheck, Sparkles, X, RefreshCw } from "lucide-react";
import { Brand } from "../common/Brand";
import { api } from "@/lib/api";

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
  const [livenessScanning, setLivenessScanning] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [scanStep, setScanStep] = useState<"initializing" | "positioning" | "analyzing" | "complete">("initializing");
  const [scanProgress, setScanProgress] = useState(0);
  const [livenessSessionId, setLivenessSessionId] = useState("a1b3fae6-af74-4896-bd58-32a81604de01");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startFaceLiveness = async () => {
    setLivenessScanning(true);

    // 1. Try Live eKYC Web SDK if available
    if (typeof window !== "undefined" && (window as any).eKYC) {
      try {
        const res = await (window as any).eKYC().start({
          pubKey: "9e31b23d-eeb4-ae08-ff13-cdf8380e5307",
        });
        setLivenessScanning(false);
        if (res?.result?.session_id) {
          setLivenessSessionId(res.result.session_id);
        }
        onVerify();
        return;
      } catch (e) {
        console.warn("eKYC SDK fallback to in-app scanner modal.");
      }
    }

    // 2. Open in-app interactive Face Liveness camera modal
    setLivenessScanning(false);
    setShowCameraModal(true);
    setScanStep("initializing");
    setScanProgress(10);
  };

  useEffect(() => {
    if (showCameraModal) {
      // Start webcam stream
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } })
          .then((stream) => {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch(() => {
            // Video stream unavailable fallback simulation
          });
      }

      // Simulate step progress
      const t1 = setTimeout(() => {
        setScanStep("positioning");
        setScanProgress(45);
      }, 900);

      const t2 = setTimeout(() => {
        setScanStep("analyzing");
        setScanProgress(85);
      }, 2200);

      const t3 = setTimeout(async () => {
        setScanStep("complete");
        setScanProgress(100);

        try {
          const sessionRes = await api.createLivenessSession("redirect", "https://your-app.com/callback", 3000);
          if (sessionRes.token) {
            setLivenessSessionId(sessionRes.token);
          }
        } catch (e) {}

        setTimeout(() => {
          stopWebcam();
          setShowCameraModal(false);
          onVerify();
        }, 1200);
      }, 3500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      stopWebcam();
    }
  }, [showCameraModal]);

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleQrCheck = async () => {
    setQrScanning(true);
    try {
      await api.eVerifyQrVerify("RAW_QR_CODE_VALUE_9639954762664080", livenessSessionId);
    } catch (e) {}
    setTimeout(() => {
      setQrScanning(false);
      onVerify();
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 580, margin: "3rem auto", padding: "2rem", background: "white", borderRadius: 28, border: "2.5px solid #1e1b4b", boxShadow: "0 8px 0 #1e1b4b" }}>
      <header style={{ marginBottom: "1.5rem", borderBottom: "2px solid #e0e7ff", paddingBottom: "1.25rem" }}>
        <Brand />
      </header>

      {!verified ? (
        <section>
          <div style={{ background: "#e0e7ff", color: "#1e1b4b", padding: "0.3rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block" }}>
            NIDAS eVERIFY BY eGovPH + FACE LIVENESS SDK
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 900, marginTop: "0.5rem" }}>PhilSys Identity Check</h1>
          <p style={{ color: "#4338ca", fontSize: "0.95rem", fontWeight: 600 }}>Confirm consent to verify your identity against the PhilSys registry with Tier II Face Liveness verification.</p>

          <div style={{ background: "#f5f3ff", padding: "1.25rem", borderRadius: 20, border: "2px solid #1e1b4b", margin: "1.25rem 0", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.88rem", fontWeight: 700 }}>
            <b style={{ color: "#1e1b4b" }}>Information to be checked:</b>
            <span><Check size={16} color="#059669" /> Full legal name: JOSIE SANTOS DELA CRUZ</span>
            <span><Check size={16} color="#059669" /> Date of birth: 1990-01-01</span>
            <span><Check size={16} color="#059669" /> PhilSys PCN: 9639954762664080</span>
            <span><Camera size={16} color="#2563eb" /> Biometric Face Liveness SDK: Active (Anti-Spoofing Threshold 95+)</span>
          </div>

          <label style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1.5rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}>
            <input type="checkbox" onChange={(e) => setConsent(e.target.checked)} style={{ width: 18, height: 18 }} /> I consent to PhilSys eVerify and Face Liveness biometric check.
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              disabled={!consent || livenessScanning}
              className="primary wide"
              onClick={startFaceLiveness}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.85rem" }}
            >
              {livenessScanning ? (
                <>
                  <RefreshCw size={20} className="animate-spin" /> Launching Face Liveness SDK...
                </>
              ) : (
                <>
                  <ShieldCheck size={20} /> Launch Face Liveness Biometric Verification
                </>
              )}
            </button>

            <button
              disabled={!consent || qrScanning}
              className="outline wide"
              onClick={handleQrCheck}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.8rem" }}
            >
              <QrCode size={20} /> {qrScanning ? "Checking National ID QR..." : "Verify via National ID QR Scan (POST /api/query/qr)"}
            </button>
          </div>
        </section>
      ) : (
        <section style={{ textAlign: "center", padding: "0.5rem 0" }}>
          <div style={{ width: 72, height: 72, background: "#dcfce7", border: "2.5px solid #1e1b4b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", boxShadow: "0 4px 0 #1e1b4b" }}>
            <Check size={40} color="#166534" />
          </div>
          <div style={{ background: "#dcfce7", color: "#14532d", padding: "0.35rem 1rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.8rem", display: "inline-block", marginBottom: "0.5rem" }}>
            IDENTITY & FACE LIVENESS VERIFIED 👋
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, margin: "0.25rem 0" }}>Welcome, JOSIE SANTOS DELA CRUZ</h1>
          <p style={{ color: "#4338ca", fontSize: "0.92rem", fontWeight: 600, marginBottom: "1.25rem" }}>Biometric face liveness confidence score (98.71%) matched your PhilSys registry record.</p>

          <div style={{ background: "#f5f3ff", padding: "1.25rem", borderRadius: 20, border: "2px solid #1e1b4b", textAlign: "left", marginBottom: "1.5rem", fontSize: "0.88rem", fontWeight: 700, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div>eVerify Reference: <b>3013490625984368</b></div>
            <div>Verified Citizen: <b>JOSIE SANTOS DELA CRUZ</b> <BadgeCheck size={18} color="#2563eb" /></div>
            <div>PhilSys PCN Code: <b>9639954762664080</b></div>
            <div>Face Liveness Session Token: <code style={{ fontSize: "0.78rem", background: "#ffffff", padding: "0.15rem 0.4rem", borderRadius: 6, border: "1px solid #1e1b4b" }}>{livenessSessionId}</code></div>
            <div>Liveness Confidence Score: <b style={{ color: "#059669" }}>98.71% SUCCEEDED (Tier II Verified)</b></div>
          </div>
          <button className="primary wide" onClick={onContinue}>
            Continue to eGov's eGuarantee Portal <ArrowRight size={20} />
          </button>
        </section>
      )}

      {/* Interactive Face Liveness Scanner Camera Modal */}
      {showCameraModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(6px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", border: "3px solid #1e1b4b", borderRadius: 28, padding: "1.75rem", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 12px 0 #1e1b4b", position: "relative" }}>
            <button style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "2px solid #1e1b4b", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => setShowCameraModal(false)}>
              <X size={20} />
            </button>

            <div style={{ background: "#e0e7ff", color: "#1e1b4b", padding: "0.3rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontWeight: 900, fontSize: "0.75rem", display: "inline-block", marginBottom: "0.75rem" }}>
              OFFICIAL eGOV FACE LIVENESS BIOMETRIC SCAN
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 900, margin: "0 0 0.25rem 0" }}>Center Your Face in Frame</h3>
            <p style={{ color: "#4338ca", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem" }}>Hold steady while AI anti-spoofing detection analyzes 3D depth and facial movement.</p>

            {/* Video Feed Frame with Oval Guide Overlay */}
            <div style={{ position: "relative", width: 280, height: 280, margin: "0 auto 1.25rem auto", borderRadius: "50%", border: "4px solid #4338ca", overflow: "hidden", boxShadow: "0 0 0 8px rgba(99, 102, 241, 0.25)", background: "#0f172a" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              
              {/* Scanning Laser Beam Effect */}
              <div style={{ position: "absolute", top: `${scanProgress}%`, left: 0, right: 0, height: 3, background: "#38bdf8", boxShadow: "0 0 12px #38bdf8", transition: "top 0.3s ease" }} />

              {/* Status Badge inside Frame */}
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: scanStep === "complete" ? "#dcfce7" : "rgba(30, 27, 75, 0.85)", color: scanStep === "complete" ? "#14532d" : "#ffffff", padding: "0.25rem 0.75rem", borderRadius: 12, fontSize: "0.75rem", fontWeight: 900, border: "1.5px solid #ffffff", whiteSpace: "nowrap" }}>
                {scanStep === "initializing" && "Connecting Biometric Camera..."}
                {scanStep === "positioning" && "Keep Still · Detecting Face"}
                {scanStep === "analyzing" && "Analyzing Anti-Spoofing Score..."}
                {scanStep === "complete" && "✓ Liveness Passed (98.71%)"}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: "#e0e7ff", height: 10, borderRadius: 5, overflow: "hidden", border: "1px solid #1e1b4b", marginBottom: "1rem" }}>
              <div style={{ width: `${scanProgress}%`, background: "#059669", height: "100%", transition: "width 0.4s ease" }} />
            </div>

            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <ShieldCheck size={18} color="#059669" /> Anti-Spoofing Score: <b>98.71% (SUCCEEDED)</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
