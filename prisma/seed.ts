import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultSettings } from "../src/lib/settings-data";
import { fold } from "../src/lib/text";

const db = new PrismaClient();

const categories = [
  ["imagerie", "Imagerie médicale", "Équipements d'imagerie. Les modèles réels seront ajoutés par l'entreprise.", 1],
  ["laboratoire", "Laboratoire", "Matériel de laboratoire et d'analyse.", 2],
  ["reactifs-laboratoire", "Réactifs de laboratoire", "Réactifs, tests et consommables d'analyse. Le lot, la péremption et la conservation réels sont confirmés à la commande.", 3],
  ["diagnostic", "Diagnostic", "Appareils de mesure et de diagnostic.", 4],
  ["mobilier", "Mobilier médical", "Mobilier pour les salles de soins et d'hospitalisation.", 5],
  ["consommables", "Consommables", "Consommables à renouveler.", 6],
  ["soins", "Équipements de soins", "Équipements utilisés au chevet ou en salle de soins.", 7],
  ["pieces", "Pièces détachées", "Pièces et capteurs de remplacement.", 8],
] as const;

const brands = [
  ["lumen-demo", "Lumen Démo", "Marque fictive de démonstration.", true],
  ["helia-demo", "Helia Démo", "Marque fictive de démonstration.", true],
  ["atlas-demo", "Atlas Démo", "Marque fictive de démonstration.", true],
] as const;

type DemoProduct = {
  slug: string;
  sku: string;
  name: string;
  summary: string;
  description: string;
  brand: string;
  category: string;
  price: number | null;
  availability: string;
  stock: number | null;
  lead: string;
  usage: string;
  install: string;
  accessories: string;
  warranty: string;
  audience: string;
  usageCodes: string;
  featured: boolean;
  specs: [string, string][];
};

const products: DemoProduct[] = [
  {
    slug: "oxymetre-chevet-demo",
    sku: "DEMO-OXY-01",
    name: "Oxymètre de pouls de chevet",
    summary: "Fiche de démonstration d'un oxymètre de chevet.",
    description: "Exemple de fiche pour un oxymètre destiné à la surveillance. Les caractéristiques ne décrivent pas un appareil réellement vendu.",
    brand: "lumen-demo",
    category: "diagnostic",
    price: 1850000,
    availability: "IN_STOCK",
    stock: 4,
    lead: "Exemple indicatif : quelques jours à Conakry, à confirmer.",
    usage: "Surveillance de la saturation lors d'une consultation ou d'une hospitalisation.",
    install: "Branchement sur secteur à vérifier sur place. Aucune installation lourde dans cet exemple.",
    accessories: "Capteur adulte illustratif. Les capteurs compatibles réels seront listés avec le produit.",
    warranty: "Durée de garantie à confirmer sur le devis.",
    audience: "hopital,clinique,cabinet",
    usageCodes: "consultation,hospitalisation",
    featured: true,
    specs: [["Affichage", "Exemple : SpO2 et pouls"], ["Alimentation", "Secteur et batterie, à confirmer"]],
  },
  {
    slug: "tensiometre-bras-demo",
    sku: "DEMO-TEN-01",
    name: "Tensiomètre professionnel",
    summary: "Fiche de démonstration d'un tensiomètre à bras.",
    description: "Exemple de tensiomètre pour cabinet. Les plages de mesure ne sont pas des spécifications fabricant.",
    brand: "lumen-demo",
    category: "diagnostic",
    price: 2400000,
    availability: "IN_STOCK",
    stock: 6,
    lead: "Disponibilité de démonstration.",
    usage: "Mesure de la pression artérielle en consultation.",
    install: "",
    accessories: "Brassard adulte de démonstration.",
    warranty: "À confirmer.",
    audience: "clinique,cabinet,particulier",
    usageCodes: "consultation",
    featured: true,
    specs: [["Type", "Brassard"], ["Usage prévu", "Consultation"]],
  },
  {
    slug: "lit-medical-demo",
    sku: "DEMO-LIT-01",
    name: "Lit médical électrique",
    summary: "Fiche de démonstration d'un lit à trois fonctions.",
    description: "Exemple de mobilier d'hospitalisation. Les dimensions et la charge utile doivent venir de la fiche fabricant.",
    brand: "atlas-demo",
    category: "mobilier",
    price: 28500000,
    availability: "ON_ORDER",
    stock: null,
    lead: "Sur commande. Le délai réel sera indiqué sur le devis.",
    usage: "Hospitalisation.",
    install: "Montage sur site à prévoir dans la prestation d'installation.",
    accessories: "Potences et barrières : à préciser au devis.",
    warranty: "À confirmer.",
    audience: "hopital,clinique",
    usageCodes: "hospitalisation",
    featured: true,
    specs: [["Fonctions", "Exemple : trois plans"], ["Alimentation", "À confirmer"]],
  },
  {
    slug: "autoclave-table-demo",
    sku: "DEMO-AUT-01",
    name: "Autoclave de table",
    summary: "Fiche de démonstration d'un autoclave de paillasse.",
    description: "Exemple pour la stérilisation. La conformité et le volume réel ne sont pas affirmés.",
    brand: "helia-demo",
    category: "soins",
    price: 45000000,
    availability: "ON_ORDER",
    stock: null,
    lead: "Délai indicatif à valider selon l'approvisionnement.",
    usage: "Stérilisation des instruments, selon les protocoles de l'établissement.",
    install: "Arrivée d'eau, évacuation et alimentation électrique à vérifier avant commande.",
    accessories: "",
    warranty: "À confirmer.",
    audience: "hopital,clinique,cabinet",
    usageCodes: "consultation,maintenance",
    featured: false,
    specs: [["Volume illustratif", "18 L — exemple"], ["Installation", "Contraintes à étudier"]],
  },
  {
    slug: "centrifugeuse-demo",
    sku: "DEMO-CEN-01",
    name: "Centrifugeuse de paillasse",
    summary: "Fiche de démonstration pour un laboratoire.",
    description: "Exemple de centrifugeuse. La vitesse et les rotors compatibles sont à remplacer par les données fournisseur.",
    brand: "helia-demo",
    category: "laboratoire",
    price: 18750000,
    availability: "IN_STOCK",
    stock: 2,
    lead: "Stock de démonstration.",
    usage: "Préparation d'échantillons.",
    install: "À poser sur un plan stable, à l'abri des vibrations excessives.",
    accessories: "Rotor non inclus dans cet exemple.",
    warranty: "À confirmer.",
    audience: "laboratoire,hopital",
    usageCodes: "laboratoire",
    featured: true,
    specs: [["Usage", "Paillasse"], ["Rotor", "À préciser"]],
  },
  {
    slug: "echographe-portable-demo",
    sku: "DEMO-ECH-01",
    name: "Échographe portable",
    summary: "Produit de démonstration proposé uniquement sur devis.",
    description: "Aucune configuration de sondes n'est vendue par cette fiche. Le besoin doit être décrit dans la demande de devis.",
    brand: "lumen-demo",
    category: "imagerie",
    price: null,
    availability: "QUOTE_ONLY",
    stock: null,
    lead: "",
    usage: "Imagerie, selon la sonde et la formation des utilisateurs.",
    install: "Formation et mise en service à chiffrer à part.",
    accessories: "Sondes à définir.",
    warranty: "À définir dans le devis.",
    audience: "hopital,clinique",
    usageCodes: "consultation,maternite",
    featured: true,
    specs: [["Offre", "Sur devis"], ["Sondes", "Non incluses dans l'exemple"]],
  },
  {
    slug: "concentrateur-oxygene-demo",
    sku: "DEMO-O2-01",
    name: "Concentrateur d'oxygène",
    summary: "Fiche de démonstration d'un concentrateur.",
    description: "Exemple. Le débit, la consommation et les conditions d'usage réel seront ceux du fabricant.",
    brand: "atlas-demo",
    category: "soins",
    price: 16000000,
    availability: "IN_STOCK",
    stock: 3,
    lead: "Exemple de stock local, non contractuel.",
    usage: "Oxygénothérapie selon prescription du médecin de l'établissement.",
    install: "Environnement aéré et alimentation électrique stables requis.",
    accessories: "Humidificateur illustratif.",
    warranty: "À confirmer.",
    audience: "hopital,clinique,particulier",
    usageCodes: "hospitalisation,urgences",
    featured: false,
    specs: [["Débit illustratif", "5 L/min — exemple"], ["Usage", "Selon prescription"]],
  },
  {
    slug: "nebuliseur-demo",
    sku: "DEMO-NEB-01",
    name: "Nébuliseur",
    summary: "Fiche de démonstration d'un nébuliseur.",
    description: "Exemple de petit équipement de soins.",
    brand: "lumen-demo",
    category: "soins",
    price: 950000,
    availability: "IN_STOCK",
    stock: 8,
    lead: "",
    usage: "Aérosolthérapie selon protocole de soin.",
    install: "",
    accessories: "Kit patient non détaillé.",
    warranty: "À confirmer.",
    audience: "cabinet,particulier,clinique",
    usageCodes: "consultation",
    featured: false,
    specs: [["Type", "Pneumatique — exemple"]],
  },
  {
    slug: "gants-nitrile-demo",
    sku: "DEMO-GAN-01",
    name: "Gants d'examen, boîte",
    summary: "Consommable de démonstration.",
    description: "Exemple de conditionnement. La taille, la norme et le lot réel seront ceux du fabricant.",
    brand: "helia-demo",
    category: "consommables",
    price: 180000,
    availability: "IN_STOCK",
    stock: 40,
    lead: "",
    usage: "Examen et soins, selon les protocoles d'hygiène.",
    install: "",
    accessories: "",
    warranty: "Consommable : conditions de retour à définir.",
    audience: "hopital,clinique,cabinet,laboratoire,pharmacie",
    usageCodes: "consultation",
    featured: false,
    specs: [["Conditionnement", "Boîte — exemple"], ["Matière illustrative", "Nitrile"]],
  },
  {
    slug: "microscope-demo",
    sku: "DEMO-MIC-01",
    name: "Microscope binoculaire",
    summary: "Fiche de démonstration pour laboratoire.",
    description: "Exemple de microscope. Les grossissements réels seront fournis avec la notice autorisée.",
    brand: "helia-demo",
    category: "laboratoire",
    price: 12500000,
    availability: "ON_ORDER",
    stock: null,
    lead: "Approvisionnement sur commande.",
    usage: "Observation de lames.",
    install: "Réglage initial possible lors de la mise en service.",
    accessories: "Objectifs de démonstration, non contractuels.",
    warranty: "À confirmer.",
    audience: "laboratoire,hopital",
    usageCodes: "laboratoire",
    featured: false,
    specs: [["Tête", "Binoculaire — exemple"]],
  },
  {
    slug: "ecg-12-demo",
    sku: "DEMO-ECG-01",
    name: "Électrocardiographe",
    summary: "Appareil de démonstration sur devis.",
    description: "Le nombre de dérivations, les options logicielles et les accessoires doivent être confirmés avant toute commande.",
    brand: "lumen-demo",
    category: "diagnostic",
    price: null,
    availability: "QUOTE_ONLY",
    stock: null,
    lead: "",
    usage: "Enregistrement ECG selon la pratique du service.",
    install: "Formation des utilisateurs à prévoir.",
    accessories: "Câble patient à définir.",
    warranty: "À définir dans le devis.",
    audience: "hopital,clinique,cabinet",
    usageCodes: "consultation,urgences",
    featured: true,
    specs: [["Offre", "Sur devis"]],
  },
  {
    slug: "capteur-spo2-demo",
    sku: "DEMO-CAP-01",
    name: "Capteur SpO2 de remplacement",
    summary: "Pièce détachée de démonstration.",
    description: "Exemple de capteur. La compatibilité avec un moniteur précis doit être vérifiée avant achat.",
    brand: "lumen-demo",
    category: "pieces",
    price: 750000,
    availability: "IN_STOCK",
    stock: 10,
    lead: "",
    usage: "Remplacement, sous réserve de compatibilité.",
    install: "",
    accessories: "",
    warranty: "À confirmer.",
    audience: "hopital,clinique",
    usageCodes: "maintenance",
    featured: false,
    specs: [["Compatibilité", "À vérifier au cas par cas"]],
  },
  {
    slug: "table-examen-demo",
    sku: "DEMO-TAB-01",
    name: "Table d'examen",
    summary: "Mobilier de démonstration.",
    description: "Exemple de table d'examen. Les finitions et dimensions réelles seront celles du fabricant choisi.",
    brand: "atlas-demo",
    category: "mobilier",
    price: 7800000,
    availability: "ON_ORDER",
    stock: null,
    lead: "Sur commande.",
    usage: "Salle de consultation.",
    install: "Livraison et mise en place à chiffrer selon l'étage et l'accès.",
    accessories: "",
    warranty: "À confirmer.",
    audience: "cabinet,clinique",
    usageCodes: "consultation",
    featured: false,
    specs: [["Réglage", "Hydraulique — exemple"]],
  },
  {
    slug: "pompe-perfusion-demo",
    sku: "DEMO-POM-01",
    name: "Pompe à perfusion",
    summary: "Exemple volontairement en rupture.",
    description: "Cette fiche sert à montrer l'état « rupture ». Elle n'est pas commandable tant que le stock n'est pas rétabli.",
    brand: "atlas-demo",
    category: "soins",
    price: 6200000,
    availability: "OUT_OF_STOCK",
    stock: 0,
    lead: "",
    usage: "Perfusion, selon le protocole du service.",
    install: "",
    accessories: "Consommables non inclus.",
    warranty: "À confirmer.",
    audience: "hopital,clinique",
    usageCodes: "hospitalisation,urgences",
    featured: false,
    specs: [["État de l'exemple", "Rupture"]],
  },
  {
    slug: "reactif-hematologie-demo",
    sku: "DEMO-REA-HEM-01",
    name: "Réactif d'hématologie — exemple",
    summary: "Fiche de démonstration d'un réactif pour analyse hématologique.",
    description: "Exemple de réactif destiné à un automate de laboratoire. Ce n'est pas un produit réel : le fabricant, le lot, la date de péremption et la température de conservation seront ceux du flacon livré.",
    brand: "helia-demo",
    category: "reactifs-laboratoire",
    price: 450000,
    availability: "IN_STOCK",
    stock: 12,
    lead: "Délai et conditions de transport à confirmer à la commande.",
    usage: "Analyse hématologique en laboratoire, selon le protocole de l'automate réellement utilisé.",
    install: "",
    accessories: "Automate compatible non inclus.",
    warranty: "Consommable : le retour dépend de l'état du lot et des conditions publiées.",
    audience: "laboratoire,hopital,clinique",
    usageCodes: "laboratoire",
    featured: true,
    specs: [["Présentation", "Flacon — exemple"], ["Conservation", "À confirmer sur le lot réel"], ["Péremption", "Selon le lot, non indiquée dans cet exemple"]],
  },
  {
    slug: "reactif-biochimie-demo",
    sku: "DEMO-REA-BIO-01",
    name: "Réactif de biochimie — exemple",
    summary: "Fiche de démonstration d'un réactif de biochimie.",
    description: "Exemple de réactif pour un dosage de biochimie. Les performances analytiques ne sont pas celles d'un fabricant.",
    brand: "helia-demo",
    category: "reactifs-laboratoire",
    price: 620000,
    availability: "IN_STOCK",
    stock: 8,
    lead: "Délai et conditions de transport à confirmer à la commande.",
    usage: "Dosage de biochimie au laboratoire.",
    install: "",
    accessories: "Calibrateurs et contrôles non inclus dans cet exemple.",
    warranty: "Consommable : conditions de retour à confirmer.",
    audience: "laboratoire,hopital,clinique",
    usageCodes: "laboratoire",
    featured: false,
    specs: [["Présentation", "Coffret — exemple"], ["Conservation", "À confirmer sur le lot réel"], ["Péremption", "Selon le lot, non indiquée dans cet exemple"]],
  },
  {
    slug: "bandelettes-urinaires-demo",
    sku: "DEMO-REA-URI-01",
    name: "Bandelettes urinaires — exemple",
    summary: "Fiche de démonstration de bandelettes d'analyse urinaire.",
    description: "Exemple de conditionnement pour l'analyse d'urine. Le nombre de paramètres et la lecture réelle seront ceux du fabricant.",
    brand: "helia-demo",
    category: "reactifs-laboratoire",
    price: 95000,
    availability: "IN_STOCK",
    stock: 30,
    lead: "",
    usage: "Dépistage urinaire en laboratoire ou en consultation.",
    install: "",
    accessories: "",
    warranty: "Consommable : conditions de retour à confirmer.",
    audience: "laboratoire,clinique,cabinet,pharmacie",
    usageCodes: "laboratoire,consultation",
    featured: false,
    specs: [["Présentation", "Boîte — exemple"], ["Conservation", "À l'abri de l'humidité, à confirmer"], ["Péremption", "Selon le lot, non indiquée dans cet exemple"]],
  },
  {
    slug: "test-rapide-demo",
    sku: "DEMO-REA-RAP-01",
    name: "Test rapide de laboratoire — exemple",
    summary: "Fiche sans prix, proposée sur devis.",
    description: "Exemple de test unitaire. Aucun analyte précis n'est revendiqué : le test réellement fourni sera nommé sur le devis.",
    brand: "helia-demo",
    category: "reactifs-laboratoire",
    price: null,
    availability: "QUOTE_ONLY",
    stock: null,
    lead: "Disponible après confirmation du devis.",
    usage: "Dépistage au laboratoire, selon le test confirmé.",
    install: "",
    accessories: "",
    warranty: "Consommable : conditions de retour à confirmer.",
    audience: "laboratoire,hopital,ong",
    usageCodes: "laboratoire",
    featured: false,
    specs: [["Présentation", "Test unitaire — exemple"], ["Analyte", "À préciser sur le devis"], ["Péremption", "Selon le lot, non indiquée dans cet exemple"]],
  },
];

const pages = [
  {
    slug: "faq",
    title: "Questions fréquentes",
    description: "Réponses de travail sur les devis, les prix, le paiement et les services.",
    body: `## Les prix affichés sont-ils définitifs ?
Non. Les prix de démonstration sont non contractuels. Un prix publié, lorsqu'il existe, peut être modifié tant que la commande n'est pas confirmée. Les produits sans prix passent par un devis.

## Comment demander un devis ?
Utilisez la page Devis, choisissez éventuellement des produits et décrivez le besoin. Une référence est alors créée. Elle ne vaut pas acceptation.

## Le paiement en ligne fonctionne-t-il déjà ?
Pas tant que l'entreprise n'a pas un contrat marchand actif. En mode test, les paiements sont simulés et aucun débit n'a lieu. Le paiement hors ligne reste en attente de vérification humaine.

## Livrez-vous partout en Guinée ?
Seules les options activées dans l'administration sont proposées. Les exemples de zones sont à remplacer. Un frais marqué « à confirmer » n'est pas un prix.

## L'installation est-elle incluse ?
Seulement si elle est choisie et chiffrée. La fiche produit indique les besoins connus, sans garantir une installation.

## Que signifie « urgent » ?
C'est votre indication de priorité. Ce n'est pas un délai d'intervention garanti.`,
  },
  {
    slug: "livraison",
    title: "Livraison et installation",
    description: "Principes de remise, à compléter avec les zones et frais réels.",
    body: `## Ce qui est déjà prévu
La commande permet de choisir une livraison, un retrait ou une installation parmi les options activées. Les frais connus sont ajoutés au total. Les frais « à confirmer » restent hors total.

## À compléter
- [À COMPLÉTER] zones réellement desservies
- [À COMPLÉTER] frais par zone
- [À COMPLÉTER] lieu de retrait
- [À COMPLÉTER] conditions d'accès pour l'installation, y compris les étages et l'alimentation électrique
- [À COMPLÉTER] délais que l'entreprise accepte de garantir

Les délais indicatifs des fiches ne sont pas des engagements.`,
  },
  {
    slug: "garantie",
    title: "Garantie",
    description: "Cadre à faire valider. Aucune durée de garantie n'est promise par défaut.",
    body: `## Principe
Une garantie n'existe que si elle est écrite sur la fiche validée, le devis accepté ou la commande. Le texte « à confirmer » ne crée pas de garantie.

## À compléter
- [À COMPLÉTER] durées par famille de produits
- [À COMPLÉTER] ce qui est couvert et exclu
- [À COMPLÉTER] prise en charge de la main-d'œuvre et des pièces
- [À COMPLÉTER] démarche en cas de panne

Ce texte doit être relu avant publication.`,
  },
  {
    slug: "retours",
    title: "Retours",
    description: "Politique de retour à rédiger et à faire valider.",
    body: `## État actuel
Aucune politique de retour n'est encore adoptée. Passer commande ne signifie pas qu'un retour est possible.

## À compléter
- [À COMPLÉTER] délais éventuels
- [À COMPLÉTER] produits exclus, notamment consommables ouverts
- [À COMPLÉTER] état exigé et frais de retour
- [À COMPLÉTER] modalité de remboursement

Les équipements installés ou personnalisés devront faire l'objet d'une règle explicite.`,
  },
  {
    slug: "confidentialite",
    title: "Confidentialité",
    description: "Information sur les données collectées pour les commandes et les demandes.",
    body: `## Responsable
Guinea Medical Device Shop SARL
Quartier Concasseur, commune de Gbessia, République de Guinée
Téléphone et WhatsApp : +224 622 32 58 88 et +224 628 00 09 02
E-mail : guineamedshop2026@gmail.com
L'affiche écrit « GUINEA MEDICAL DIVICE SHOP - SARL ». L'immatriculation reste à confirmer.

## Données utilisées
Le site demande les informations utiles pour répondre : nom, organisation, fonction, téléphone, e-mail, ville, besoin, et les pièces que vous joignez. Une commande ajoute l'adresse de remise.

## Ce qui n'est pas collecté
Les numéros de carte et les codes secrets Mobile Money ne sont pas saisis sur ce site. Le paiement en ligne, lorsqu'il sera activé, se fera sur la page du prestataire.

## Finalités
Traiter les devis, commandes, demandes de service et messages. Tenir la facturation et le suivi technique. Répondre aux demandes d'accès, de correction ou de suppression.

## Durée
[À COMPLÉTER] durées de conservation, à définir selon les obligations comptables et les garanties.

## Destinataires
L'équipe autorisée de l'entreprise. Le prestataire de paiement, uniquement quand un paiement en ligne est lancé. L'hébergeur. [À COMPLÉTER] autres sous-traitants.

## Vos demandes
Le formulaire de cette page permet de demander un accès, une correction ou une suppression. [À COMPLÉTER] base légale et délai de réponse après validation juridique.`,
  },
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    description: "Mentions à compléter avant publication.",
    body: `## Éditeur
Guinea Medical Device Shop SARL
Quartier Concasseur, commune de Gbessia, République de Guinée
Téléphone et WhatsApp : +224 622 32 58 88 et +224 628 00 09 02
E-mail : guineamedshop2026@gmail.com
[À COMPLÉTER] forme, capital, RCCM, NIF.
[À COMPLÉTER] directeur de la publication.

L'affiche écrit « GUINEA MEDICAL DIVICE SHOP - SARL ». Cette orthographe et l'immatriculation sont à confirmer.

## Hébergement
[À COMPLÉTER] nom et adresse de l'hébergeur.

## Propriété
[À COMPLÉTER] règles d'usage des textes, du logo et des photographies.`,
  },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (password.length < 12) throw new Error("ADMIN_PASSWORD doit contenir au moins 12 caractères pour le seed.");
  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    await db.user.create({
      data: {
        email,
        name: "Administration",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
  }

  await db.siteSetting.upsert({
    where: { id: "default" },
    create: { id: "default", data: JSON.stringify(defaultSettings) },
    update: {},
  });

  for (const [slug, name, description, sortOrder] of categories) {
    await db.category.upsert({
      where: { slug },
      create: { slug, name, description, sortOrder },
      update: { name, description, sortOrder, active: true },
    });
  }
  for (const [slug, name, note, isDemo] of brands) {
    await db.brand.upsert({
      where: { slug },
      create: { slug, name, note, isDemo },
      update: { name, note, isDemo },
    });
  }

  const categoryRows = await db.category.findMany();
  const brandRows = await db.brand.findMany();
  const categoryId = new Map(categoryRows.map((row) => [row.slug, row.id]));
  const brandId = new Map(brandRows.map((row) => [row.slug, row.id]));

  for (const product of products) {
    const data = {
      sku: product.sku,
      name: product.name,
      summary: product.summary,
      description: product.description,
      searchText: fold([product.name, product.sku, product.summary, product.description, product.brand, product.category].join(" ")),
      brandId: brandId.get(product.brand)!,
      categoryId: categoryId.get(product.category)!,
      priceGnf: product.price === null ? null : BigInt(product.price),
      availability: product.availability,
      stockQty: product.stock,
      leadTimeNote: product.lead,
      usageNotes: product.usage,
      installationNotes: product.install,
      accessoriesNote: product.accessories,
      warrantyNote: product.warranty,
      audience: product.audience,
      usage: product.usageCodes,
      featured: product.featured,
      active: true,
      isDemo: true,
      allowCart: true,
      allowQuote: true,
      allowQuestion: true,
      specs: JSON.stringify(product.specs.map(([label, value]) => ({ label, value }))),
    };
    await db.product.upsert({ where: { slug: product.slug }, create: { slug: product.slug, ...data }, update: data });
  }

  const deliveries = [
    { name: "Retrait — exemple", description: "Le lieu de retrait reste à indiquer par l'entreprise.", fulfillment: "PICKUP", feeGnf: BigInt(0), feePending: false, delayNote: "Délai non garanti.", sortOrder: 1 },
    { name: "Livraison Conakry — exemple", description: "Frais de démonstration, à remplacer.", fulfillment: "DELIVERY", feeGnf: BigInt(150000), feePending: false, delayNote: "Délai indicatif non contractuel.", sortOrder: 2 },
    { name: "Livraison autre ville — exemple", description: "Le transport hors de l'exemple Conakry doit être chiffré.", fulfillment: "DELIVERY", feeGnf: null, feePending: true, delayNote: "Frais et délai à confirmer.", sortOrder: 3 },
    { name: "Installation sur site — exemple", description: "Prestation à détailler dans le devis : accès, alimentation, mise en service.", fulfillment: "INSTALLATION", feeGnf: null, feePending: true, delayNote: "Planification à confirmer.", sortOrder: 4 },
  ];
  for (const option of deliveries) {
    const existingOption = await db.deliveryOption.findFirst({ where: { name: option.name } });
    if (existingOption) {
      await db.deliveryOption.update({ where: { id: existingOption.id }, data: { ...option, active: true, isDemo: true } });
    } else {
      await db.deliveryOption.create({ data: { ...option, active: true, isDemo: true } });
    }
  }

  for (const page of pages) {
    await db.pageContent.upsert({
      where: { slug_locale: { slug: page.slug, locale: "fr" } },
      create: { ...page, locale: "fr", needsReview: true },
      update: {},
    });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
