export const STAFF_ROLES = ["ADMIN", "MANAGER", "SALES", "CATALOG", "SUPPORT"] as const;

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

export function can(role: string, permission: string) {
  const granted = ROLE_PERMISSIONS[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function isStaff(role: string) {
  return STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number]);
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administration",
  MANAGER: "Direction opérationnelle",
  SALES: "Commercial",
  CATALOG: "Catalogue",
  SUPPORT: "Support technique",
  CUSTOMER: "Client",
};
