export function Card({ children, style = {}, theme }) {
  const bg = theme?.surface || "#131210";
  const border = theme?.border || "#2a2820";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 24, ...style }}>
      {children}
    </div>
  );
}

export function Pill({ emoji, value, color }) {
  return (
    <div style={{ background: "#1a1815", border: "1px solid #2a2820", borderRadius: 8, padding: "4px 12px", fontSize: 13, color, display: "flex", alignItems: "center", gap: 6 }}>
      <span>{emoji}</span>
      <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

export function StatCard({ emoji, label, value, color, theme }) {
  const bg = theme?.surface || "#131210";
  const border = theme?.border || "#2a2820";
  const textFaint = theme?.textFaint || "#6b6755";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 20 }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontSize: 11, color: textFaint, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export function LoadingLesson({ theme }) {
  const textFaint = theme?.textFaint || "#6b6755";
  return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <div style={{ fontSize: 40, marginBottom: 16, display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</div>
      <p style={{ color: textFaint, fontFamily: "monospace" }}>Preparando sua lição...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorCard({ onRetry, theme }) {
  const bg = theme?.surface || "#131210";
  const border = theme?.border || "#2a2820";
  const textMuted = theme?.textMuted || "#b5b09e";
  const accent = theme?.accent || "#e8c97a";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <p style={{ color: textMuted, marginBottom: 8 }}>Não foi possível carregar a lição.</p>
      <p style={{ color: textMuted, fontSize: 13, marginBottom: 20 }}>
        Verifique se a chave OpenAI está correta no arquivo <code style={{ background: "#1a1815", padding: "2px 6px", borderRadius: 4 }}>.env.local</code>
      </p>
      <button onClick={onRetry}
        style={{ background: accent, border: "none", borderRadius: 10, padding: "10px 24px", color: "#0f0e0c", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        Tentar novamente
      </button>
    </div>
  );
}
