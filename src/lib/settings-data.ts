export type Settings = {
  demoMode: boolean;
  companyName: string;
  legalName: string;
  legalNameNote: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  country: string;
  hours: string;
  timezone: string;
  interventionAreas: string;
  facebook: string;
  linkedin: string;
  rateEurPerGnf: string;
  rateUsdPerGnf: string;
  serviceBlurbs: [string, string, string, string];
  payments: {
    offline: boolean;
    orangeMoney: boolean;
    visa: boolean;
    mastercard: boolean;
    paycard: boolean;
  };
};

export const defaultSettings: Settings = {
  demoMode: true,
  companyName: "GUINEA MEDICAL DEVICE SHOP - SARL",
  legalName: "GUINEA MEDICAL DEVICE SHOP - SARL",
  legalNameNote: "",
  tagline: "Votre partenaire de confiance en santé",
  heroTitle: "Équipements médicaux, installés et suivis.",
  heroSubtitle:
    "Vente d'équipements médicaux et de réactifs de laboratoire, installation, maintenance et conseil technique pour les établissements de santé et les professionnels en République de Guinée.",
  intro:
    "GUINEA MEDICAL DEVICE SHOP - SARL assure la vente d'équipements médicaux, de réactifs de laboratoire et de consommables, ainsi que l'installation, la maintenance et le conseil.",
  phone: "+224 622 32 58 88",
  whatsapp: "+224 628 00 09 02",
  email: "guineamedshop2026@gmail.com",
  address: "Quartier Concasseur, commune de Gbessia",
  city: "Gbessia",
  country: "République de Guinée",
  hours: "GMT",
  timezone: "Africa/Conakry",
  interventionAreas: "Guinée",
  facebook: "",
  linkedin: "",
  rateEurPerGnf: "",
  rateUsdPerGnf: "",
  serviceBlurbs: [
    "Sélection et fourniture d'équipements, de réactifs de laboratoire, de consommables et de pièces, selon le catalogue publié et les devis confirmés.",
    "Mise en place sur site lorsque la prestation est prévue : installation, vérification de fonctionnement et prise en main.",
    "Maintenance préventive et dépannage, sur demande, pour les équipements concernés et dans les zones d'intervention définies.",
    "Aide au choix selon l'usage, le plateau technique et les contraintes d'installation. Ce conseil ne remplace pas une prescription médicale.",
  ],
  payments: {
    offline: true,
    orangeMoney: false,
    visa: false,
    mastercard: false,
    paycard: false,
  },
};

export function mergeSettings(input: unknown): Settings {
  const source = input && typeof input === "object" ? (input as Partial<Settings>) : {};
  const payments: Partial<Settings["payments"]> = source.payments ?? {};
  const blurbs = Array.isArray(source.serviceBlurbs) ? source.serviceBlurbs : [];
  return {
    ...defaultSettings,
    ...source,
    serviceBlurbs: [0, 1, 2, 3].map(
      (index) => (typeof blurbs[index] === "string" && blurbs[index].trim() ? blurbs[index] : defaultSettings.serviceBlurbs[index]),
    ) as Settings["serviceBlurbs"],
    payments: {
      offline: typeof payments.offline === "boolean" ? payments.offline : defaultSettings.payments.offline,
      orangeMoney: false,
      visa: false,
      mastercard: false,
      paycard: false,
    },
  };
}
