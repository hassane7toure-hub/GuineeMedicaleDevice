import { mkdir, writeFile } from "fs/promises";
import path from "path";

const PRIVATE_DIR = path.join(process.cwd(), "data", "uploads");
const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads", "products");

function sniff(buffer: Buffer) {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { ext: "png", mime: "image/png", kind: "image" as const };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg", kind: "image" as const };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return { ext: "webp", mime: "image/webp", kind: "image" as const };
  }
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return { ext: "pdf", mime: "application/pdf", kind: "pdf" as const };
  }
  return null;
}

export async function savePublicImage(file: File, alt: string) {
  if (!alt.trim()) throw new Error("Le texte alternatif de la photo est requis.");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) return null;
  if (buffer.length > 2_000_000) throw new Error("Photo trop lourde (2 Mo maximum).");
  const kind = sniff(buffer);
  if (!kind || kind.kind !== "image") throw new Error("Formats acceptés pour une photo : JPEG, PNG ou WebP.");
  const name = `${crypto.randomUUID()}.${kind.ext}`;
  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(path.join(PUBLIC_DIR, name), buffer);
  return { url: `/uploads/products/${name}`, alt: alt.trim() };
}

export async function savePrivateFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) return null;
  if (buffer.length > 2_000_000) throw new Error("Pièce jointe trop lourde (2 Mo maximum).");
  const kind = sniff(buffer);
  if (!kind) throw new Error("Pièces jointes acceptées : PDF, JPEG, PNG ou WebP.");
  const storedName = `${crypto.randomUUID()}.${kind.ext}`;
  await mkdir(PRIVATE_DIR, { recursive: true });
  await writeFile(path.join(PRIVATE_DIR, storedName), buffer);
  const original = path.basename(file.name || `document.${kind.ext}`).slice(0, 120);
  return { storedName, originalName: original, mime: kind.mime, size: buffer.length };
}

export function privateFilePath(storedName: string) {
  if (!/^[a-z0-9-]+\.(pdf|jpg|png|webp)$/i.test(storedName)) return null;
  const full = path.resolve(PRIVATE_DIR, storedName);
  if (!full.startsWith(path.resolve(PRIVATE_DIR))) return null;
  return full;
}
