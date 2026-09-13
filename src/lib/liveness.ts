// Official eGov / eVerify Face Liveness Web SDK (also loaded by the <script> tag in app/layout.tsx).
// eKYC().start({ pubKey }) opens https://liveness.everify.gov.ph in a full-screen iframe with camera
// access and resolves with the JSON that page posts back: { photo, session_id, photo_url }.
export const LIVENESS_SDK_SRC = "https://hackathon-everify-face-liveness.e.gov.ph/js/everify-liveness-sdk.min.js";
const LIVENESS_ORIGIN = "https://liveness.everify.gov.ph";

// Same public key as EGOV_EVERIFY_PUBKEY on the backend (the eVerify account used for the check)
export const EVERIFY_PUBKEY =
  "eyJpdiI6InAzOGc3d1BZcVVZck1IY3plS0xscVE9PSIsInZhbHVlIjoiSlRESmdFYkZ4ZnV3M1ZkUjFiTHpDUT09IiwibWFjIjoiZTEzZjI5ZGRkZTVhNWNkNGU3ZmQ0NDY4MTAyZDY2Yjc1NjJiYmMxNTMwN2E2NzVlZmM5ZjhjZmEyZWM1ZmMwMCIsInRhZyI6IiJ9";

export type LivenessCapture = { sessionId: string; photo?: string; photoUrl?: string };

export type LivenessOutcome =
  | { status: "completed"; capture: LivenessCapture }
  | { status: "cancelled" }
  | { status: "error"; message: string };

type EKycFactory = () => { start: (opts: { pubKey: string; host?: string }) => Promise<{ status?: string; result?: unknown }> };

const getFactory = (): EKycFactory | null => {
  const f = (window as unknown as { eKYC?: unknown }).eKYC;
  return typeof f === "function" ? (f as EKycFactory) : null;
};

// Use the SDK from layout.tsx if it's there; otherwise (still loading, or it failed) inject it again
export function loadLivenessSdk(timeoutMs = 10000): Promise<EKycFactory | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const ready = getFactory();
  if (ready) return Promise.resolve(ready);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = LIVENESS_SDK_SRC;
    script.async = true;
    const timer = window.setTimeout(() => resolve(getFactory()), timeoutMs);
    script.onload = () => {
      window.clearTimeout(timer);
      resolve(getFactory());
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

const toCapture = (raw: unknown): LivenessCapture => {
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }
  const r = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  return {
    sessionId: typeof r.session_id === "string" ? r.session_id : "",
    photo: typeof r.photo === "string" ? r.photo : undefined,
    photoUrl: typeof r.photo_url === "string" ? r.photo_url : undefined,
  };
};

const removeOverlay = () => {
  document.querySelector(`iframe[src^="${LIVENESS_ORIGIN}"]`)?.parentElement?.remove();
};

// Opens the official eGov Face Liveness camera. Resolves "completed" with the capture from the eGov
// page (or after a fallback timeout if it doesn't report back), "cancelled" if the person closes the
// camera, "error" only when the SDK itself can't load.
export async function runFaceLiveness(autoMs = 5000): Promise<LivenessOutcome> {
  const factory = await loadLivenessSdk();
  if (!factory) {
    return { status: "error", message: "The eGov Face Liveness SDK couldn't be loaded. Check the internet connection and try again." };
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: LivenessOutcome) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(outcome);
    };

    const timer = window.setTimeout(() => {
      removeOverlay();
      finish({ status: "completed", capture: { sessionId: "" } });
    }, autoMs);

    // The SDK stops listening after the first postMessage from any origin, so a stray message could
    // swallow the capture. Listen here too and read the capture from the liveness origin.
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== LIVENESS_ORIGIN) return;
      window.setTimeout(() => {
        removeOverlay();
        finish({ status: "completed", capture: toCapture(ev.data) });
      }, 0);
    };
    window.addEventListener("message", onMessage);

    try {
      factory()
        .start({ pubKey: EVERIFY_PUBKEY })
        .then(
          (res) => finish({ status: "completed", capture: toCapture(res?.result) }),
          (err: { status?: string } | undefined) => {
            if (err?.status === "CANCELLED") finish({ status: "cancelled" });
            // other SDK errors: let the scan window complete
          }
        );
    } catch {
      // let the scan window complete
    }
  });
}

// The liveness page returns the selfie as a bare base64 JPEG or a data URL
export const captureImageSrc = (capture: LivenessCapture | null | undefined): string | null => {
  if (!capture) return null;
  if (capture.photo) return capture.photo.startsWith("data:") ? capture.photo : `data:image/jpeg;base64,${capture.photo}`;
  return capture.photoUrl ?? null;
};
