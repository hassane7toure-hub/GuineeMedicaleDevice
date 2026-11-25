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
    description: "Commande, devis, disponibilité, livraison, installation, garantie et assistance.",
    body: `## Comment passer une commande ?
Sélectionnez le produit, indiquez la quantité et suivez les étapes de commande. Si le site ne permet pas de finaliser l'achat, contactez l'équipe pour obtenir un devis ou confirmer la disponibilité.

## Puis-je demander un devis pour un établissement de santé ?
Oui. Les hôpitaux, cliniques, cabinets, laboratoires, ONG et autres organisations peuvent demander un devis en précisant les références, les quantités, la destination et les besoins éventuels d'installation.

## Les produits sont-ils disponibles immédiatement ?
La disponibilité est indiquée sur la fiche produit lorsqu'elle est connue. Pour les équipements sur commande ou les grandes quantités, l'équipe confirme le délai après vérification.

## Livrez-vous en dehors de Conakry ?
La livraison peut être organisée dans les autres villes et régions selon la destination, le produit et les possibilités logistiques. Les frais et les délais sont confirmés avant la commande.

## Proposez-vous l'installation et la formation ?
Pour certains équipements, l'installation, la mise en service ou la formation peuvent être proposées. Leur disponibilité et leur coût sont précisés dans le devis.

## Comment bénéficier de la garantie ?
Contactez le service client avec la preuve d'achat, la référence du produit et une description du problème. Une vérification pourra être réalisée conformément aux conditions du fabricant.

## Puis-je retourner un produit ?
Les retours sont examinés selon la politique de retour, l'état du produit, son type et les conditions applicables. Contactez le service client avant tout renvoi.

## Comment obtenir une assistance technique ?
Indiquez la marque, la référence, le numéro de série si vous l'avez, le problème constaté et vos coordonnées.

## Les produits sont-ils destinés à un usage professionnel ?
Chaque fiche produit indique sa destination et ses caractéristiques. Le client vérifie que le produit correspond à son besoin et à l'usage prévu.`,
  },
  {
    slug: "livraison",
    title: "Livraison et installation",
    description: "Livraison à Conakry et dans les autres zones de Guinée, installation et réception.",
    body: `## Livraison
GUINEA MEDICAL DEVICE SHOP - SARL livre à Conakry et dans les autres zones de Guinée selon la couverture logistique disponible. Le délai estimatif, le coût et les éventuelles contraintes d'accès sont confirmés avant la validation de la commande. Les délais peuvent varier selon la disponibilité du produit, la destination, les formalités et les conditions de transport.

## Installation et mise en service
Certains équipements nécessitent une installation, un paramétrage, une vérification ou une formation à l'utilisation. Ces prestations sont proposées lorsqu'elles sont disponibles. Elles font l'objet d'un devis qui précise le périmètre, les prérequis du site, les frais et le calendrier. Le client s'assure que le lieu d'installation dispose des conditions nécessaires : alimentation électrique, espace, sécurité, accès, réseau ou autres prérequis indiqués.

## Réception
À la livraison, le client vérifie le colis, le produit, les accessoires et les documents remis. Toute réserve relative à un dommage visible, un article manquant ou une erreur de référence est signalée au livreur et au service client dans les meilleurs délais.`,
  },
  {
    slug: "garantie",
    title: "Garantie",
    description: "Garantie fabricant, exclusions et démarche de demande. La durée se renseigne sur chaque fiche.",
    body: `Les équipements et dispositifs vendus bénéficient de la garantie fabricant lorsqu'elle est prévue, selon la durée, les conditions et les exclusions indiquées dans la fiche produit, le certificat de garantie ou les documents remis à l'achat. GUINEA MEDICAL DEVICE SHOP - SARL accompagne le client dans la prise en charge des demandes de garantie.

## Ce que la garantie ne couvre généralement pas
La garantie ne couvre généralement pas les dommages liés à une mauvaise utilisation, une installation non conforme, une modification non autorisée, un entretien insuffisant, une usure normale, un accident ou l'utilisation de consommables et d'accessoires non recommandés par le fabricant, sous réserve des droits impératifs du client.

## Ouvrir une demande
Le client fournit la référence du produit, la preuve d'achat, une description du défaut et, si possible, des photos ou des vidéos. Le produit peut être soumis à un diagnostic avant décision.

## Fiche produit
Les conditions de garantie propres à chaque produit prévalent lorsqu'elles sont plus précises et compatibles avec les règles applicables. La durée et les modalités sont renseignées sur la fiche avant publication.`,
  },
  {
    slug: "retours",
    title: "Retours",
    description: "Demande de retour, conditions d'acceptation, produits restreints et remboursement.",
    body: `Toute demande de retour est adressée au service client avant l'expédition ou le dépôt du produit. Le client indique le numéro de commande, la référence, le motif du retour et joint, si possible, des photos.

## Conditions d'acceptation
Sous réserve des droits légaux du client, un retour peut être accepté lorsque le produit n'est pas utilisé, qu'il est complet, dans son emballage d'origine, accompagné de ses accessoires et de ses documents, et qu'il peut être remis en vente dans des conditions appropriées. Une inspection peut être effectuée à la réception.

## Produits soumis à restriction
Pour des raisons de sécurité, d'hygiène, de traçabilité ou de protection des patients, certains produits peuvent être exclus du retour ou soumis à des conditions particulières. Il s'agit notamment des consommables, des produits stériles, des articles dont l'emballage de protection a été ouvert, des produits personnalisés, des produits commandés spécialement et des équipements déjà installés ou utilisés. Ces restrictions sont précisées par catégorie de produit. Elles ne limitent pas les droits impératifs du client.

## Produit défectueux, endommagé ou non conforme
En cas de produit endommagé à la livraison, défectueux ou différent de la commande, le client contacte rapidement le service client et conserve le produit, son emballage et les éléments de preuve. Après vérification, une solution peut être proposée : remplacement, réparation, remboursement, avoir ou autre prise en charge conforme aux règles applicables.

## Frais et remboursement
Les frais de retour, les modalités de remboursement et les délais de traitement sont communiqués au client avant la validation de la procédure, selon le motif du retour et les conditions applicables. Aucun retour n'est expédié sans instruction préalable du service client.

## Contact
Téléphone : +224 622 32 58 88
WhatsApp : +224 628 00 09 02
E-mail : guineamedshop2026@gmail.com
Quartier Concasseur, commune de Gbessia`,
  },
  {
    slug: "confidentialite",
    title: "Confidentialité",
    description: "Utilisation des informations de devis, de commande, de livraison et de service client.",
    body: `GUINEA MEDICAL DEVICE SHOP - SARL accorde une importance particulière à la confidentialité des informations communiquées par ses clients. Les données recueillies lors d'une demande de devis, d'une commande, d'une livraison ou d'un échange avec le service client sont utilisées pour traiter les demandes, assurer le suivi commercial, gérer les règlements, organiser la livraison et améliorer les services.

## Accès aux informations
Les informations sont accessibles uniquement aux personnes et aux prestataires qui en ont besoin pour accomplir ces opérations. Elles ne sont pas vendues à des tiers. Elles peuvent être communiquées aux partenaires qui interviennent dans le traitement de la commande, notamment les transporteurs et les techniciens d'installation, dans la limite des informations nécessaires.

## Ce qui n'est pas demandé
Le site ne propose pas de paiement en ligne. Les numéros de carte et les codes secrets Mobile Money ne sont pas demandés.

## Vos demandes
Le client peut demander l'accès, la correction ou la mise à jour de ses informations, ainsi que poser toute question relative à leur utilisation.
E-mail : guineamedshop2026@gmail.com
Téléphone : +224 622 32 58 88
WhatsApp : +224 628 00 09 02
Quartier Concasseur, commune de Gbessia
Le formulaire de cette page sert aussi à demander un accès, une correction ou une suppression. La durée de conservation est déterminée selon la finalité du traitement et les obligations applicables.

## Cookies
Le site peut utiliser des cookies ou des technologies similaires pour assurer son fonctionnement, mesurer l'audience ou améliorer l'expérience de navigation. Les paramètres de consentement et de navigation sont présentés, lorsque cela est requis, dans une interface dédiée.`,
  },
  {
    slug: "conditions-generales",
    title: "Conditions générales de vente",
    description: "Modalités de vente, de prix, de commande, de livraison et de réclamation.",
    body: `Les présentes Conditions Générales de Vente (CGV) définissent les modalités selon lesquelles GUINEA MEDICAL DEVICE SHOP - SARL (ci-après « le Vendeur ») propose et vend ses produits et services aux clients particuliers, professionnels de santé, établissements sanitaires, entreprises et organisations.

## 1.1. Produits et disponibilité
Les produits présentés sur le site sont décrits avec leurs caractéristiques essentielles, leur référence et, lorsqu'elle est connue, leur disponibilité. Les photographies sont illustratives et peuvent présenter de légères différences avec le produit livré. Une commande est confirmée sous réserve de disponibilité et de validation du paiement ou des conditions de règlement convenues.

## 1.2. Prix et paiement
Les prix sont indiqués en GNF. Ils précisent, le cas échéant, les taxes, les frais de livraison, les frais d'installation ou les autres coûts applicables. Le montant final est communiqué au client avant la validation de la commande. Les moyens de règlement acceptés sont ceux affichés sur le site ou ceux confirmés par le service commercial. Le site ne propose pas de paiement en ligne.

## 1.3. Commande
Le client vérifie les références, les quantités, les caractéristiques, les coordonnées et les modalités de livraison avant de confirmer sa commande. Un accusé de réception ne constitue pas nécessairement une confirmation définitive de disponibilité. Le Vendeur peut contacter le client pour clarifier une information ou proposer une solution en cas d'indisponibilité.

## 1.4. Livraison, installation et réception
Les délais et les frais de livraison sont communiqués lors de la commande ou dans le devis. Pour les équipements qui nécessitent une installation, celle-ci est réalisée selon les modalités convenues au devis. À la réception, le client vérifie l'état apparent, les accessoires et les références, puis signale rapidement toute anomalie.

## 1.5. Réclamations et responsabilité
Toute réclamation peut être adressée au service client aux coordonnées indiquées sur le site. Le Vendeur examine les demandes et propose, selon le cas, une réparation, un remplacement, un avoir, un remboursement ou une autre solution prévue par les conditions applicables. Les produits sont utilisés conformément à leur notice, à leur destination et aux recommandations du fabricant.

## 1.6. Acceptation
La validation d'une commande implique la prise de connaissance des CGV et leur acceptation, sous réserve des dispositions impératives applicables. Les CGV en vigueur au moment de la commande sont celles qui s'appliquent à cette transaction.`,
  },
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    description: "Éditeur, activité et responsable de la publication. Le RCCM et le NIF restent à compléter.",
    body: `## Éditeur
- Dénomination : GUINEA MEDICAL DEVICE SHOP - SARL
- Nom commercial : Guinée Medical Device Shop
- Forme juridique : SARL
- Activité : vente, installation et maintenance d'équipements médicaux et de leurs consommables. Vente et distribution d'équipements, de dispositifs médicaux, de consommables et d'accessoires, selon le catalogue effectivement proposé.
- Adresse du siège : Quartier Concasseur, commune de Gbessia
- Téléphone : +224 622 32 58 88
- WhatsApp : +224 628 00 09 02
- E-mail : guineamedshop2026@gmail.com
- Responsable de la publication : Alhassane TOURE
- RCCM / NIF : [à compléter]

Les informations relatives aux autorisations, aux enregistrements, à la conformité des produits et aux obligations applicables à la commercialisation de dispositifs médicaux sont à vérifier et à ajouter selon la réglementation guinéenne et les catégories de produits vendus.

## Hébergement
[à compléter] nom et adresse de l'hébergeur.`,
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
      create: { ...page, locale: "fr", needsReview: page.slug === "mentions-legales" },
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
