"use client";

import Image from "next/image";
import { useLocaleSwitch } from "@/lib/i18n";
import { findImage, SiteImage } from "@/lib/images";
import styles from "./HeroCollage.module.css";

interface Tile {
  area: string;
  image: SiteImage;
  /** vw the tile actually renders at in this breakpoint, for next/image sizes. */
  vw: number;
  priority?: boolean;
}

// Desktop (>=1024px): 4 large photos on a 5/3/4 column grid — left and right
// columns full height, two stacked in the middle. Every tile gets the same
// navy veil (see the CSS module) so the set reads as one piece.
const DESKTOP_TILES: Tile[] = [
  { area: styles.a, image: findImage("/images/vinedo-andes-cielo.jpg"), vw: 42, priority: true },
  { area: styles.b, image: findImage("/images/uvas-vid-vendimia.jpg"), vw: 25 },
  { area: styles.c, image: findImage("/images/vino-barrica-botellas.jpg"), vw: 33 },
  { area: styles.d, image: findImage("/images/quebrada-humahuaca-panoramica.jpg"), vw: 25 },
];

// Tablet (640-1023px): 3 photos, one tall on the left.
const TABLET_TILES: Tile[] = [
  { area: styles.a, image: findImage("/images/vinedo-cordillera-panoramica.jpg"), vw: 50, priority: true },
  { area: styles.b, image: findImage("/images/uvas-vid-vendimia.jpg"), vw: 50 },
  { area: styles.c, image: findImage("/images/vino-barrica-botellas.jpg"), vw: 50 },
];

// Mobile (<640px): a single full-bleed photo. A multi-tile grid put its
// near-black seams right behind the title and copy, reading as hard dark
// bands on phones.
const MOBILE_TILES: Tile[] = [
  { area: styles.a, image: findImage("/images/vinedo-andes-cielo.jpg"), vw: 100, priority: true },
];

function CollageGrid({ tiles, gridClassName, locale }: { tiles: Tile[]; gridClassName: string; locale: "es" | "en" }) {
  return (
    <div className={gridClassName}>
      {tiles.map((tile) => (
        <div key={`${tile.area}-${tile.image.src}`} className={`${styles.tile} ${tile.area}`}>
          <Image
            src={tile.image.src}
            alt={locale === "en" ? tile.image.altEn : tile.image.altEs}
            fill
            sizes={`${tile.vw}vw`}
            priority={tile.priority}
            className="object-cover"
            style={{ objectPosition: tile.image.focus }}
          />
        </div>
      ))}
    </div>
  );
}

export function HeroCollage() {
  const { locale } = useLocaleSwitch();

  return (
    <div className={styles.wrapper}>
      <div className="hidden lg:block w-full h-full">
        <CollageGrid tiles={DESKTOP_TILES} gridClassName={styles.gridDesktop} locale={locale} />
      </div>
      <div className="hidden sm:block lg:hidden w-full h-full">
        <CollageGrid tiles={TABLET_TILES} gridClassName={styles.gridTablet} locale={locale} />
      </div>
      <div className="sm:hidden w-full h-full">
        <CollageGrid tiles={MOBILE_TILES} gridClassName={styles.gridMobile} locale={locale} />
      </div>
    </div>
  );
}
