import { LEVELS } from "../constants.js";
import { Card, StatCard } from "./Card.jsx";

export function Progress({ streak, xp, completed, words, level }) {
  const nextXP = Math.ceil((xp + 1) / 100) * 100;
  const progress = xp % 100;

  return (
    <div>
      <h2
        style={{
          fontSize: 22,
          color: "#e8e4d9",
          fontWeight: 700,
          marginBottom: 24,
        }}
      >
        📊 Seu Progresso
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard emoji="🔥" label="Sequência" value={`${streak} dias`} color="#fb923c" />
        <StatCard emoji="⚡" label="XP Total" value={xp} color="#e8c97a" />
        <StatCard emoji="📖" label="Lições" value={completed} color="#4ade80" />
        <StatCard emoji="💬" label="Palavras" value={words.length} color="#38bdf8" />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 13,
            color: "#6b6755",
            fontFamily: "JetBrains Mono, monospace",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          PRÓXIMO NÍVEL
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ color: "#e8e4d9", fontSize: 14 }}>{xp} XP</span>
          <span style={{ color: "#6b6755", fontSize: 14 }}>{nextXP} XP</span>
        </div>
        <div
          style={{
            height: 8,
            background: "#2a2820",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(progress, 100)}%`,
              background: "#e8c97a",
              borderRadius: 4,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </Card>

      <div>
        <div
          style={{
            fontSize: 13,
            color: "#6b6755",
            fontFamily: "JetBrains Mono, monospace",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          NÍVEIS DE ESTUDO
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {LEVELS.map((l) => (
            <div
              key={l.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                background: l.id === level?.id ? "#1e1c16" : "transparent",
                border: `1px solid ${
                  l.id === level?.id ? "#e8c97a44" : "#1a1815"
                }`,
                borderRadius: 10,
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 18 }}>{l.emoji}</span>
              <span
                style={{
                  color: l.id === level?.id ? "#e8c97a" : "#6b6755",
                  fontSize: 14,
                }}
              >
                {l.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#4a4940",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                — {l.desc}
              </span>
              {l.id === level?.id && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: "#e8c97a",
                    fontFamily: "JetBrains Mono, monospace",
                    background: "#e8c97a22",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  ATUAL
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
