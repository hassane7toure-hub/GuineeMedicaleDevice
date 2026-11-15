import { getSettings } from "../settings";
import { cinetpayConfigured, paymentMode } from "./provider";

export type MethodOption = {
  id: string;
  label: string;
  detail: string;
  provider: "sandbox" | "offline" | "cinetpay";
};

export async function availableMethods(): Promise<MethodOption[]> {
  const settings = await getSettings();
  const methods: MethodOption[] = [];
  if (paymentMode() === "test") {
    methods.push(
      {
        id: "SANDBOX_ORANGE",
        label: "Orange Money — simulation",
        detail: "Aucun débit. Aucun code secret n'est demandé. Réservé au mode test.",
        provider: "sandbox",
      },
      {
        id: "SANDBOX_VISA",
        label: "Carte Visa — simulation",
        detail: "Aucun numéro de carte n'est saisi ici. La page de test simule seulement le résultat.",
        provider: "sandbox",
      },
    );
  }
  if (settings.payments.offline) {
    methods.push({
      id: "OFFLINE",
      label: "Paiement hors ligne ou sur facture",
      detail: "La commande reste en attente jusqu'à validation manuelle. Les modalités exactes sont à confirmer par l'entreprise.",
      provider: "offline",
    });
  }
  if (cinetpayConfigured()) {
    if (settings.payments.orangeMoney) {
      methods.push({
        id: "ORANGE_MONEY",
        label: "Orange Money",
        detail: "Redirection vers la page hébergée du prestataire.",
        provider: "cinetpay",
      });
    }
    if (settings.payments.visa) {
      methods.push({
        id: "VISA",
        label: "Carte Visa",
        detail: "Saisie de la carte uniquement sur la page hébergée du prestataire.",
        provider: "cinetpay",
      });
    }
    if (settings.payments.mastercard) {
      methods.push({
        id: "MASTERCARD",
        label: "Mastercard",
        detail: "Proposé seulement si le contrat marchand couvre ce réseau.",
        provider: "cinetpay",
      });
    }
    if (settings.payments.paycard) {
      methods.push({
        id: "PAYCARD",
        label: "PayCard",
        detail: "À activer seulement après confirmation du prestataire pour ce réseau.",
        provider: "cinetpay",
      });
    }
  }
  return methods;
}

export function methodProvider(method: string): MethodOption["provider"] | null {
  if (method.startsWith("SANDBOX_")) return "sandbox";
  if (method === "OFFLINE") return "offline";
  if (["ORANGE_MONEY", "VISA", "MASTERCARD", "PAYCARD"].includes(method)) return "cinetpay";
  return null;
}
