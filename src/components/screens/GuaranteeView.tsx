import React from "react";
import { CheckCircle2, FileText, ScanLine, Search, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Screen } from "@/types";
import { Head, Status } from "../common/Ui";

const money = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);

export function GuaranteeView({ go, used }: { go: (s: Screen) => void; used: number }) {
  return (
    <>
      <Head
        over="DIGITAL GUARANTEE LETTER"
        title="Guarantee Letter GL-DSWD-2026-04821"
        text="Issued electronically by DSWD NCR. Notifications sent via eMessage."
        action={<Status tone="green">{used ? "Fully Utilized" : "Valid & Active"}</Status>}
      />

      <div className="letterGrid">
        <section className="letter">
          <header style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.75rem" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "#1e1b4b" }}>DSWD NCR</div>
              <small style={{ fontWeight: 700, color: "#6366f1", fontSize: "0.85rem" }}>Republic of the Philippines</small>
            </div>
            <div style={{ textAlign: "center", background: "#f5f3ff", padding: "0.6rem 1.25rem", borderRadius: "16px", border: "2px solid #1e1b4b", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
              <small style={{ color: "#6366f1", fontWeight: 900, letterSpacing: "0.08em", fontSize: "0.75rem" }}>GUARANTEE NO.</small>
              <div style={{ fontWeight: 900, fontSize: "1.35rem", color: "#1e1b4b", marginTop: "0.15rem" }}>GL-DSWD-2026-04821</div>
            </div>
          </header>

          <div className="letterTitle">
            <label style={{ fontSize: "0.8rem", letterSpacing: "0.1em", fontWeight: 900, color: "#6366f1" }}>MEDICAL ASSISTANCE</label>
            <h1>Guarantee Letter</h1>
            <p style={{ color: "#4338ca", fontSize: "0.9rem", fontWeight: 700 }}>Issued electronically on 21 July 2026</p>
          </div>

          <p style={{ fontSize: "1rem", lineHeight: 1.6, fontWeight: 700 }}>
            To: <b>Manila General Hospital</b><br />
            Address: Taft Avenue, Ermita, Manila
          </p>
          <p style={{ fontSize: "1rem", lineHeight: 1.6, fontWeight: 600 }}>
            This certifies that DSWD guarantees payment for eligible medical services rendered to the patient below up to the approved amount stated.
          </p>

          <div className="letterDetails">
            <span>
              Patient
              <b>JUAN DELA CRUZ SANTOS</b>
            </span>
            <span>
              Applicant / Representative
              <b>MARIA LOURDES SANTOS</b>
            </span>
            <span>
              Covered Medical Service
              <b>Laparoscopic appendectomy and confinement</b>
            </span>
            <span>
              Approved Amount
              <strong>₱50,000.00</strong>
            </span>
          </div>

          <footer>
            <div>
              <small style={{ color: "#6366f1", fontWeight: 800, display: "block" }}>Digitally Signed by</small>
              <b style={{ fontSize: "1.2rem", fontWeight: 900 }}>ELENA P. ROBLES</b>
              <small style={{ display: "block", color: "#4338ca", fontWeight: 700 }}>Regional Director · DSWD NCR</small>
            </div>
            <div style={{ textAlign: "center" }}>
              <QRCodeSVG value="https://verify.egov.ph/gl/GL-DSWD-2026-04821" size={110} />
              <small style={{ display: "block", fontSize: "0.75rem", color: "#4338ca", fontWeight: 800, marginTop: "0.35rem" }}>Scan to verify</small>
            </div>
          </footer>

          <div style={{ marginTop: "1.75rem", padding: "0.85rem 1.25rem", background: "#f5f3ff", borderRadius: 16, border: "2px solid #1e1b4b", fontSize: "0.8rem", fontWeight: 800, color: "#1e1b4b", display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <ShieldCheck size={18} color="#059669" /> <span>eGovChain Reference: <b>EGC-7F3A-91D2-B840</b> (Only cryptographic hashes recorded)</span>
          </div>
        </section>

        <aside>
          <div className="card">
            <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900 }}>GUARANTEE ACTIONS</label>
            <h3 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#1e1b4b", margin: "0.5rem 0" }}>₱50,000.00</h3>
            <p style={{ fontSize: "0.9rem", color: "#4338ca", fontWeight: 700, marginBottom: "1.5rem" }}>Status: {used ? `Utilized (${money(used)})` : "Valid for hospital billing"}</p>
            <button className="primary wide" style={{ marginBottom: "1rem" }} onClick={() => typeof window !== "undefined" && window.print()}>
              <FileText size={20} /> Print / Save PDF
            </button>
            <button className="outline wide" onClick={() => go("validate")}>
              <ScanLine size={20} /> Provider Validation
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

export function ValidateView({ used, utilize }: { used: number; utilize: () => void }) {
  return (
    <>
      <Head over="PROVIDER VERIFICATION" title="Validate Guarantee Letter" text="Hospital staff scan QR code or enter GL reference to record bill settlement." />
      <div className="cols">
        <section className="card">
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900 }}>Scan / Enter Reference</h2>
          <div style={{ background: "#f5f3ff", padding: "2.5rem", border: "2.5px dashed #1e1b4b", borderRadius: 24, textAlign: "center", marginBottom: "1.75rem" }}>
            <ScanLine size={56} color="#1e1b4b" />
            <p style={{ margin: "0.75rem 0 0 0", fontWeight: 900, fontSize: "1.1rem" }}>Simulated QR Scanner Active</p>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800, marginBottom: "1.25rem" }}>
            Guarantee Letter Number
            <input defaultValue="GL-DSWD-2026-04821" style={{ padding: "0.75rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 800 }} />
          </label>

          <button className="primary wide">
            <Search size={20} /> Verify Guarantee Record
          </button>
        </section>

        <section className="card" style={{ background: "#dcfce7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <span style={{ color: "#14532d", fontWeight: 900, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <CheckCircle2 size={20} /> TAMPER-EVIDENT VERIFIED
            </span>
            <Status tone="green">{used ? "Fully Utilized" : "Valid"}</Status>
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0, color: "#14532d" }}>Juan Dela Cruz Santos</h2>
          <p style={{ fontSize: "0.9rem", color: "#166534", fontWeight: 700, marginTop: "0.2rem" }}>Covered service: Laparoscopic appendectomy</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", margin: "1.25rem 0", background: "#ffffff", padding: "1.25rem", borderRadius: 20, border: "2px solid #1e1b4b", fontSize: "0.9rem", fontWeight: 800 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Issuing Agency</span><b>DSWD NCR</b></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Approved Guarantee</span><b>₱50,000.00</b></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Available Balance</span><b>{money(50000 - used)}</b></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Expiration Date</span><b>20 August 2026</b></div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1.5px solid #e0e7ff", paddingTop: "0.5rem" }}><span>eGovPay Direct Settlement</span><b style={{ color: "#059669" }}>PAY-2026-A24D (Landbank Direct)</b></div>
          </div>

          <button disabled={used > 0} className="primary wide" onClick={utilize}>
            <CheckCircle2 size={20} /> {used > 0 ? "Guarantee Fully Utilized & eGovPay Settled" : "Record ₱50,000 Guarantee Utilization & eGovPay Settlement"}
          </button>
        </section>
      </div>
    </>
  );
}
