# GUINEA MEDICAL DEVICE SHOP - SARL

Boutique en français pour la vente, l'installation, la maintenance et le conseil en équipements médicaux, pensée pour la République de Guinée. Les prix sont en francs guinéens. Les coordonnées, stocks, garanties et paiements réels ne sont pas inventés : ils se configurent, et le catalogue livré est marqué comme démonstration.

## Architecture

Next.js (App Router) rend les pages sur le serveur. Le catalogue, le panier et les formulaires restent utilisables avec peu de JavaScript, ce qui compte sur un téléphone et une connexion lente. Tailwind porte l'interface. Prisma et SQLite stockent les données en local ; le schéma n'utilise que des types compatibles avec PostgreSQL pour la production.

Les rôles sont : administration, direction opérationnelle, commercial, catalogue, support et client. L'accès à l'administration est vérifié par un cookie de session signé, puis à nouveau dans chaque action sensible. Les formulaires publics sont validés avec Zod, limités en débit et protégés par un champ invisible.

Les paiements passent par une seule fonction de confirmation (`applyVerified`). Elle refuse une transition illégale, ignore un événement déjà traité et ne marque une commande payée qu'après cette vérification. Trois prestataires existent derrière cette fonction :

- `offline` : demande hors ligne, qui reste en attente ;
- `sandbox` : page de test interne, active seulement si `PAYMENT_MODE=test`, sans saisie de carte ni de code secret ;
- `cinetpay` : page hébergée du prestataire, inactive tant que les identifiants, le mode live et la devise `GNF` ne sont pas tous présents.

L'éligibilité de CinetPay pour un marchand guinéen n'est pas supposée. Orange Money, Visa, Mastercard et PayCard ne sont proposés en réel que comme canaux de cette page hébergée, après confirmation du contrat. Le retour navigateur n'a pas le droit de confirmer un paiement. La notification serveur rappelle l'API de vérification du prestataire.

Les textes de l'interface partent de `src/i18n/fr.ts`. Une autre langue s'ajoute en créant un dictionnaire et en l'enregistrant dans `src/i18n/index.ts`. Les pages longues sont en base, par couple slug + langue.

## Arborescence

- `/` accueil
- `/boutique` catalogue, filtres et pages de 8 produits
- `/produit/[slug]` fiche
- `/comparer?ids=a,b,c` comparaison
- `/services` et formulaire
- `/devis` demande multi-produits
- `/panier` puis `/commande` puis `/commande/[reference]`
- `/commande/suivi` avec la référence et l'e-mail
- `/paiement/sandbox/[id]` simulation
- `/paiement/retour` lecture de l'état, sans confirmer le paiement
- `/a-propos`, `/contact`
- `/faq`, `/livraison`, `/garantie`, `/retours`, `/confidentialite`, `/mentions-legales`
- `/compte` et `/admin`

## Installation

Prérequis : Node.js 20 ou plus récent.

```powershell
cd C:\Users\hassa\OneDrive\Desktop\GMD\Site
copy .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run verify
npm run dev
```

Le site local est sur [http://localhost:3000](http://localhost:3000).

Le fichier `.env` déjà présent sert au développement. Le compte équipe créé par le seed utilise `ADMIN_EMAIL` et `ADMIN_PASSWORD`. Avec le `.env` local fourni :

- e-mail : `admin@example.com`
- mot de passe : `Demonstration-GMD-2026`

Changez-le avant tout hébergement. Le seed ne remplace pas le mot de passe si le compte existe déjà.

## Variables d'environnement

Le modèle est `.env.example`. Aucune valeur de ce fichier n'est un secret de production.

- `DATABASE_URL` : SQLite local, ou une URL PostgreSQL.
- `SESSION_SECRET` et `PAYMENT_WEBHOOK_SECRET` : longues chaînes aléatoires. En production, une valeur contenant `dev-only`, `changeme` ou `replace-with` est refusée.
- `PAYMENT_MODE` : `test` ou `live`.
- `NEXT_PUBLIC_SITE_URL` : URL publique, sans slash final.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` : premier administrateur.
- `SALES_EMAIL` et les variables `SMTP_*` : notification e-mail. Sans SMTP, la demande reste visible dans l'administration et la notification est marquée non envoyée.
- `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_CURRENCY` : vides tant que le contrat n'est pas signé. `CINETPAY_CURRENCY` doit valoir exactement `GNF`, sinon le prestataire reste coupé. Aucun taux n'est appliqué à la place.
- `ENFORCE_HTTPS` : `true` derrière un reverse proxy HTTPS, pour envoyer l'en-tête HSTS.

Générer un secret :

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Administration

Connectez-vous puis ouvrez Espace équipe. Le tableau de bord liste ce qui manque avant la mise en ligne. On y gère le catalogue, les commandes, les paiements, les devis, les services, les messages, les options de remise, les pages, les réglages, les utilisateurs, le journal et les exports CSV.

Les exports contiennent des données personnelles et sont réservés aux rôles autorisés. Les URL de paiement ne sont pas exportées.

Retirer un produit de la boutique le masque. Les fichiers déjà téléversés ne sont pas effacés du disque.

## Paiement

En mode test, le récapitulatif propose une simulation Orange Money, une simulation Visa et, si le réglage est actif, le paiement hors ligne. La page de simulation ne demande aucun numéro. Le succès, l'échec, l'annulation et la mise « à vérifier » passent par la même fonction que la notification serveur. Un second appel identique ne crée ni second paiement ni second mouvement de stock.

En mode live, les simulations disparaissent. Un moyen en ligne n'apparaît que si CinetPay est complet et si l'administrateur a coché ce moyen. Le webhook est `POST /api/paiements/notification/cinetpay`. Il déclenche un contrôle auprès du prestataire. Si le prestataire ne répond pas, la réponse est 503 pour permettre une nouvelle tentative, et la commande reste en attente.

Un règlement hors ligne n'est jamais traité comme payé tant qu'une personne autorisée ne l'a pas enregistré après vérification.

## Déploiement

1. Créer le serveur Node, le nom de domaine et le certificat HTTPS.
2. Renseigner `.env` de production, avec `PAYMENT_MODE=test` tant que le marchand n'est pas opérationnel.
3. Pour PostgreSQL, changer le provider du schéma Prisma en `postgresql`, pointer `DATABASE_URL`, puis lancer `npx prisma migrate dev` en développement pour régénérer la migration.
4. `npm ci`, `npx prisma migrate deploy`, `npm run build`, `npm start`.
5. Placer un reverse proxy HTTPS devant le port de l'application. Faire en sorte qu'il écrive l'adresse réelle du client dans `x-forwarded-for`.
6. Sauvegarder la base. SQLite est un fichier unique, sensible aux copies pendant l'écriture et au verrouillage de OneDrive. PostgreSQL est préférable dès que le site est public.
7. Désactiver le mode démonstration seulement après avoir masqué les produits d'exemple, remplacé les options de livraison et fait valider les pages juridiques.

## À fournir avant la production

- Confirmation de la dénomination, du RCCM, du NIF, du capital et du responsable de publication.
- Téléphone, WhatsApp, e-mail, adresse, horaires, réseaux et zones réellement couvertes.
- Catalogue : noms, références, marques distribuées, photos dont les droits sont détenus, textes alternatifs, caractéristiques, notices autorisées.
- Prix en GNF, règles de stock, délais que l'entreprise accepte de garantir.
- Frais et modes de livraison, retrait et installation.
- Durées de garantie, exclusions, politique de retour et durées de conservation des données, relues par un conseil.
- Comptes marchands : prestataire retenu, preuve que la Guinée et le franc guinéen sont couverts, identifiants de production, moyens réellement inclus (Orange Money, Visa, Mastercard, PayCard ou autre).
- Adresse SMTP et personne qui reçoit les notifications.
- Mot de passe d'administration remplaçant celui de démonstration, et liste des autres comptes.

## Limites connues

- Aucun encaissement réel n'est branché. L'éligibilité guinéenne de CinetPay, et le fait qu'il encaisse en GNF, doivent être confirmés par le prestataire. Un autre prestataire s'ajoute en implémentant la même vérification serveur, sans réécrire la commande.
- Il n'y a pas d'intégration directe au code USSD Orange Money, volontairement : le secret ne doit pas transiter par ce site.
- Les photos du catalogue d'exemple sont des illustrations. Les photographies réelles sont à téléverser.
- Les prix, stocks, marques et frais de l'exemple sont fictifs.
- Les pages légales sont des brouillons.
- Le taux EUR ou USD n'est affiché que s'il est saisi. Il reste indicatif.
- La limitation des essais de connexion est stockée dans la base de cette instance. Plusieurs serveurs sans base partagée ne la cumulent pas.
- L'en-tête de sécurité des scripts autorise encore les scripts internes nécessaires au framework. Un durcissement par nonce peut venir ensuite.
- Le site est en français. L'architecture de traduction est prête, les autres langues ne sont pas rédigées.
- Une commande peut être créée avant le paiement. C'est voulu : une panne du prestataire ne l'efface pas. Elle reste à reprendre ou à vérifier.
