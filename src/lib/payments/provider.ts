import { createHmac, timingSafeEqual } from "crypto";
import { canTransition, isPaymentStatus, type PaymentStatus } from "./transitions";

export type VerifiedPayment = {
  paymentId: string;
  provider: string;
  providerRef: string;
  providerEventId: string;
  status: PaymentStatus;
  method?: string;
  payload?: string;
};

export type CheckoutInput = {
  paymentId: string;
  orderReference: string;
  amountGnf: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  returnUrl: string;
  notifyUrl: string;
};

export function webhookSecret() {
  const value = process.env.PAYMENT_WEBHOOK_SECRET ?? "";
  if (value.length < 16) throw new Error("PAYMENT_WEBHOOK_SECRET manquant.");
  if (process.env.NODE_ENV === "production" && /dev-only|changeme|change-me|replace-with/i.test(value)) {
    throw new Error("PAYMENT_WEBHOOK_SECRET de démonstration refusé en production.");
  }
  return value;
}

export function signSandbox(paymentId: string) {
  return createHmac("sha256", webhookSecret()).update(`sandbox:${paymentId}`).digest("hex");
}

export function sandboxTokenValid(paymentId: string, token: string) {
  const expected = signSandbox(paymentId);
  if (expected.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function paymentMode() {
  return process.env.PAYMENT_MODE === "live" ? "live" : "test";
}

export function cinetpayConfigured() {
  return Boolean(
    process.env.CINETPAY_API_KEY &&
      process.env.CINETPAY_SITE_ID &&
      process.env.CINETPAY_CURRENCY === "GNF" &&
      paymentMode() === "live",
  );
}

export function cinetpayBlockers() {
  const reasons: string[] = [];
  if (paymentMode() !== "live") reasons.push("PAYMENT_MODE n'est pas « live ».");
  if (!process.env.CINETPAY_API_KEY) reasons.push("CINETPAY_API_KEY est vide.");
  if (!process.env.CINETPAY_SITE_ID) reasons.push("CINETPAY_SITE_ID est vide.");
  if (process.env.CINETPAY_CURRENCY !== "GNF") {
    reasons.push("CINETPAY_CURRENCY doit valoir GNF. Aucune conversion de devise n'est faite automatiquement.");
  }
  reasons.push("L'éligibilité du marchand en République de Guinée reste à confirmer par écrit avec le prestataire.");
  return reasons;
}

export function mapProviderStatus(value: string): PaymentStatus {
  const normalized = value.toUpperCase();
  if (["ACCEPTED", "PAID", "SUCCESS", "SUCCEEDED"].includes(normalized)) return "PAID";
  if (["REFUSED", "FAILED", "ERROR"].includes(normalized)) return "FAILED";
  if (["CANCELLED", "CANCELED"].includes(normalized)) return "CANCELLED";
  if (["REFUNDED"].includes(normalized)) return "REFUNDED";
  if (isPaymentStatus(normalized) && canTransition("PENDING", normalized)) return normalized;
  if (["PENDING", "WAITING", "PROCESSING"].includes(normalized)) return "PENDING";
  return "REVIEW";
}
