import React, { useState } from "react";
import { Activity, CheckCircle2, Clock3, ShieldCheck, Sparkles, Upload, FileText, Eye, Plus, Cpu } from "lucide-react";
import { api } from "@/lib/api";
import { CaseDocument, Screen } from "@/types";
import { Head, Stat, Status } from "../common/Ui";
import { BlockchainProofModal } from "../common/BlockchainProofModal";

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
  const [uploading, setUploading] = useState(false);
  const [selectedProofDoc, setSelectedProofDoc] = useState<Partial<CaseDocument> | null>(null);

  // Form states
  const [docType, setDocType] = useState("statement_of_account");
  const [docTitle, setDocTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Default records list (including hospital records and citizen-uploaded hashed documents)
  const [records, setRecords] = useState<any[]>([
    {
      id: 200,
      type: "indigency",
      title: "Barangay Certificate of Indigency (Uploaded by Citizen)",
      sub: "Citizen upload · Cryptographic hash anchored to eGovChain (Awaiting Hospital Verification)",
      status: "hashed",
      ref: "HSH-DOC-8B7C6D5E",
      hash: "DOC-HASH-8B7C6D5E4F3A",
      fullSha256: "8b7c6d5e4f3a9920192837410293847102938471029384710293847102938471",
      besuTx: "0x8b7c6d5e4f3a9920192837410293847102938471",
      block: "0x1c37b0",
      uploadedByCitizen: true,
    },
    {
      id: 201,
      type: "statement_of_account",
      title: "Certified Statement of Account (₱150,000.00)",
      sub: "Hospital itemized billing summary ref SOA-MGH-992",
      status: "draft",
      ref: "HSP-REF-88A1901B",
      hash: "DOC-HASH-99A1F2C84B",
      fullSha256: "8f431c92a10b428d0987f65e2310ab45981273645bc890123ef890123456789a",
      besuTx: "0x98f2190c5d12a8f9104b2819c5b201f8a920b41c",
      block: "0x1c37b1",
    },
    {
      id: 202,
      type: "medical_abstract",
      title: "Official Medical Abstract & Clinical Summary",
      sub: "Laparoscopic appendectomy summary signed by Dr. Ana Reyes",
      status: "draft",
      ref: "HSP-REF-77C102A1",
      hash: "DOC-HASH-77B41C90",
      fullSha256: "77b41c90129bc8173499210982c716e9102934812b123984712093847123490a",
      besuTx: "0x7a31b209c12df882a1099238bc110a273b40",
      block: "0x1c37b3",
    },
    {
      id: 203,
      type: "treatment_order",
      title: "Physician Treatment & Diagnostic Order",
      sub: "Dr. Ana Reyes order ref ORD-MGH-102",
      status: "draft",
      ref: "HSP-REF-55A901C2",
      hash: "DOC-HASH-55C19A82",
      fullSha256: "55c19a8209182374901283740912837409128374091283740912837409128374",
      besuTx: "0x44b91010a2938102938410293840192384910293",
      block: "0x1c37b5",
    },
  ]);

  const handleVerifySingleRecord = async (recId: number) => {
    try {
      await api.certifyDocument(recId);
    } catch (e) {}
    setRecords((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: "certified" } : r))
    );
    notify("Document verified and certified on eGovChain by Dr. Ana Reyes!");
  };

  const handleUploadAndCertify = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleToUse = docTitle.trim() || `Official ${docType.replace(/_/g, " ").toUpperCase()}`;

    setUploading(true);
    try {
      const res = await api.uploadHospitalDocument(1, docType, titleToUse, selectedFile || undefined);
      notify("Official medical record uploaded, certified, and anchored to eGovChain!");

      const meta = (res.document.extracted_json as any) || {};
      const newRec = {
        id: res.document.id,
        type: res.document.document_type,
        title: res.document.title,
        sub: `Certified by Dr. Ana Reyes · ${selectedFile ? selectedFile.name : "Uploaded PDF"}`,
        status: "certified",
        ref: res.document.verification_reference || "HSP-REF-NEW",
        hash: res.document.sha256_hash || "DOC-HASH-NEW",
        fullSha256: meta.full_sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        besuTx: meta.blockchain_tx_hash || "0x98f2190c5d12a8f9104b2819c5b201f8a920b41c",
        block: meta.blockchain_block_number || "0x1c37b1",
      };

      setRecords((prev) => [newRec, ...prev]);
      setDocTitle("");
      setSelectedFile(null);
    } catch (err: any) {
      notify(`Hospital upload note: ${err?.message || "Record certified & anchored!"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleBatchCertifyAll = async () => {
    try {
      await api.submitHospitalDocuments(1);
    } catch (e) {}
    setCertified(true);
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status: "certified",
      }))
    );
    notify("All patient medical records certified & anchored to eGovChain blockchain; citizen & DSWD notified!");
  };

  return (
    <>
      <Head over="OFFICIAL RECORD CERTIFICATION" title="Patient: Juan D. Santos" text="Case MGL-2026-001284 · Manila General Hospital" />

      <div className="cols">
        {/* Main Column: Records List & Batch Action */}
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: 0 }}>Official Provider Records & Verification</h2>
            <button
              className="primary"
              disabled={certified}
              onClick={handleBatchCertifyAll}
            >
              <ShieldCheck size={18} /> {certified ? "All Records Certified" : "Batch Certify All Records"}
            </button>
          </div>

          {/* List of Hospital Certified Records */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "1.25rem 0" }}>
            {records.map((rec) => (
              <div
                key={rec.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  padding: "1.1rem 1.25rem",
                  border: "2.5px solid #1e1b4b",
                  borderRadius: 20,
                  background: rec.status === "certified" || certified ? "#f0fdf4" : rec.status === "hashed" ? "#eff6ff" : "#ffffff",
                  boxShadow: "0 4px 0 #1e1b4b",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <b style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0f172a" }}>{rec.title}</b>
                    <small style={{ display: "block", color: rec.status === "hashed" ? "#1e40af" : "#4338ca", fontWeight: 600, marginTop: "0.15rem" }}>
                      {rec.sub} · Ref: {rec.ref}
                    </small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Status tone={rec.status === "certified" || certified ? "green" : rec.status === "hashed" ? "blue" : "orange"}>
                      {rec.status === "certified" || certified ? "Hospital Certified" : rec.status === "hashed" ? "Citizen Upload (Hashed)" : "Pending Certification"}
                    </Status>
                    {rec.status === "hashed" && !certified && (
                      <button
                        onClick={() => handleVerifySingleRecord(rec.id)}
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
                        <ShieldCheck size={13} /> Verify & Certify
                      </button>
                    )}
                  </div>
                </div>

                {/* SHA-256 Hash & Verification Row */}
                <div style={{
                  background: "#f8fafc",
                  padding: "0.6rem 0.8rem",
                  borderRadius: 12,
                  border: "1.5px solid #cbd5e1",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  fontSize: "0.775rem",
                }}>
                  <div>
                    <span style={{ color: "#64748b", fontWeight: 700 }}>SHA-256 Digest: </span>
                    <code style={{ color: "#1e1b4b", fontWeight: 900, fontFamily: "monospace" }}>
                      {rec.hash}
                    </code>
                  </div>
                  <button
                    onClick={() =>
                      setSelectedProofDoc({
                        id: rec.id,
                        title: rec.title,
                        document_type: rec.type,
                        status: rec.status === "certified" || certified ? "certified" : rec.status,
                        sha256_hash: rec.hash,
                        verification_reference: rec.ref,
                        extracted_json: {
                          full_sha256: rec.fullSha256,
                          blockchain_tx_hash: rec.besuTx,
                          blockchain_block_number: rec.block,
                        },
                      })
                    }
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
                    <Eye size={13} /> Verify On eGovChain
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Form to Upload New Official Hospital Document */}
          <div style={{ marginTop: "1.75rem", padding: "1.25rem", border: "2.5px solid #1e1b4b", borderRadius: 20, background: "#f8fafc" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1e1b4b", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Plus size={18} /> Upload & Certify Additional Hospital File
            </h3>

            <form onSubmit={handleUploadAndCertify} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#1e1b4b", marginBottom: "0.3rem" }}>
                    Record Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: 12,
                      border: "2px solid #1e1b4b",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="statement_of_account">Statement of Account (SOA)</option>
                    <option value="medical_abstract">Official Medical Abstract</option>
                    <option value="physician_order">Physician Treatment Order</option>
                    <option value="diagnostic_report">Diagnostic / Lab Result</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#1e1b4b", marginBottom: "0.3rem" }}>
                    Document Title / Billing Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Itemized Surgical SOA ₱150,000"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: 12,
                      border: "2px solid #1e1b4b",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
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
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: 12,
                    border: "2px solid #1e1b4b",
                    fontSize: "0.85rem",
                    background: "#ffffff",
                  }}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
              </div>

              <button type="submit" className="primary wide" disabled={uploading}>
                {uploading ? "Hashing & Certifying..." : "Upload & Certify Record"}
              </button>
            </form>
          </div>
        </section>

        {/* Sidebar Column: eGov AI Summary */}
        <aside>
          <div className="card ai">
            <h3><Sparkles size={20} /> eGov AI Medical Billing Extraction</h3>
            <p>
              <b>Patient:</b> Juan D. Santos<br />
              <b>Diagnosis:</b> Acute appendicitis<br />
              <b>Procedure:</b> Laparoscopic appendectomy<br />
              <b>Verified Bill:</b> ₱150,000.00
            </p>
            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1.5px solid #e0e7ff", fontSize: "0.8rem" }}>
              <b style={{ color: "#3730a3", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Cpu size={15} /> Hyperledger Besu Network
              </b>
              <span>IBFT 2.0 Proof of Authority zero-gas network validates hospital signatures.</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Render Blockchain Proof Modal */}
      {selectedProofDoc && (
        <BlockchainProofModal
          doc={selectedProofDoc}
          onClose={() => setSelectedProofDoc(null)}
        />
      )}
    </>
  );
}
