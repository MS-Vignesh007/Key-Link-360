import type { QRCodeItem } from "../types";
import { buildQrImageUrl } from "./qrCodes";

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch as blob first so canvas is not CORS-tainted by the QR CDN.
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load image (${response.status})`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to decode image"));
      };
      img.src = objectUrl;
    } catch (error) {
      reject(error);
    }
  });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode logo"));
    img.src = dataUrl;
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/** Turn near-white QR background pixels fully transparent (PNG/SVG). */
function punchWhiteBackgroundToTransparent(ctx: CanvasRenderingContext2D, size: number) {
  const image = ctx.getImageData(0, 0, size, size);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // QR modules are solid brand color; background is white / near-white.
    if (r >= 245 && g >= 245 && b >= 245) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(image, 0, 0);
}

export type BrandedQrExportOptions = {
  scanUrl: string;
  color: string;
  size: number;
  designPattern?: QRCodeItem["designPattern"];
  designLogo?: QRCodeItem["designLogo"];
  designLogoUrl?: string;
  /** PNG/SVG: transparent QR background. JPEG/PDF: keep white. */
  transparentBackground?: boolean;
};

/** Renders QR + frame style + center brand mark exactly like Live style preview. */
export async function renderBrandedQrCanvas(
  options: BrandedQrExportOptions
): Promise<HTMLCanvasElement> {
  const size = Math.max(256, Math.floor(options.size));
  const pattern = options.designPattern || "rounded";
  const transparent = Boolean(options.transparentBackground);
  const qrSourceSize = Math.min(1000, Math.max(size, 500));
  const qrUrl = buildQrImageUrl(options.scanUrl, options.color, qrSourceSize);
  const qrImage = await loadImageFromUrl(qrUrl);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.clearRect(0, 0, size, size);
  if (!transparent) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
  }

  const compactScale = pattern === "compact" ? 0.92 : 1;
  const drawSize = size * compactScale;
  const offset = (size - drawSize) / 2;
  const cornerRadius =
    pattern === "rounded" ? drawSize * 0.08 : pattern === "compact" ? drawSize * 0.05 : 0;

  ctx.save();
  if (cornerRadius > 0) {
    roundRectPath(ctx, offset, offset, drawSize, drawSize, cornerRadius);
    ctx.clip();
  }
  ctx.drawImage(qrImage, offset, offset, drawSize, drawSize);
  ctx.restore();

  if (transparent) {
    punchWhiteBackgroundToTransparent(ctx, size);
  }

  const hasLogo = options.designLogo === "custom" && Boolean(options.designLogoUrl);
  if (hasLogo && options.designLogoUrl) {
    const logo = await loadImageFromDataUrl(options.designLogoUrl);
    // Match Live preview badge: ~18% of QR, circular crop, thin ring — no white plate.
    const badgeSize = drawSize * 0.18;
    const cx = size / 2;
    const cy = size / 2;
    const radius = badgeSize / 2;
    const ring = Math.max(2, size * 0.006);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, cx - radius, cy - radius, badgeSize, badgeSize);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, radius + ring / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = ring;
    ctx.stroke();
  }

  return canvas;
}

export async function exportBrandedQrPngBlob(options: BrandedQrExportOptions): Promise<Blob> {
  const canvas = await renderBrandedQrCanvas({ ...options, transparentBackground: true });
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG export failed");
  return blob;
}

export async function exportBrandedQrJpegBlob(options: BrandedQrExportOptions): Promise<Blob> {
  const canvas = await renderBrandedQrCanvas({ ...options, transparentBackground: false });
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  );
  if (!blob) throw new Error("JPEG export failed");
  return blob;
}

export async function exportBrandedQrPngDataUrl(options: BrandedQrExportOptions): Promise<string> {
  const canvas = await renderBrandedQrCanvas({
    ...options,
    transparentBackground: options.transparentBackground ?? false
  });
  return canvas.toDataURL("image/png");
}

export async function exportBrandedQrSvgBlob(options: BrandedQrExportOptions): Promise<Blob> {
  const pngDataUrl = await exportBrandedQrPngDataUrl({
    ...options,
    size: Math.max(options.size, 1000),
    transparentBackground: true
  });
  const size = Math.max(256, Math.floor(options.size));
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <image href="${pngDataUrl}" width="${size}" height="${size}" />
</svg>`;
  return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
}

export function triggerBrowserDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
