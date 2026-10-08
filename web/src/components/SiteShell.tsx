import Link from "next/link";
import { ReactNode } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CartFab } from "@/components/CartFab";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";

// Shared frame for inner pages (wine, bodegas, legal): brand bar, content,
// footer with legal links, language toggle and cart.
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="canary-stripe h-2 w-full fixed top-0 z-[100]" />
      <LanguageToggle />
      <header className="bg-wine-900 pt-8 pb-5 px-5 border-b border-wine-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between pr-36 sm:pr-40">
          <Link href="/" className="font-serif text-xl md:text-2xl text-white tracking-wide hover:text-gold-500 transition-colors">
            De Altura <span className="text-gold-500">Wines</span>
          </Link>
          <SiteNav />
        </div>
      </header>
      <main>{children}</main>
      <SiteFooter />
      <CartFab />
    </>
  );
}
