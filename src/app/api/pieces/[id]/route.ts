import { readFile } from "fs/promises";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { privateFilePath } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user || !can(user.role, "quotes.write")) return new Response("Introuvable", { status: 404 });
  const { id } = await context.params;
  const file = await db.attachment.findUnique({ where: { id } });
  if (!file) return new Response("Introuvable", { status: 404 });
  const full = privateFilePath(file.storedName);
  if (!full) return new Response("Introuvable", { status: 404 });
  const data = await readFile(full);
  return new Response(data, {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `attachment; filename="${file.storedName}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
