"use client";

import { formatMontant } from "@/lib/currencies";
import type { DeviseCode } from "@/lib/currencies";

export interface PosterEventData {
  id: string;
  nom: string;
  date_debut: string;
  heure_debut: string | null;
  heure_fin?: string | null;
  lieu: string;
  ville: string | null;
  logo_url: string | null;
  cover_url: string | null;
  ticket_types?: Array<{ nom: string; prix: number }>;
}

/** Loads an image from URL, returns null on failure */
async function loadImage(url: string): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
    });
    return img;
  } catch {
    return null;
  }
}

/** Draws a rounded rect clip and draws the image inside */
function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, size: number, radius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + size, y, x + size, y + size, radius);
  ctx.arcTo(x + size, y + size, x, y + size, radius);
  ctx.arcTo(x, y + size, x, y, radius);
  ctx.arcTo(x, y, x + size, y, radius);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();

  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + size, y, x + size, y + size, radius);
  ctx.arcTo(x + size, y + size, x, y + size, radius);
  ctx.arcTo(x, y + size, x, y, radius);
  ctx.arcTo(x, y, x + size, y, radius);
  ctx.closePath();
  ctx.stroke();
}

/** Draws a rounded rect */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill?: string, stroke?: string
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

/** Word-wrap text and draw it */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, startY: number,
  maxWidth: number, lineHeight: number,
  font: string, color: string
): number {
  ctx.font = font;
  ctx.fillStyle = color;
  const words = text.split(" ");
  let line = "";
  let y = startY;
  for (const word of words) {
    const test = line + (line ? " " : "") + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
  return y;
}

function formatDateFr(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeFr(time: string): string {
  return time.slice(0, 5);
}

/**
 * Generate a poster PNG (1080×1920 – story/A4) with event QR code
 * and trigger a download.
 */
export async function generateEventPoster(
  evt: PosterEventData,
  devise: DeviseCode
): Promise<void> {
  const canvas = document.createElement("canvas");
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // ── Background ──
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // ── Cover image (top ~40%) ──
  const coverH = 760;
  let coverLoaded = false;
  if (evt.cover_url) {
    const coverImg = await loadImage(evt.cover_url);
    if (coverImg) {
      const scale = Math.max(W / coverImg.width, coverH / coverImg.height);
      const sw = W / scale;
      const sh = coverH / scale;
      ctx.drawImage(
        coverImg,
        (coverImg.width - sw) / 2, (coverImg.height - sh) / 2, sw, sh,
        0, 0, W, coverH
      );
      // Dark gradient overlay at bottom
      const grad = ctx.createLinearGradient(0, coverH - 250, 0, coverH);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, coverH - 250, W, 250);
      coverLoaded = true;
    }
  }

  if (!coverLoaded) {
    // Emerald gradient fallback
    const grad = ctx.createLinearGradient(0, 0, W, coverH);
    grad.addColorStop(0, "#10b981");
    grad.addColorStop(1, "#059669");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, coverH);
  }

  // ── Logo on cover ──
  let logoLoaded = false;
  if (evt.logo_url) {
    const logo = await loadImage(evt.logo_url);
    if (logo) {
      drawRoundedImage(ctx, logo, 60, 620, 100, 20);
      logoLoaded = true;
    }
  }

  // ── Event name on cover ──
  const nameX = logoLoaded ? 180 : 60;
  drawWrappedText(
    ctx, evt.nom, nameX, 680,
    W - nameX - 60, 60,
    `bold 52px ${FONT}`, "#ffffff"
  );

  // ══════ Content area ══════
  let y = 810;

  // ── Date ──
  ctx.fillStyle = "#10b981";
  ctx.font = `bold 18px ${FONT}`;
  ctx.fillText("📅  DATE", 60, y);
  y += 42;
  ctx.fillStyle = "#111827";
  ctx.font = `bold 32px ${FONT}`;
  const dateStr = formatDateFr(evt.date_debut);
  ctx.fillText(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), 60, y);
  if (evt.heure_debut) {
    y += 38;
    ctx.fillStyle = "#6b7280";
    ctx.font = `500 26px ${FONT}`;
    const timeStr = `🕐  ${formatTimeFr(evt.heure_debut)}${evt.heure_fin ? ` — ${formatTimeFr(evt.heure_fin)}` : ""}`;
    ctx.fillText(timeStr, 60, y);
  }

  // ── Lieu ──
  y += 60;
  ctx.fillStyle = "#10b981";
  ctx.font = `bold 18px ${FONT}`;
  ctx.fillText("📍  LIEU", 60, y);
  y += 42;
  ctx.fillStyle = "#111827";
  ctx.font = `bold 32px ${FONT}`;
  ctx.fillText(evt.lieu, 60, y);
  if (evt.ville) {
    y += 38;
    ctx.fillStyle = "#6b7280";
    ctx.font = `500 26px ${FONT}`;
    ctx.fillText(evt.ville, 60, y);
  }

  // ── QR Code ──
  y += 80;
  const qrSize = 280;
  const qrX = (W - qrSize) / 2;
  const qrY = y;

  // QR background card
  const cardPad = 40;
  const cardW = qrSize + cardPad * 2;
  const cardH = qrSize + cardPad * 2 + 80;
  const cardX = (W - cardW) / 2;
  const cardY = qrY - cardPad;
  roundedRect(ctx, cardX, cardY, cardW, cardH, 20, "#f9fafb", "#e5e7eb");

  // Render QR via hidden SVG
  const eventUrl = `${window.location.origin}/evenement/${evt.id}`;
  await new Promise<void>((resolve) => {
    const tempDiv = document.createElement("div");
    tempDiv.style.cssText = "position:absolute;left:-9999px";
    document.body.appendChild(tempDiv);

    // Dynamic requires — we're in a "use client" module
    const React = require("react");
    const { createRoot } = require("react-dom/client");
    const { QRCodeSVG } = require("qrcode.react");

    const root = createRoot(tempDiv);
    root.render(
      React.createElement(QRCodeSVG, {
        value: eventUrl,
        size: qrSize,
        level: "H",
        includeMargin: false,
      })
    );

    setTimeout(() => {
      const svg = tempDiv.querySelector("svg");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          URL.revokeObjectURL(url);
          root.unmount();
          document.body.removeChild(tempDiv);
          resolve();
        };
        img.onerror = () => {
          root.unmount();
          document.body.removeChild(tempDiv);
          resolve();
        };
        img.src = url;
      } else {
        root.unmount();
        document.body.removeChild(tempDiv);
        resolve();
      }
    }, 250);
  });

  // "Scannez pour réserver"
  ctx.fillStyle = "#374151";
  ctx.font = `bold 24px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("Scannez pour réserver", W / 2, qrY + qrSize + 50);
  ctx.textAlign = "left";

  // ── Ticket types ──
  y = qrY + qrSize + cardPad + 100;
  if (evt.ticket_types && evt.ticket_types.length > 0) {
    ctx.fillStyle = "#10b981";
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillText("🎟️  BILLETS", 60, y);
    y += 45;

    for (const tt of evt.ticket_types) {
      const ttW = W - 120;
      const ttH = 64;
      const ttX = 60;

      // Pill background
      roundedRect(ctx, ttX, y, ttW, ttH, 14, "#f0fdf4", "#bbf7d0");

      // Left accent bar
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.moveTo(ttX, y + 14);
      ctx.arcTo(ttX, y, ttX + 14, y, 14);
      ctx.lineTo(ttX + 8, y);
      ctx.lineTo(ttX + 8, y + ttH);
      ctx.lineTo(ttX + 14, y + ttH);
      ctx.arcTo(ttX, y + ttH, ttX, y + ttH - 14, 14);
      ctx.closePath();
      ctx.fill();

      // Name
      ctx.fillStyle = "#111827";
      ctx.font = `bold 26px ${FONT}`;
      ctx.fillText(tt.nom, ttX + 30, y + 40);

      // Price (right-aligned)
      const priceText = tt.prix > 0 ? formatMontant(tt.prix, devise) : "Gratuit";
      ctx.fillStyle = "#10b981";
      ctx.font = `bold 26px ${FONT}`;
      const priceW = ctx.measureText(priceText).width;
      ctx.fillText(priceText, ttX + ttW - priceW - 16, y + 40);

      y += ttH + 12;
    }
  }

  // ── Footer ──
  ctx.fillStyle = "#d1d5db";
  ctx.font = `500 20px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("Propulsé par Binq", W / 2, H - 80);
  ctx.textAlign = "left";

  // ── Trigger download ──
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${evt.nom.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").replace(/\s+/g, "_")}_affiche.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png", 1.0);
}
