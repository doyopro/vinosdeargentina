// Single source of truth for site photography. To add a new photo:
// 1. Drop the optimized JPEG into web/public/images/.
// 2. Add one entry below with its path, both alts, dimensions, focus point,
//    and the section(s) it belongs to. Nothing else in the app should
//    hardcode an image path.

export type ImageSection = "hero" | "landing";

export interface SiteImage {
  /** Public path, relative to web/public. */
  src: string;
  altEs: string;
  altEn: string;
  width: number;
  height: number;
  /** CSS object-position, tuned per photo so the important part of the
   * frame survives whatever crop its grid slot forces. */
  focus: string;
  sections: ImageSection[];
}

// width/height are the actual pixel dimensions of the optimized file (sips
// -Z 2400, longest side capped at 2400px), needed by next/image to reserve
// layout space and avoid CLS.
export const SITE_IMAGES: SiteImage[] = [
  {
    src: "/images/vinedo-andes-cielo.jpg",
    altEs: "Viñedo a los pies de la Cordillera de los Andes, bajo un cielo despejado",
    altEn: "Vineyard at the foot of the Andes mountains, under a clear sky",
    width: 2400,
    height: 1740,
    focus: "center 55%",
    sections: ["hero"],
  },
  {
    src: "/images/bandera-vinedo-mendoza.jpg",
    altEs: "Bandera argentina flameando frente a un viñedo con las montañas de Mendoza de fondo",
    altEn: "Argentine flag waving in front of a vineyard with the Mendoza mountains behind",
    width: 2400,
    height: 1600,
    focus: "30% 45%",
    sections: ["hero"],
  },
  {
    src: "/images/bodega-tractor-cordillera.jpg",
    altEs: "Tractor junto a hileras de vides con la cordillera y nubes dramáticas de fondo",
    altEn: "Tractor beside vine rows with the mountains and dramatic clouds behind",
    width: 2400,
    height: 1800,
    focus: "60% 60%",
    sections: ["hero"],
  },
  {
    src: "/images/quebrada-cerros-colores.jpg",
    altEs: "Cerros multicolores de la Quebrada, con burros pastando al pie de la montaña",
    altEn: "Multicolored hills of the Quebrada, with donkeys grazing at the foot of the mountain",
    width: 2400,
    height: 1600,
    focus: "45% 68%",
    sections: ["hero"],
  },
  {
    src: "/images/uvas-vid-vendimia.jpg",
    altEs: "Racimos de uva malbec colgando de la vid durante la vendimia",
    altEn: "Bunches of Malbec grapes hanging from the vine during harvest",
    width: 2400,
    height: 1614,
    focus: "40% 55%",
    sections: ["hero"],
  },
  {
    src: "/images/vinedo-cordillera-panoramica.jpg",
    altEs: "Vista panorámica de un viñedo con la Cordillera de los Andes al fondo",
    altEn: "Panoramic view of a vineyard with the Andes mountains in the background",
    width: 2400,
    height: 1600,
    focus: "center 50%",
    sections: ["hero"],
  },
  {
    src: "/images/uvas-malbec-01.jpg",
    altEs: "Primer plano de racimos de uva malbec en la vid",
    altEn: "Close-up of Malbec grape clusters on the vine",
    width: 1800,
    height: 2400,
    focus: "center 40%",
    sections: ["hero"],
  },
  {
    src: "/images/vinedo-hileras-montana.jpg",
    altEs: "Hileras de vides con las montañas de fondo en un día despejado",
    altEn: "Rows of vines with mountains in the background on a clear day",
    width: 2400,
    height: 1600,
    focus: "center 50%",
    sections: ["landing"],
  },
  {
    src: "/images/bodega-jardin-sauce.jpg",
    altEs: "Sauce llorón centenario en el jardín de una bodega argentina",
    altEn: "Century-old weeping willow in the garden of an Argentine winery",
    width: 1800,
    height: 2400,
    focus: "center 35%",
    sections: ["hero"],
  },
  {
    src: "/images/quebrada-humahuaca-panoramica.jpg",
    altEs: "Vista panorámica de la Quebrada de Humahuaca, con montañas de tonos rojizos",
    altEn: "Panoramic view of the Quebrada de Humahuaca, with reddish-toned mountains",
    width: 2400,
    height: 1041,
    focus: "center 60%",
    sections: ["hero"],
  },
  {
    src: "/images/vino-barrica-botellas.jpg",
    altEs: "Dos botellas de vino tinto sobre una barrica de roble, con viñedo de fondo",
    altEn: "Two bottles of red wine on an oak barrel, with a vineyard in the background",
    width: 2400,
    height: 1600,
    focus: "center 40%",
    sections: ["hero"],
  },
];

export function getImagesForSection(section: ImageSection): SiteImage[] {
  return SITE_IMAGES.filter((image) => image.sections.includes(section));
}

export function findImage(src: string): SiteImage {
  const image = SITE_IMAGES.find((i) => i.src === src);
  if (!image) throw new Error(`Unknown image: ${src}`);
  return image;
}
