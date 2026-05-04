const { useState } = React;

// ─── Wordmark ──────────────────────────────────────
window.Wordmark = function Wordmark({ className = "", size = 22, merch = false }) {
  return (
    <span className={className} style={{ fontSize: size, letterSpacing: "-0.02em", lineHeight: 1 }}>
      <span style={{ fontWeight: 200 }}>PSU</span>
      <span style={{ fontWeight: 700 }}>Worship</span>
      {merch && (
        <span style={{ marginLeft: 8, fontSize: size * 0.42, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: merch === "dark" ? "#968a78" : "rgba(0,48,73,0.45)" }}>
          Merch
        </span>
      )}
    </span>
  );
};

// ─── Eyebrow ───────────────────────────────────────
window.Eyebrow = function Eyebrow({ children, color = "#b45741", mb = 8 }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color, marginBottom: mb }}>
      {children}
    </div>
  );
};

// ─── PillButton ────────────────────────────────────
window.PillButton = function PillButton({ children, variant = "primary", onClick, disabled, style }) {
  const [hover, setHover] = useState(false);
  const base = {
    height: 52, padding: "0 32px", borderRadius: 9999, border: variant === "outline" ? "1px solid rgba(0,48,73,0.2)" : "0",
    background: disabled ? "rgba(0,48,73,0.15)" : variant === "outline" ? "transparent" : (hover ? "#b45741" : "#003049"),
    color: variant === "outline" ? "#003049" : "#fff7eb",
    fontSize: 13, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
    transform: hover && !disabled ? "translateY(-2px)" : "none",
    boxShadow: hover && !disabled ? "0 8px 24px rgba(0,48,73,0.18)" : "none",
    transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: disabled ? 0.5 : 1,
    fontFamily: "inherit",
    ...style,
  };
  return <button style={base} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onClick} disabled={disabled}>{children}</button>;
};

// ─── ToolCard ──────────────────────────────────────
window.ToolCard = function ToolCard({ icon, title, desc, accent, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onClick}
      style={{
        background: "#fff", borderRadius: 16, border: `1px solid ${hover ? "rgba(0,48,73,0.3)" : "rgba(0,48,73,0.10)"}`,
        padding: 24, display: "flex", gap: 20, alignItems: "center", cursor: "pointer",
        boxShadow: hover ? "0 12px 32px rgba(0,48,73,0.14)" : "none", transition: "all 200ms",
      }}
    >
      <div style={{ width: 60, height: 60, background: accent || "#003049", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff7eb" }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, color: "#003049" }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 14, color: "rgba(0,48,73,0.60)" }}>{desc}</p>
      </div>
      <div style={{ fontSize: 22, opacity: hover ? 0.6 : 0.3, transform: hover ? "translateX(4px)" : "none", transition: "all 200ms", color: "#003049" }}>→</div>
    </div>
  );
};

// ─── Icons ─────────────────────────────────────────
window.HarmonyIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="10" width="3" height="4" rx="1" fill="#fff7eb"/><rect x="8" y="6" width="3" height="12" rx="1" fill="#fff7eb"/><rect x="13" y="8" width="3" height="8" rx="1" fill="#fff7eb"/><rect x="18" y="5" width="3" height="14" rx="1" fill="#fff7eb"/></svg>);
window.SetlistIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#fff7eb" strokeWidth="2" fill="none"/><line x1="8" y1="8" x2="16" y2="8" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="16" x2="13" y2="16" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round"/></svg>);
window.MerchIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="7" cy="7" r="1.5" fill="#fff7eb"/></svg>);
window.JoinIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="#fff7eb" strokeWidth="2" fill="none"/><path d="M2 21v-1a7 7 0 0 1 11.95-4.95" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" fill="none"/><line x1="19" y1="13" x2="19" y2="21" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="17" x2="23" y2="17" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round"/></svg>);
window.BackArrow = () => (<span style={{ fontSize: 14, marginRight: 6 }}>←</span>);
