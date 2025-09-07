import React from "react";

const baseStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#b8c5d6",
  background: "linear-gradient(135deg, rgba(24,28,36,0.6) 0%, rgba(35,43,59,0.6) 100%)",
  border: "1px dashed rgba(255, 217, 61, 0.35)",
  borderRadius: "14px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
  backdropFilter: "blur(8px)",
  fontFamily: "'Inter', sans-serif",
};

const variants = {
  banner: { ...baseStyle, height: 80, width: "100%", fontWeight: 600, letterSpacing: 0.5 },
  inline: { ...baseStyle, height: 260, width: 360 },
  sidebar: { ...baseStyle, height: 600, width: 300, position: "sticky", top: 24 },
};

export default function AdSlot({ type = "banner", label = "Advertisement", style }) {
  const s = variants[type] || variants.banner;
  return (
    <div role="complementary" aria-label={label} style={{ ...s, ...style }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Ad</div>
        <div style={{ fontSize: 14 }}>{label}</div>
      </div>
    </div>
  );
} 