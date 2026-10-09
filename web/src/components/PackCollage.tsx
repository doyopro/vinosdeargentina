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

export function PackCollage({ images, size = "card" }: Props) {
  const mini = size === "mini";
  const hero = size === "hero";
  // Hero dimensions scale with the parent's --s CSS variable (responsive without JS).
  const px = (v: number): number | string => (hero ? `calc(var(--s, 1) * ${v}px)` : v);
  const shown = mini ? images.slice(0, 3) : images;
  const n = shown.length;

  // Fixed stage (px) so the composition is deterministic; every bottle shares the
  // same height, grouped around the centre in a shallow fan.
  const stageW = mini ? 88 : hero ? 540 : 300;
  const stageH = mini ? 64 : hero ? 450 : 252;
  const spread = stageW * (mini ? 0.92 : hero ? 0.98 : 0.87);
  const heightByCount = hero ? [0, 0.96, 0.95, 0.93, 0.88, 0.83, 0.78] : [0, 0.96, 0.94, 0.9, 0.8, 0.73, 0.67];
  const bottleH = Math.round(stageH * (heightByCount[Math.min(n, 6)] ?? 0.6));
  const canvasW = bottleH * ASPECT;
  const step = n > 1 ? Math.min((spread - canvasW) / (n - 1), canvasW * 0.95) : 0;
  const marginLeft = n > 1 ? step - canvasW : 0;
  const mid = (n - 1) / 2;
  const angleStep = n <= 3 ? 5 : 4;

  return (
    <div
      className="relative mx-auto flex items-end justify-center"
      style={{ width: px(stageW), height: px(stageH), maxWidth: "100%" }}
    >
      {shown.map((img, i) => {
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
              zIndex: Math.round(10 - Math.abs(offset) * 2),
              transform: `translateY(${hero ? `calc(var(--s, 1) * ${dy}px)` : `${dy}px`}) rotate(${mini ? 0 : offset * angleStep}deg)`,
            }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes={mini ? "40px" : hero ? "260px" : "120px"}
              className="object-contain drop-shadow-[0_8px_10px_rgba(15,42,68,0.28)]"
            />
          </div>
        );
      })}
    </div>
  );
}
