import React, { useCallback, useEffect, useState } from "react";
import { ArrowRight, AlertTriangle, Send, UploadCloud, Layers, RefreshCw, Check, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { AgencyProgram, Organization, Screen, Selection } from "@/types";
import { Head, Status } from "../common/Ui";
import { getSavedRequirementRule, SavedServiceRule } from "@/lib/requirementStore";

const money = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

/** Inline error banner used instead of swallowing failures. */
function ErrorNote({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        background: "#fef2f2",
        border: "2px solid #ef4444",
        borderRadius: 14,
        padding: "0.7rem 0.95rem",
        marginBottom: "1rem",
        color: "#991b1b",
        fontWeight: 800,
        fontSize: "0.85rem",
        display: "flex",
        gap: "0.45rem",
        alignItems: "flex-start",
      }}
    >
      <AlertTriangle size={17} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} /> <span>{message}</span>
    </div>
  );
}

export function ApplyWizardView({
  go,
  notify,
  select,
}: {
  go: (s: Screen) => void;
  notify: (s: string) => void;
  select: (patch: Partial<Selection>) => void;
}) {
  const [step, setStep] = useState(1);
  const [serviceRule, setServiceRule] = useState<SavedServiceRule>(getSavedRequirementRule());

  // Step 1 — every field is controlled.
  const [patientName, setPatientName] = useState("");
  const [relationship, setRelationship] = useState("Sibling");
  const [condition, setCondition] = useState("");
  const [bill, setBill] = useState("");
  const [providerId, setProviderId] = useState<string>("");
  const [step1Error, setStep1Error] = useState("");
  const [creatingCase, setCreatingCase] = useState(false);

  // The real case created in step 1 — uploads and the application target it.
  const [caseId, setCaseId] = useState<number | null>(null);

  // Step 2 — uploads
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [step2Error, setStep2Error] = useState("");

  // Step 3 — providers, programs, consent
  const [providers, setProviders] = useState<Organization[]>([]);
  const [programs, setPrograms] = useState<AgencyProgram[]>([]);
  const [programId, setProgramId] = useState<string>("");
  const [requested, setRequested] = useState("");
  const [consent, setConsent] = useState(false);
  const [loadingStep3, setLoadingStep3] = useState(false);
  const [step3Error, setStep3Error] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const updateHandler = () => setServiceRule(getSavedRequirementRule());
    window.addEventListener("egov_rule_updated", updateHandler);
    return () => window.removeEventListener("egov_rule_updated", updateHandler);
  }, []);

  const loadStep3Options = useCallback(async () => {
    setLoadingStep3(true);
    setStep3Error("");
    try {
      const [provRes, progRes] = await Promise.all([api.getProviders(), api.getAgencyPrograms()]);
      setProviders(provRes.providers || []);
      setPrograms(progRes.programs || []);
      setProviderId((prev) => prev || String(provRes.providers?.[0]?.id ?? ""));
      setProgramId((prev) => prev || String(progRes.programs?.[0]?.id ?? ""));
    } catch (err: any) {
      setProviders([]);
      setPrograms([]);
      setStep3Error(err?.message || "The provider and program lists could not be loaded.");
    } finally {
      setLoadingStep3(false);
    }
  }, []);

  useEffect(() => {
    if (step === 3) loadStep3Options();
  }, [step, loadStep3Options]);

  const selectedProgram = programs.find((p) => String(p.id) === programId) || null;
  const selectedProvider = providers.find((p) => String(p.id) === providerId) || null;
  const requestedValue = Number(requested.replace(/[₱,\s]/g, ""));
  const billValue = Number(bill.replace(/[₱,\s]/g, ""));

  const handleCreateCase = async () => {
    setStep1Error("");
    if (!patientName.trim()) return setStep1Error("Enter the patient's full name.");
    if (!relationship.trim()) return setStep1Error("Enter your relationship to the patient.");
    if (!condition.trim()) return setStep1Error("Describe the medical condition or category.");
    if (!Number.isFinite(billValue) || billValue <= 0) return setStep1Error("Enter the estimated medical bill as a number greater than zero.");
    if (!providerId) return setStep1Error("Select the hospital provider for this case.");

    setCreatingCase(true);
    try {
      // The case is created for real here and its id is carried forward.
      const res = await api.createCase({
        patient_name: patientName.trim(),
        relationship: relationship.trim(),
        provider_id: Number(providerId),
        condition_category: condition.trim(),
        estimated_bill: billValue,
      });
      setCaseId(res.case.id);
      select({ caseId: res.case.id });
      setRequested(String(billValue));
      notify(`Case ${res.case.case_number} created.`);
      setStep(2);
    } catch (err: any) {
      setStep1Error(err?.message || "The case could not be created.");
    } finally {
      setCreatingCase(false);
    }
  };

  const handleFileUploadInWizard = async (blockId: string, blockTitle: string, file?: File) => {
    setStep2Error("");
    if (!caseId) {
      setStep2Error("Create the case in step 1 before uploading documents.");
      return;
    }
    if (!file) {
      setStep2Error("Select a PDF, JPG or PNG file (max 10 MB) to upload.");
      return;
    }
    setUploading(true);
    try {
      await api.uploadDocument(caseId, blockId, blockTitle, file);
      setUploadedFiles((prev) => ({ ...prev, [blockId]: true }));
      notify(`Uploaded "${blockTitle}".`);
    } catch (err: any) {
      setStep2Error(err?.message || `"${blockTitle}" could not be uploaded.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitApplication = async () => {
    setStep3Error("");
    if (!caseId) return setStep3Error("Create the case in step 1 first.");
    if (!programId) return setStep3Error("Select the assistance program to apply for.");
    if (!Number.isFinite(requestedValue) || requestedValue <= 0) return setStep3Error("Enter the amount you are requesting.");
    if (!consent) return setStep3Error("Consent to share your records is required before submitting.");

    setSubmitting(true);
    try {
      // Ask the hospital for the certified records, then file the application.
      await api.requestHospitalDocuments(caseId);
      const res = await api.submitAgencyApplication(caseId, Number(programId), requestedValue, consent);
      select({ applicationId: res.application.id, caseId });
      notify("Application submitted. Track its progress on your dashboard.");
      go("dashboard");
    } catch (err: any) {
      setStep3Error(err?.message || "The application could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head
        over={`NEW MEDICAL ASSISTANCE CASE · ${serviceRule.agencyName.toUpperCase()}`}
        title={step === 1 ? "Patient & Medical Need" : step === 2 ? "Upload Applicant Documents" : "Hospital & Agency Selection"}
        text={`Applying for ${serviceRule.serviceTitle} under ${serviceRule.agencyName} requirement rules.`}
        action={caseId ? <Status tone="blue">Case #{caseId}</Status> : undefined}
      />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        {["1. Patient details", "2. Documents", "3. Provider & Agency"].map((x, i) => {
          const target = i + 1;
          const reachable = target === 1 || (target === 2 && !!caseId) || (target === 3 && !!caseId);
          return (
            <button
              key={x}
              disabled={!reachable}
              onClick={() => reachable && setStep(target)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                fontWeight: 800,
                border: "2.5px solid #1e1b4b",
                boxShadow: target <= step ? "0 3px 0 #1e1b4b" : "none",
                background: target === step ? "#1e1b4b" : target < step ? "#e0e7ff" : "#ffffff",
                color: target === step ? "#ffffff" : reachable ? "#1e1b4b" : "#94a3b8",
                cursor: reachable ? "pointer" : "not-allowed",
                transition: "all 0.15s ease",
              }}
            >
              {x}
            </button>
          );
        })}
      </div>

      {step === 1 && (
        <section className="card">
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "1.25rem" }}>Step 1: Patient Information</h2>
          <ErrorNote message={step1Error} />
          <div className="formGrid">
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800 }}>
              Patient Full Name
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Family name, first name"
                style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 700 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800 }}>
              Applicant Relationship to Patient
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 700, background: "#ffffff" }}
              >
                {["Self", "Sibling", "Parent", "Child", "Spouse", "Grandparent", "Relative", "Guardian"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800 }}>
              Medical Condition / Category
              <input
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. Acute appendicitis"
                style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 700 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800 }}>
              Estimated Medical Bill (₱)
              <input
                value={bill}
                onChange={(e) => setBill(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 700 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800 }}>
              Hospital Provider
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 700, background: "#ffffff" }}
              >
                <option value="">Select a hospital...</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {providers.length === 0 && !loadingStep3 && (
                <button className="outline" onClick={loadStep3Options} style={{ alignSelf: "flex-start", fontSize: "0.78rem", padding: "0.3rem 0.7rem" }}>
                  <RefreshCw size={13} /> Load hospitals
                </button>
              )}
            </label>
          </div>
          <button className="primary" disabled={creatingCase} onClick={handleCreateCase}>
            {creatingCase ? "Creating case..." : "Continue to Documents"} <ArrowRight size={20} />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: 0 }}>Step 2: Required Applicant Documents</h2>
              <small style={{ color: "#6366f1", fontWeight: 700 }}>
                Requirements set by {serviceRule.agencyName} Evaluator for {serviceRule.serviceTitle} · uploading to case #{caseId}
              </small>
            </div>
            <span style={{ fontSize: "0.75rem", background: "#e0e7ff", color: "#1e1b4b", padding: "0.3rem 0.75rem", borderRadius: 9999, fontWeight: 800, border: "1.5px solid #1e1b4b", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Layers size={14} /> Agency Evaluator Connected
            </span>
          </div>

          <ErrorNote message={step2Error} />

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.75rem" }}>
            {serviceRule.blocks.map((block) => {
              const isUploaded = block.alreadyInWallet || uploadedFiles[block.id];
              const isWallet = block.alreadyInWallet;
              return (
                <div key={block.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", border: "2.5px solid #1e1b4b", borderRadius: 20, background: isWallet ? "#f0fdf4" : isUploaded ? "#eff6ff" : "#ffffff", boxShadow: "0 4px 0 #1e1b4b", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <b style={{ fontSize: "1rem", fontWeight: 900, color: "#1e1b4b" }}>{block.title}</b>
                    <small style={{ display: "block", color: isWallet ? "#166534" : isUploaded ? "#1e40af" : "#4338ca", fontWeight: 700 }}>
                      {block.subtitle} {isWallet ? "· Auto-verified via PhilSys / eGov Wallet" : isUploaded ? "· Uploaded (Pending Hospital Verification)" : "· Required document"}
                    </small>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {isUploaded ? (
                      <Status tone={isWallet ? "green" : "blue"}>
                        {isWallet ? "Wallet Auto-Verified" : "Uploaded (Awaiting Hospital Verification)"}
                      </Status>
                    ) : (
                      <>
                        <input
                          id={`wizard-file-${block.id}`}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUploadInWizard(block.id, block.title, e.target.files[0]);
                            }
                            e.target.value = "";
                          }}
                        />
                        <button
                          className="primary"
                          disabled={uploading || !caseId}
                          onClick={() => {
                            const elem = document.getElementById(`wizard-file-${block.id}`);
                            if (elem) elem.click();
                          }}
                          style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}
                        >
                          <UploadCloud size={14} /> {uploading ? "Uploading..." : "Upload File"}
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

          <ErrorNote message={step3Error} />

          {loadingStep3 ? (
            <p style={{ color: "#4338ca", fontWeight: 700, display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <RefreshCw size={16} className="animate-spin" /> Loading providers and programs...
            </p>
          ) : (
            <>
              <div style={{ marginBottom: "1.75rem", padding: "1.25rem", background: "#f5f3ff", borderRadius: 20, border: "2.5px solid #1e1b4b" }}>
                <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900 }}>MEDICAL PROVIDER</label>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 900, margin: "0.2rem 0" }}>
                  {selectedProvider?.name || "No provider selected"}{" "}
                </h3>
                <label style={{ display: "block", marginTop: "0.4rem" }}>
                  <select
                    value={providerId}
                    onChange={(e) => setProviderId(e.target.value)}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 12, border: "2px solid #1e1b4b", fontWeight: 700, background: "#ffffff" }}
                  >
                    <option value="">Select a hospital...</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p style={{ fontSize: "0.9rem", color: "#4338ca", fontWeight: 600, margin: "0.5rem 0 0 0" }}>
                  Certified medical records will be requested from this hospital when you submit.
                </p>
              </div>

              <div style={{ marginBottom: "1.75rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900, marginBottom: "0.5rem", display: "block" }}>TARGET ASSISTANCE PROGRAM</label>
                {programs.length === 0 ? (
                  <p style={{ fontWeight: 700, color: "#4338ca" }}>No assistance programs are published yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {programs.map((program) => {
                      const active = String(program.id) === programId;
                      return (
                        <button
                          key={program.id}
                          type="button"
                          onClick={() => setProgramId(String(program.id))}
                          style={{
                            textAlign: "left",
                            border: "2.5px solid #1e1b4b",
                            borderRadius: 20,
                            padding: "1.1rem 1.25rem",
                            background: active ? "#e0e7ff" : "#ffffff",
                            boxShadow: active ? "0 4px 0 #1e1b4b" : "none",
                            cursor: "pointer",
                          }}
                        >
                          <b style={{ fontSize: "1.05rem", color: "#1e1b4b", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            {active && <Check size={18} color="#166534" />} {program.agency?.name ? `${program.agency.name} · ` : ""}
                            {program.name}
                          </b>
                          <p style={{ fontSize: "0.9rem", color: "#4338ca", fontWeight: 600, margin: "0.25rem 0 0 0" }}>
                            {program.criteria_summary || program.description || "No criteria summary provided."}
                          </p>
                          <small style={{ color: "#6366f1", fontWeight: 800 }}>
                            Maximum assistance: {money(Number(program.max_assistance_amount || 0))}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800, marginBottom: "1.25rem", maxWidth: 320 }}>
                Requested Assistance Amount (₱)
                <input
                  value={requested}
                  onChange={(e) => setRequested(e.target.value)}
                  inputMode="decimal"
                  style={{ padding: "0.75rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 800 }}
                />
                {selectedProgram && requestedValue > Number(selectedProgram.max_assistance_amount || 0) && (
                  <small style={{ color: "#b45309", fontWeight: 800 }}>
                    Above this program&apos;s maximum of {money(Number(selectedProgram.max_assistance_amount || 0))}; the evaluator may approve less.
                  </small>
                )}
              </label>

              <label style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1.75rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />{" "}
                I consent to share my verified identity and medical records with the selected agency for evaluation.
              </label>

              <button
                className="primary wide"
                disabled={submitting || !consent || !programId || !requestedValue}
                onClick={handleSubmitApplication}
              >
                <Send size={20} /> {submitting ? "Submitting..." : "Submit Assistance Application"}
              </button>
              {!consent && (
                <small style={{ display: "block", marginTop: "0.6rem", color: "#92400e", fontWeight: 800 }}>
                  Consent is required by the backend before an application can be submitted.
                </small>
              )}
            </>
          )}
        </section>
      )}

      {!caseId && step > 1 && (
        <p style={{ marginTop: "1rem", fontWeight: 800, color: "#92400e", display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <FileText size={16} /> No case has been created yet.
        </p>
      )}
    </>
  );
}
