import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Scanora — Accessibility, Performance & SEO Auditor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0e1a 0%, #0f1729 50%, #0a0e1a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow effects */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "700px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "0",
            width: "500px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(6, 182, 212, 0.08) 0%, transparent 70%)",
          }}
        />

        {/* Logo + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(16, 185, 129, 0.3)",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            </svg>
          </div>
          <span style={{ fontSize: "56px", fontWeight: 800, color: "white", letterSpacing: "-1px" }}>
            Scanora
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: "26px",
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: "750px",
            lineHeight: 1.5,
            marginBottom: "48px",
          }}
        >
          Free Website Accessibility, Performance & SEO Audit Tool
        </p>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { label: "Accessibility", color: "#10b981" },
            { label: "Performance", color: "#06b6d4" },
            { label: "SEO", color: "#f97316" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "12px",
                border: `1px solid ${item.color}33`,
                background: `${item.color}15`,
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: item.color,
                }}
              />
              <span style={{ fontSize: "18px", color: item.color, fontWeight: 600 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "4px",
            background: "linear-gradient(90deg, #10b981, #06b6d4, #f97316)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
