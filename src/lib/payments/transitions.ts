export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED", "REVIEW"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ["PAID", "FAILED", "CANCELLED", "REVIEW"],
  REVIEW: ["PAID", "FAILED", "CANCELLED"],
  PAID: ["REFUNDED", "REVIEW"],
  FAILED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: PaymentStatus, to: PaymentStatus) {
  return TRANSITIONS[from].includes(to);
}
