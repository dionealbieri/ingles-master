import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./Card.jsx";
import { SpeakButton } from "./SpeakButton.jsx";
import { getDueCards, reviewCard, getCardStats } from "../utils/spacedRepetition.js";

const GRADES = [
  { value: 0, label: "Errei",   color: "#f87171", emoji: "❌" },
  { value: 1, label: "Difícil", color: "#fb923c", emoji: "😓" },
  { value: 2, label: "Bom",     color: "#38bdf8", emoji: "👍" },
  { value: 3, label: "Fácil",   color: "#4ade80", emoji: "⚡" },
];

export function Flashcards({ cards, onUpdateCards }) {
  const [mode, setMode] = useState("menu"); // menu | review | done
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const stats = getCardStats(cards);
  const due = getDueCards(cards);

  const startReview = () => {
    if (due.length === 0) return;
    setQueue([...due].sort(() => Math.random() - 0.5));
    setCurrent(0);
    setFlipped(false);
    setReviewed(0);
    setMode("review");
  };

  const handleGrade = (grade) => {
    const card = queue[current];
    const updated = reviewCard(card, grade);
    onUpdateCards({ ...cards, [card.word]: updated });
    setReviewed(r => r + 1);
    if (current + 1 < queue.length) {
      setCurrent(c => c + 1);
      setFlipped(false);
    } else {
      setMode("done");
    }
  };

  if (mode === "menu") {
    return (
      <div>
        <h2 style={{ fontSize: 22, color: "#e8e4d9", fontWeight: 700, marginBottom: 8 }}>🃏 Flashcards</h2>
        <p style={{ color: "#6b6755", fontSize: 13, fontFamily: "monospace", marginBottom: 24 }}>Repetição espaçada — método Anki</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total de cards", value: stats.total, color: "#e8c97a", emoji: "🃏" },
            { label: "Para revisar hoje", value: stats.due, color: "#fb923c", emoji: "🔔" },
            { label: "Aprendendo", value: stats.learning, color: "#38bdf8", emoji: "📚" },
            { label: "Dominadas", value: stats.mastered, color: "#4ade80", emoji: "✅" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#131210", border: "1px solid #2a2820", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.emoji}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b6755", fontFamily: "monospace" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {stats.total === 0 ? (
          <Card style={{ textAlign: "center", padding: 32 }}>
            <p style={{ color: "#6b6755" }}>Complete lições para adicionar palavras aos flashcards!</p>
          </Card>
        ) : (
          <button onClick={startReview} disabled={stats.due === 0}
            style={{ width: "100%", background: stats.due > 0 ? "#e8c97a" : "#2a2820", border: "none", borderRadius: 12, padding: "18px", color: stats.due > 0 ? "#0f0e0c" : "#6b6755", fontSize: 16, fontWeight: 700, cursor: stats.due > 0 ? "pointer" : "not-allowed", fontFamily: "Lora, Georgia, serif" }}>
            {stats.due > 0 ? `▶ Revisar ${stats.due} card${stats.due > 1 ? "s" : ""} de hoje` : "✅ Todas as revisões do dia concluídas!"}
          </button>
        )}

        {stats.total > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, color: "#6b6755", fontFamily: "monospace", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Todas as palavras</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.values(cards).map((c, i) => (
                <div key={i} style={{ background: "#1a1815", border: `1px solid ${c.interval >= 21 ? "#4ade8033" : c.interval >= 7 ? "#38bdf833" : "#2a2820"}`, borderRadius: 8, padding: "4px 12px", fontSize: 13 }}>
                  <span style={{ color: c.interval >= 21 ? "#4ade80" : c.interval >= 7 ? "#38bdf8" : "#e8c97a" }}>{c.word}</span>
                  <span style={{ color: "#4a4940", marginLeft: 6, fontFamily: "monospace", fontSize: 11 }}>+{c.interval}d</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === "done") {
    return (
      <div style={{ textAlign: "center" }}>
        <Card style={{ padding: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 28, color: "#e8c97a", fontWeight: 700, marginBottom: 8 }}>Revisão concluída!</h2>
          <p style={{ color: "#b5b09e", fontSize: 16, marginBottom: 32 }}>{reviewed} cards revisados hoje.</p>
          <button onClick={() => setMode("menu")} style={{ background: "#e8c97a", border: "none", borderRadius: 10, padding: "12px 28px", color: "#0f0e0c", fontWeight: 700, cursor: "pointer", fontFamily: "Lora, Georgia, serif" }}>Voltar</button>
        </Card>
      </div>
    );
  }

  const card = queue[current];
  if (!card) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ color: "#6b6755", fontFamily: "monospace", fontSize: 13 }}>{current + 1} / {queue.length}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {queue.map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < current ? "#4ade80" : i === current ? "#e8c97a" : "#2a2820" }} />
          ))}
        </div>
      </div>

      <div onClick={() => setFlipped(f => !f)} style={{ cursor: "pointer", marginBottom: 20 }}>
        <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.4 }} style={{ transformStyle: "preserve-3d", position: "relative", minHeight: 200 }}>
          {/* Frente */}
          <div style={{ position: flipped ? "absolute" : "relative", backfaceVisibility: "hidden", width: "100%" }}>
            <Card style={{ textAlign: "center", padding: 48, minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 11, color: "#4a4940", fontFamily: "monospace", marginBottom: 16, textTransform: "uppercase", letterSpacing: 2 }}>Palavra em inglês</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: "#e8c97a", marginBottom: 12 }}>{card.word}</div>
              <SpeakButton text={card.word} size={20} rate={0.7} />
              <div style={{ fontSize: 12, color: "#4a4940", marginTop: 20, fontFamily: "monospace" }}>clique para ver a tradução</div>
            </Card>
          </div>
          {/* Verso */}
          {flipped && (
            <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", width: "100%" }}>
              <Card style={{ textAlign: "center", padding: 48, minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 11, color: "#4a4940", fontFamily: "monospace", marginBottom: 16, textTransform: "uppercase", letterSpacing: 2 }}>Tradução</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: "#b5b09e", marginBottom: 8 }}>{card.translation}</div>
                <div style={{ fontSize: 14, color: "#4a4940", fontStyle: "italic" }}>
                  Revisado {card.totalCorrect + card.totalIncorrect} vez{card.totalCorrect + card.totalIncorrect !== 1 ? "es" : ""}
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {flipped && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 13, color: "#6b6755", fontFamily: "monospace", textAlign: "center", marginBottom: 12 }}>Como foi?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              {GRADES.map(g => (
                <button key={g.value} onClick={() => handleGrade(g.value)}
                  style={{ background: "#131210", border: `1px solid ${g.color}44`, borderRadius: 10, padding: "12px 8px", cursor: "pointer", color: g.color, fontSize: 13, fontFamily: "Lora, Georgia, serif", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = g.color + "22"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#131210"; }}>
                  <span style={{ fontSize: 20 }}>{g.emoji}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
