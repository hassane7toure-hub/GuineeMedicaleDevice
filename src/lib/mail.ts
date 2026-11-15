import nodemailer from "nodemailer";
import { db } from "./db";
import { getSettings } from "./settings";

type MailInput = {
  to: string;
  subject: string;
  body: string;
  emailBody?: string;
  relatedType: string;
  relatedId: string;
  skipReason?: string;
};

export async function sendRecordedEmail(input: MailInput) {
  const recipient = input.to.trim();
  const notification = await db.notification.create({
    data: {
      channel: "EMAIL",
      recipient: recipient || "non configuré",
      subject: input.subject,
      body: input.body,
      status: "QUEUED",
      relatedType: input.relatedType,
      relatedId: input.relatedId,
    },
  });

  if (!recipient || !process.env.SMTP_HOST) {
    const error = input.skipReason || "Messagerie non configurée. La demande reste visible dans l'administration.";
    await db.notification.update({
      where: { id: notification.id },
      data: { status: "SKIPPED", error },
    });
    return { status: "SKIPPED" as const, error };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD || "" }
        : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipient,
      subject: input.subject,
      text: input.emailBody || input.body,
    });
    await db.notification.update({ where: { id: notification.id }, data: { status: "SENT", error: "" } });
    return { status: "SENT" as const, error: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Envoi impossible";
    const stored = message.slice(0, 300);
    await db.notification.update({
      where: { id: notification.id },
      data: { status: "FAILED", error: stored },
    });
    return { status: "FAILED" as const, error: stored };
  }
}

export async function notifyTeam(input: {
  subject: string;
  body: string;
  relatedType: string;
  relatedId: string;
}) {
  const settings = await getSettings();
  await sendRecordedEmail({
    to: process.env.SALES_EMAIL || settings.email || "",
    subject: input.subject,
    body: input.body,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
  });
}

export async function notifyCustomer(input: {
  to: string;
  subject: string;
  body: string;
  emailBody?: string;
  relatedType: string;
  relatedId: string;
}) {
  return sendRecordedEmail({
    ...input,
    skipReason: input.to.trim()
      ? "Messagerie non configurée. La facture proforma reste accessible sur le site."
      : "Adresse du client absente. La facture proforma n'a pas été envoyée.",
  });
}
