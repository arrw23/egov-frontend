import React from "react";
import { AlertTriangle, CheckCircle2, FileText, Network, QrCode, RefreshCw, ScanLine, Search, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { decodeQrImage } from "@/lib/qr";
import { Screen, Selection } from "@/types";
import { Head, Status } from "../common/Ui";
import { api } from "@/lib/api";

const money = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

const dateOnly = (value?: string | null) => (value ? String(value).slice(0, 10) : "—");

/** Fallback QR target only when the backend supplies no qr_payload. */
const qrFallbackPayload = (glNumber: string) => `https://verify.egov.ph/gl/${glNumber}`;

const utilizationLabel = (utilized: number, approved: number, unusedLabel: string) =>
  approved > 0 && utilized >= approved ? "Fully Utilized" : utilized > 0 ? "Partially Utilized" : unusedLabel;

export function GuaranteeView({
  go,
  selection,
  select,
}: {
  go: (s: Screen) => void;
  selection: Selection;
  select: (patch: Partial<Selection>) => void;
}) {
  const [guarantee, setGuarantee] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [ledger, setLedger] = React.useState<any>(null);
  const [ledgerBusy, setLedgerBusy] = React.useState(false);

  // Resolve the guarantee to show: the explicitly selected one, otherwise the
  // newest guarantee letter on the selected case. Nothing is hard-coded.
  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let id = selection.guaranteeId;
      if (!id && selection.caseId) {
        const caseRes = await api.getCase(selection.caseId);
        const gls = (caseRes.case as any)?.guarantee_letters || [];
        if (gls.length > 0) id = gls[0].id;
      }
      if (!id) {
        setGuarantee(null);
        setLoading(false);
        return;
      }
      if (id !== selection.guaranteeId) select({ guaranteeId: id });
      const res = await api.getGuarantee(id);
      setGuarantee(res.guarantee);
    } catch (err: any) {
      setGuarantee(null);
      setError(err?.message || "The guarantee letter could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [selection.guaranteeId, selection.caseId, select]);

  React.useEffect(() => {
    load();
  }, [load]);

  const checkLedger = async () => {
    if (!guarantee?.gl_number) return;
    setLedgerBusy(true);
    try {
      const res = await api.besuJsonRpc("egov_verifyRecord", [guarantee.gl_number]);
      setLedger(res);
    } catch (err: any) {
      setLedger({ error: { message: err?.message || "The ledger check failed." } });
    } finally {
      setLedgerBusy(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head over="DIGITAL GUARANTEE LETTER" title="Loading guarantee letter..." text="Fetching the issued guarantee letter." />
        <p style={{ color: "#4338ca", fontWeight: 700, display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <RefreshCw size={16} className="animate-spin" /> Loading guarantee letter...
        </p>
      </>
    );
  }

  if (!guarantee) {
    return (
      <>
        <Head
          over="DIGITAL GUARANTEE LETTER"
          title="No guarantee letter yet"
          text="A guarantee letter appears here once an agency evaluator approves the application."
        />
        {error && (
          <div role="alert" style={{ background: "#fef2f2", border: "2.5px solid #ef4444", borderRadius: 16, padding: "0.9rem 1.1rem", marginBottom: "1.25rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <AlertTriangle size={18} color="#dc2626" /> {error}
          </div>
        )}
        <section className="card">
          <p style={{ fontWeight: 700, color: "#4338ca" }}>
            No guarantee letter is selected and no guarantee letter exists on the selected case yet.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button className="primary" onClick={() => go("dashboard")}>
              Back to dashboard
            </button>
            <button className="outline" onClick={load}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </section>
      </>
    );
  }

  const approved = Number(guarantee.approved_amount || 0);
  const utilized = Number(guarantee.utilized_amount || 0);
  const remaining = typeof guarantee.remaining_value === "number" ? Number(guarantee.remaining_value) : Math.max(0, approved - utilized);
  const qrValue = guarantee.qr_payload || qrFallbackPayload(guarantee.gl_number);
  const simulated = ledger ? ledger?.simulated !== false && ledger?.result?.simulated !== false : null;

  return (
    <>
      <Head
        over={guarantee.issuing_agency ? guarantee.issuing_agency.toUpperCase() : "DIGITAL GUARANTEE LETTER"}
        title={`Guarantee Letter ${guarantee.gl_number}`}
        text="Issued electronically. Notifications are sent to the applicant and the hospital by the backend."
        action={<Status tone={guarantee.status === "valid" ? "green" : guarantee.status === "expired" ? "red" : "orange"}>{guarantee.status?.replace(/_/g, " ") || "—"}</Status>}
      />

      <div className="letterGrid">
        <section className="letter">
          <header style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.75rem" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "#1e1b4b" }}>{guarantee.issuing_agency || "Issuing Agency"}</div>
              <small style={{ fontWeight: 700, color: "#6366f1", fontSize: "0.85rem" }}>Republic of the Philippines</small>
            </div>
            <div style={{ textAlign: "center", background: "#f5f3ff", padding: "0.6rem 1.25rem", borderRadius: "16px", border: "2px solid #1e1b4b", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
              <small style={{ color: "#6366f1", fontWeight: 900, letterSpacing: "0.08em", fontSize: "0.75rem" }}>GUARANTEE NO.</small>
              <div style={{ fontWeight: 900, fontSize: "1.35rem", color: "#1e1b4b", marginTop: "0.15rem" }}>{guarantee.gl_number}</div>
            </div>
          </header>

          <div className="letterTitle">
            <label style={{ fontSize: "0.8rem", letterSpacing: "0.1em", fontWeight: 900, color: "#6366f1" }}>MEDICAL ASSISTANCE</label>
            <h1>Guarantee Letter</h1>
            <p style={{ color: "#4338ca", fontSize: "0.9rem", fontWeight: 700 }}>
              Issued {dateOnly(guarantee.issue_date)} · Valid until {dateOnly(guarantee.expiration_date)}
            </p>
          </div>

          <p style={{ fontSize: "1rem", lineHeight: 1.6, fontWeight: 700 }}>
            To: <b>{guarantee.hospital_name || "—"}</b>
          </p>
          <p style={{ fontSize: "1rem", lineHeight: 1.6, fontWeight: 600 }}>
            This certifies that {guarantee.issuing_agency || "the issuing agency"} guarantees payment for eligible medical services rendered to the patient below up to the approved amount stated.
          </p>

          <div className="letterDetails">
            <span>
              Patient
              <b>{(guarantee.patient_name || "—").toUpperCase()}</b>
            </span>
            <span>
              Applicant / Representative
              <b>{(guarantee.applicant_name || "—").toUpperCase()}</b>
            </span>
            <span>
              Covered Medical Service
              <b>{guarantee.covered_service || "—"}</b>
            </span>
            <span>
              Approved Amount
              <strong>{money(approved)}</strong>
            </span>
            <span>
              Utilized to Date
              <b>{money(utilized)}</b>
            </span>
            <span>
              Remaining Value
              <b>{money(remaining)}</b>
            </span>
          </div>

          <footer>
            <div>
              <small style={{ color: "#6366f1", fontWeight: 800, display: "block" }}>Digitally Signed by</small>
              <b style={{ fontSize: "1.2rem", fontWeight: 900 }}>{guarantee.digital_signatory_name || "—"}</b>
              <small style={{ display: "block", color: "#4338ca", fontWeight: 700 }}>{guarantee.digital_signatory_role || ""}</small>
            </div>
            <div style={{ textAlign: "center" }}>
              {/* Quiet zone so a screenshot of this QR decodes on the hospital's Validate Guarantee upload */}
              <QRCodeSVG value={qrValue} size={120} marginSize={2} />
              <small style={{ display: "block", fontSize: "0.75rem", color: "#4338ca", fontWeight: 800, marginTop: "0.35rem" }}>Scan to verify authenticity</small>
            </div>
          </footer>

          <div style={{ marginTop: "1.75rem", padding: "0.85rem 1.25rem", background: "#f5f3ff", borderRadius: 16, border: "2px solid #1e1b4b", fontSize: "0.8rem", fontWeight: 800, color: "#1e1b4b", display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <ShieldCheck size={18} color="#059669" />{" "}
            <span>
              Digital Reference: <b>{guarantee.chain_reference || "—"}</b> (recorded reference)
            </span>
          </div>

          <div style={{ background: "#e0e7ff", border: "2px solid #4338ca", borderRadius: 16, padding: "1rem 1.25rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Network size={18} style={{ color: "#4338ca" }} />
              <span style={{ fontWeight: 900, fontSize: "0.85rem", color: "#1e1b4b" }}>Ledger Reference</span>
            </div>
            <small style={{ display: "block", fontWeight: 700, color: "#4338ca", marginBottom: "0.6rem" }}>
              The record reference above is stored by GabayMed. A ledger transaction exists only when a contract address is configured server-side.
            </small>
            <button
              onClick={checkLedger}
              disabled={ledgerBusy}
              style={{ background: "#4338ca", color: "white", border: "2px solid #1e1b4b", borderRadius: 10, padding: "0.5rem 1rem", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <ShieldCheck size={16} /> {ledgerBusy ? "Checking ledger..." : "Check ledger record"}
            </button>

            {ledger && (
              <div style={{ marginTop: "0.75rem", background: "#ffffff", border: "2px solid #1e1b4b", borderRadius: 12, padding: "0.75rem 0.9rem", fontSize: "0.78rem", fontWeight: 700, color: "#1e1b4b" }}>
                {ledger.error ? (
                  <span style={{ color: "#991b1b" }}>{ledger.error.message || "The ledger check failed."}</span>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <div>
                      Ledger: <b>{ledger.result?.chain_name || ledger.chain_name || "—"}</b>
                    </div>
                    <div>
                      State: <b style={{ color: simulated ? "#b45309" : "#166534" }}>{ledger.result?.state || "—"}</b>
                    </div>
                    <div>
                      Simulated: <b>{String(ledger.simulated ?? ledger.result?.simulated ?? "—")}</b>
                    </div>
                    {ledger.result?.note && <div style={{ color: "#92400e" }}>{ledger.result.note}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <aside>
          <div className="card">
            <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 900 }}>GUARANTEE ACTIONS</label>
            <h3 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#1e1b4b", margin: "0.5rem 0" }}>{money(approved)}</h3>
            <p style={{ fontSize: "0.9rem", color: "#4338ca", fontWeight: 700, marginBottom: "1.5rem" }}>
              Status: {utilized > 0 ? `${money(utilized)} utilized · ${money(remaining)} remaining` : "Valid for hospital billing"}
            </p>
            <button className="primary wide" style={{ marginBottom: "1rem" }} onClick={() => typeof window !== "undefined" && window.print()}>
              <FileText size={20} /> Print / Save PDF
            </button>
            <button className="outline wide" onClick={() => go("validate")}>
              <ScanLine size={20} /> Provider Validation
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

type LookupState =
  | { status: "idle" }
  | { status: "reading" }
  | { status: "verifying"; gl: string }
  | { status: "verified"; gl: string; guarantee: any }
  | { status: "error"; message: string };

const parsePeso = (s: string) => Number(s.replace(/[₱,\s]/g, ""));

/** The QR encodes qr_payload JSON; older letters may only carry the GL number. */
function glFromQrPayload(text: string): string | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.gl_number === "string") return parsed.gl_number;
  } catch {
    // not JSON — fall through to the regex
  }
  return text.match(/GL-[A-Z]+-\d{4}-\d{5}/i)?.[0] ?? null;
}

export function ValidateView({
  selection,
  notify,
}: {
  selection: Selection;
  notify: (s: string) => void;
}) {
  const [glInput, setGlInput] = React.useState("");
  const [lookup, setLookup] = React.useState<LookupState>({ status: "idle" });
  const [qrPreview, setQrPreview] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [billingRef, setBillingRef] = React.useState("");
  const [settling, setSettling] = React.useState(false);
  const [receipt, setReceipt] = React.useState<any>(null);
  const [actionError, setActionError] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const lookupIdRef = React.useRef(0);

  React.useEffect(
    () => () => {
      if (qrPreview) URL.revokeObjectURL(qrPreview);
    },
    [qrPreview]
  );

  // Prefill from the guarantee the user was just looking at, when there is one.
  React.useEffect(() => {
    if (!selection.guaranteeId) return;
    let cancelled = false;
    api
      .getGuarantee(selection.guaranteeId)
      .then((res) => {
        if (cancelled || !res?.guarantee?.gl_number) return;
        setGlInput(res.guarantee.gl_number);
        setLookup({ status: "verified", gl: res.guarantee.gl_number, guarantee: res.guarantee });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [selection.guaranteeId]);

  const guarantee = lookup.status === "verified" ? lookup.guarantee : null;
  const approved = Number(guarantee?.approved_amount || 0);
  const utilized = Number(guarantee?.utilized_amount || 0);
  const balance = typeof guarantee?.remaining_value === "number" ? Number(guarantee.remaining_value) : Math.max(0, approved - utilized);
  const amountValue = parsePeso(amount);
  const billingRefValue = billingRef.trim();
  const amountError =
    !amount
      ? ""
      : !Number.isFinite(amountValue) || amountValue <= 0
      ? "Enter the billed amount"
      : amountValue > balance
      ? `Exceeds available balance of ${money(balance)}`
      : "";

  const verifyGl = async (raw: string) => {
    const gl = raw.trim().toUpperCase();
    const id = ++lookupIdRef.current;
    setReceipt(null);
    setActionError("");
    if (!gl) {
      setLookup({ status: "error", message: "Upload the guarantee letter QR or enter its GL number." });
      return;
    }

    setLookup({ status: "verifying", gl });
    try {
      const [res] = await Promise.all([
        api.validateGuarantee(gl),
        new Promise((r) => setTimeout(r, 600)),
      ]);
      if (id !== lookupIdRef.current) return;
      setLookup({ status: "verified", gl: res.guarantee?.gl_number || gl, guarantee: res.guarantee });
    } catch (err: any) {
      if (id !== lookupIdRef.current) return;
      setLookup({ status: "error", message: err?.message || `No issued guarantee letter found for ${gl}.` });
    }
  };

  const handleQrFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLookup({ status: "error", message: "That file isn't an image. Upload a PNG or JPG of the guarantee letter QR." });
      return;
    }
    const id = ++lookupIdRef.current;
    setQrPreview(URL.createObjectURL(file));
    setLookup({ status: "reading" });
    const text = await decodeQrImage(file);
    if (id !== lookupIdRef.current) return;
    if (!text) {
      setLookup({ status: "error", message: "Couldn't find a QR code in that image. Try a sharper screenshot, or type the GL number." });
      return;
    }
    const gl = glFromQrPayload(text);
    if (!gl) {
      setLookup({ status: "error", message: "That QR isn't a GabayMed guarantee letter." });
      return;
    }
    setGlInput(gl.toUpperCase());
    await verifyGl(gl);
  };

  const handleRecordUtilization = async () => {
    if (!guarantee || amountError || !billingRefValue) return;
    setSettling(true);
    setActionError("");
    try {
      // ONE call: the backend records the utilization, settles via eGovPay and
      // returns the new balance, so the frontend never settles twice.
      const res = await api.recordUtilization(guarantee.id, amountValue, billingRefValue);
      setReceipt(res);
      if (res.guarantee) {
        setLookup({
          status: "verified",
          gl: guarantee.gl_number,
          guarantee: {
            ...guarantee,
            approved_amount: res.guarantee.approved_amount,
            utilized_amount: res.guarantee.utilized_amount,
            remaining_value: res.guarantee.remaining_value,
            status: res.guarantee_status,
          },
        });
      }
      setAmount("");
      notify(res.message || `Utilization of ${money(amountValue)} recorded.`);
    } catch (err: any) {
      setActionError(err?.message || "The utilization could not be recorded.");
    } finally {
      setSettling(false);
    }
  };

  const verified = lookup.status === "verified";
  const busy = lookup.status === "reading" || lookup.status === "verifying";

  return (
    <>
      <Head over="PROVIDER VERIFICATION" title="Validate Guarantee Letter" text="Upload the guarantee letter QR or enter its GL number, then record the hospital bill against it." />
      <div className="cols validateCols">
        <section className="card">
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900 }}>Scan / Enter Reference</h2>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              handleQrFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleQrFile(e.dataTransfer.files?.[0]);
            }}
            disabled={busy}
            style={{ width: "100%", background: dragOver ? "#e0e7ff" : "#f5f3ff", padding: "1.75rem 1.25rem", border: "2.5px dashed #1e1b4b", borderRadius: 24, textAlign: "center", marginBottom: "1rem", cursor: busy ? "wait" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem", color: "#1e1b4b" }}
          >
            {qrPreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img src={qrPreview} alt="Uploaded guarantee letter QR" style={{ width: 132, height: 132, objectFit: "contain", background: "#ffffff", border: "2px solid #1e1b4b", borderRadius: 14, padding: 6 }} />
            ) : (
              <ScanLine size={56} color="#1e1b4b" />
            )}
            <b style={{ fontSize: "1.1rem", fontWeight: 900 }}>{qrPreview ? "Upload a different QR" : "Upload Guarantee Letter QR"}</b>
            <small style={{ color: "#4338ca", fontWeight: 700 }}>Screenshot or photo of the QR on the applicant&apos;s guarantee letter · or drop it here</small>
          </button>

          <div aria-live="polite" style={{ minHeight: "1.6rem", marginBottom: "1rem", fontSize: "0.85rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.45rem", color: lookup.status === "error" ? "#b91c1c" : lookup.status === "verified" ? "#166534" : "#4338ca" }}>
            {lookup.status === "reading" && <><RefreshCw size={16} className="animate-spin" /> Reading QR code...</>}
            {lookup.status === "verifying" && <><RefreshCw size={16} className="animate-spin" /> {lookup.gl} decoded · checking the guarantee register...</>}
            {lookup.status === "verified" && <><CheckCircle2 size={16} /> {lookup.gl} · verified against the guarantee register</>}
            {lookup.status === "error" && <><AlertTriangle size={16} /> {lookup.message}</>}
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 800, marginBottom: "1.25rem" }}>
            Guarantee Letter Number
            <input
              value={glInput}
              onChange={(e) => setGlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verifyGl(glInput)}
              placeholder="GL-AGENCY-YYYY-00001"
              style={{ padding: "0.75rem", borderRadius: 16, border: "2.5px solid #1e1b4b", fontWeight: 800 }}
            />
          </label>

          <button className="primary wide" disabled={busy} onClick={() => verifyGl(glInput)}>
            <Search size={20} /> Verify Guarantee Record
          </button>
        </section>

        {!verified ? (
          <section className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "0.6rem", color: "#4338ca", minHeight: 280 }}>
            <QrCode size={48} color="#6366f1" />
            <b style={{ color: "#1e1b4b", fontSize: "1.1rem" }}>Awaiting guarantee letter</b>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", maxWidth: 320 }}>Upload the GL QR or enter the GL number to pull the verified record and record billing.</span>
          </section>
        ) : (
          <section className="card" style={{ background: "#dcfce7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ color: "#14532d", fontWeight: 900, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <CheckCircle2 size={20} /> VERIFIED GUARANTEE RECORD
              </span>
              <Status tone="green">{utilizationLabel(utilized, approved, "Valid")}</Status>
            </div>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0, color: "#14532d" }}>{guarantee.patient_name || "—"}</h2>
            <p style={{ fontSize: "0.9rem", color: "#166534", fontWeight: 700, marginTop: "0.2rem" }}>
              Covered service: {guarantee.covered_service || "—"} · Applicant: {(guarantee.applicant_name || "—").toUpperCase()}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", margin: "1.25rem 0", background: "#ffffff", padding: "1.25rem", borderRadius: 20, border: "2px solid #1e1b4b", fontSize: "0.9rem", fontWeight: 800 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}><span>Guarantee No.</span><b>{guarantee.gl_number}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}><span>Issuing Agency</span><b>{guarantee.issuing_agency || "—"}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}><span>Hospital</span><b>{guarantee.hospital_name || "—"}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}><span>Approved Guarantee</span><b>{money(approved)}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}><span>Utilized to Date</span><b>{money(utilized)}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}><span>Available Balance</span><b style={{ color: "#059669" }}>{money(balance)}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}><span>Expiration Date</span><b>{dateOnly(guarantee.expiration_date)}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}><span>Record Reference</span><b style={{ color: "#166534" }}>{guarantee.chain_reference || "—"}</b></div>
            </div>

            <div style={{ background: "#ffffff", padding: "1rem 1.25rem", borderRadius: 20, border: "2px solid #1e1b4b", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "#6366f1", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>BILLING UTILIZATION</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 800 }}>
                  Amount (₱)
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" disabled={balance <= 0} style={{ padding: "0.65rem", borderRadius: 14, border: "2px solid #1e1b4b", fontWeight: 800 }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 800 }}>
                  Billing Reference
                  <input value={billingRef} onChange={(e) => setBillingRef(e.target.value)} placeholder="HSP-BILL-..." disabled={balance <= 0} style={{ padding: "0.65rem", borderRadius: 14, border: "2px solid #1e1b4b", fontWeight: 800 }} />
                </label>
              </div>
              {balance > 0 && amountError && <small style={{ display: "block", marginTop: "0.5rem", color: "#b91c1c", fontWeight: 800 }}>{amountError}</small>}
            </div>

            {actionError && (
              <div role="alert" style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: 14, padding: "0.7rem 0.95rem", marginBottom: "0.85rem", color: "#991b1b", fontWeight: 800, display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <AlertTriangle size={16} color="#dc2626" /> {actionError}
              </div>
            )}

            <button
              disabled={balance <= 0 || settling || !!amountError || !amountValue || !billingRefValue}
              className="primary wide"
              onClick={handleRecordUtilization}
            >
              <CheckCircle2 size={20} /> {balance <= 0 ? "Guarantee Fully Utilized & Settled" : settling ? "Recording & settling..." : "Record Utilization"}
            </button>

            {/* Settlement receipt, rendered from the backend's response */}
            {receipt && (
              <div style={{ marginTop: "1.25rem", background: "#1e1b4b", color: "#ffffff", borderRadius: 20, padding: "1.25rem", border: "2.5px solid #312e81", boxShadow: "0 6px 0 #0f172a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#818cf8", letterSpacing: "0.08em" }}>RECORDED UTILIZATION & SETTLEMENT</span>
                  <span style={{ fontSize: "0.725rem", background: "#059669", color: "#ffffff", padding: "0.2rem 0.6rem", borderRadius: 8, fontWeight: 900 }}>
                    {(receipt.guarantee_status || "recorded").toString().toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ffffff", marginBottom: "0.25rem" }}>
                  {money(Number(receipt.utilization?.utilized_amount ?? 0))} recorded
                </div>
                {receipt.settlement?.gateway && (
                  <div style={{ fontSize: "0.8rem", color: "#c7d2fe", fontWeight: 700, marginBottom: "0.85rem" }}>{receipt.settlement.gateway}</div>
                )}

                <div style={{ background: "#312e81", padding: "0.85rem", borderRadius: 14, fontSize: "0.775rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ color: "#a5b4fc" }}>Transaction Ref:</span>
                    <b style={{ color: "#ffffff", fontFamily: "monospace" }}>{receipt.settlement?.transaction_ref || "—"}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ color: "#a5b4fc" }}>Hospital Billing Ref:</span>
                    <b style={{ color: "#ffffff", fontFamily: "monospace" }}>{receipt.utilization?.billing_reference || "—"}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ color: "#a5b4fc" }}>Remaining GL Balance:</span>
                    <b style={{ color: "#34d399" }}>
                      {typeof receipt.guarantee?.remaining_value === "number" ? money(Number(receipt.guarantee.remaining_value)) : "—"}
                    </b>
                  </div>
                  {receipt.settlement?.settlement_uuid && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ color: "#a5b4fc" }}>Settlement UUID:</span>
                      <b style={{ color: "#34d399", fontFamily: "monospace" }}>{receipt.settlement.settlement_uuid}</b>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
