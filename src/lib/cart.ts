import { cookies } from "next/headers";
import { db } from "./db";
import { canPurchase } from "./catalog";

const CART_COOKIE = "gmd_cart";

async function jar() {
  return cookies();
}

export async function getCart() {
  const id = (await jar()).get(CART_COOKIE)?.value;
  if (!id) return null;
  return db.cart.findUnique({
    where: { id },
    include: { items: { include: { product: { include: { brand: true } } }, orderBy: { id: "asc" } } },
  });
}

export async function getOrCreateCart() {
  const existing = await getCart();
  if (existing) return existing;
  const cart = await db.cart.create({ data: { id: crypto.randomUUID() } });
  (await jar()).set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return db.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: { items: { include: { product: { include: { brand: true } } } } },
  });
}

export async function cartCount() {
  const cart = await getCart();
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export function linePurchasable(item: { quantity: number; product: { allowCart: boolean; priceGnf: bigint | null; availability: string; active: boolean; stockQty: number | null } }) {
  if (!item.product.active || !canPurchase(item.product)) return false;
  if (item.product.stockQty !== null && item.product.stockQty < item.quantity) return false;
  return true;
}
