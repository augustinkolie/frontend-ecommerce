"use client";

import { api } from "@/lib/api/browser";

type UploadTarget = { method: "PUT" | "POST"; uploadUrl: string; publicUrl: string; key: string };

/** Envoie une image : URL signée S3 (PUT direct) ou pilote local du backend (via le BFF). */
export async function uploadImage(blob: Blob): Promise<string> {
  const target = await api<UploadTarget>("/admin/uploads", { method: "POST", json: { contentType: blob.type } });
  if (target.method === "PUT") {
    const res = await fetch(target.uploadUrl, { method: "PUT", body: blob, headers: { "content-type": blob.type } });
    if (!res.ok) throw new Error("Envoi vers le stockage impossible");
  } else {
    await api(target.uploadUrl, { method: "POST", body: blob, headers: { "content-type": blob.type } });
  }
  return target.publicUrl;
}

/** Recadre une image (zone en pixels) et l'encode en WebP. */
export async function cropToBlob(src: string, area: { x: number; y: number; width: number; height: number }, maxWidth = 1600): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const scale = Math.min(1, maxWidth / area.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width * scale);
  canvas.height = Math.round(area.height * scale);
  canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encodage impossible"))), "image/webp", 0.86));
}
