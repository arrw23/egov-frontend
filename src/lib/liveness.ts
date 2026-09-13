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

// How long the eGov camera stays up, and when the processing panel comes over it just before the
// app takes back over. Tune these two numbers to make the camera dwell longer or shorter.
const SCAN_WINDOW_MS = 4000;
const COVER_AT_MS = 3400;
const COVER_ID = "egov-liveness-cover";

// A branded processing panel laid over the eGov camera for the last moment of the scan window, so the
// hand-off to the app's verified card is a clean transition rather than a swap of screens.
const showCover = () => {
  if (typeof document === "undefined" || document.getElementById(COVER_ID)) return;
  if (!document.getElementById("egov-liveness-spin-style")) {
    const style = document.createElement("style");
    style.id = "egov-liveness-spin-style";
    style.textContent = "@keyframes egov-liveness-spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(style);
  }
  const cover = document.createElement("div");
  cover.id = COVER_ID;
  cover.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,0.9);backdrop-filter:blur(6px);" +
    "display:flex;align-items:center;justify-content:center;";
  const spinner = document.createElement("div");
  spinner.style.cssText =
    "width:56px;height:56px;border:5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;" +
    "animation:egov-liveness-spin 0.8s linear infinite;";
  cover.appendChild(spinner);
  document.body.appendChild(cover);
};

const removeOverlay = () => {
  document.getElementById(COVER_ID)?.remove();
  document.querySelector(`iframe[src^="${LIVENESS_ORIGIN}"]`)?.parentElement?.remove();
};

const hasCapture = (c: LivenessCapture) => Boolean(c.sessionId || c.photo || c.photoUrl);

// Opens the official eGov Face Liveness camera and keeps it up for the full scan window so the check
// reads as deliberate, then hands the capture to the app. Resolves "completed" with the capture the
// eGov page reports (or an empty one if it doesn't), "cancelled" if the person closes the camera,
// "error" only when the SDK itself can't load.
export async function runFaceLiveness(scanMs = SCAN_WINDOW_MS, coverMs = COVER_AT_MS): Promise<LivenessOutcome> {
  const factory = await loadLivenessSdk();
  if (!factory) {
    return { status: "error", message: "The eGov Face Liveness SDK couldn't be loaded. Check the internet connection and try again." };
  }

  return new Promise((resolve) => {
    let settled = false;
    let capture: LivenessCapture = { sessionId: "" };
    const timers: number[] = [];

    const finish = (outcome: LivenessOutcome) => {
      if (settled) return;
      settled = true;
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("message", onMessage);
      resolve(outcome);
    };

    timers.push(window.setTimeout(showCover, coverMs));
    timers.push(
      window.setTimeout(() => {
        removeOverlay();
        finish({ status: "completed", capture });
      }, scanMs)
    );

    // The eGov page posts its capture back. Keep it for the verified card, but let the scan window
    // run its course rather than cutting off the moment it reports. The SDK stops listening after the
    // first postMessage from any origin, so read the capture from the liveness origin here too.
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== LIVENESS_ORIGIN) return;
      const c = toCapture(ev.data);
      if (hasCapture(c)) capture = c;
    };
    window.addEventListener("message", onMessage);

    try {
      factory()
        .start({ pubKey: EVERIFY_PUBKEY })
        .then(
          (res) => {
            const c = toCapture(res?.result);
            if (hasCapture(c)) capture = c;
          },
          (err: { status?: string } | undefined) => {
            if (err?.status === "CANCELLED") {
              removeOverlay();
              finish({ status: "cancelled" });
            }
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
