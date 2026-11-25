export const STAFF_ROLES = ["ADMIN", "MANAGER", "SALES", "CATALOG", "SUPPORT"] as const;

export const ROLE_ORDER = ["ADMIN", "MANAGER", "SALES", "CATALOG", "SUPPORT", "CUSTOMER"] as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ["*"],
  MANAGER: [
    "catalog.write",
    "orders.read",
    "orders.write",
    "payments.write",
    "quotes.write",
    "services.write",
    "delivery.write",
    "content.write",
    "settings.write",
    "audit.read",
    "export",
    "messages.read",
  ],
  SALES: ["orders.read", "quotes.write", "export", "messages.read"],
  CATALOG: ["catalog.write"],
  SUPPORT: ["orders.read", "services.write", "messages.read"],
  CUSTOMER: [],
};

export function parseRoles(value: string) {
  const found = new Set(
    value
      .split(/[,;|]/)
      .map((part) => part.trim())
      .filter((part) => part in ROLE_PERMISSIONS),
  );
  return ROLE_ORDER.filter((role) => found.has(role));
}

export function joinRoles(values: string[]) {
  return parseRoles(values.join(",")).join(",");
}

export function hasRole(value: string, role: string) {
  return parseRoles(value).includes(role as (typeof ROLE_ORDER)[number]);
}

export function can(role: string, permission: string) {
  return parseRoles(role).some((item) => {
    const granted = ROLE_PERMISSIONS[item] ?? [];
    return granted.includes("*") || granted.includes(permission);
  });
}

export function isStaff(role: string) {
  return parseRoles(role).some((item) => STAFF_ROLES.includes(item as (typeof STAFF_ROLES)[number]));
}

export function roleLabel(value: string) {
  const roles = parseRoles(value);
  if (roles.length === 0) return value;
  return roles.map((role) => ROLE_LABELS[role]).join(", ");
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administration",
  MANAGER: "Direction opérationnelle",
  SALES: "Commercial",
  CATALOG: "Catalogue",
  SUPPORT: "Support technique",
  CUSTOMER: "Client",
};
