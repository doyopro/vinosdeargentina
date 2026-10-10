"use client";

import { useCart } from "@/lib/CartContext";
import { useLocaleSwitch } from "@/lib/i18n";
import { lineKey } from "@/lib/cart";
import { toPackLine } from "@/lib/packs";
import { Pack } from "@/lib/types";
import { PackCard } from "@/components/PackCard";

export function PacksGrid({ packs }: { packs: Pack[] }) {
  const { locale } = useLocaleSwitch();
  const { cart, addPack } = useCart();
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {packs.map((pack) => (
        <PackCard
          key={pack.id}
          pack={pack}
          qty={cart[lineKey("pack", pack.id)]?.qty ?? 0}
          onChangeQty={(p, change) => addPack(toPackLine(p, locale), change)}
        />
      ))}
    </div>
  );
}
