import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import { CartProvider } from "@/lib/CartContext";
import { AgeGate } from "@/components/AgeGate";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// viewport-fit=cover lets env(safe-area-inset-*) work on notched phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "VinoArgentino.es",
  title: "VinoArgentino.es — Vinos de Argentina online",
  description:
    "Vinos argentinos de altura, directos a Canarias. Cajas y packs con retirada gratis en Lanzarote y envío a las islas.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "VinoArgentino.es",
    title: "VinoArgentino.es — Vinos de Argentina online",
    description:
      "Vinos argentinos de altura, directos a Canarias. Cajas y packs con retirada gratis en Lanzarote y envío a las islas.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${playfair.variable} ${montserrat.variable} scroll-smooth`}>
      <body className="antialiased relative font-sans">
        <I18nProvider>
          <CartProvider>
            {children}
            <AgeGate />
          </CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
