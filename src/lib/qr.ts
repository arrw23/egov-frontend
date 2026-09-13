import jsQR from "jsqr";

// Decode a QR from an uploaded screenshot/photo. Pads with white (some QRs have no quiet zone)
// and upscales small screenshots so jsQR can find the finder patterns.
export const decodeQrImage = (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const longest = Math.max(img.width, img.height);
      const scale = longest < 600 ? 600 / longest : Math.min(1, 1400 / longest);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const pad = Math.round(Math.max(w, h) * 0.12);
      const canvas = document.createElement("canvas");
      canvas.width = w + pad * 2;
      canvas.height = h + pad * 2;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return resolve(null);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = scale < 1;
      ctx.drawImage(img, pad, pad, w, h);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(jsQR(data, canvas.width, canvas.height, { inversionAttempts: "attemptBoth" })?.data ?? null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
