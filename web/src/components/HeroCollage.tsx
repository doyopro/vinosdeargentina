"use client";

import Image from "next/image";
import { useLocaleSwitch } from "@/lib/i18n";
import { getImagesForSection } from "@/lib/images";

// Desktop/tablet show all 6 hero photos in a mosaic; mobile drops to the
// first 4 so tiles stay legible instead of shrinking into confetti.
const HERO_IMAGES = getImagesForSection("hero");
const MOBILE_IMAGES = HERO_IMAGES.slice(0, 4);

export function HeroCollage() {
  const { locale } = useLocaleSwitch();

  return (
    <div className="absolute inset-0 z-0">
      {/* Mobile: 2x2 grid */}
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full sm:hidden">
        {MOBILE_IMAGES.map((image, i) => (
          <div key={image.src} className="relative w-full h-full overflow-hidden">
            <Image
              src={image.src}
              alt={locale === "en" ? image.altEn : image.altEs}
              fill
              sizes="50vw"
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Desktop/tablet: 6-tile mosaic, one large tile + five smaller ones */}
      <div className="hidden sm:grid grid-cols-6 grid-rows-2 gap-0.5 w-full h-full">
        {HERO_IMAGES.map((image, i) => (
          <div
            key={image.src}
            className={`relative w-full h-full overflow-hidden ${i === 0 ? "col-span-3 row-span-2" : "col-span-1 row-span-1"}`}
          >
            <Image
              src={image.src}
              alt={locale === "en" ? image.altEn : image.altEs}
              fill
              sizes={i === 0 ? "50vw" : "17vw"}
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dark gradient for legibility: light at the top, heavier toward the
          bottom where the title/subtitle/button sit, but the photos stay visible. */}
      <div className="absolute inset-0 bg-gradient-to-b from-wine-900/50 via-wine-900/55 to-wine-900/85" />
    </div>
  );
}
