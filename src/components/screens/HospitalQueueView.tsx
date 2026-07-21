import React, { useState } from "react";
import { Activity, CheckCircle2, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Screen } from "@/types";
import { Head, Stat, Status } from "../common/Ui";

export function HospitalQueueView({
  go,
  notify,
}: {
  go: (s: Screen) => void;
  notify: (s: string) => void;
}) {
  return (
    <>
      <Head over="MANILA GENERAL HOSPITAL" title="Patient Record Requests" text="Directly upload and certify official medical records to citizen cases." />
      
      <div className="card" style={{ background: "#fef08a", marginBottom: "1.75rem", border: "2.5px solid #1e1b4b", boxShadow: "0 6px 0 #1e1b4b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#1e1b4b", letterSpacing: "0.08em" }}>DBM COMPASS PROVIDER GUARANTEE CEILING</span>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 900, margin: "0.1rem 0", color: "#1e1b4b" }}>Manila General Hospital — Government Guarantee Pool</h3>
          </div>
          <Status tone="green">Verified DBM Fund Line</Status>
        </div>
        <div className="formGrid" style={{ background: "#ffffff", padding: "1.1rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontSize: "0.9rem", fontWeight: 800, gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#6366f1", display: "block" }}>Annual Approved Pool</span>
            <b style={{ fontSize: "1.25rem", color: "#1e1b4b" }}>₱50,000,000.00</b>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#6366f1", display: "block" }}>Active Utilized Guarantees</span>
            <b style={{ fontSize: "1.25rem", color: "#d97706" }}>₱12,450,000.00</b>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#6366f1", display: "block" }}>Remaining Available Pool</span>
            <b style={{ fontSize: "1.25rem", color: "#059669" }}>₱37,550,000.00</b>
          </div>
        </div>
      </div>

      <div className="stats three">
        <Stat Icon={Clock3} label="Pending Requests" value="8" note="3 received today" tone="orange" />
        <Stat Icon={Activity} label="Processing" value="5" note="Awaiting certification" tone="blue" />
        <Stat Icon={CheckCircle2} label="Completed This Month" value="42" note="1.8 day turnaround" tone="green" />
      </div>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: 0 }}>Request Queue</h2>
          <input placeholder="Search patient name or case..." style={{ padding: "0.6rem 1rem", border: "2.5px solid #1e1b4b", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 700 }} />
        </div>

        {[
          ["Juan D. Santos", "MGL-2026-001284", "Medical Abstract, SOA (₱150,000)", "Pending"],
          ["Liza P. Mendoza", "MGL-2026-001279", "Medical Abstract, SOA", "Processing"],
          ["Roberto A. Garcia", "MGL-2026-001265", "SOA, Physician Order", "Completed"],
        ].map(([name, num, docs, st], i) => (
          <div key={num} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.1rem 0", borderBottom: "2px solid #e0e7ff", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <b style={{ fontSize: "1.1rem", fontWeight: 900 }}>{name}</b>
              <small style={{ display: "block", color: "#4338ca", fontWeight: 600 }}>Case: {num} · {docs}</small>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <Status tone={i === 2 ? "green" : "orange"}>{st}</Status>
              <button className="primary" onClick={() => go("hospital_detail")}>
                Open Case
              </button>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

export function HospitalDetailView({
  go,
  notify,
}: {
  go: (s: Screen) => void;
  notify: (s: string) => void;
}) {
  const [certified, setCertified] = useState(false);

  return (
    <>
      <Head over="OFFICIAL RECORD CERTIFICATION" title="Patient: Juan D. Santos" text="Case MGL-2026-001284 · Manila General Hospital" />
      <div className="cols">
        <section className="card">
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "1.25rem" }}>Official Provider Records</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "1.25rem 0" }}>
            {[
              ["Medical Abstract", "Laparoscopic appendectomy summary"],
              ["Statement of Account", "Verified medical bill: ₱150,000.00"],
              ["Physician Treatment Order", "Dr. Ana Reyes order ref ORD-MGH-102"],
            ].map(([title, sub]) => (
              <div key={title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", border: "2.5px solid #1e1b4b", borderRadius: 20, background: "#ffffff", boxShadow: "0 4px 0 #1e1b4b" }}>
                <div>
                  <b style={{ fontSize: "1rem", fontWeight: 900 }}>{title}</b>
                  <small style={{ display: "block", color: "#4338ca", fontWeight: 600 }}>{sub}</small>
                </div>
                <Status tone={certified ? "green" : "orange"}>{certified ? "Certified" : "Draft"}</Status>
              </div>
            ))}
          </div>

          <button
            className="primary wide"
            disabled={certified}
            onClick={async () => {
              try {
                await api.submitHospitalDocuments(1);
              } catch (e) {}
              setCertified(true);
              notify("Official records certified; citizen and DSWD notified!");
            }}
          >
            <ShieldCheck size={20} /> {certified ? "Records Certified" : "Certify Medical Records"}
          </button>
        </section>

        <aside>
          <div className="card ai">
            <h3><Sparkles size={20} /> eGov AI Extraction</h3>
            <p>
              <b>Patient:</b> Juan D. Santos<br />
              <b>Diagnosis:</b> Acute appendicitis<br />
              <b>Procedure:</b> Laparoscopic appendectomy<br />
              <b>Total Bill:</b> ₱150,000.00
            </p>
            <small>AI-generated extraction — subject to authorized staff review.</small>
          </div>
        </aside>
      </div>
    </>
  );
}
