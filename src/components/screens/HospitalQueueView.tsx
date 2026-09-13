import React, { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle2, Clock3, ShieldCheck, Sparkles, Eye, Plus, FileText, RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { CaseDocument, HospitalRequest, Screen, Selection } from "@/types";
import { Head, Stat, Status } from "../common/Ui";
import { BlockchainProofModal } from "../common/BlockchainProofModal";

const money = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

/** Document types the backend actually requests/accepts. */
const DOC_TYPES: [string, string][] = [
  ["statement_of_account", "Statement of Account (SOA)"],
  ["medical_abstract", "Official Medical Abstract"],
  ["treatment_order", "Treatment / Physician Order"],
];

const docTypeLabel = (type: string) =>
  DOC_TYPES.find(([value]) => value === type)?.[1] || type.replace(/_/g, " ");

const statusTone = (status: string) =>
  status === "certified" ? "green" : status === "pending" ? "orange" : "blue";

export function HospitalQueueView({
  go,
  select,
}: {
  go: (s: Screen) => void;
  select: (patch: Partial<Selection>) => void;
}) {
  const [requests, setRequests] = useState<HospitalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getHospitalRequests();
      setRequests(res.requests || []);
    } catch (err: any) {
      setRequests([]);
      setError(err?.message || "The hospital request queue could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = requests.filter((r) => r.status === "pending");
  const processing = requests.filter((r) => r.status === "processing");
  const certified = requests.filter((r) => r.status === "certified");

  const filtered = requests.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (r.medical_case?.patient_name || "").toLowerCase().includes(q) ||
      (r.medical_case?.case_number || "").toLowerCase().includes(q)
    );
  });

  const openCase = (req: HospitalRequest) => {
    select({ hospitalRequestId: req.id, caseId: req.medical_case_id });
    go("hospital_detail");
  };

  return (
    <>
      <Head
        over="HOSPITAL PORTAL"
        title="Patient Record Requests"
        text="Certify the official medical records citizens requested for their case, straight from the hospital queue."
        action={
          <button className="outline" onClick={load} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh queue
          </button>
        }
      />

      {error && (
        <div role="alert" style={{ background: "#fef2f2", border: "2.5px solid #ef4444", borderRadius: 16, padding: "0.9rem 1.1rem", marginBottom: "1.5rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <AlertTriangle size={18} color="#dc2626" /> {error}
        </div>
      )}

      <div className="stats three">
        <Stat Icon={Clock3} label="Pending Requests" value={String(pending.length)} note="Awaiting hospital certification" tone="orange" />
        <Stat Icon={Activity} label="Processing" value={String(processing.length)} note="Partially certified" tone="blue" />
        <Stat Icon={CheckCircle2} label="Certified" value={String(certified.length)} note="All requested records certified" tone="green" />
      </div>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: 0 }}>Request Queue</h2>
          <input
            placeholder="Search patient name or case..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: "0.6rem 1rem", border: "2.5px solid #1e1b4b", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 700 }}
          />
        </div>

        {loading ? (
          <p style={{ color: "#4338ca", fontWeight: 700, display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <RefreshCw size={16} className="animate-spin" /> Loading requests...
          </p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#4338ca", fontWeight: 700 }}>
            {requests.length === 0
              ? "No document requests for this hospital yet."
              : "No requests match that search."}
          </p>
        ) : (
          filtered.map((req) => {
            const kase = req.medical_case;
            const docs = (req.requested_document_types || []).map(docTypeLabel).join(", ") || "No document types listed";
            return (
              <div
                key={req.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.1rem 0", borderBottom: "2px solid #e0e7ff", flexWrap: "wrap", gap: "1rem" }}
              >
                <div>
                  <b style={{ fontSize: "1.1rem", fontWeight: 900 }}>{kase?.patient_name || "Patient name unavailable"}</b>
                  <small style={{ display: "block", color: "#4338ca", fontWeight: 600 }}>
                    Case: {kase?.case_number || "—"} · {docs}
                  </small>
                  <small style={{ display: "block", color: "#6366f1", fontWeight: 700 }}>
                    {kase?.relationship ? `Relationship: ${kase.relationship} · ` : ""}
                    Bill: {kase ? money(kase.verified_bill) : "—"}
                  </small>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <Status tone={statusTone(req.status)}>{req.status}</Status>
                  <button className="primary" onClick={() => openCase(req)}>
                    Open Case
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </>
  );
}

export function HospitalDetailView({
  go,
  notify,
  selection,
}: {
  go: (s: Screen) => void;
  notify: (s: string) => void;
  selection: Selection;
}) {
  const requestId = selection.hospitalRequestId;

  const [request, setRequest] = useState<HospitalRequest | null>(null);
  const [aiExtraction, setAiExtraction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyDocId, setBusyDocId] = useState<number | null>(null);
  const [certifyingAll, setCertifyingAll] = useState(false);
  const [missingTypes, setMissingTypes] = useState<string[]>([]);
  const [selectedProofDoc, setSelectedProofDoc] = useState<Partial<CaseDocument> | null>(null);

  // Upload form
  const [docType, setDocType] = useState("statement_of_account");
  const [docTitle, setDocTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const load = useCallback(async () => {
    if (!requestId) {
      setRequest(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.getHospitalRequest(requestId);
      setRequest(res.request);
      setAiExtraction(res.ai_extraction || (res.request?.medical_case as any)?.ai_summary || null);
    } catch (err: any) {
      setRequest(null);
      setError(err?.message || "That hospital request could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  const kase = request?.medical_case;
  const records: CaseDocument[] = kase?.documents || [];

  const proofDocFor = (doc: CaseDocument): Partial<CaseDocument> => ({
    id: doc.id,
    title: doc.title,
    document_type: doc.document_type,
    status: doc.status,
    sha256_hash: doc.sha256_hash,
    verification_reference: doc.verification_reference,
    extracted_json: doc.extracted_json,
  });

  const handleCertifyOne = async (doc: CaseDocument) => {
    setBusyDocId(doc.id);
    try {
      await api.certifyDocument(doc.id);
      notify(`"${doc.title}" certified.`);
      await load();
    } catch (err: any) {
      notify(err?.message || `"${doc.title}" could not be certified.`);
    } finally {
      setBusyDocId(null);
    }
  };

  const handleCertifyAndAnchor = async () => {
    if (!request) return;
    setCertifyingAll(true);
    try {
      const res = await api.submitHospitalDocuments(request.id);
      const missing = res.missing || [];
      setMissingTypes(missing);
      notify(
        missing.length
          ? `${res.documents?.length || 0} record(s) certified. Still missing: ${missing.map(docTypeLabel).join(", ")}.`
          : res.message || "All requested records certified and anchored."
      );
      await load();
      // The statement of account is the document the guarantee settles against.
      const soa =
        (res.documents || []).find((d) => d.document_type === "statement_of_account") ||
        (res.documents || [])[0];
      if (soa) setSelectedProofDoc(proofDocFor(soa));
    } catch (err: any) {
      notify(err?.message || "The documents could not be certified.");
    } finally {
      setCertifyingAll(false);
    }
  };

  const handleUploadAndCertify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    const caseId = request.medical_case_id;
    const titleToUse = docTitle.trim() || `Official ${docTypeLabel(docType)}`;
    setUploadError("");
    setUploading(true);
    try {
      const res = await api.uploadHospitalDocument(caseId, docType, titleToUse, selectedFile || undefined, request.id);
      notify(`"${res.document.title}" uploaded, certified and anchored.`);
      setDocTitle("");
      setSelectedFile(null);
      await load();
    } catch (err: any) {
      setUploadError(err?.message || "The hospital document could not be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  if (!requestId) {
    return (
      <>
        <Head over="OFFICIAL RECORD CERTIFICATION" title="No request selected" text="Open a request from the hospital queue to certify its records." />
        <section className="card">
          <p style={{ fontWeight: 700, color: "#4338ca" }}>Select a patient request from the queue first.</p>
          <button className="primary" onClick={() => go("hospital")}>
            Back to request queue
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <Head
        over={kase?.provider?.name ? kase.provider.name.toUpperCase() : "OFFICIAL RECORD CERTIFICATION"}
        title={kase ? `Patient: ${kase.patient_name}` : "Loading request..."}
        text={kase ? `Case ${kase.case_number} · Bill ${money(kase.verified_bill)}` : "Loading the selected hospital request."}
        action={
          <button className="outline" onClick={() => go("hospital")}>
            ← Back to queue
          </button>
        }
      />

      {error && (
        <div role="alert" style={{ background: "#fef2f2", border: "2.5px solid #ef4444", borderRadius: 16, padding: "0.9rem 1.1rem", marginBottom: "1.5rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <AlertTriangle size={18} color="#dc2626" /> {error}
        </div>
      )}

      <div className="cols">
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: 0 }}>Official Provider Records & Verification</h2>
            <button className="primary" disabled={certifyingAll || loading || !request} onClick={handleCertifyAndAnchor}>
              <ShieldCheck size={18} /> {certifyingAll ? "Certifying & anchoring..." : "Certify & Anchor"}
            </button>
          </div>

          <p style={{ color: "#4338ca", fontWeight: 700, marginTop: 0 }}>
            Requested: {(request?.requested_document_types || []).map(docTypeLabel).join(", ") || "—"} ·{" "}
            <Status tone={statusTone(request?.status || "pending")}>{request?.status || "—"}</Status>
          </p>

          {missingTypes.length > 0 && (
            <div style={{ background: "#fef3c7", border: "2px solid #d97706", borderRadius: 14, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#92400e", fontWeight: 800 }}>
              No uploaded document exists for: {missingTypes.map(docTypeLabel).join(", ")}. Upload one below — nothing is invented on the citizen&apos;s behalf.
            </div>
          )}

          {loading ? (
            <p style={{ color: "#4338ca", fontWeight: 700, display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <RefreshCw size={16} className="animate-spin" /> Loading case documents...
            </p>
          ) : records.length === 0 ? (
            <p style={{ color: "#4338ca", fontWeight: 700 }}>This case has no uploaded documents yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "1.25rem 0" }}>
              {records.map((doc) => {
                const isCertified = doc.status === "certified" || doc.status === "verified";
                return (
                  <div
                    key={doc.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      padding: "1.1rem 1.25rem",
                      border: "2.5px solid #1e1b4b",
                      borderRadius: 20,
                      background: isCertified ? "#f0fdf4" : doc.status === "hashed" ? "#eff6ff" : "#ffffff",
                      boxShadow: "0 4px 0 #1e1b4b",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <b style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0f172a" }}>{doc.title}</b>
                        <small style={{ display: "block", color: "#4338ca", fontWeight: 600, marginTop: "0.15rem" }}>
                          {docTypeLabel(doc.document_type)} · Ref: {doc.verification_reference || "—"}
                        </small>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Status tone={isCertified ? "green" : doc.status === "hashed" ? "blue" : "orange"}>
                          {isCertified ? "Hospital Certified" : doc.status === "hashed" ? "Citizen Upload (Hashed)" : "Pending Certification"}
                        </Status>
                        {!isCertified && (
                          <button
                            onClick={() => handleCertifyOne(doc)}
                            disabled={busyDocId === doc.id}
                            style={{
                              padding: "0.35rem 0.75rem",
                              background: "#059669",
                              color: "#ffffff",
                              border: "1.5px solid #047857",
                              borderRadius: 10,
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <ShieldCheck size={13} /> {busyDocId === doc.id ? "Certifying..." : "Verify & Certify"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "0.6rem 0.8rem", borderRadius: 12, border: "1.5px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.775rem" }}>
                      <div>
                        <span style={{ color: "#64748b", fontWeight: 700 }}>SHA-256 Digest: </span>
                        <code style={{ color: "#1e1b4b", fontWeight: 900, fontFamily: "monospace" }}>{doc.sha256_hash || "—"}</code>
                      </div>
                      <button
                        onClick={() => setSelectedProofDoc(proofDocFor(doc))}
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
                        <Eye size={13} /> View chain receipt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload a new official hospital document */}
          <div style={{ marginTop: "1.75rem", padding: "1.25rem", border: "2.5px solid #1e1b4b", borderRadius: 20, background: "#f8fafc" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1e1b4b", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Plus size={18} /> Upload & Certify an Official Hospital File
            </h3>

            {uploadError && (
              <div role="alert" style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: 12, padding: "0.6rem 0.9rem", marginBottom: "0.85rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <AlertTriangle size={16} color="#dc2626" /> {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadAndCertify} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#1e1b4b", marginBottom: "0.3rem" }}>
                    Record Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 12, border: "2px solid #1e1b4b", fontWeight: 700, fontSize: "0.85rem" }}
                  >
                    {DOC_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#1e1b4b", marginBottom: "0.3rem" }}>
                    Document Title / Billing Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Itemized Surgical SOA"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 12, border: "2px solid #1e1b4b", fontWeight: 700, fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#1e1b4b", marginBottom: "0.3rem" }}>
                  Hospital Document File (PDF/Image)
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (!docTitle) setDocTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: 12, border: "2px solid #1e1b4b", fontSize: "0.85rem", background: "#ffffff" }}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <small style={{ display: "block", marginTop: "0.3rem", color: "#6366f1", fontWeight: 700 }}>
                  Without a file the server certifies the record from its own stored copy — attach one whenever the hospital holds the original.
                </small>
              </div>

              <button type="submit" className="primary wide" disabled={uploading || !request}>
                {uploading ? "Hashing & Certifying..." : "Upload & Certify Record"}
              </button>
            </form>
          </div>
        </section>

        <aside>
          <div className="card ai">
            <h3>
              <Sparkles size={20} /> eGov AI Case Extraction
            </h3>
            {aiExtraction?.summary ? (
              <>
                <p>{aiExtraction.summary}</p>
                <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", fontWeight: 700, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <div>
                    Completeness: <b>{typeof aiExtraction.completeness_score === "number" ? `${aiExtraction.completeness_score}%` : "—"}</b>
                  </div>
                  <div>
                    Missing:{" "}
                    <b>
                      {Array.isArray(aiExtraction.missing_requirements) && aiExtraction.missing_requirements.length > 0
                        ? aiExtraction.missing_requirements.map(docTypeLabel).join(", ")
                        : "None"}
                    </b>
                  </div>
                </div>
                <small style={{ display: "block", marginTop: "0.5rem", color: "#4338ca", fontWeight: 700 }}>
                  {aiExtraction.disclaimer || "AI-generated summary — subject to evaluator review."}
                </small>
              </>
            ) : (
              <p style={{ fontWeight: 700, color: "#4338ca" }}>
                {loading ? "Loading AI extraction..." : "No AI extraction is available for this case yet."}
              </p>
            )}
            {aiExtraction?.ledger_note && (
              <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1.5px solid #e0e7ff", fontSize: "0.8rem" }}>
                <b style={{ color: "#3730a3", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <FileText size={15} /> Ledger status
                </b>
                <span>{aiExtraction.ledger_note}</span>
              </div>
            )}
          </div>
        </aside>
      </div>

      {selectedProofDoc && (
        <BlockchainProofModal doc={selectedProofDoc} onClose={() => setSelectedProofDoc(null)} />
      )}
    </>
  );
}
