import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { askClaude } from "../api.js";
import { SpeakButton } from "./SpeakButton.jsx";

const GRAMMAR_TOPICS = {
  beginner: [
    { id: "verb_to_be",   title: "Verbo To Be",          icon: "🔵", desc: "am, is, are" },
    { id: "articles",     title: "Artigos",               icon: "📝", desc: "a, an, the" },
    { id: "pronouns",     title: "Pronomes Pessoais",     icon: "👤", desc: "I, you, he, she..." },
    { id: "numbers",      title: "Números e Plurais",     icon: "🔢", desc: "one/ones, car/cars" },
  ],
  elementary: [
    { id: "present_simple", title: "Presente Simples",   icon: "⏰", desc: "I work, she works" },
    { id: "there_is",       title: "There is / There are",icon: "📍", desc: "Existe / Existem" },
    { id: "possessives",    title: "Possessivos",         icon: "🏠", desc: "my, your, his, her..." },
    { id: "questions",      title: "Perguntas com WH",    icon: "❓", desc: "what, where, when, why..." },
  ],
  intermediate: [
    { id: "past_simple",    title: "Passado Simples",     icon: "⏪", desc: "worked, went, was" },
    { id: "present_cont",   title: "Presente Contínuo",   icon: "🔄", desc: "I am working" },
    { id: "future",         title: "Futuro",              icon: "⏩", desc: "will, going to" },
    { id: "modal_verbs",    title: "Verbos Modais",       icon: "🎛️", desc: "can, could, should, must" },
  ],
  advanced: [
    { id: "perfect",        title: "Present Perfect",     icon: "✅", desc: "I have worked" },
    { id: "conditionals",   title: "Condicionais",        icon: "🔀", desc: "if I were, I would..." },
    { id: "passive",        title: "Voz Passiva",         icon: "🔃", desc: "It was made, is being done" },
    { id: "phrasal_verbs",  title: "Phrasal Verbs",       icon: "🔗", desc: "give up, look for, come across" },
  ],
};

async function generateGrammarLesson(topicId, topicTitle, level) {
  const prompt = `Crie uma lição de gramática inglesa sobre "${topicTitle}" para nível ${level}.
Responda APENAS com JSON válido:
{
  "title": "${topicTitle}",
  "explanation": "explicação clara em português com exemplos, 3-4 parágrafos",
  "rules": [
    {"rule": "regra principal", "example_en": "exemplo em inglês", "example_pt": "tradução"}
  ],
  "common_mistakes": [
    {"wrong": "erro comum", "correct": "forma correta", "tip": "dica para lembrar"}
  ],
  "practice": [
    {"question": "Complete: She ___ a teacher.", "options": ["am","is","are","be"], "answer": "is", "explanation": "com she usamos is"},
    {"question": "Complete: They ___ happy.", "options": ["am","is","are","be"], "answer": "are", "explanation": "com they usamos are"}
  ]
}
Inclua exatamente 4 regras e 2 erros comuns e 4 exercícios práticos.`;

  const raw = await askClaude("Você é um professor de gramática inglesa. Retorne APENAS JSON válido.", prompt);
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

export function Grammar({ level, theme: t }) {
  const topics = GRAMMAR_TOPICS[level] || GRAMMAR_TOPICS.beginner;
  const [selected, setSelected] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const openTopic = async (topic) => {
    setSelected(topic);
    setLesson(null);
    setLoading(true);
    setPracticeIdx(0);
    setAnswer(null);
    setAnswered(false);
    setScore(0);
    setDone(false);
    try {
      const l = await generateGrammarLesson(topic.id, topic.title, level);
      setLesson(l);
    } catch { setLesson(null); }
    setLoading(false);
  };

  const handleAnswer = (opt) => {
    if (answered) return;
    setAnswer(opt);
    setAnswered(true);
    if (opt === lesson.practice[practiceIdx].answer) setScore(s => s + 1);
  };

  const nextPractice = () => {
    if (practiceIdx + 1 < lesson.practice.length) {
      setPracticeIdx(i => i + 1);
      setAnswer(null);
      setAnswered(false);
    } else setDone(true);
  };

  if (!selected) return (
    <div>
      <h2 style={{ fontSize: 22, color: t.text, fontWeight: 700, marginBottom: 8 }}>📖 Gramática</h2>
      <p style={{ color: t.textFaint, fontSize: 13, fontFamily: "monospace", marginBottom: 24 }}>Escolha um tópico para aprender</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {topics.map(topic => (
          <button key={topic.id} onClick={() => openTopic(topic)}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = t.surface2; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface; }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{topic.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{topic.title}</div>
            <div style={{ fontSize: 12, color: t.textFaint, marginTop: 4, fontFamily: "monospace" }}>{topic.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={() => setSelected(null)} style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 8, padding: "4px 12px", color: t.textFaint, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>← Voltar</button>

      {loading && <div style={{ textAlign: "center", padding: 60, color: t.textFaint, fontFamily: "monospace" }}>Preparando lição de gramática...</div>}

      {lesson && !done && (
        <div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>{selected.icon}</span>
              <h2 style={{ fontSize: 22, color: t.accent, fontWeight: 700, margin: 0 }}>{lesson.title}</h2>
            </div>
            <p style={{ color: t.textMuted, lineHeight: 1.8, fontSize: 15, whiteSpace: "pre-wrap" }}>{lesson.explanation}</p>
          </div>

          {/* Regras */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: t.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>📌 REGRAS PRINCIPAIS</div>
            <div style={{ display: "grid", gap: 12 }}>
              {lesson.rules.map((r, i) => (
                <div key={i} style={{ padding: "12px 16px", background: t.surface2, borderRadius: 10, borderLeft: `3px solid ${t.accent}` }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 6 }}>{r.rule}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, color: t.accent, fontStyle: "italic" }}>{r.example_en}</span>
                    <SpeakButton text={r.example_en} size={13} rate={0.8} />
                  </div>
                  <div style={{ fontSize: 13, color: t.textFaint, marginTop: 4 }}>{r.example_pt}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Erros comuns */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#f87171", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>⚠️ ERROS COMUNS</div>
            <div style={{ display: "grid", gap: 10 }}>
              {lesson.common_mistakes.map((m, i) => (
                <div key={i} style={{ padding: "12px 16px", background: t.surface2, borderRadius: 10 }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
                    <span style={{ color: "#f87171", fontSize: 14 }}>✗ {m.wrong}</span>
                    <span style={{ color: "#4ade80", fontSize: 14 }}>✓ {m.correct}</span>
                  </div>
                  <div style={{ fontSize: 12, color: t.textFaint, fontFamily: "monospace" }}>💡 {m.tip}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prática */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: t.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>✏️ PRÁTICA</div>
              <span style={{ fontSize: 12, color: t.textFaint, fontFamily: "monospace" }}>{practiceIdx + 1}/{lesson.practice.length}</span>
            </div>
            <p style={{ fontSize: 17, color: t.text, marginBottom: 20 }}>{lesson.practice[practiceIdx].question}</p>
            <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
              {lesson.practice[practiceIdx].options.map((opt, i) => {
                const ex = lesson.practice[practiceIdx];
                let bg = t.surface2, border = t.border, color = t.textMuted;
                if (answered) {
                  if (opt === ex.answer) { bg = "#0f2d1a"; border = "#4ade80"; color = "#4ade80"; }
                  else if (opt === answer) { bg = "#2d0f0f"; border = "#f87171"; color = "#f87171"; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(opt)}
                    style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 14px", cursor: answered ? "default" : "pointer", color, fontSize: 14, textAlign: "left", fontFamily: "Lora, Georgia, serif", transition: "all 0.2s" }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {answered && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ padding: "10px 14px", background: answer === lesson.practice[practiceIdx].answer ? "#0f2d1a" : "#1a1215", borderRadius: 8, fontSize: 13, color: answer === lesson.practice[practiceIdx].answer ? "#86efac" : "#fca5a5", marginBottom: 12 }}>
                  {answer === lesson.practice[practiceIdx].answer ? "✅ " : "❌ "}{lesson.practice[practiceIdx].explanation}
                </div>
                <button onClick={nextPractice} style={{ background: t.accent, border: "none", borderRadius: 8, padding: "10px 24px", color: "#0f0e0c", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {practiceIdx + 1 < lesson.practice.length ? "Próximo →" : "Finalizar ✓"}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {done && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
            <h2 style={{ fontSize: 28, color: t.accent, fontWeight: 700, marginBottom: 8 }}>Lição concluída!</h2>
            <p style={{ color: t.textMuted, marginBottom: 24 }}>Você acertou {score} de {lesson.practice.length} exercícios.</p>
            <button onClick={() => setSelected(null)} style={{ background: t.accent, border: "none", borderRadius: 10, padding: "12px 28px", color: "#0f0e0c", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>← Voltar aos tópicos</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
