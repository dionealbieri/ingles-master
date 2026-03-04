import { useSpeech } from "../hooks/useSpeech.js";

export function SpeakButton({ text, size = 16, rate = 0.85, style = {} }) {
  const { speak, stop, speaking } = useSpeech();

  const handleClick = (e) => {
    e.stopPropagation();
    if (speaking) {
      stop();
    } else {
      speak(text, { rate });
    }
  };

  return (
    <button
      onClick={handleClick}
      title={speaking ? "Parar" : `Ouvir: "${text}"`}
      style={{
        background: speaking ? "#e8c97a22" : "transparent",
        border: `1px solid ${speaking ? "#e8c97a" : "#3a3820"}`,
        borderRadius: "50%",
        width: size + 16,
        height: size + 16,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size,
        transition: "all 0.2s",
        flexShrink: 0,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!speaking) e.currentTarget.style.borderColor = "#e8c97a";
      }}
      onMouseLeave={(e) => {
        if (!speaking) e.currentTarget.style.borderColor = "#3a3820";
      }}
    >
      {speaking ? "⏹️" : "🔊"}
    </button>
  );
}

// Botão maior para frases completas
export function SpeakPhrase({ text, label = "Ouvir frase", rate = 0.8 }) {
  const { speak, stop, speaking } = useSpeech();

  return (
    <button
      onClick={() => (speaking ? stop() : speak(text, { rate }))}
      style={{
        background: speaking ? "#e8c97a22" : "#1a1815",
        border: `1px solid ${speaking ? "#e8c97a" : "#3a3820"}`,
        borderRadius: 8,
        padding: "6px 14px",
        cursor: "pointer",
        color: speaking ? "#e8c97a" : "#6b6755",
        fontSize: 12,
        fontFamily: "JetBrains Mono, monospace",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.2s",
      }}
    >
      {speaking ? "⏹ parar" : `🔊 ${label}`}
    </button>
  );
}
