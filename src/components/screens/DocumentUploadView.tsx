import React from "react";
import { Screen } from "@/types";
import { Head, Status } from "../common/Ui";

export function DocumentUploadView({
  go,
  notify,
}: {
  go: (s: Screen) => void;
  notify: (s: string) => void;
}) {
  return (
    <>
      <Head over="DOCUMENT MANAGEMENT" title="Case Documents" text="Upload applicant files. System generates cryptographic SHA-256 hashes automatically." />
      <section className="card">
        <h2 style={{ fontSize: "1.25rem", fontWeight: 900, marginBottom: "1.25rem" }}>Uploaded Files</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            ["PhilSys Digital ID", "EVR-8F2A-19C0-2026", "verified"],
            ["Barangay Certificate of Indigency", "BRGY-MANILA-2026-99", "verified"],
            ["Patient Authorization Letter", "AUTH-PATIENT-2026", "verified"],
          ].map(([title, ref, st]) => (
            <div key={title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.1rem 1.25rem", border: "2.5px solid #1e1b4b", borderRadius: 20, background: "#ffffff", boxShadow: "0 4px 0 #1e1b4b" }}>
              <div>
                <b style={{ fontSize: "1rem", fontWeight: 900 }}>{title}</b>
                <small style={{ display: "block", color: "#4338ca", fontWeight: 600 }}>Ref: {ref} · eGov AI Classified</small>
              </div>
              <Status tone="green">{st}</Status>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function SubmitSelectionView({
  go,
  notify,
}: {
  go: (s: Screen) => void;
  notify: (s: string) => void;
}) {
  return (
    <>
      <Head over="CASE SUBMISSION" title="Provider & Agency" text="Direct provider certification reduces document alteration risks." />
      <section className="card">
        <h2 style={{ fontSize: "1.35rem", fontWeight: 900 }}>Selected Provider: Manila General Hospital</h2>
        <p style={{ color: "#4338ca", fontWeight: 600 }}>Requested records: Medical Abstract, Statement of Account, Physician Order.</p>
        <button className="primary" onClick={() => go("dashboard")}>Back to Dashboard</button>
      </section>
    </>
  );
}
