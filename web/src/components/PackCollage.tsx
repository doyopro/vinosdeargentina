import Image from "next/image";
import { PackImage } from "@/lib/types";

// Bottle photos are 2:3 transparent PNGs with the bottle occupying roughly the
// middle third, so neighbours can overlap a lot without hiding each other.
const ASPECT = 2 / 3;

interface Props {
  images: PackImage[];
  /** "card": stage on the pack card. "hero": large stage on the pack page (scaled
   * with the CSS variable --s set by the parent). "mini": thumbnail for the cart. */
  size?: "card" | "hero" | "mini";
}

type Px = (v: number) => number | string;

interface RowProps {
  images: PackImage[];
  stageW: number;
  stageH: number;
  spreadK: number;
  heights: number[];
  px: Px;
  mini: boolean;
  hero: boolean;
  /** Distance from the stage bottom, in stage px (second row of big packs). */
  lift?: number;
  zBase?: number;
  /** Shrinks the row (back row looks further away). */
  scale?: number;
  sizes: string;
}

// One fan of bottles, bottom-anchored. Every bottle shares the same height,
// grouped around the centre in a shallow arc.
function Row({ images, stageW, stageH, spreadK, heights, px, mini, hero, lift = 0, zBase = 0, scale = 1, sizes }: RowProps) {
  const n = images.length;
  const spread = stageW * spreadK;
  const bottleH = Math.round(stageH * (heights[Math.min(n, 6)] ?? 0.6) * scale);
  const canvasW = bottleH * ASPECT;
  const step = n > 1 ? Math.min((spread - canvasW) / (n - 1), canvasW * 0.95) : 0;
  const marginLeft = n > 1 ? step - canvasW : 0;
  const mid = (n - 1) / 2;
  const angleStep = n <= 3 ? 5 : 4;
  return (
    <div className="absolute inset-x-0 flex items-end justify-center" style={{ bottom: px(lift), zIndex: zBase }}>
      {images.map((img, i) => {
        const offset = i - mid;
        const dy = mini ? 0 : Math.round(offset * offset * (hero ? 4 : 3));
        return (
          <div
            key={`${img.src}-${i}`}
            className="relative flex-shrink-0 origin-bottom"
            style={{
              height: px(bottleH),
              width: px(canvasW),
              marginLeft: i === 0 ? 0 : px(marginLeft),
              zIndex: zBase + Math.round(10 - Math.abs(offset) * 2),
              transform: `translateY(${hero ? `calc(var(--s, 1) * ${dy}px)` : `${dy}px`}) rotate(${mini ? 0 : offset * angleStep}deg)`,
            }}
          >
            <Image src={img.src} alt={img.alt} fill sizes={sizes} className="object-contain drop-shadow-[0_8px_10px_rgba(15,42,68,0.28)]" />
          </div>
        );
      })}
    </div>
  );
}

export function PackCollage({ images, size = "card" }: Props) {
  const mini = size === "mini";
  const hero = size === "hero";
  // Hero dimensions scale with the parent's --s CSS variable (responsive without JS).
  const px: Px = (v) => (hero ? `calc(var(--s, 1) * ${v}px)` : v);

  const shown = mini ? images.slice(0, 3) : images;
  const n = shown.length;

  // Fixed stage (px) so the composition is deterministic.
  const stageW = mini ? 88 : hero ? 540 : 300;
  const stageH = mini ? 64 : hero ? 450 : 252;
  const spreadK = mini ? 0.92 : hero ? 0.98 : 0.87;
  const heights = hero ? [0, 0.96, 0.95, 0.93, 0.88, 0.83, 0.78] : [0, 0.96, 0.94, 0.9, 0.8, 0.73, 0.67];
  const sizes = mini ? "40px" : hero ? "260px" : "120px";

  // Big packs (more than 6 bottles) go on two rows: a smaller back row and a
  // front row, so each bottle stays large instead of being squeezed into slivers.
  const twoRows = !mini && n > 6;
  const rowStageH = twoRows ? stageH * 0.64 : stageH;
  const back = twoRows ? shown.slice(0, Math.ceil(n / 2)) : [];
  const front = twoRows ? shown.slice(Math.ceil(n / 2)) : shown;
  const common = { stageW, stageH: rowStageH, spreadK, heights, px, mini, hero, sizes };

  return (
    <div className="relative mx-auto" style={{ width: px(stageW), height: px(stageH), maxWidth: "100%" }}>
      {twoRows && <Row {...common} images={back} lift={stageH * 0.3} scale={0.9} zBase={0} />}
      <Row {...common} images={front} zBase={twoRows ? 20 : 0} />
    </div>
  );
}
