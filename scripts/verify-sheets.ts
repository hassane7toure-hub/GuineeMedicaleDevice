import { db } from "../src/lib/db";
import { importProductTable, productRows } from "../src/lib/product-sheet";
import { parseTable, toCsv, toXlsx } from "../src/lib/tabular";
import { importUserTable, userRows } from "../src/lib/user-sheet";

async function main() {
const productTable = [
  ["Nom", "Référence", "Marque", "Catégorie", "Prix GNF", "Disponibilité", "Stock", "Établissements"],
  ["Article import", "TEST-IMPORT-ROLLBACK", "Marque Import Test", "Catégorie Import Test", "12000", "Disponible", "3", "Hôpital, Laboratoire"],
  ["Article import", "TEST-IMPORT-ROLLBACK", "Marque Import Test", "Catégorie Import Test", "12000", "Disponible", "3", "Hôpital"],
];

const parsedCsv = await parseTable(Buffer.from(toCsv(productTable)), "produits.csv");
const parsedXlsx = await parseTable(await toXlsx(parsedCsv, "Produits"), "produits.xlsx");
if (parsedXlsx[1]?.[1] !== "TEST-IMPORT-ROLLBACK") throw new Error(`xlsx roundtrip failed: ${JSON.stringify(parsedXlsx[1])}`);

const userTable = [
  ["Nom", "E-mail", "Mot de passe", "Rôle", "Actif"],
  ["Compte Import", "import.rollback@example.com", "Demonstration-1abc", "Client", "oui"],
  ["Compte court", "import.short@example.com", "court", "Client", "oui"],
];

try {
  await db.$transaction(async (tx) => {
    const products = await importProductTable(tx, parsedXlsx);
    if (products.created !== 1 || products.skipped !== 1) throw new Error(`products ${JSON.stringify(products)}`);
    const users = await importUserTable(tx, await parseTable(Buffer.from(toCsv(userTable)), "utilisateurs.csv"));
    if (users.created !== 1 || users.skipped !== 1) throw new Error(`users ${JSON.stringify(users)}`);
    const exportedUsers = userRows(await tx.user.findMany({ where: { email: "import.rollback@example.com" } }));
    if (exportedUsers[1]?.[3] !== "") throw new Error("password was exported");
    const exportedProducts = productRows(
      await tx.product.findMany({ where: { sku: "TEST-IMPORT-ROLLBACK" }, include: { brand: true, category: true } }),
    );
    if (exportedProducts[1]?.[4] !== "12000") throw new Error(`product export ${JSON.stringify(exportedProducts[1])}`);
    throw new Error("ROLLBACK");
  });
} catch (error) {
  if (!(error instanceof Error) || error.message !== "ROLLBACK") throw error;
}

const leftover = await db.product.count({ where: { sku: "TEST-IMPORT-ROLLBACK" } });
const leftoverUser = await db.user.count({ where: { email: "import.rollback@example.com" } });
if (leftover || leftoverUser) throw new Error("rollback left data");
console.log("sheets ok");
await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
