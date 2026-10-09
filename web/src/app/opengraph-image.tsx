import { ImageResponse } from "next/og";

export const alt = "VinoArgentino.es — Vinos de Argentina en Canarias";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Share card (WhatsApp, Instagram, Facebook...). Generated at build time,
// so it always matches the brand palette and needs no external file.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0f2a44 0%, #1f4d7a 100%)",
          color: "#ffffff",
          fontFamily: "serif",
          textAlign: "center",
          padding: 60,
        }}
      >
        <div style={{ display: "flex", width: 120, height: 6, background: "#e3a72f", marginBottom: 40 }} />
        <div style={{ display: "flex", fontSize: 104, fontWeight: 700, letterSpacing: -2 }}>
          VinoArgentino.es
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 28, color: "#74acdf" }}>
          Vinos de Argentina, directos a Canarias
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 36, color: "#e3a72f", letterSpacing: 6 }}>
          CAJAS · PACKS · RETIRADA EN LANZAROTE
        </div>
      </div>
    ),
    { ...size },
  );
}
