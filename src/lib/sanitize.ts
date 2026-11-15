const SENSITIVE = /api|secret|token|password|passwd|pin|otp|cvv|cvc|pan|card|authorization|cookie/i;

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = SENSITIVE.test(key) ? "[retiré]" : redact(item);
    }
    return output;
  }
  if (typeof value === "string" && value.length > 500) return `${value.slice(0, 500)}…`;
  return value;
}

export function redactText(raw: string) {
  try {
    return JSON.stringify(redact(JSON.parse(raw)));
  } catch {
    const params = Object.fromEntries(new URLSearchParams(raw).entries());
    if (Object.keys(params).length) return JSON.stringify(redact(params));
    return JSON.stringify({ note: "Charge utile non structurée, non conservée." });
  }
}
