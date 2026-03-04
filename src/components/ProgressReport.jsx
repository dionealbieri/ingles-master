import { Card, StatCard } from "./Card.jsx";
import { LEVELS } from "../constants.js";
import { getCardStats } from "../utils/spacedRepetition.js";

export function ProgressReport({ streak, xp, completed, words, level, history, cards, onReset }) {
  const stats = getCardStats(cards);
  const nextXP = Math.ceil((xp + 1) / 100) * 100;
  const progress = xp % 100;
  const accuracy = history.length > 0
    ? Math.round(history.reduce((a, h) => a + (h.score || 0), 0) / history.reduce((a, h) => a + (h.total || 1), 0) * 100)
    : 0;

  const last7 = history.slice(-7);

  return (
    <div>
      <h2 style={{ fontSize: 22, color: "#e8e4d9", fontWeight: 700, marginBottom: 24 }}>📊 Relatório de Evolução</h2>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        <StatCard emoji="🔥" label="Sequência" value={`${streak} dias`} color="#fb923c" />
        <StatCard emoji="⚡" label="XP Total" value={xp} color="#e8c97a" />
        <StatCard emoji="🎯" label="Acerto geral" value={`${accuracy}%`} color="#4ade80" />
        <StatCard emoji="📖" label="Lições" value={completed} color="#38bdf8" />
        <StatCard emoji="💬" label="Palavras" value={words.length} color="#a78bfa" />
        <StatCard emoji="✅" label="Dominadas" value={stats.mastered} color="#4ade80" />
      </div>

      {/* XP bar */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#6b6755", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>PROGRESSO DE XP</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#e8e4d9", fontSize: 14 }}>{xp} XP</span>
          <span style={{ color: "#6b6755", fontSize: 14 }}>próximo: {nextXP} XP</span>
        </div>
        <div style={{ height: 8, background: "#2a2820", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(progress, 100)}%`, background: "linear-gradient(90deg, #e8c97a, #fb923c)", borderRadius: 4, transition: "width 0.5s" }} />
        </div>
      </Card>

      {/* History */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#6b6755", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>ÚLTIMAS LIÇÕES</div>
        {last7.length === 0
          ? <p style={{ color: "#4a4940", textAlign: "center", padding: 16 }}>Nenhuma lição completada ainda.</p>
          : last7.reverse().map((h, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < last7.length - 1 ? "1px solid #1a1815" : "none" }}>
              <div>
                <div style={{ fontSize: 14, color: "#e8e4d9" }}>{h.title}</div>
                <div style={{ fontSize: 12, color: "#6b6755", fontFamily: "monospace", marginTop: 2 }}>{h.date} · {h.words} palavras</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: (h.score / h.total) >= 0.7 ? "#4ade80" : "#fb923c" }}>
                  {h.total > 0 ? Math.round((h.score / h.total) * 100) : 0}%
                </div>
                <div style={{ fontSize: 11, color: "#4a4940", fontFamily: "monospace" }}>{h.score}/{h.total}</div>
              </div>
            </div>
          ))
        }
      </Card>

      {/* Flashcard progress */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#6b6755", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>STATUS DOS FLASHCARDS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { label: "Dominadas", value: stats.mastered, color: "#4ade80", desc: "≥21 dias" },
            { label: "Aprendendo", value: stats.learning, color: "#38bdf8", desc: "Em progresso" },
            { label: "Para revisar", value: stats.due, color: "#fb923c", desc: "Hoje" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: 12, background: "#1a1815", borderRadius: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#b5b09e", marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#4a4940", fontFamily: "monospace" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Level */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#6b6755", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>NÍVEL ATUAL</div>
        <div style={{ display: "grid", gap: 8 }}>
          {LEVELS.map(l => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: l.id === level?.id ? "#1e1c16" : "transparent", border: `1px solid ${l.id === level?.id ? "#e8c97a44" : "#1a1815"}`, borderRadius: 10 }}>
              <span style={{ fontSize: 18 }}>{l.emoji}</span>
              <span style={{ color: l.id === level?.id ? "#e8c97a" : "#6b6755", fontSize: 14 }}>{l.label}</span>
              {l.id === level?.id && <span style={{ marginLeft: "auto", fontSize: 11, color: "#e8c97a", fontFamily: "monospace", background: "#e8c97a22", padding: "2px 8px", borderRadius: 4 }}>ATUAL</span>}
            </div>
          ))}
        </div>
      </Card>

      <button onClick={() => { if (confirm("Tem certeza? Todo o progresso será apagado.")) onReset(); }}
        style={{ background: "transparent", border: "1px solid #3a2020", borderRadius: 10, padding: "10px 20px", color: "#6b4040", fontSize: 13, cursor: "pointer", fontFamily: "Lora, Georgia, serif" }}>
        🗑️ Resetar todo o progresso
      </button>
    </div>
  );
}
