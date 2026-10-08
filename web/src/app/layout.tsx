import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import { CartProvider } from "@/lib/CartContext";
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
  title: "De Altura Wines | Desde los Andes a Canarias",
  description:
    "El prestigio mundial del vino argentino, desde la inmensidad de los Andes directo a Islas Canarias. Catálogo exclusivo.",
  openGraph: {
    type: "website",
    url: "https://doyopro.github.io/vinosdeargentina/",
    title: "De Altura Wines | Desde los Andes a Canarias",
    description:
      "El prestigio mundial del vino argentino, desde la inmensidad de los Andes directo a Islas Canarias. Catálogo exclusivo.",
    images: [
      {
        url: "https://pzzbvinbyzaxrshlmlcn.supabase.co/storage/v1/object/public/product-images/banner-compartir.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${playfair.variable} ${montserrat.variable} scroll-smooth`}>
      <body className="antialiased relative font-sans">
        <I18nProvider>
          <CartProvider>{children}</CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
