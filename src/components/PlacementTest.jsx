import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { generatePlacementTest } from "../lessonService.js";
import { LEVELS } from "../constants.js";

export function PlacementTest({ onComplete, onSkip }) {
  const [phase, setPhase] = useState("intro"); // intro | loading | test | result
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);

  const start = async () => {
    setPhase("loading");
    try {
      const data = await generatePlacementTest();
      setQuestions(data.questions);
      setPhase("test");
    } catch {
      setPhase("intro");
      alert("Erro ao gerar o teste. Tente novamente.");
    }
  };

  const handleAnswer = (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    setTimeout(() => {
      const newAnswers = [...answers, { question: questions[current], selected: opt }];
      setAnswers(newAnswers);
      if (current + 1 < questions.length) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        calculateResult(newAnswers);
      }
    }, 700);
  };

  const calculateResult = (ans) => {
    const scores = { beginner: 0, elementary: 0, intermediate: 0, advanced: 0 };
    ans.forEach(a => {
      if (a.selected === a.question.answer) scores[a.question.level]++;
    });
    let level = "beginner";
    if (scores.advanced >= 2) level = "advanced";
    else if (scores.intermediate >= 2) level = "intermediate";
    else if (scores.elementary >= 2) level = "elementary";
    setPhase({ type: "result", level, scores });
  };

  const s = typeof phase === "object" ? phase : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0f0e0c", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Lora, Georgia, serif" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 560 }}>

        {phase === "intro" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
            <h1 style={{ fontSize: 32, color: "#e8c97a", fontWeight: 700, margin: "0 0 12px" }}>Teste de Nivelamento</h1>
            <p style={{ color: "#b5b09e", fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
              Responda 12 perguntas rápidas para descobrirmos qual é o seu nível de inglês atual.
              Leva apenas 3 minutos!
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={onSkip} style={{ background: "transparent", border: "1px solid #3a3820", borderRadius: 10, padding: "12px 24px", color: "#6b6755", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                Pular, escolher manualmente
              </button>
              <button onClick={start} style={{ background: "#e8c97a", border: "none", borderRadius: 10, padding: "12px 28px", color: "#0f0e0c", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Começar Teste →
              </button>
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16, display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</div>
            <p style={{ color: "#6b6755", fontFamily: "monospace" }}>Preparando seu teste personalizado...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {phase === "test" && questions[current] && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ color: "#6b6755", fontSize: 13, fontFamily: "monospace" }}>Pergunta {current + 1} de {questions.length}</span>
              <span style={{ color: "#6b6755", fontSize: 13, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>
                {questions[current].level}
              </span>
            </div>
            <div style={{ height: 4, background: "#2a2820", borderRadius: 2, marginBottom: 28 }}>
              <div style={{ height: "100%", width: `${((current) / questions.length) * 100}%`, background: "#e8c97a", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
            <div style={{ background: "#131210", border: "1px solid #2a2820", borderRadius: 14, padding: 28, marginBottom: 20 }}>
              <p style={{ fontSize: 20, color: "#e8e4d9", margin: 0, lineHeight: 1.5 }}>{questions[current].question}</p>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {questions[current].options.map((opt, i) => {
                let bg = "#131210", border = "#2a2820", color = "#b5b09e";
                if (selected !== null) {
                  if (opt === questions[current].answer) { bg = "#0f2d1a"; border = "#4ade80"; color = "#4ade80"; }
                  else if (opt === selected) { bg = "#2d0f0f"; border = "#f87171"; color = "#f87171"; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(opt)} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 18px", cursor: selected !== null ? "default" : "pointer", color, fontSize: 15, textAlign: "left", transition: "all 0.2s", fontFamily: "Lora, Georgia, serif" }}
                    onMouseEnter={e => { if (selected === null) e.currentTarget.style.borderColor = "#e8c97a55"; }}
                    onMouseLeave={e => { if (selected === null) e.currentTarget.style.borderColor = "#2a2820"; }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {s && s.type === "result" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{LEVELS.find(l => l.id === s.level)?.emoji}</div>
            <h2 style={{ fontSize: 28, color: "#e8c97a", fontWeight: 700, margin: "0 0 8px" }}>Seu nível é:</h2>
            <h1 style={{ fontSize: 40, color: "#e8e4d9", fontWeight: 700, margin: "0 0 24px" }}>
              {LEVELS.find(l => l.id === s.level)?.label}
            </h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
              {LEVELS.map(l => (
                <div key={l.id} style={{ background: "#131210", border: `1px solid ${l.id === s.level ? l.color : "#2a2820"}`, borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 13, color: "#6b6755", fontFamily: "monospace", marginBottom: 4 }}>{l.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: l.color }}>{s.scores[l.id]}/3</div>
                </div>
              ))}
            </div>
            <button onClick={() => onComplete(s.level)} style={{ background: "#e8c97a", border: "none", borderRadius: 10, padding: "14px 36px", color: "#0f0e0c", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Começar no nível {LEVELS.find(l => l.id === s.level)?.label} →
            </button>
          </div>
        )}

      </motion.div>
    </div>
  );
}
