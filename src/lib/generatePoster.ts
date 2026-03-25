"use client";

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

/**
 * Generate a clean QR code image for the event and trigger download.
 * Big QR, white background, ready to print.
 */
export async function generateEventPoster(
  evt: PosterEventData,
  _devise: DeviseCode
): Promise<void> {
  const canvas = document.createElement("canvas");
  const SIZE = 800;
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Render QR via hidden SVG
  const qrSize = 680;
  const qrX = (SIZE - qrSize) / 2;
  const qrY = 30;
  const eventUrl = `${window.location.origin}/evenement/${evt.id}`;

  await new Promise<void>((resolve) => {
    const tempDiv = document.createElement("div");
    tempDiv.style.cssText = "position:absolute;left:-9999px";
    document.body.appendChild(tempDiv);

    const React = require("react");
    const { createRoot } = require("react-dom/client");
    const { QRCodeSVG } = require("qrcode.react");

    const root = createRoot(tempDiv);
    root.render(
      React.createElement(QRCodeSVG, { value: eventUrl, size: qrSize, level: "H", includeMargin: false })
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
        img.onerror = () => { root.unmount(); document.body.removeChild(tempDiv); resolve(); };
        img.src = url;
      } else {
        root.unmount();
        document.body.removeChild(tempDiv);
        resolve();
      }
    }, 250);
  });

  // Small event name below QR
  const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#6b7280";
  ctx.font = `600 22px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(evt.nom.length > 50 ? evt.nom.substring(0, 50) + "…" : evt.nom, SIZE / 2, qrY + qrSize + 40);
  ctx.textAlign = "left";

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR_${evt.nom.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").replace(/\s+/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png", 1.0);
}
