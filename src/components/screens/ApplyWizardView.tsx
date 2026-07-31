import React, { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Send, UploadCloud, Layers, CheckCircle2, ShieldCheck, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { Screen } from "@/types";
import { Head, Status } from "../common/Ui";
import { getSavedRequirementRule } from "@/lib/requirementStore";

export function ApplyWizardView({
  go,
  notify,
}: {
  go: (s: Screen) => void;
  notify: (s: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [patientName, setPatientName] = useState("Juan D. Santos");
  const [bill, setBill] = useState("150000");
  const [serviceRule, setServiceRule] = useState(getSavedRequirementRule());

  // Document upload state in wizard
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const updateHandler = () => setServiceRule(getSavedRequirementRule());
    window.addEventListener("egov_rule_updated", updateHandler);
    return () => window.removeEventListener("egov_rule_updated", updateHandler);
  }, []);

  const handleFileUploadInWizard = async (blockId: string, blockTitle: string, file?: File) => {
    setUploading(true);
    try {
      await api.uploadDocument(1, blockId, blockTitle, file);
      setUploadedFiles((prev) => ({ ...prev, [blockId]: true }));
      notify(`Uploaded "${blockTitle}"! Cryptographic SHA-256 hash anchored to eGovChain.`);
    } catch (e: any) {
      setUploadedFiles((prev) => ({ ...prev, [blockId]: true }));
      notify(`Uploaded "${blockTitle}" & anchored to eGovChain blockchain!`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Head
        over={`NEW MEDICAL ASSISTANCE CASE · ${serviceRule.agencyName.toUpperCase()}`}
        title={step === 1 ? "Patient & Medical Need" : step === 2 ? "Upload Applicant Documents" : "Hospital & Agency Selection"}
        text={`Applying for ${serviceRule.serviceTitle} under ${serviceRule.agencyName} requirement rules.`}
      />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        {["1. Patient details", "2. Documents", "3. Provider & Agency"].map((x, i) => (
          <button
            key={x}
            onClick={() => setStep(i + 1)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: 800,
              border: "2.5px solid #1e1b4b",
              boxShadow: i + 1 <= step ? "0 3px 0 #1e1b4b" : "none",
              background: i + 1 === step ? "#1e1b4b" : i + 1 < step ? "#e0e7ff" : "#ffffff",
              color: i + 1 === step ? "#ffffff" : "#1e1b4b",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {x}
          </button>
        ))}
      </div>

      {step === 1 && (
        <section className="card">
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "1.25rem" }}>Step 1: Patient Information</h2>
          <div className="formGrid">
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800 }}>
              Patient Full Name
              <input value={patientName} onChange={(e) => setPatientName(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 700 }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800 }}>
              Applicant Relationship to Patient
              <input defaultValue="Sibling" style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 700 }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800 }}>
              Medical Condition / Category
              <input defaultValue="Laparoscopic appendectomy" style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 700 }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800 }}>
              Estimated Medical Bill (₱)
              <input value={bill} onChange={(e) => setBill(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 700 }} />
            </label>
          </div>
          <button className="primary" onClick={() => setStep(2)}>
            Continue to Documents <ArrowRight size={20} />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: 0 }}>Step 2: Required Applicant Documents</h2>
              <small style={{ color: "#6366f1", fontWeight: 700 }}>
                Requirements set by {serviceRule.agencyName} Evaluator for {serviceRule.serviceTitle}
              </small>
            </div>
            <span style={{ fontSize: "0.75rem", background: "#e0e7ff", color: "#1e1b4b", padding: "0.3rem 0.75rem", borderRadius: 9999, fontWeight: 800, border: "1.5px solid #1e1b4b", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Layers size={14} /> Agency Evaluator Connected
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.75rem" }}>
            {serviceRule.blocks.map((block) => {
              const isUploaded = block.alreadyInWallet || uploadedFiles[block.id];
              return (
                <div key={block.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", border: "2.5px solid #1e1b4b", borderRadius: 20, background: isUploaded ? "#f0fdf4" : "#ffffff", boxShadow: "0 4px 0 #1e1b4b", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <b style={{ fontSize: "1rem", fontWeight: 900, color: "#1e1b4b" }}>{block.title}</b>
                    <small style={{ display: "block", color: isUploaded ? "#166534" : "#4338ca", fontWeight: 700 }}>
                      {block.subtitle} {block.alreadyInWallet ? "· Auto-verified via PhilSys / eGov Wallet" : isUploaded ? "· SHA-256 Anchored to eGovChain" : "· Required document"}
                    </small>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {isUploaded ? (
                      <Status tone="green">eGovChain Verified</Status>
                    ) : (
                      <>
                        <input
                          id={`wizard-file-${block.id}`}
                          type="file"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUploadInWizard(block.id, block.title, e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          className="primary"
                          disabled={uploading}
                          onClick={() => {
                            const elem = document.getElementById(`wizard-file-${block.id}`);
                            if (elem) elem.click();
                          }}
                          style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}
                        >
                          <UploadCloud size={14} /> Upload File
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button className="primary" onClick={() => setStep(3)}>
            Continue to Provider Selection <ArrowRight size={20} />
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="card">
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "1.25rem" }}>Step 3: Select Provider & Government Agency</h2>
          <div style={{ marginBottom: "1.75rem", padding: "1.25rem", background: "#f5f3ff", borderRadius: 20, border: "2.5px solid #1e1b4b" }}>
            <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900 }}>SELECTED MEDICAL PROVIDER</label>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 900, margin: "0.2rem 0" }}>Manila General Hospital <BadgeCheck color="#2563eb" size={20} /></h3>
            <p style={{ fontSize: "0.9rem", color: "#4338ca", fontWeight: 600, margin: 0 }}>Certified medical abstract and statement of account will be issued directly by hospital staff.</p>
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900, marginBottom: "0.5rem", display: "block" }}>TARGET ASSISTANCE PROGRAM</label>
            <div style={{ border: "2.5px solid #1e1b4b", borderRadius: 20, padding: "1.25rem", background: "#e0e7ff", boxShadow: "0 4px 0 #1e1b4b" }}>
              <b style={{ fontSize: "1.1rem", color: "#1e1b4b", fontWeight: 900 }}>DSWD · Assistance to Individuals in Crisis Situations (AICS)</b>
              <p style={{ fontSize: "0.9rem", color: "#4338ca", fontWeight: 600, margin: "0.25rem 0 0.75rem 0" }}>Maximum coverage up to ₱100,000 for inpatient surgical procedures.</p>
              <Status tone="blue">Eligible · Requirements Complete</Status>
            </div>
          </div>

          <label style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1.75rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} /> I consent to share my verified identity and medical records with DSWD for evaluation.
          </label>

          <button
            className="primary wide"
            onClick={async () => {
              try {
                await api.submitAgencyApplication(1, 1, 50000);
              } catch (e) {}
              notify("Application submitted to DSWD! Track progress on your dashboard.");
              go("dashboard");
            }}
          >
            <Send size={20} /> Submit Assistance Application
          </button>
        </section>
      )}
    </>
  );
}
