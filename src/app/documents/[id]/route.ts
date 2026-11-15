import { readFile } from "fs/promises";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { privateFilePath } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const document = await db.productDocument.findUnique({ where: { id } });
  if (!document) return new Response("Introuvable", { status: 404 });
  if (!document.authorized) {
    const user = await currentUser();
    if (!user || !can(user.role, "catalog.write")) return new Response("Introuvable", { status: 404 });
  }
  const full = privateFilePath(document.storedName);
  if (!full) return new Response("Introuvable", { status: 404 });
  const data = await readFile(full);
  return new Response(data, {
    headers: {
      "Content-Type": document.mime,
      "Content-Disposition": `attachment; filename="${document.storedName}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
