import Link from "next/link";
import { Availability } from "./availability";
import { DeviceArt } from "./device-art";
import { PriceTag } from "./price-tag";
import type { ProductCard as Card } from "@/lib/catalog";

export function ProductCard({ product }: { product: Card }) {
  return (
    <article className="card product-card">
      <Link href={`/produit/${product.slug}`} className="visual">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.imageAlt} />
        ) : (
          <DeviceArt category={product.categorySlug} />
        )}
      </Link>
      <div className="card-body">
        <p className="meta">{product.categoryName}</p>
        <h3>
          <Link href={`/produit/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="meta">
          {product.brandName}
          {product.brandDemo ? " · marque de démonstration" : ""} · {product.sku}
        </p>
        <Availability value={product.availability} />
        {product.isDemo ? <span className="badge badge-demo">Démonstration</span> : null}
        <PriceTag amount={product.priceGnf} demo={product.isDemo} />
      </div>
    </article>
  );
}
