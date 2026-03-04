import { motion } from "motion/react";
import { LEVELS } from "../constants.js";

export function LevelPicker({ onPick }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0e0c",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        fontFamily: "Lora, Georgia, serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: "100%", maxWidth: 520 }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🇺🇸</div>
          <h1
            style={{
              fontSize: 36,
              color: "#e8c97a",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-1px",
            }}
          >
            Inglês Master
          </h1>
          <p
            style={{
              color: "#6b6755",
              marginTop: 8,
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 13,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Qual é o seu nível atual?
          </p>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {LEVELS.map((l, i) => (
            <motion.button
              key={l.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onPick(l.id)}
              style={{
                background: "#131210",
                border: "1px solid #2a2820",
                borderRadius: 14,
                padding: "20px 24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "all 0.2s",
                textAlign: "left",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = l.color;
                e.currentTarget.style.background = "#1a1815";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2a2820";
                e.currentTarget.style.background = "#131210";
              }}
            >
              <span style={{ fontSize: 32 }}>{l.emoji}</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#e8e4d9",
                    fontFamily: "Lora, Georgia, serif",
                  }}
                >
                  {l.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b6755",
                    marginTop: 2,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {l.desc}
                </div>
              </div>
              <span style={{ color: l.color, fontSize: 20 }}>→</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
