import React, { useState } from "react";
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  FileCheck2,
  FileText,
  Search,
  ShieldCheck,
  UserCheck,
  WalletCards,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Screen } from "@/types";
import { Head, Status } from "../common/Ui";

function DocImagePreview({ doc }: { doc: any }) {
  return (
    <div
      style={{
        width: "100%",
        height: 180,
        borderRadius: "20px",
        border: "2.5px solid #1e1b4b",
        background: "#ffffff",
        boxShadow: "0 5px 0 #1e1b4b",
        marginBottom: "1rem",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Actual Genuine Document Image Frame with Privacy Blur */}
      {doc.imageSrc ? (
        <img
          src={doc.imageSrc}
          alt={doc.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(2.2px) contrast(1.05)",
            transform: "scale(1.05)",
          }}
        />
      ) : (
        <div style={{ padding: "1rem", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: doc.badgeBg }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1.5px solid #1e1b4b", paddingBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 900, color: "#1e1b4b" }}>{doc.authority}</span>
            <span style={{ fontSize: "0.65rem", background: "#ffffff", padding: "0.15rem 0.5rem", borderRadius: 8, fontWeight: 900, border: "1px solid #1e1b4b" }}>{doc.ref}</span>
          </div>
          <div style={{ filter: "blur(2.2px)", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <div style={{ height: 10, background: "#1e1b4b", opacity: 0.4, borderRadius: 4, width: "80%" }} />
            <div style={{ height: 8, background: "#4338ca", opacity: 0.35, borderRadius: 4, width: "95%" }} />
            <div style={{ height: 8, background: "#4338ca", opacity: 0.3, borderRadius: 4, width: "70%" }} />
          </div>
        </div>
      )}

      {/* Top Header Tag Overlay */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 10,
          background: "rgba(30, 27, 75, 0.85)",
          backdropFilter: "blur(4px)",
          color: "#ffffff",
          padding: "0.2rem 0.6rem",
          borderRadius: "8px",
          fontSize: "0.68rem",
          fontWeight: 800,
          border: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        DOCUMENT PREVIEW
      </div>

      {/* Official Validated Stamp Overlay */}
      <div
        style={{
          position: "absolute",
          right: 10,
          bottom: 10,
          background: "#dcfce7",
          color: "#14532d",
          border: "2px solid #166534",
          borderRadius: 4,
          padding: "0.25rem 0.65rem",
          fontSize: "0.72rem",
          fontWeight: 900,
          boxShadow: "0 3px 0 #166534",
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          zIndex: 5,
        }}
      >
        <ShieldCheck size={14} color="#166534" /> VALIDATED
      </div>
    </div>
  );
}

export function VerifiedCatalogView({ go }: { go: (s: Screen) => void }) {
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "validated" | "pending" | "rejected">("all");

  const verifiedDocs = [
    {
      id: "doc-1",
      title: "PhilSys Digital ID",
      category: "IDENTITY CREDENTIAL",
      authority: "Philippine Statistics Authority (PSA)",
      status: "Validated",
      expiry: "No Expiration (Permanent)",
      hash: "0x9f8a4e12c5b309f871e4d20918c53a8f",
      ledgerId: "EGC-PHIL-8F2A-2026",
      ref: "EVR-8F2A-19C0-2026",
      details: "Official PhilSys Digital Identity matched against central registry database via eVerify API.",
      tone: "green",
      Icon: UserCheck,
      badgeBg: "#e0e7ff",
      imageSrc: "/docs/doc-1.png",
    },
    {
      id: "doc-2",
      title: "Barangay Certificate of Indigency",
      category: "RESIDENCY & ELIGIBILITY",
      authority: "Barangay 659-A, City of Manila",
      status: "Validated",
      expiry: "31 Dec 2026",
      hash: "0x7b2f91a08e4c19d205f3189a04b12c5e",
      ledgerId: "EGC-BRGY-MANILA-99",
      ref: "BRGY-MANILA-2026-99",
      details: "Certified barangay residency and indigency clearance issued for DSWD AICS assistance.",
      tone: "green",
      Icon: Building2,
      badgeBg: "#fef08a",
      imageSrc: "/docs/doc-2.png",
    },
    {
      id: "doc-3",
      title: "Certified Medical Abstract & Diagnosis",
      category: "OFFICIAL MEDICAL RECORD",
      authority: "Manila General Hospital",
      status: "Validated",
      expiry: "Permanent Medical Record",
      hash: "0xe3b0c44298fc1c149afbf4c8996fb924",
      ledgerId: "EGC-HSP-MED-081E",
      ref: "HSP-MED-2026-081E",
      details: "Official medical record covering diagnosis (Acute appendicitis) and surgical procedure.",
      tone: "green",
      Icon: FileText,
      badgeBg: "#dcfce7",
      imageSrc: "/docs/doc-3.png",
    },
    {
      id: "doc-4",
      title: "Certified Statement of Account (SOA)",
      category: "FINANCIAL BILLING RECORD",
      authority: "Manila General Hospital Billing Dept.",
      status: "Validated",
      expiry: "21 Aug 2026",
      hash: "0xa41e9b205f18c4d93021e85f091a4b12",
      ledgerId: "EGC-SOA-MGH-9901",
      ref: "SOA-MGH-2026-9901",
      details: "Itemized surgical statement of account verified for total hospital bill of ₱150,000.00.",
      tone: "green",
      Icon: FileCheck2,
      badgeBg: "#fce7f3",
      imageSrc: "/docs/doc-2.png",
    },
    {
      id: "doc-5",
      title: "Physician Treatment Order",
      category: "OFFICIAL MEDICAL ORDER",
      authority: "Dr. Ana Reyes (PRC #0192841)",
      status: "Validated",
      expiry: "Permanent Medical Record",
      hash: "0x3f81e9b04c1a205d981e74f2018c5e9f",
      ledgerId: "EGC-ORD-MGH-102",
      ref: "ORD-MGH-102",
      details: "Certified attending physician order authorizing inpatient surgical management.",
      tone: "green",
      Icon: ShieldCheck,
      badgeBg: "#e0e7ff",
      imageSrc: "/docs/doc-3.png",
    },
    {
      id: "doc-6",
      title: "Digital Guarantee Letter",
      category: "GOVERNMENT ASSISTANCE GUARANTEE",
      authority: "DSWD NCR (AICS Program)",
      status: "Validated",
      expiry: "20 Aug 2026",
      hash: "0xd8f2910c5d12a8f9104b2819c5b201f8",
      ledgerId: "EGC-GL-7F3A-91D2",
      ref: "GL-DSWD-2026-04821",
      details: "Official digital guarantee letter approving ₱50,000.00 assistance issued to Manila General Hospital.",
      tone: "green",
      Icon: WalletCards,
      badgeBg: "#dcfce7",
      imageSrc: "/docs/doc-2.png",
    },
  ];

  const filtered = verifiedDocs.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.authority.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ledgerId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "validated" && d.status === "Validated") ||
      (statusFilter === "pending" && d.status === "Pending") ||
      (statusFilter === "rejected" && d.status === "Rejected");

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Head
        over="DIGITAL CREDENTIAL INVENTORY"
        title="My Verified Inventory"
        text="A central inventory of all official documents, credentials, and digital seals linked to your profile. Secured by tamper-evident eGovChain Ledger Hashes."
        action={<Status tone="green">{verifiedDocs.length} Verified Credentials</Status>}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["all", "validated", "pending", "rejected"] as const).map((st) => (
            <button
              key={st}
              className={statusFilter === st ? "primary" : "outline"}
              onClick={() => setStatusFilter(st)}
              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem", textTransform: "capitalize", fontWeight: 800 }}
            >
              {st === "all" ? `All Items (${verifiedDocs.length})` : st === "validated" ? `Validated (${verifiedDocs.filter((x) => x.status === "Validated").length})` : st === "pending" ? `Pending (0)` : `Rejected (0)`}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", minWidth: 260 }}>
          <input
            placeholder="Search credential or ledger hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "0.6rem 1rem 0.6rem 2.5rem", border: "2.5px solid #1e1b4b", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 700, width: "100%" }}
          />
          <Search size={16} color="#6366f1" style={{ position: "absolute", left: 14, top: 12 }} />
        </div>
      </div>

      <div className="formGrid">
        {filtered.map((doc) => {
          return (
            <div
              key={doc.id}
              className="card"
              onClick={() => setSelectedDoc(doc)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                margin: 0,
                cursor: "pointer",
                padding: "1.5rem",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* GENUINE DOCUMENT IMAGE FRAME FRONT & CENTER */}
                <DocImagePreview doc={doc} />



                {/* Front & Center Title */}
                <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#1e1b4b", margin: "0 0 0.35rem 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", textAlign: "center" }}>
                  {doc.title} <BadgeCheck color="#2563eb" size={20} />
                </h3>

                {/* Validated By Agency Name */}
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#4338ca", marginBottom: "1rem", textAlign: "center" }}>
                  Validated by: <b style={{ color: "#1e1b4b" }}>{doc.authority}</b>
                </div>

                {/* Subtitle-esque Secondary Info Area */}
                <div style={{ background: "#f5f3ff", padding: "0.85rem 1rem", borderRadius: 16, border: "2px solid #1e1b4b", width: "100%", display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 800, marginBottom: "1.25rem", textAlign: "left", boxSizing: "border-box" }}>
                  <div style={{ fontSize: "0.72rem", color: "#6366f1", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {doc.category}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#4338ca" }}>Expiration:</span>
                    <b style={{ color: doc.expiry.includes("No Expiration") || doc.expiry.includes("Permanent") ? "#059669" : "#d97706" }}>{doc.expiry}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#4338ca" }}>Ledger Hash:</span>
                    <code style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#1e1b4b" }}>{doc.hash.substring(0, 12)}...</code>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#4338ca" }}>eGovChain ID:</span>
                    <b style={{ color: "#1e1b4b" }}>{doc.ledgerId}</b>
                  </div>
                </div>
              </div>

              <div style={{ width: "100%" }}>
                <button
                  className="primary wide"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem 1rem", fontSize: "0.9rem" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDoc(doc);
                  }}
                >
                  <FileCheck2 size={18} /> Click for more details <ChevronRight size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Dialog for Viewing Certified Copy */}
      {selectedDoc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            overflowY: "auto",
          }}
          onClick={() => setSelectedDoc(null)}
        >
          <div
            style={{
              background: "#ffffff",
              border: "3px solid #1e1b4b",
              borderRadius: 28,
              padding: "1.5rem 1.75rem",
              maxWidth: 560,
              width: "100%",
              maxHeight: "88vh",
              overflowY: "auto",
              boxShadow: "0 10px 0 #1e1b4b",
              position: "relative",
              boxSizing: "border-box",
              margin: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                background: "#ffffff",
                zIndex: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
                borderBottom: "2.5px solid #e0e7ff",
                paddingBottom: "1rem",
                marginTop: "-0.5rem",
                paddingTop: "0.5rem",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900 }}>OFFICIAL CERTIFIED COPY</span>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 900, margin: 0, color: "#1e1b4b" }}>{selectedDoc.title}</h2>
              </div>
              <button className="closeDrawerBtn" onClick={() => setSelectedDoc(null)} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            {/* Unblurred Full Genuine Document Preview in Modal */}
            {selectedDoc.imageSrc && (
              <div style={{ marginBottom: "1.25rem", borderRadius: 20, border: "2.5px solid #1e1b4b", overflow: "hidden", boxShadow: "0 4px 0 #1e1b4b" }}>
                <img src={selectedDoc.imageSrc} alt={selectedDoc.title} style={{ width: "100%", height: 220, objectFit: "cover" }} />
              </div>
            )}

            <div style={{ background: "#f5f3ff", padding: "1.25rem", borderRadius: 20, border: "2.5px solid #1e1b4b", marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.9rem", fontWeight: 700 }}>
              <div><b>Validated by:</b> <b style={{ color: "#1e1b4b" }}>{selectedDoc.authority}</b></div>
              <div><b>Reference Number:</b> {selectedDoc.ref}</div>
              <div><b>eGovChain Blockchain ID:</b> <b>{selectedDoc.ledgerId}</b></div>
              <div><b>Verification Status:</b> <Status tone="green">{selectedDoc.status}</Status></div>
              <div><b>Expiration Date:</b> <b style={{ color: "#d97706" }}>{selectedDoc.expiry}</b></div>
              <div><b>Cryptographic Ledger Hash (SHA-256):</b> <code style={{ fontSize: "0.78rem", wordBreak: "break-all", background: "#ffffff", padding: "0.2rem 0.5rem", borderRadius: 8, border: "1px solid #1e1b4b", display: "block", marginTop: "0.25rem" }}>{selectedDoc.hash}</code></div>
              <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1.5px solid #e0e7ff", fontSize: "0.85rem", color: "#4338ca" }}>{selectedDoc.details}</div>
            </div>

            <div style={{ textAlign: "center", marginBottom: "1.25rem", padding: "1rem", background: "#ffffff", borderRadius: 16, border: "2px solid #1e1b4b" }}>
              <QRCodeSVG value={`https://verify.egov.ph/doc/${selectedDoc.ref}`} size={110} style={{ margin: "0 auto" }} />
              <small style={{ display: "block", fontSize: "0.75rem", color: "#4338ca", fontWeight: 800, marginTop: "0.5rem" }}>Scan QR to verify authentic agency seal on eGovChain</small>
            </div>

            <button className="primary wide" onClick={() => setSelectedDoc(null)}>
              Close Certified Document
            </button>
          </div>
        </div>
      )}
    </>
  );
}
