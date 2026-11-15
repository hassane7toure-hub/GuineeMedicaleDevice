import { createHmac, timingSafeEqual } from "crypto";
import { applyVerified } from "@/lib/payments/apply";
import { verifyCinetPayNotification, ProviderUnavailable } from "@/lib/payments/cinetpay";
import { isPaymentStatus } from "@/lib/payments/transitions";
import { webhookSecret } from "@/lib/payments/provider";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const raw = await request.text();
  try {
    if (provider === "cinetpay") {
      await applyVerified(await verifyCinetPayNotification(raw));
      return new Response("OK", { status: 200 });
    }
    if (provider === "sandbox") {
      if (process.env.PAYMENT_MODE === "live") return new Response("INDISPONIBLE", { status: 404 });
      const signature = request.headers.get("x-gmd-signature") || "";
      const expected = createHmac("sha256", webhookSecret()).update(raw).digest("hex");
      const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      if (!valid) return new Response("SIGNATURE", { status: 400 });
      const body = JSON.parse(raw) as { paymentId?: string; status?: string; eventId?: string };
      if (!body.paymentId || !body.status || !body.eventId || !isPaymentStatus(body.status)) {
        return new Response("CORPS", { status: 400 });
      }
      await applyVerified({
        paymentId: body.paymentId,
        provider: "sandbox",
        providerRef: body.paymentId,
        providerEventId: body.eventId,
        status: body.status,
        payload: raw,
      });
      return new Response("OK", { status: 200 });
    }
    return new Response("PRESTATAIRE", { status: 404 });
  } catch (error) {
    if (error instanceof ProviderUnavailable) return new Response("REESSAYER", { status: 503 });
    return new Response("INVALIDE", { status: 400 });
  }
}
