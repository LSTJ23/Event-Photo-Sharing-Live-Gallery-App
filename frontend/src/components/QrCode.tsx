"use client";

import { useMemo } from "react";
import { makeQr, qrPath } from "@/lib/qr";

const MARGIN = 4; // the blank border scanners need, in squares

/** The QR code for `value`, drawn as a crisp SVG at any size. */
export function QrCode({ value, size, className }: { value: string; size: number; className?: string }) {
  const modules = useMemo(() => makeQr(value), [value]);
  const total = modules.length + MARGIN * 2;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      role="img"
      aria-label={`QR code for ${value}`}
      shapeRendering="crispEdges"
    >
      <rect width={total} height={total} fill="#fff" />
      <path d={qrPath(modules, MARGIN)} fill="#000" />
    </svg>
  );
}

/** Saves the QR code for `value` as a PNG (about 1200 px square, sharp enough to print). */
export function downloadQrPng(value: string, fileName: string) {
  const modules = makeQr(value);
  const total = modules.length + MARGIN * 2;
  const scale = Math.ceil(1200 / total);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = total * scale;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000";
  modules.forEach((row, r) =>
    row.forEach((isDark, c) => {
      if (isDark) context.fillRect((c + MARGIN) * scale, (r + MARGIN) * scale, scale, scale);
    })
  );
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
