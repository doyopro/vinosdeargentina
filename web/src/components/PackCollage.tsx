import Image from "next/image";
import { PackImage } from "@/lib/types";

// Bottle photos are 2:3 transparent PNGs with the bottle occupying roughly the
// middle third, so neighbours can overlap a lot without hiding each other.
const ASPECT = 2 / 3;

interface Props {
  images: PackImage[];
  /** "card": full stage on the pack card. "mini": tiny thumbnail for the cart. */
  size?: "card" | "mini";
}

export function PackCollage({ images, size = "card" }: Props) {
  const mini = size === "mini";
  const shown = mini ? images.slice(0, 3) : images;
  const n = shown.length;

  // Fixed stage (px) so the composition is deterministic; every bottle shares the
  // same height, grouped around the centre in a shallow fan.
  const stageW = mini ? 88 : 300;
  const stageH = mini ? 64 : 252;
  const spread = stageW * (mini ? 0.92 : 0.87);
  const heightByCount = [0, 0.96, 0.94, 0.9, 0.8, 0.73, 0.67];
  const bottleH = Math.round(stageH * (heightByCount[Math.min(n, 6)] ?? 0.6));
  const canvasW = bottleH * ASPECT;
  const step = n > 1 ? Math.min((spread - canvasW) / (n - 1), canvasW * 0.95) : 0;
  const marginLeft = n > 1 ? step - canvasW : 0;
  const mid = (n - 1) / 2;
  const angleStep = n <= 3 ? 5 : 4;

  return (
    <div
      className="relative mx-auto flex items-end justify-center"
      style={{ width: stageW, height: stageH, maxWidth: "100%" }}
    >
      {shown.map((img, i) => {
        const offset = i - mid;
        const dy = mini ? 0 : Math.round(offset * offset * 3);
        return (
          <div
            key={`${img.src}-${i}`}
            className="relative flex-shrink-0 origin-bottom"
            style={{
              height: bottleH,
              width: canvasW,
              marginLeft: i === 0 ? 0 : marginLeft,
              zIndex: Math.round(10 - Math.abs(offset) * 2),
              transform: `translateY(${dy}px) rotate(${mini ? 0 : offset * angleStep}deg)`,
            }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes={mini ? "40px" : "120px"}
              className="object-contain drop-shadow-[0_8px_10px_rgba(43,7,16,0.28)]"
            />
          </div>
        );
      })}
    </div>
  );
}
