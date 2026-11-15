import { db } from "./db";

export async function audit(input: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      userId: input.userId || null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? "",
      meta: JSON.stringify(input.meta ?? {}),
    },
  });
}
