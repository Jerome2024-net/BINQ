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

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

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

/** Word-wrap centered text, returns the Y after last line */
function drawCenteredWrapped(
  ctx: CanvasRenderingContext2D,
  text: string, centerX: number, startY: number,
  maxWidth: number, lineHeight: number,
  font: string, color: string
): number {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  const words = text.split(" ");
  let line = "";
  let y = startY;
  for (const word of words) {
    const test = line + (line ? " " : "") + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, centerX, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, centerX, y);
  ctx.textAlign = "left";
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

/** Render a QR code on the canvas at given position */
async function renderQR(
  ctx: CanvasRenderingContext2D,
  value: string, x: number, y: number, size: number
): Promise<void> {
  return new Promise<void>((resolve) => {
    const tempDiv = document.createElement("div");
    tempDiv.style.cssText = "position:absolute;left:-9999px";
    document.body.appendChild(tempDiv);

    const React = require("react");
    const { createRoot } = require("react-dom/client");
    const { QRCodeSVG } = require("qrcode.react");

    const root = createRoot(tempDiv);
    root.render(
      React.createElement(QRCodeSVG, { value, size, level: "H", includeMargin: false })
    );

    setTimeout(() => {
      const svg = tempDiv.querySelector("svg");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, x, y, size, size);
          URL.revokeObjectURL(url);
          root.unmount();
          document.body.removeChild(tempDiv);
          resolve();
        };
        img.onerror = () => { root.unmount(); document.body.removeChild(tempDiv); resolve(); };
        img.src = url;
      } else {
        root.unmount();
        document.body.removeChild(tempDiv);
        resolve();
      }
    }, 250);
  });
}

/**
 * Generate a clean, printable Ticket QR card (900×1300) for the organizer.
 * Compact format: event name, date, lieu, big QR code, ticket prices.
 * Ready to print and hand out / display.
 */
export async function generateEventPoster(
  evt: PosterEventData,
  devise: DeviseCode
): Promise<void> {
  const canvas = document.createElement("canvas");
  const W = 900;
  const H = 1300;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const cx = W / 2; // center X

  // ── White background ──
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // ── Green header band ──
  const headerH = 220;
  const grad = ctx.createLinearGradient(0, 0, W, headerH);
  grad.addColorStop(0, "#10b981");
  grad.addColorStop(1, "#059669");
  ctx.fillStyle = grad;
  roundedRect(ctx, 0, 0, W, headerH, 0, undefined);
  ctx.fill();

  // Logo in top-left of header if available
  let logoOffset = 0;
  if (evt.logo_url) {
    const logo = await loadImage(evt.logo_url);
    if (logo) {
      const ls = 60;
      // Rounded clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(50 + ls / 2, headerH / 2, ls / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logo, 50, headerH / 2 - ls / 2, ls, ls);
      ctx.restore();
      logoOffset = 80;
    }
  }

  // Event name centered in header
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 38px ${FONT}`;
  const nameMaxW = W - 80;
  const words = evt.nom.split(" ");
  let line = "";
  let nameY = evt.nom.length > 30 ? headerH / 2 - 20 : headerH / 2 + 5;
  for (const word of words) {
    const test = line + (line ? " " : "") + word;
    if (ctx.measureText(test).width > nameMaxW && line) {
      ctx.fillText(line, cx, nameY);
      line = word;
      nameY += 46;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, cx, nameY);
  ctx.textAlign = "left";

  // ── Dashed cutout line + circles ──
  const cutY = headerH;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(0, cutY, 18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W, cutY, 18, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#e5e7eb";
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, cutY);
  ctx.lineTo(W - 30, cutY);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Date & Lieu (compact, centered) ──
  let y = headerH + 40;

  // Date
  ctx.textAlign = "center";
  ctx.fillStyle = "#111827";
  ctx.font = `bold 26px ${FONT}`;
  const dateStr = formatDateFr(evt.date_debut);
  ctx.fillText("📅  " + dateStr.charAt(0).toUpperCase() + dateStr.slice(1), cx, y);
  if (evt.heure_debut) {
    y += 34;
    ctx.fillStyle = "#6b7280";
    ctx.font = `500 22px ${FONT}`;
    ctx.fillText(`🕐  ${formatTimeFr(evt.heure_debut)}${evt.heure_fin ? ` — ${formatTimeFr(evt.heure_fin)}` : ""}`, cx, y);
  }

  // Lieu
  y += 38;
  ctx.fillStyle = "#111827";
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillText(`📍  ${evt.lieu}${evt.ville ? `, ${evt.ville}` : ""}`, cx, y);
  ctx.textAlign = "left";

  // ── Big QR Code ──
  y += 50;
  const qrSize = 400;
  const qrX = (W - qrSize) / 2;
  const qrY = y;

  // Light background behind QR
  roundedRect(ctx, qrX - 30, qrY - 30, qrSize + 60, qrSize + 60, 24, "#f9fafb", "#e5e7eb");

  const eventUrl = `${window.location.origin}/evenement/${evt.id}`;
  await renderQR(ctx, eventUrl, qrX, qrY, qrSize);

  // ── "Scannez pour réserver" ──
  y = qrY + qrSize + 55;
  ctx.textAlign = "center";
  ctx.fillStyle = "#10b981";
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillText("Scannez pour réserver", cx, y);

  // ── Ticket types / prices ──
  y += 50;
  if (evt.ticket_types && evt.ticket_types.length > 0) {
    for (const tt of evt.ticket_types) {
      const priceText = tt.prix > 0 ? formatMontant(tt.prix, devise) : "Gratuit";
      const ttW = W - 120;
      const ttX = 60;
      const ttH = 52;

      roundedRect(ctx, ttX, y, ttW, ttH, 12, "#f0fdf4", "#bbf7d0");

      // Left green accent
      ctx.fillStyle = "#10b981";
      ctx.fillRect(ttX, y + 8, 6, ttH - 16);

      ctx.fillStyle = "#111827";
      ctx.font = `bold 22px ${FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(tt.nom, ttX + 24, y + 33);

      ctx.fillStyle = "#10b981";
      ctx.font = `bold 22px ${FONT}`;
      ctx.textAlign = "right";
      ctx.fillText(priceText, ttX + ttW - 16, y + 33);

      y += ttH + 10;
    }
  }

  ctx.textAlign = "center";

  // ── URL text (small) ──
  y = H - 70;
  ctx.fillStyle = "#9ca3af";
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText(eventUrl, cx, y);

  // ── Footer ──
  y = H - 35;
  ctx.fillStyle = "#d1d5db";
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText("Propulsé par Binq", cx, y);
  ctx.textAlign = "left";

  // ── Trigger download ──
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket_QR_${evt.nom.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").replace(/\s+/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png", 1.0);
}
