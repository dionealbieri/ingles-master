import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./Card.jsx";
import { SpeakButton, SpeakPhrase } from "./SpeakButton.jsx";
import { useSpeech } from "../hooks/useSpeech.js";

const STEPS = ["Explicação", "Vocabulário", "Diálogo", "Exercícios"];

export function LessonView({ lesson, onComplete }) {
  const [step, setStep] = useState(0);
  const [exIdx, setExIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [orderedWords, setOrderedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);

  const exercises = lesson.exercises || [];
  const currentEx = exercises[exIdx];

  const initReorder = (ex) => {
    const shuffled = [...ex.words].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setOrderedWords([]);
  };

  const handleStepChange = (newStep) => {
    setStep(newStep);
    if (newStep === 3 && exercises.length > 0) {
      setExIdx(0);
      setAnswered(false);
      setSelected(null);
      setTextInput("");
      if (exercises[0].type === "reorder") initReorder(exercises[0]);
    }
  };

  const checkAnswer = () => {
    if (!currentEx) return;
    let isCorrect = false;
    if (currentEx.type === "multiple_choice") isCorrect = selected === currentEx.answer;
    else if (currentEx.type === "fill_blank" || currentEx.type === "translate")
      isCorrect = textInput.trim().toLowerCase() === currentEx.answer.toLowerCase();
    else if (currentEx.type === "reorder")
      isCorrect = orderedWords.join(" ").toLowerCase() === currentEx.answer.toLowerCase();
    setAnswered(true);
    if (isCorrect) setCorrect(c => c + 1);
    setTotal(t => t + 1);
  };

  const nextExercise = () => {
    if (exIdx + 1 < exercises.length) {
      const next = exercises[exIdx + 1];
      setExIdx(exIdx + 1);
      setAnswered(false);
      setSelected(null);
      setTextInput("");
      if (next.type === "reorder") initReorder(next);
    } else {
      onComplete(lesson.vocabulary.map(v => v.word), correct + (answered && isCurrentCorrect() ? 1 : 0), exercises.length);
    }
  };

  const isCurrentCorrect = () => {
    if (!currentEx) return false;
    if (currentEx.type === "multiple_choice") return selected === currentEx.answer;
    if (currentEx.type === "fill_blank" || currentEx.type === "translate")
      return textInput.trim().toLowerCase() === currentEx.answer.toLowerCase();
    if (currentEx.type === "reorder")
      return orderedWords.join(" ").toLowerCase() === currentEx.answer.toLowerCase();
    return false;
  };

  const canCheck = () => {
    if (!currentEx) return false;
    if (currentEx.type === "multiple_choice") return selected !== null;
    if (currentEx.type === "fill_blank" || currentEx.type === "translate") return textInput.trim().length > 0;
    if (currentEx.type === "reorder") return orderedWords.length === currentEx.words.length;
    return false;
  };

  const exTypeLabel = { multiple_choice: "Múltipla Escolha", fill_blank: "Complete a Frase", translate: "Tradução", reorder: "Reordene as Palavras" };
  const exTypeIcon = { multiple_choice: "🔤", fill_blank: "✏️", translate: "🔄", reorder: "🔀" };

  return (
    <div>
      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "#e8c97a" : "#2a2820", transition: "background 0.3s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
          <span style={{ fontSize: 12, color: "#6b6755", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>{STEPS[step]}</span>
          <span style={{ fontSize: 11, color: "#3d3c35", fontFamily: "monospace" }}>— {lesson.title}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Explicação */}
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <div style={{ fontSize: 13, color: "#e8c97a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>📖 Hoje vamos aprender</div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#e8e4d9", margin: "0 0 16px" }}>{lesson.title}</h2>
              <p style={{ color: "#b5b09e", lineHeight: 1.7, fontSize: 16 }}>{lesson.explanation}</p>
              {lesson.tip && (
                <div style={{ marginTop: 20, padding: "12px 16px", background: "#1e1c16", borderRadius: 10, borderLeft: "3px solid #e8c97a" }}>
                  <span style={{ fontSize: 12, color: "#e8c97a", fontFamily: "monospace" }}>💡 DICA: </span>
                  <span style={{ color: "#9c9785", fontSize: 14 }}>{lesson.tip}</span>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Vocabulário */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#e8c97a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>📚 Vocabulário do Dia</div>
                <span style={{ fontSize: 11, color: "#4a4940", fontFamily: "monospace" }}>🔊 clique para ouvir</span>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {lesson.vocabulary.map((v, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#1a1815", borderRadius: 12, border: "1px solid #2a2820" }}>
                    <SpeakButton text={v.word} size={18} rate={0.7} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#e8c97a" }}>{v.word}</div>
                      <div style={{ fontSize: 13, color: "#6b6755", fontFamily: "monospace", marginTop: 2 }}>/{v.pronunciation}/</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, color: "#b5b09e" }}>{v.translation}</div>
                      <div style={{ fontSize: 12, color: "#4a4940", marginTop: 4, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                        <span style={{ fontStyle: "italic" }}>{v.example}</span>
                        <SpeakButton text={v.example} size={12} rate={0.8} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Diálogo */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#e8c97a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>🎭 Diálogo</div>
                <SpeakPhrase text={lesson.dialogue.map(l => l.en).join(". ")} label="ouvir tudo" rate={0.8} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {lesson.dialogue.map((line, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}
                    style={{ display: "flex", gap: 12, flexDirection: line.speaker === "B" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: line.speaker === "A" ? "#e8c97a22" : "#38bdf822", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: line.speaker === "A" ? "#e8c97a" : "#38bdf8", flexShrink: 0, fontFamily: "monospace" }}>{line.speaker}</div>
                    <div style={{ background: line.speaker === "A" ? "#1e1c16" : "#111d2e", borderRadius: 12, padding: "10px 14px", maxWidth: "70%" }}>
                      <div style={{ fontSize: 16, color: "#e8e4d9", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{line.en}</span>
                        <SpeakButton text={line.en} size={14} rate={0.8} />
                      </div>
                      <div style={{ fontSize: 12, color: "#6b6755", marginTop: 4, fontStyle: "italic" }}>{line.pt}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Exercícios */}
        {step === 3 && currentEx && (
          <motion.div key={`ex-${exIdx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#e8c97a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>
                  {exTypeIcon[currentEx.type]} {exTypeLabel[currentEx.type]}
                </div>
                <span style={{ fontSize: 12, color: "#4a4940", fontFamily: "monospace" }}>{exIdx + 1}/{exercises.length}</span>
              </div>

              <p style={{ fontSize: 18, color: "#e8e4d9", marginBottom: 24, lineHeight: 1.5 }}>{currentEx.question}</p>

              {/* Multiple Choice */}
              {currentEx.type === "multiple_choice" && (
                <div style={{ display: "grid", gap: 10 }}>
                  {currentEx.options.map((opt, i) => {
                    let bg = "#1a1815", border = "#2a2820", color = "#b5b09e";
                    if (answered) {
                      if (opt === currentEx.answer) { bg = "#0f2d1a"; border = "#4ade80"; color = "#4ade80"; }
                      else if (opt === selected) { bg = "#2d0f0f"; border = "#f87171"; color = "#f87171"; }
                    } else if (selected === opt) border = "#e8c97a";
                    return (
                      <button key={i} onClick={() => !answered && setSelected(opt)}
                        style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "12px 16px", cursor: answered ? "default" : "pointer", color, fontSize: 15, textAlign: "left", transition: "all 0.2s", fontFamily: "Lora, Georgia, serif", display: "flex", justifyContent: "space-between" }}>
                        <span>{opt}</span>
                        {answered && opt === currentEx.answer && <SpeakButton text={opt} size={14} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fill in the blank */}
              {currentEx.type === "fill_blank" && (
                <div>
                  {currentEx.hint && <div style={{ marginBottom: 12, fontSize: 13, color: "#6b6755", fontFamily: "monospace" }}>💡 Dica: {currentEx.hint}</div>}
                  <input value={textInput} onChange={e => !answered && setTextInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && canCheck() && !answered && checkAnswer()}
                    placeholder="Digite sua resposta..."
                    style={{ width: "100%", background: answered ? (isCurrentCorrect() ? "#0f2d1a" : "#2d0f0f") : "#1a1815", border: `1px solid ${answered ? (isCurrentCorrect() ? "#4ade80" : "#f87171") : "#3a3820"}`, borderRadius: 10, padding: "14px 16px", color: "#e8e4d9", fontSize: 16, outline: "none", fontFamily: "Lora, Georgia, serif" }} />
                </div>
              )}

              {/* Translate */}
              {currentEx.type === "translate" && (
                <div>
                  {currentEx.hint && <div style={{ marginBottom: 12, fontSize: 13, color: "#6b6755", fontFamily: "monospace" }}>💡 Dica: {currentEx.hint}</div>}
                  <input value={textInput} onChange={e => !answered && setTextInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && canCheck() && !answered && checkAnswer()}
                    placeholder="Escreva em inglês..."
                    style={{ width: "100%", background: answered ? (isCurrentCorrect() ? "#0f2d1a" : "#2d0f0f") : "#1a1815", border: `1px solid ${answered ? (isCurrentCorrect() ? "#4ade80" : "#f87171") : "#3a3820"}`, borderRadius: 10, padding: "14px 16px", color: "#e8e4d9", fontSize: 16, outline: "none", fontFamily: "Lora, Georgia, serif" }} />
                </div>
              )}

              {/* Reorder */}
              {currentEx.type === "reorder" && (
                <div>
                  <div style={{ minHeight: 52, background: "#1a1815", border: `1px solid ${answered ? (isCurrentCorrect() ? "#4ade80" : "#f87171") : "#3a3820"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {orderedWords.length === 0 && <span style={{ color: "#4a4940", fontSize: 14, fontStyle: "italic" }}>Clique nas palavras abaixo para ordenar...</span>}
                    {orderedWords.map((w, i) => (
                      <button key={i} onClick={() => { if (answered) return; setOrderedWords(prev => prev.filter((_, j) => j !== i)); setAvailableWords(prev => [...prev, w]); }}
                        style={{ background: "#e8c97a22", border: "1px solid #e8c97a55", borderRadius: 8, padding: "6px 14px", color: "#e8c97a", cursor: "pointer", fontSize: 15, fontFamily: "Lora, Georgia, serif" }}>{w}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {availableWords.map((w, i) => (
                      <button key={i} onClick={() => { if (answered) return; setOrderedWords(prev => [...prev, w]); setAvailableWords(prev => prev.filter((_, j) => j !== i)); }}
                        style={{ background: "#1a1815", border: "1px solid #3a3820", borderRadius: 8, padding: "6px 14px", color: "#b5b09e", cursor: "pointer", fontSize: 15, fontFamily: "Lora, Georgia, serif" }}>{w}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {answered && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 16, padding: "12px 16px", background: isCurrentCorrect() ? "#0f2d1a" : "#1a1215", borderRadius: 10, fontSize: 14, color: isCurrentCorrect() ? "#86efac" : "#fca5a5" }}>
                  {isCurrentCorrect() ? "✅ Correto! " : `❌ A resposta correta é: "${currentEx.answer}" `}
                  {currentEx.explanation || ""}
                </motion.div>
              )}
            </Card>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {answered
                ? <button onClick={nextExercise} style={{ marginLeft: "auto", background: "#e8c97a", color: "#0f0e0c", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Lora, Georgia, serif" }}>
                    {exIdx + 1 < exercises.length ? "Próximo →" : "Concluir Lição ✓"}
                  </button>
                : <button onClick={checkAnswer} disabled={!canCheck()} style={{ marginLeft: "auto", background: canCheck() ? "#38bdf8" : "#2a2820", color: canCheck() ? "#0f0e0c" : "#6b6755", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: canCheck() ? "pointer" : "not-allowed", fontFamily: "Lora, Georgia, serif" }}>
                    Verificar ✓
                  </button>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav buttons */}
      {step < 3 && (
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => handleStepChange(step + 1)}
            style={{ background: "#e8c97a", color: "#0f0e0c", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Lora, Georgia, serif" }}>
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}

export function LessonSuccess({ lesson, score, total, onNext, setTab }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <Card style={{ textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 70 ? "⭐" : "💪"}</div>
        <h2 style={{ fontSize: 32, color: "#e8c97a", fontWeight: 700, margin: "0 0 8px" }}>
          {pct >= 70 ? "Parabéns!" : "Bom esforço!"}
        </h2>
        <p style={{ color: "#b5b09e", fontSize: 16, marginBottom: 12 }}>
          Lição <strong style={{ color: "#e8e4d9" }}>"{lesson.title}"</strong> concluída
        </p>
        <div style={{ display: "inline-flex", gap: 24, background: "#1a1815", borderRadius: 12, padding: "16px 32px", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#e8c97a" }}>{pct}%</div>
            <div style={{ fontSize: 12, color: "#6b6755", fontFamily: "monospace" }}>ACERTO</div>
          </div>
          <div style={{ width: 1, background: "#2a2820" }} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#4ade80" }}>{score}/{total}</div>
            <div style={{ fontSize: 12, color: "#6b6755", fontFamily: "monospace" }}>EXERCÍCIOS</div>
          </div>
          <div style={{ width: 1, background: "#2a2820" }} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#38bdf8" }}>+50</div>
            <div style={{ fontSize: 12, color: "#6b6755", fontFamily: "monospace" }}>XP</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <button onClick={() => setTab("review")} style={{ background: "#1e1c16", border: "1px solid #2a2820", borderRadius: 10, padding: "12px 22px", color: "#e8e4d9", fontSize: 14, cursor: "pointer", fontFamily: "Lora, Georgia, serif" }}>🃏 Revisar com Flashcards</button>
          <button onClick={onNext} style={{ background: "#e8c97a", border: "none", borderRadius: 10, padding: "12px 22px", color: "#0f0e0c", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Lora, Georgia, serif" }}>Próxima Lição →</button>
        </div>
      </Card>
    </motion.div>
  );
}
