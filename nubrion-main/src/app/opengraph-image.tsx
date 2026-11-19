import { ImageResponse } from "next/og";

// Link preview for WhatsApp, Messenger, LinkedIn & co. Rendered once at build time.
export const alt = "Nubrion – AI, která ve firmě opravdu běží";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD = "#d9a441";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          color: "#eef1f5",
          background:
            "radial-gradient(circle at 78% 38%, rgba(217,164,65,.28), rgba(217,164,65,0) 45%), linear-gradient(180deg, #1b2330 0%, #10151c 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: `radial-gradient(circle at 35% 35%, #f3d28c, ${GOLD} 55%, #8a6420)`,
              boxShadow: "0 0 0 10px rgba(217,164,65,.14)",
            }}
          />
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>Nubrion</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, maxWidth: 900 }}>
            AI, která ve firmě opravdu běží
          </div>
          <div style={{ marginTop: 28, fontSize: 32, color: "#aab2bf" }}>
            Administrativa · Time management · Faktury · Firemní inteligence
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: GOLD }}>
          <div style={{ width: 40, height: 3, background: GOLD }} />
          nubrion.cz
        </div>
      </div>
    ),
    size,
  );
}
