import type { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { joinRoles, roleLabel } from "@/lib/permissions";
import { headerKey, recordsFromTable, type SheetRecord } from "@/lib/tabular";

type Store = Prisma.TransactionClient | PrismaClient;

export const USER_HEADERS = ["Nom", "E-mail", "Téléphone", "Mot de passe", "Rôle", "Actif", "Organisation", "Fonction", "Ville"] as const;

const USER_ALIASES: Record<string, string> = {
  nom: "name",
  name: "name",
  email: "email",
  mail: "email",
  telephone: "phone",
  tel: "phone",
  phone: "phone",
  motdepasse: "password",
  password: "password",
  role: "role",
  actif: "active",
  active: "active",
  organisation: "organization",
  organization: "organization",
  fonction: "roleTitle",
  titre: "roleTitle",
  ville: "city",
  city: "city",
};

const ROLE_KEYS = new Map<string, string>([
  ["admin", "ADMIN"],
  ["administration", "ADMIN"],
  ["manager", "MANAGER"],
  ["directionoperationnelle", "MANAGER"],
  ["sales", "SALES"],
  ["commercial", "SALES"],
  ["catalog", "CATALOG"],
  ["catalogue", "CATALOG"],
  ["support", "SUPPORT"],
  ["supporttechnique", "SUPPORT"],
  ["customer", "CUSTOMER"],
  ["client", "CUSTOMER"],
]);

function yesNo(value: boolean) {
  return value ? "oui" : "non";
}

function flag(value: string | undefined, fallback: boolean) {
  const key = headerKey(value || "");
  if (!key) return fallback;
  if (["oui", "yes", "true", "vrai", "1"].includes(key)) return true;
  if (["non", "no", "false", "faux", "0"].includes(key)) return false;
  return fallback;
}

export function userTemplate() {
  return [[...USER_HEADERS]];
}

export function userRows(
  users: { name: string; email: string; phone: string; role: string; active: boolean; organization: string; roleTitle: string; city: string }[],
) {
  return [
    [...USER_HEADERS],
    ...users.map((user) => [
      user.name,
      user.email,
      user.phone,
      "",
      roleLabel(user.role),
      yesNo(user.active),
      user.organization,
      user.roleTitle,
      user.city,
    ]),
  ];
}

export async function importUserTable(store: Store, table: string[][]) {
  const parsed = recordsFromTable(table, USER_ALIASES, ["name", "email", "password", "role"], 200);
  if (parsed.error) return { error: parsed.error, created: 0, skipped: 0, errors: [] as string[] };
  const existing = await store.user.findMany({ select: { email: true } });
  const emails = new Set(existing.map((user) => user.email.toLowerCase()));
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const row of parsed.records) {
    const message = await createUser(store, row, emails);
    if (message) {
      skipped += 1;
      errors.push(message);
    } else created += 1;
  }
  return { error: undefined, created, skipped, errors };
}

async function createUser(store: Store, row: SheetRecord, emails: Set<string>) {
  const values = row.values;
  const name = values.name.slice(0, 120);
  const email = values.email.slice(0, 160).toLowerCase();
  const password = values.password;
  const role = joinRoles(
    (values.role || "").split(/[,;|/]/).flatMap((part) => {
      const code = ROLE_KEYS.get(headerKey(part));
      return code ? [code] : [];
    }),
  );
  if (name.length < 2 || !email.includes("@") || !role) return `Ligne ${row.line} : nom, e-mail et au moins un rôle sont requis.`;
  if (emails.has(email)) return `Ligne ${row.line} : l'e-mail ${email} existe déjà.`;
  if (password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return `Ligne ${row.line} : le mot de passe doit contenir au moins 12 caractères, une lettre et un chiffre.`;
  }
  await store.user.create({
    data: {
      name,
      email,
      phone: (values.phone || "").slice(0, 30),
      organization: (values.organization || "").slice(0, 160),
      roleTitle: (values.roleTitle || "").slice(0, 120),
      city: (values.city || "").slice(0, 80),
      role,
      active: flag(values.active, true),
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  emails.add(email);
  return "";
}
