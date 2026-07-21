import React from "react";
import {
  Activity,
  BadgeCheck,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileText,
  QrCode,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { MedicalCase, Screen } from "@/types";
import { Head, Stat, Status } from "../common/Ui";
import { getSavedRequirementRule } from "@/lib/requirementStore";

const money = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);

export function DashboardView({
  go,
  approved,
  used,
  activeCase,
}: {
  go: (s: Screen) => void;
  approved: boolean;
  used: number;
  activeCase: MedicalCase | null;
}) {
  const rule = getSavedRequirementRule();
  const verifiedBill = activeCase ? activeCase.verified_bill : 150000;
  const approvedAmount = approved ? 50000 : 0;
  const remainingUncovered = Math.max(0, verifiedBill - approvedAmount);

  return (
    <>
      <Head
        over={`MAGANDANG ARAW, ${activeCase?.applicant_name ? activeCase.applicant_name.split(" ")[0].toUpperCase() : "JOSIE"} 👋`}
        title="Your Medical Assistance"
        text="Track your family's request from hospital document verification to guarantee letter utilization."
        action={
          <button className="primary" onClick={() => go("apply")}>
            <FileText size={20} /> New application
          </button>
        }
      />
      <div className="case">
        <span>
          <label>CASE {activeCase ? activeCase.case_number : "MGL-2026-001284"}</label>
          <h2>
            {activeCase ? activeCase.patient_name : "Juan D. Santos"} <BadgeCheck color="#2563eb" size={24} />
          </h2>
          <p>{activeCase ? activeCase.provider?.name : "Manila General Hospital"} · {activeCase ? activeCase.condition_category : "Laparoscopic appendectomy"}</p>
        </span>
        <Status tone="green">{approved ? "Guarantee letter issued" : "Under agency review"}</Status>
      </div>

      <div className="stats">
        <Stat Icon={FileCheck2} label="Verified Medical Bill" value={money(verifiedBill)} note="Certified by Manila General Hospital" tone="blue" />
        <Stat Icon={CircleDollarSign} label="Assistance Approved" value={money(approvedAmount)} note="DSWD AICS Program" tone="green" />
        <Stat Icon={WalletCards} label="Remaining Uncovered" value={money(remainingUncovered)} note="Bill − Total Approved Assistance" tone="orange" />
        <Stat Icon={Activity} label="Amount Utilized" value={money(used)} note={used ? "Confirmed by hospital provider" : "Not yet recorded"} tone="purple" />
      </div>

      <div className="cols">
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: 0 }}>Case Journey Progress</h2>
            <div style={{ background: "#e0e7ff", padding: "0.3rem 0.85rem", borderRadius: "9999px", border: "1.5px solid #1e1b4b", fontSize: "0.75rem", fontWeight: 900, color: "#1e1b4b" }}>
              eGovChain Verified
            </div>
          </div>
          <div className="timeline">
            {[
              ["Identity verified", "PhilSys eVerify matched"],
              ["Hospital records certified", "Manila General Hospital certified SOA & abstract"],
              ["Agency application reviewed", "DSWD NCR evaluator review"],
              ["Guarantee letter issued", "GL-DSWD-2026-04821 (₱50,000 approved)"],
              ["Guarantee letter utilized", used ? `${money(used)} recorded by hospital` : "Waiting for hospital billing settlement"],
            ].map(([title, sub], i) => (
              <div className={i < 4 || used ? "done" : ""} key={title}>
                <i>{i < 4 || used ? <Check size={18} /> : <Clock3 size={18} />}</i>
                <span>
                  <b style={{ fontSize: "1rem" }}>{title}</b>
                  <small style={{ color: "#4338ca", fontWeight: 600 }}>{sub}</small>
                </span>
                <time>{i < 4 || used ? "Completed" : "Pending"}</time>
              </div>
            ))}
          </div>
        </section>

        <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "#e0e7ff", color: "#1e1b4b" }}>
            <label style={{ fontSize: "0.75rem", color: "#4338ca", fontWeight: 900, letterSpacing: "0.08em" }}>DIGITAL GUARANTEE LETTER</label>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 900, margin: "0.25rem 0" }}>GL-DSWD-2026-04821</h3>
            <strong style={{ fontSize: "2rem", fontWeight: 900, display: "block", color: "#1e1b4b", margin: "0.25rem 0" }}>₱50,000</strong>
            <small style={{ color: "#4338ca", fontWeight: 800, display: "block", marginBottom: "1.25rem" }}>Valid until 20 August 2026</small>
            <button className="primary wide" onClick={() => go("guarantee")}>
              <QrCode size={20} /> View Guarantee Letter
            </button>
          </div>

          <div className="card" style={{ background: "#ffffff", border: "2.5px solid #1e1b4b", boxShadow: "0 4px 0 #1e1b4b" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6366f1", fontWeight: 900 }}>AGENCY EVALUATOR RULE</label>
                <h4 style={{ fontSize: "1rem", fontWeight: 900, margin: 0, color: "#1e1b4b" }}>{rule.serviceTitle} ({rule.agencyName})</h4>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {rule.blocks.map((b) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", fontWeight: 700, padding: "0.35rem 0.6rem", background: b.alreadyInWallet ? "#f0fdf4" : "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
                  <span style={{ color: "#1e1b4b" }}>{b.title}</span>
                  {b.alreadyInWallet ? (
                    <span style={{ color: "#166534", fontSize: "0.72rem", fontWeight: 800 }}>✓ Wallet Auto-Verified</span>
                  ) : (
                    <span style={{ color: "#d97706", fontSize: "0.72rem", fontWeight: 800 }}>Upload Required</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: "#dcfce7", color: "#14532d" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: "0 0 0.5rem 0", color: "#14532d" }}>Recent eMessage Notice</h3>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#166534", display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <CheckCircle2 size={18} /> Guarantee Letter GL-DSWD-2026-04821 ready for hospital presentation.
            </span>
          </div>
        </aside>
      </div>

      <div className="apis">
        <b style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e1b4b", marginBottom: "0.25rem" }}>
          <ShieldCheck size={20} color="#1e1b4b" /> eGovPH API Services:
        </b>
        {["eGov SSO", "eVerify", "eMessage", "eGovChain", "eGov AI"].map((x) => (
          <span key={x}>
            <Check size={14} /> {x}
          </span>
        ))}
      </div>
    </>
  );
}
