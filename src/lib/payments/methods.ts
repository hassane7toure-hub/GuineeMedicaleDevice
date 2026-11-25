import { getSettings } from "../settings";

export type MethodOption = {
  id: string;
  label: string;
  detail: string;
  provider: "sandbox" | "offline" | "cinetpay";
};

export async function availableMethods(): Promise<MethodOption[]> {
  const settings = await getSettings();
  if (!settings.payments.offline) return [];
  return [
    {
      id: "OFFLINE",
      label: "Paiement hors ligne ou sur facture",
      detail: "La commande reste en attente jusqu'à validation manuelle. Aucun paiement en ligne n'est proposé.",
      provider: "offline",
    },
  ];
}

export function methodProvider(method: string): MethodOption["provider"] | null {
  if (method.startsWith("SANDBOX_")) return "sandbox";
  if (method === "OFFLINE") return "offline";
  if (["ORANGE_MONEY", "VISA", "MASTERCARD", "PAYCARD"].includes(method)) return "cinetpay";
  return null;
}
