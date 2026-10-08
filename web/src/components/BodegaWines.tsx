"use client";

import { useCart } from "@/lib/CartContext";
import { lineKey } from "@/lib/cart";
import { CatalogWine } from "@/lib/types";
import { WineCard } from "@/components/WineCard";

export function BodegaWines({ wines }: { wines: CatalogWine[] }) {
  const { cart, add } = useCart();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {wines.map((w) => (
        <WineCard
          key={w.id}
          wine={w}
          qty={cart[lineKey("product", w.id)]?.qty ?? 0}
          onChangeQty={(id, change) => {
            const wine = wines.find((x) => x.id === id);
            if (wine) add(wine, change);
          }}
        />
      ))}
    </div>
  );
}
