import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PantauDesa — Transparansi Anggaran Dana Desa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%)",
          padding: "64px 72px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* decorative dot grid */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 480,
            height: 480,
            background:
              "radial-gradient(circle at 70% 30%, rgba(99,102,241,0.25) 0%, transparent 60%)",
          }}
        />

        {/* eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 32,
              height: 4,
              background: "#6366f1",
              borderRadius: 2,
            }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#818cf8",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Platform Transparansi Desa
          </span>
        </div>

        {/* headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#f1f5f9",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 20,
          }}
        >
          PantauDesa
        </div>

        {/* sub */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "#94a3b8",
            lineHeight: 1.4,
            maxWidth: 680,
            marginBottom: 48,
          }}
        >
          Cari desamu. Lihat Dana Desa-nya.{"\n"}Awasi penggunaannya.
        </div>

        {/* stat strip */}
        <div style={{ display: "flex", gap: 40 }}>
          {[
            { value: "3.581", label: "Desa Jawa Barat" },
            { value: "100%", label: "Dana Desa tercatat" },
            { value: "Terbuka", label: "Data sumber resmi" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{ fontSize: 32, fontWeight: 700, color: "#e2e8f0" }}
              >
                {stat.value}
              </span>
              <span style={{ fontSize: 16, color: "#64748b" }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
