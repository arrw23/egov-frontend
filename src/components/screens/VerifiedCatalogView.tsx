import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CaseDocument, GuaranteeLetter, MedicalCase, Screen, Selection } from "@/types";
import { Head, Status } from "../common/Ui";
import { api } from "@/lib/api";

const money = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

const titleCase = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** A single inventory row, built from a real case document or guarantee letter. */
interface InventoryItem {
  id: string;
  title: string;
  category: string;
  authority: string;
  status: string;
  expiry: string;
  hash: string;
  ref: string;
  details: string;
  tone: "green" | "orange" | "red" | "blue";
  Icon: any;
  badgeBg: string;
  chainNote: string;
}

function documentItem(doc: CaseDocument, providerName: string): InventoryItem {
  const certified = doc.status === "certified" || doc.status === "verified";
  const ledgerSimulated = (doc.extracted_json as any)?.ledger_simulated !== false;
  return {
    id: `doc-${doc.id}`,
    title: doc.title || titleCase(doc.document_type),
    category: titleCase(doc.document_type),
    authority: certified ? providerName || "Hospital provider" : "Uploaded by the applicant",
    status: certified ? "Validated" : "Pending",
    expiry: "Not recorded",
    hash: doc.sha256_hash || "—",
    ref: doc.verification_reference || `DOC-${doc.id}`,
    details: certified
      ? `Certified by ${providerName || "the hospital provider"}.`
      : "Awaiting hospital verification and certification.",
    tone: certified ? "green" : "orange",
    Icon: certified ? FileCheck2 : FileText,
    badgeBg: certified ? "#dcfce7" : "#fef3c7",
    chainNote: ledgerSimulated
      ? "Simulated ledger (no chain submission)"
      : "Ledger submission recorded",
  };
}

function guaranteeItem(gl: GuaranteeLetter, index: number): InventoryItem {
  const active = gl.status === "valid" || gl.status === "partially_utilized";
  return {
    id: `gl-${gl.id ?? index}`,
    title: `Digital Guarantee Letter ${gl.gl_number}`,
    category: "Government assistance guarantee",
    authority: gl.digital_signatory_name ? `${gl.digital_signatory_name} · ${gl.digital_signatory_role || ""}` : "Issuing agency",
    status: active ? "Validated" : gl.status === "cancelled" ? "Rejected" : "Pending",
    expiry: gl.expiration_date ? String(gl.expiration_date).slice(0, 10) : "Not recorded",
    hash: gl.chain_reference || "—",
    ref: gl.gl_number,
    details: `${money(Number(gl.approved_amount || 0))} approved for ${gl.hospital_name || "the hospital provider"} · ${titleCase(gl.covered_service || "")}`,
    tone: active ? "green" : gl.status === "cancelled" ? "red" : "orange",
    Icon: WalletCards,
    badgeBg: active ? "#dcfce7" : "#fef3c7",
    chainNote: "Reference recorded by GabayMed",
  };
}

function DocImagePreview({ doc }: { doc: InventoryItem }) {
  const Icon = doc.Icon;
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
      <div style={{ padding: "1rem", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: doc.badgeBg }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1.5px solid #1e1b4b", paddingBottom: "0.4rem", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 900, color: "#1e1b4b" }}>{doc.authority}</span>
          <span style={{ fontSize: "0.65rem", background: "#ffffff", padding: "0.15rem 0.5rem", borderRadius: 8, fontWeight: 900, border: "1px solid #1e1b4b", whiteSpace: "nowrap" }}>{doc.ref}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", opacity: 0.55 }}>
          <Icon size={48} color="#1e1b4b" />
        </div>
        <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#4338ca" }}>{doc.chainNote}</div>
      </div>

      <div style={{ position: "absolute", top: 8, right: 10, background: "rgba(30, 27, 75, 0.85)", color: "#ffffff", padding: "0.2rem 0.6rem", borderRadius: "8px", fontSize: "0.68rem", fontWeight: 800 }}>
        RECORD PREVIEW
      </div>

      <div
        style={{
          position: "absolute",
          right: 10,
          bottom: 10,
          background: doc.tone === "green" ? "#dcfce7" : "#fef3c7",
          color: doc.tone === "green" ? "#14532d" : "#92400e",
          border: `2px solid ${doc.tone === "green" ? "#166534" : "#d97706"}`,
          borderRadius: 4,
          padding: "0.25rem 0.65rem",
          fontSize: "0.72rem",
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          zIndex: 5,
        }}
      >
        <ShieldCheck size={14} /> {doc.status.toUpperCase()}
      </div>
    </div>
  );
}

export function VerifiedCatalogView({ go, selection }: { go: (s: Screen) => void; selection: Selection }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "validated" | "pending" | "rejected">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!selection.caseId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.getCase(selection.caseId);
      const kase: MedicalCase = res.case;
      const providerName = kase.provider?.name || "";
      setItems([
        ...(kase.documents || []).map((d) => documentItem(d, providerName)),
        ...(kase.guarantee_letters || []).map((gl, i) => guaranteeItem(gl, i)),
      ]);
    } catch (err: any) {
      setItems([]);
      setError(err?.message || "The verified inventory could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [selection.caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      items.filter((d) => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          !q ||
          d.title.toLowerCase().includes(q) ||
          d.authority.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.ref.toLowerCase().includes(q) ||
          d.hash.toLowerCase().includes(q);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "validated" && d.status === "Validated") ||
          (statusFilter === "pending" && d.status === "Pending") ||
          (statusFilter === "rejected" && d.status === "Rejected");

        return matchesSearch && matchesStatus;
      }),
    [items, searchTerm, statusFilter]
  );

  const countBy = (status: string) => items.filter((x) => x.status === status).length;

  return (
    <>
      <Head
        over="DIGITAL CREDENTIAL INVENTORY"
        title="My Verified Inventory"
        text="Every official document, credential and guarantee letter recorded against the selected case."
        action={<Status tone="green">{items.length} Recorded Item(s)</Status>}
      />

      {error && (
        <div role="alert" style={{ background: "#fef2f2", border: "2.5px solid #ef4444", borderRadius: 16, padding: "0.9rem 1.1rem", marginBottom: "1.5rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <AlertTriangle size={18} color="#dc2626" /> {error}
        </div>
      )}

      {!selection.caseId && (
        <section className="card" style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontWeight: 700, color: "#4338ca" }}>No case is selected, so there is nothing to inventory yet.</p>
          <button className="primary" onClick={() => go("apply")}>
            Start an application
          </button>
        </section>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["all", "validated", "pending", "rejected"] as const).map((st) => (
            <button
              key={st}
              className={statusFilter === st ? "primary" : "outline"}
              onClick={() => setStatusFilter(st)}
              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem", textTransform: "capitalize", fontWeight: 800 }}
            >
              {st === "all"
                ? `All Items (${items.length})`
                : st === "validated"
                ? `Validated (${countBy("Validated")})`
                : st === "pending"
                ? `Pending (${countBy("Pending")})`
                : `Rejected (${countBy("Rejected")})`}
            </button>
          ))}
          <button className="outline" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
        <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
          <input
            placeholder="Search record or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "0.6rem 1rem 0.6rem 2.5rem", border: "2.5px solid #1e1b4b", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 700, width: "100%" }}
          />
          <Search size={16} color="#6366f1" style={{ position: "absolute", left: 14, top: 12 }} />
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#4338ca", fontWeight: 700, display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <RefreshCw size={16} className="animate-spin" /> Loading case records...
        </p>
      ) : filtered.length === 0 ? (
        <section className="card">
          <p style={{ fontWeight: 700, color: "#4338ca" }}>
            {items.length === 0 ? "No documents or guarantee letters are recorded on this case yet." : "No records match the current filters."}
          </p>
        </section>
      ) : (
        <div className="formGrid">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="card"
              onClick={() => setSelectedDoc(doc)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", margin: 0, cursor: "pointer", padding: "1.5rem" }}
            >
              <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <DocImagePreview doc={doc} />

                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1e1b4b", margin: "0 0 0.35rem 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", textAlign: "center" }}>
                  {doc.title} <BadgeCheck color="#2563eb" size={20} />
                </h3>

                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#4338ca", marginBottom: "1rem", textAlign: "center" }}>
                  Issued / held by: <b style={{ color: "#1e1b4b" }}>{doc.authority}</b>
                </div>

                <div style={{ background: "#f5f3ff", padding: "0.85rem 1rem", borderRadius: 16, border: "2px solid #1e1b4b", width: "100%", display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 800, marginBottom: "1.25rem", textAlign: "left", boxSizing: "border-box" }}>
                  <div style={{ fontSize: "0.72rem", color: "#6366f1", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>{doc.category}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                    <span style={{ color: "#4338ca" }}>Expiry:</span>
                    <b style={{ color: doc.expiry === "Not recorded" ? "#64748b" : "#d97706" }}>{doc.expiry}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                    <span style={{ color: "#4338ca" }}>Reference:</span>
                    <b style={{ color: "#1e1b4b", wordBreak: "break-all", textAlign: "right" }}>{doc.ref}</b>
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
                  <FileCheck2 size={18} /> View Record Details <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDoc && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", overflowY: "auto" }}
          onClick={() => setSelectedDoc(null)}
        >
          <div
            style={{ background: "#ffffff", border: "3px solid #1e1b4b", borderRadius: 28, padding: "1.5rem", maxWidth: 540, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 10px 0 #1e1b4b", position: "relative", boxSizing: "border-box", margin: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "2.5px solid #e0e7ff", paddingBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900 }}>RECORDED CASE ITEM</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, margin: 0, color: "#1e1b4b" }}>{selectedDoc.title}</h2>
              </div>
              <button className="closeDrawerBtn" onClick={() => setSelectedDoc(null)} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            <div style={{ background: "#f5f3ff", padding: "1.25rem", borderRadius: 20, border: "2.5px solid #1e1b4b", marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.88rem", fontWeight: 700 }}>
              <div><b>Issued / held by:</b> <b style={{ color: "#1e1b4b" }}>{selectedDoc.authority}</b></div>
              <div><b>Reference Number:</b> {selectedDoc.ref}</div>
              <div><b>Status:</b> <Status tone={selectedDoc.tone}>{selectedDoc.status}</Status></div>
              <div><b>Expiration Date:</b> <b style={{ color: "#d97706" }}>{selectedDoc.expiry}</b></div>
              <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1.5px solid #e0e7ff", fontSize: "0.85rem", color: "#4338ca" }}>{selectedDoc.details}</div>
              <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1.5px solid #e0e7ff", fontSize: "0.82rem", color: "#475569" }}>
                <b>Ledger:</b> {selectedDoc.chainNote}
              </div>
            </div>

            <div style={{ background: "#eff6ff", border: "2px solid #93c5fd", borderRadius: 16, padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.3rem" }}>Digest / Reference hash</div>
              <code style={{ display: "block", wordBreak: "break-all", fontSize: "0.78rem", fontFamily: "monospace", background: "#ffffff", padding: "0.6rem 0.8rem", borderRadius: 10, border: "1.5px solid #bfdbfe", color: "#1e3a8a", fontWeight: 700 }}>
                {selectedDoc.hash}
              </code>
            </div>

            <div style={{ textAlign: "center", marginBottom: "1.25rem", padding: "1rem", background: "#ffffff", borderRadius: 16, border: "2px solid #1e1b4b" }}>
              <QRCodeSVG value={`https://verify.egov.ph/record/${selectedDoc.ref}`} size={110} style={{ margin: "0 auto" }} />
              <small style={{ display: "block", fontSize: "0.75rem", color: "#4338ca", fontWeight: 800, marginTop: "0.5rem" }}>Scan QR to look up this reference</small>
            </div>

            <button className="primary wide" onClick={() => setSelectedDoc(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
