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

// Desktop (>=1024px): 6x4 grid, 9 photos — 3 big squares (a/f/g), 2 tall
// verticals (b/d, our only two portrait-shot photos), 4 wide strips
// (c/e/h/i). Themes alternate so no two vineyard+mountain shots touch, and
// the busiest photo (donkeys + striped hills) sits at a far corner, not
// behind the title.
const DESKTOP_TILES: Tile[] = [
  { area: styles.a, image: findImage("/images/vinedo-andes-cielo.jpg"), vw: 33, priority: true },
  { area: styles.b, image: findImage("/images/uvas-malbec-01.jpg"), vw: 17 },
  { area: styles.c, image: findImage("/images/bandera-vinedo-mendoza.jpg"), vw: 33 },
  { area: styles.d, image: findImage("/images/bodega-jardin-sauce.jpg"), vw: 17 },
  { area: styles.e, image: findImage("/images/uvas-vid-vendimia.jpg"), vw: 33 },
  { area: styles.f, image: findImage("/images/quebrada-cerros-colores.jpg"), vw: 33 },
  { area: styles.g, image: findImage("/images/vino-barrica-botellas.jpg"), vw: 33 },
  { area: styles.h, image: findImage("/images/quebrada-humahuaca-panoramica.jpg"), vw: 33 },
  { area: styles.i, image: findImage("/images/bodega-tractor-cordillera.jpg"), vw: 33 },
];

// Tablet (640-1023px): 4x3 grid, 7 photos — 1 big square, 4 small squares,
// 2 wide strips. No tall verticals needed, so the two portrait photos crop
// fine into small squares here.
const TABLET_TILES: Tile[] = [
  { area: styles.a, image: findImage("/images/vinedo-cordillera-panoramica.jpg"), vw: 50 },
  { area: styles.b, image: findImage("/images/uvas-vid-vendimia.jpg"), vw: 25 },
  { area: styles.c, image: findImage("/images/quebrada-cerros-colores.jpg"), vw: 25 },
  { area: styles.d, image: findImage("/images/quebrada-humahuaca-panoramica.jpg"), vw: 50 },
  { area: styles.e, image: findImage("/images/uvas-malbec-01.jpg"), vw: 25 },
  { area: styles.f, image: findImage("/images/bodega-tractor-cordillera.jpg"), vw: 50 },
  { area: styles.g, image: findImage("/images/bodega-jardin-sauce.jpg"), vw: 25 },
];

// Mobile (<640px): 2x3 grid, 4 photos — 2 wide strips, 2 small squares.
const MOBILE_TILES: Tile[] = [
  { area: styles.a, image: findImage("/images/vinedo-andes-cielo.jpg"), vw: 100 },
  { area: styles.b, image: findImage("/images/uvas-malbec-01.jpg"), vw: 50 },
  { area: styles.c, image: findImage("/images/bodega-jardin-sauce.jpg"), vw: 50 },
  { area: styles.d, image: findImage("/images/bodega-tractor-cordillera.jpg"), vw: 100 },
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
