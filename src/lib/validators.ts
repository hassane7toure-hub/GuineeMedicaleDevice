import { z } from "zod";

const phone = z
  .string({ required_error: "Le téléphone est requis." })
  .trim()
  .min(8, "Le téléphone est trop court.")
  .max(20, "Le téléphone est trop long.")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  }, "Indiquez un numéro utilisable, par exemple +224 6XX XX XX XX.");

const email = z.string().trim().email("L'adresse e-mail n'est pas valide.").max(160);
const personName = z.string().trim().min(2, "Le nom est trop court.").max(120);
const consent = z.literal("oui", { errorMap: () => ({ message: "Le consentement est requis pour envoyer la demande." }) });

export const quoteSchema = z.object({
  name: personName,
  organization: z.string().trim().max(160).optional().default(""),
  roleTitle: z.string().trim().max(120).optional().default(""),
  phone,
  email,
  city: z.string().trim().min(2, "La ville est requise.").max(80),
  need: z.string().trim().min(10, "Décrivez le besoin en quelques phrases.").max(4000),
  consent,
});

export const contactSchema = z.object({
  name: personName,
  email,
  phone: z.string().trim().max(20).optional().default(""),
  subject: z.string().trim().min(3, "L'objet est requis.").max(140),
  message: z.string().trim().min(10, "Le message est trop court.").max(4000),
  consent,
});

export const serviceSchema = z.object({
  serviceType: z.enum(["VENTE", "INSTALLATION", "MAINTENANCE_PREVENTIVE", "MAINTENANCE_CORRECTIVE", "CONSEIL"]),
  equipment: z.string().trim().max(180).optional().default(""),
  location: z.string().trim().min(2, "La localisation est requise.").max(120),
  urgency: z.enum(["NORMAL", "SOON", "URGENT"]),
  description: z.string().trim().min(10, "Décrivez la demande.").max(4000),
  name: personName,
  organization: z.string().trim().max(160).optional().default(""),
  phone,
  email,
  consent,
});

export const privacySchema = z.object({
  name: personName,
  email,
  phone: z.string().trim().max(20).optional().default(""),
  type: z.enum(["ACCESS", "CORRECTION", "DELETION"]),
  message: z.string().trim().min(10, "Précisez la demande.").max(4000),
  consent,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(8, "Mot de passe requis.").max(200),
});

export const registerSchema = z.object({
  name: personName,
  email,
  phone: z.string().trim().max(20).optional().default(""),
  organization: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  password: z
    .string()
    .min(12, "Au moins 12 caractères.")
    .max(200)
    .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), "Incluez au moins une lettre et un chiffre."),
});

export const checkoutSchema = z.object({
  customerName: personName,
  organization: z.string().trim().max(160).optional().default(""),
  email,
  phone,
  city: z.string().trim().min(2, "La ville est requise.").max(80),
  area: z.string().trim().max(120).optional().default(""),
  addressLine: z.string().trim().max(240).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  deliveryOptionId: z.string().min(1, "Choisissez un mode de remise."),
  intendedMethod: z.string().min(1, "Choisissez un mode de règlement."),
  consent,
});

export function fieldErrors(error: z.ZodError) {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) result[key] = issue.message;
  }
  return result;
}

export function formTiming(formData: FormData) {
  if (String(formData.get("gmd_hp") || "").trim()) return "spam" as const;
  const started = Number(formData.get("startedAt"));
  if (!Number.isFinite(started)) return "invalid" as const;
  const elapsed = Date.now() - started;
  if (elapsed < 2000) return "fast" as const;
  if (elapsed > 12 * 60 * 60 * 1000) return "expired" as const;
  return "ok" as const;
}

export function safeNext(value: string | undefined | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/compte";
  return value;
}
