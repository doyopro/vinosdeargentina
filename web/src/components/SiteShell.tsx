import Link from "next/link";
import { ReactNode } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CartFab } from "@/components/CartFab";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { Wordmark } from "@/components/Wordmark";
import { Tagline } from "@/components/Tagline";

// Shared frame for inner pages (wine, bodegas, legal): brand bar, content,
// footer with legal links, language toggle and cart.
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="canary-stripe h-2 w-full fixed top-0 z-[100]" />
      <LanguageToggle />
      <header className="bg-brand-900 pt-8 pb-5 px-5 border-b border-brand-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between pr-36 sm:pr-40">
          <Link href="/" className="flex flex-col leading-tight" aria-label="VinoArgentino.es">
            <Wordmark className="font-serif text-xl md:text-2xl tracking-wide" />
            <Tagline />
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
