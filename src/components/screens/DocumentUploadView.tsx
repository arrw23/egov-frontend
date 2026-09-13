import React, { useCallback, useEffect, useState } from "react";
import { UploadCloud, FileText, Eye, Layers, ArrowRight, RefreshCw, AlertTriangle, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { CaseDocument, MedicalCase, Screen, Selection } from "@/types";
import { Head, Status } from "../common/Ui";
import { BlockchainProofModal } from "../common/BlockchainProofModal";
import { getSavedRequirementRule, SavedServiceRule } from "@/lib/requirementStore";

export function DocumentUploadView({
  go,
  notify,
  selection,
}: {
  go: (s: Screen) => void;
  notify: (s: string) => void;
  selection: Selection;
}) {
  const caseId = selection.caseId;
  const [activeCase, setActiveCase] = useState<MedicalCase | null>(null);
  const [rule, setRule] = useState<SavedServiceRule>(getSavedRequirementRule());
  const [uploadedMap, setUploadedMap] = useState<Record<string, CaseDocument>>({});
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDocForProof, setSelectedDocForProof] = useState<Partial<CaseDocument> | null>(null);

  const load = useCallback(async () => {
    if (!caseId) {
      setActiveCase(null);
      setUploadedMap({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.getCase(caseId);
      setActiveCase(res.case);
      const map: Record<string, CaseDocument> = {};
      (res.case.documents || []).forEach((d) => {
        map[d.document_type] = d;
      });
      setUploadedMap(map);
    } catch (err: any) {
      setActiveCase(null);
      setUploadedMap({});
      setError(err?.message || "The case documents could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    const syncRule = () => setRule(getSavedRequirementRule());
    syncRule();
    window.addEventListener("egov_rule_updated", syncRule);
    return () => window.removeEventListener("egov_rule_updated", syncRule);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleFileUploadForBlock = async (blockId: string, blockTitle: string, file?: File) => {
    if (!caseId) {
      notify("Select or create a case before uploading documents.");
      return;
    }
    if (!file) {
      notify("Choose a PDF, JPG or PNG file (max 10 MB) to upload.");
      return;
    }
    setUploadingBlockId(blockId);
    try {
      // The backend requires a real file and files the audit report itself, so
      // there is no fabricated local document and no extra eMessage/eReport call.
      const res = await api.uploadDocument(caseId, blockId, blockTitle, file);
      notify(`Uploaded "${blockTitle}". Hospital verification pending.`);
      setUploadedMap((prev) => ({ ...prev, [blockId]: res.document }));
    } catch (err: any) {
      notify(err?.message || `"${blockTitle}" could not be uploaded.`);
    } finally {
      setUploadingBlockId(null);
    }
  };

  return (
    <>
      <Head
        over={`DOCUMENT MANAGEMENT · ${rule.agencyName.toUpperCase()} RULES`}
        title="Required Case Documents"
        text={`Documents required for ${rule.serviceTitle} under ${rule.agencyName} requirement rules. Simply click upload for each required item.`}
        action={activeCase ? <Status tone="blue">Case {activeCase.case_number}</Status> : undefined}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="card" style={{ background: "#f5f3ff", border: "2.5px solid #1e1b4b", boxShadow: "0 6px 0 #1e1b4b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#6366f1", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Layers size={14} /> DYNAMIC REQUIREMENT RULE SET
              </span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 900, margin: "0.15rem 0", color: "#1e1b4b" }}>
                {rule.agencyName} — {rule.serviceTitle} Assistance Requirements
              </h3>
              <p style={{ color: "#4338ca", fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>
                Configure requirements in the Requirement Builder to change the document checklist below.
              </p>
            </div>
            <button className="outline" onClick={() => go("builder")}>
              View Requirement Builder
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" style={{ background: "#fef2f2", border: "2.5px solid #ef4444", borderRadius: 16, padding: "0.9rem 1.1rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <AlertTriangle size={18} color="#dc2626" /> {error}
          </div>
        )}

        {!caseId ? (
          <section className="card">
            <p style={{ fontWeight: 700, color: "#4338ca" }}>
              No case is selected, so documents cannot be uploaded. Start an application or open an existing case first.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button className="primary" onClick={() => go("apply")}>
                Start an application
              </button>
              <button className="outline" onClick={() => go("dashboard")}>
                Open my case
              </button>
            </div>
          </section>
        ) : (
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1e1b4b", margin: 0 }}>
                Required Document Blocks ({rule.blocks.length})
              </h2>
              <button className="outline" onClick={load} disabled={loading}>
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh documents
              </button>
            </div>

            {loading ? (
              <p style={{ color: "#4338ca", fontWeight: 700, display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <RefreshCw size={16} className="animate-spin" /> Loading case documents...
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {rule.blocks.map((block) => {
                  const uploadedDoc = uploadedMap[block.id];
                  const isWalletVerified = block.alreadyInWallet;
                  const isHospitalCertified = uploadedDoc?.status === "certified" || uploadedDoc?.status === "verified";
                  const isHashedOnly =
                    !!uploadedDoc && ["hashed", "pending_hospital_verification", "uploaded", "processing"].includes(uploadedDoc.status);
                  const isUploaded = isWalletVerified || !!uploadedDoc;
                  const isUploadingThis = uploadingBlockId === block.id;

                  const docHash = uploadedDoc?.sha256_hash || null;
                  const refNum = uploadedDoc?.verification_reference || null;

                  return (
                    <div
                      key={block.id}
                      style={{
                        padding: "1.2rem 1.35rem",
                        border: "2.5px solid #1e1b4b",
                        borderRadius: 22,
                        background: isHospitalCertified || isWalletVerified ? "#f0fdf4" : isHashedOnly ? "#eff6ff" : "#ffffff",
                        boxShadow: "0 4px 0 #1e1b4b",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.85rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                          <div
                            style={{
                              padding: "0.6rem",
                              background: isHospitalCertified || isWalletVerified ? "#dcfce7" : isHashedOnly ? "#dbeafe" : "#e0e7ff",
                              borderRadius: 14,
                              border: `2px solid ${isHospitalCertified || isWalletVerified ? "#166534" : isHashedOnly ? "#1d4ed8" : "#3730a3"}`,
                            }}
                          >
                            <FileText size={22} color={isHospitalCertified || isWalletVerified ? "#15803d" : isHashedOnly ? "#1e40af" : "#3730a3"} />
                          </div>
                          <div>
                            <b style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0f172a" }}>{block.title}</b>
                            <span style={{ display: "block", fontSize: "0.825rem", color: isHospitalCertified || isWalletVerified ? "#166534" : isHashedOnly ? "#1e40af" : "#4338ca", fontWeight: 700, marginTop: "0.15rem" }}>
                              {block.subtitle} ·{" "}
                              {isWalletVerified
                                ? "Auto-Verified via PhilSys / eGov Wallet"
                                : isHospitalCertified
                                ? "Verified & Certified by Hospital Staff"
                                : isHashedOnly
                                ? "Uploaded (Pending Hospital Verification)"
                                : "Required — Action Needed"}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {isUploaded ? (
                            <Status tone={isWalletVerified || isHospitalCertified ? "green" : "blue"}>
                              {isWalletVerified ? "Wallet Auto-Verified" : isHospitalCertified ? "Hospital Verified" : "Pending Hospital Verification"}
                            </Status>
                          ) : (
                            <>
                              <input
                                id={`block-file-${block.id}`}
                                type="file"
                                style={{ display: "none" }}
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleFileUploadForBlock(block.id, block.title, e.target.files[0]);
                                  }
                                  e.target.value = "";
                                }}
                              />
                              <button
                                className="primary"
                                disabled={isUploadingThis}
                                onClick={() => {
                                  const elem = document.getElementById(`block-file-${block.id}`);
                                  if (elem) elem.click();
                                }}
                                style={{ padding: "0.55rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                              >
                                <UploadCloud size={16} />
                                {isUploadingThis ? "Uploading..." : "Upload Document"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

              {/* Hash & provenance row — only for documents that really exist */}
                      {uploadedDoc && (
                        <div
                          style={{
                            background: "#ffffff",
                            padding: "0.65rem 0.85rem",
                            borderRadius: 14,
                            border: `1.5px solid ${isHospitalCertified ? "#bbf7d0" : "#bfdbfe"}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                            fontSize: "0.775rem",
                          }}
                        >
                          <div>
                            <span style={{ color: isHospitalCertified ? "#166534" : "#1e40af", fontWeight: 700 }}>Ref: </span>
                            <b style={{ color: "#1e1b4b", marginRight: "0.75rem" }}>{refNum || "—"}</b>
                            <span style={{ color: "#64748b", fontWeight: 700 }}>SHA-256 Digest: </span>
                            <code style={{ color: isHospitalCertified ? "#15803d" : "#2563eb", fontWeight: 900, fontFamily: "monospace" }}>
                              {docHash || "—"}
                            </code>
                          </div>

                          <button
                            onClick={() => setSelectedDocForProof(uploadedDoc)}
                            style={{
                              padding: "0.35rem 0.75rem",
                              background: "#15803d",
                              color: "#ffffff",
                              border: "1.5px solid #14532d",
                              borderRadius: 10,
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <Eye size={13} /> View integrity receipt
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: "1.75rem", display: "flex", justifyContent: "flex-end" }}>
              <button className="primary" onClick={() => go("submit")}>
                Proceed to Provider & Agency Submission <ArrowRight size={20} />
              </button>
            </div>
          </section>
        )}
      </div>

      {selectedDocForProof && <BlockchainProofModal doc={selectedDocForProof} onClose={() => setSelectedDocForProof(null)} />}
    </>
  );
}

/**
 * Shows the case's real provider and the status of the hospital record
 * request, and lets the applicant send that request.
 */
export function SubmitSelectionView({
  go,
  notify,
  selection,
}: {
  go: (s: Screen) => void;
  notify: (s: string) => void;
  selection: Selection;
}) {
  const caseId = selection.caseId;
  const [activeCase, setActiveCase] = useState<MedicalCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    if (!caseId) {
      setActiveCase(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.getCase(caseId);
      setActiveCase(res.case);
    } catch (err: any) {
      setActiveCase(null);
      setError(err?.message || "The case could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const requests = activeCase?.hospital_requests || [];
  const latestRequest = requests.length > 0 ? requests[requests.length - 1] : null;
  const applications = activeCase?.agency_applications || [];
  const latestApplication = applications.length > 0 ? applications[applications.length - 1] : null;

  const handleRequestRecords = async () => {
    if (!caseId) return;
    setRequesting(true);
    setError("");
    try {
      await api.requestHospitalDocuments(caseId);
      notify("Hospital record request sent.");
      await load();
    } catch (err: any) {
      setError(err?.message || "The hospital record request could not be sent.");
    } finally {
      setRequesting(false);
    }
  };

  if (!caseId) {
    return (
      <>
        <Head over="CASE SUBMISSION" title="Provider & Agency Selection" text="Select or create a case before requesting records." />
        <section className="card">
          <p style={{ fontWeight: 700, color: "#4338ca" }}>No case is selected.</p>
          <button className="primary" onClick={() => go("apply")}>
            Start an application
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <Head
        over="CASE SUBMISSION"
        title="Provider & Agency Selection"
        text="Direct provider certification reduces document alteration risks."
        action={activeCase ? <Status tone="blue">Case {activeCase.case_number}</Status> : undefined}
      />

      {error && (
        <div role="alert" style={{ background: "#fef2f2", border: "2.5px solid #ef4444", borderRadius: 16, padding: "0.9rem 1.1rem", marginBottom: "1.25rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <AlertTriangle size={18} color="#dc2626" /> {error}
        </div>
      )}

      <section className="card">
        {loading ? (
          <p style={{ color: "#4338ca", fontWeight: 700, display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <RefreshCw size={16} className="animate-spin" /> Loading case...
          </p>
        ) : !activeCase ? (
          <p style={{ fontWeight: 700, color: "#4338ca" }}>This case could not be loaded.</p>
        ) : (
          <>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.4rem", margin: 0 }}>
              <Building2 size={22} /> Selected Provider: {activeCase.provider?.name || "Not set"}
            </h2>
            <p style={{ color: "#4338ca", fontWeight: 600 }}>
              {activeCase.patient_name} · {activeCase.condition_category} · Case {activeCase.case_number}
            </p>

            <div style={{ margin: "1.25rem 0", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.9rem", fontWeight: 700 }}>
              <div>
                <b>Hospital record request:</b>{" "}
                {latestRequest ? (
                  <>
                    <Status tone={latestRequest.status === "certified" ? "green" : "orange"}>{latestRequest.status}</Status>{" "}
                    <span style={{ color: "#4338ca" }}>
                      ({(latestRequest.requested_document_types || []).map((t) => t.replace(/_/g, " ")).join(", ") || "no types listed"})
                    </span>
                  </>
                ) : (
                  <span style={{ color: "#92400e" }}>Not requested yet.</span>
                )}
              </div>
              <div>
                <b>Agency application:</b>{" "}
                {latestApplication ? (
                  <>
                    <Status tone="blue">{latestApplication.status?.replace(/_/g, " ") || "—"}</Status>{" "}
                    <span style={{ color: "#4338ca" }}>
                      ₱{Number(latestApplication.requested_amount || 0).toLocaleString("en-PH")} requested
                    </span>
                  </>
                ) : (
                  <span style={{ color: "#92400e" }}>No application submitted for this case yet.</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button className="primary" disabled={requesting} onClick={handleRequestRecords}>
                <RefreshCw size={18} className={requesting ? "animate-spin" : ""} />{" "}
                {requesting ? "Requesting..." : latestRequest ? "Re-request hospital records" : "Request hospital records"}
              </button>
              <button className="outline" onClick={() => go("dashboard")}>
                Back to Dashboard
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
