import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "./Card.jsx";
import { generateQuiz } from "../lessonService.js";

export function VocabReview({ words }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setQuiz(null);
    try {
      const q = await generateQuiz(words);
      setQuiz(q);
      setSelected(null);
      setAnswered(false);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2
        style={{
          fontSize: 22,
          color: "#e8e4d9",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        📝 Vocabulário Aprendido
      </h2>
      <p
        style={{
          color: "#6b6755",
          fontSize: 13,
          fontFamily: "JetBrains Mono, monospace",
          marginBottom: 24,
        }}
      >
        {words.length} palavras no seu dicionário pessoal
      </p>

      {words.length === 0 ? (
        <Card>
          <p style={{ color: "#6b6755", textAlign: "center", padding: 24 }}>
            Complete lições para acumular vocabulário aqui!
          </p>
        </Card>
      ) : (
        <>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}
          >
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                style={{
                  background: "#1a1815",
                  border: "1px solid #2a2820",
                  borderRadius: 8,
                  padding: "4px 12px",
                  fontSize: 14,
                  color: "#e8c97a",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {w}
              </motion.span>
            ))}
          </div>

          <button
            onClick={handleGenerateQuiz}
            disabled={loading || words.length < 3}
            style={{
              background: "#e8c97a",
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              color: "#0f0e0c",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading || words.length < 3 ? "not-allowed" : "pointer",
              opacity: loading || words.length < 3 ? 0.6 : 1,
              marginBottom: 20,
              fontFamily: "Lora, Georgia, serif",
            }}
          >
            {loading ? "Gerando..." : "🎲 Quiz Rápido"}
          </button>

          {quiz && (
            <Card>
              <div
                style={{
                  fontSize: 13,
                  color: "#e8c97a",
                  fontFamily: "JetBrains Mono, monospace",
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                QUIZ
              </div>
              <p
                style={{
                  fontSize: 17,
                  color: "#e8e4d9",
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}
              >
                {quiz.question}
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {quiz.options.map((opt, i) => {
                  let bg = "#1a1815",
                    border = "#2a2820",
                    color = "#b5b09e";
                  if (answered) {
                    if (opt === quiz.answer) {
                      bg = "#0f2d1a";
                      border = "#4ade80";
                      color = "#4ade80";
                    } else if (opt === selected) {
                      bg = "#2d0f0f";
                      border = "#f87171";
                      color = "#f87171";
                    }
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (!answered) {
                          setSelected(opt);
                          setAnswered(true);
                        }
                      }}
                      style={{
                        background: bg,
                        border: `1px solid ${border}`,
                        borderRadius: 8,
                        padding: "10px 14px",
                        cursor: answered ? "default" : "pointer",
                        color,
                        fontSize: 14,
                        textAlign: "left",
                        fontFamily: "Lora, Georgia, serif",
                        transition: "all 0.2s",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: 12,
                    padding: "10px 14px",
                    background: "#1e1c16",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#9c9785",
                    lineHeight: 1.6,
                  }}
                >
                  {quiz.explanation}
                </motion.div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
