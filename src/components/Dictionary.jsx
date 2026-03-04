import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { askClaude } from "../api.js";
import { SpeakButton } from "./SpeakButton.jsx";

async function lookupWord(word) {
  const prompt = `Pesquise a palavra ou expressão em inglês: "${word}"
Responda APENAS com JSON válido:
{
  "word": "${word}",
  "phonetic": "fuh-NET-ic",
  "type": "substantivo / verbo / adjetivo / expressão",
  "definitions": [
    {"meaning": "definição em português", "example_en": "exemplo em inglês", "example_pt": "tradução do exemplo"}
  ],
  "synonyms": ["similar1", "similar2"],
  "tip": "dica de uso ou diferença importante",
  "level": "beginner / elementary / intermediate / advanced"
}
Inclua até 3 definições e até 4 sinônimos.`;

  const raw = await askClaude("Você é um dicionário de inglês-português. Retorne APENAS JSON válido.", prompt);
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

const LEVEL_COLORS = { beginner: "#4ade80", elementary: "#34d399", intermediate: "#38bdf8", advanced: "#a78bfa" };
const LEVEL_LABELS = { beginner: "Iniciante", elementary: "Elementar", intermediate: "Intermediário", advanced: "Avançado" };

export function Dictionary({ theme: t }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const inputRef = useRef();

  const search = async (word) => {
    const w = (word || query).trim();
    if (!w) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await lookupWord(w);
      setResult(data);
      setHistory(prev => [w, ...prev.filter(x => x !== w)].slice(0, 10));
    } catch { setResult({ error: true }); }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, color: t.text, fontWeight: 700, marginBottom: 8 }}>🌐 Dicionário</h2>
      <p style={{ color: t.textFaint, fontSize: 13, fontFamily: "monospace", marginBottom: 24 }}>Busque qualquer palavra ou expressão em inglês</p>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Digite uma palavra em inglês ou português..."
          style={{ flex: 1, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 16px", color: t.text, fontSize: 15, outline: "none", fontFamily: "Lora, Georgia, serif" }} />
        <button onClick={() => search()} disabled={loading || !query.trim()}
          style={{ background: t.accent, border: "none", borderRadius: 10, padding: "0 24px", color: "#0f0e0c", fontSize: 20, cursor: query.trim() ? "pointer" : "not-allowed", opacity: query.trim() ? 1 : 0.4 }}>
          {loading ? "⟳" : "🔍"}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && !result && !loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: t.textFaint, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Buscas recentes</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {history.map((w, i) => (
              <button key={i} onClick={() => { setQuery(w); search(w); }}
                style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "4px 14px", color: t.accent, fontSize: 13, cursor: "pointer", fontFamily: "monospace" }}>{w}</button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: t.textFaint, fontFamily: "monospace" }}>
          <div style={{ fontSize: 36, marginBottom: 12, display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</div>
          <div>Buscando "{query}"...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      <AnimatePresence>
        {result && !result.error && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <h2 style={{ fontSize: 34, fontWeight: 700, color: t.accent, margin: 0 }}>{result.word}</h2>
                    <SpeakButton text={result.word} size={20} rate={0.7} />
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 14, color: t.textFaint, fontFamily: "monospace" }}>/{result.phonetic}/</span>
                    <span style={{ fontSize: 12, color: t.textFaint, background: t.surface2, borderRadius: 6, padding: "2px 8px" }}>{result.type}</span>
                    <span style={{ fontSize: 12, color: LEVEL_COLORS[result.level] || "#e8c97a", background: (LEVEL_COLORS[result.level] || "#e8c97a") + "22", borderRadius: 6, padding: "2px 8px" }}>
                      {LEVEL_LABELS[result.level] || result.level}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Definitions */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: t.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>📖 DEFINIÇÕES</div>
              <div style={{ display: "grid", gap: 14 }}>
                {result.definitions.map((d, i) => (
                  <div key={i} style={{ paddingLeft: 16, borderLeft: `3px solid ${t.accent}` }}>
                    <div style={{ fontSize: 15, color: t.text, fontWeight: 600, marginBottom: 6 }}>{i + 1}. {d.meaning}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, color: t.accent, fontStyle: "italic" }}>{d.example_en}</span>
                      <SpeakButton text={d.example_en} size={13} rate={0.8} />
                    </div>
                    <div style={{ fontSize: 13, color: t.textFaint, marginTop: 2 }}>{d.example_pt}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Synonyms */}
            {result.synonyms?.length > 0 && (
              <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: t.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🔗 SINÔNIMOS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.synonyms.map((s, i) => (
                    <button key={i} onClick={() => { setQuery(s); search(s); }}
                      style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 14px", color: t.textMuted, cursor: "pointer", fontSize: 14, fontFamily: "Lora, Georgia, serif", display: "flex", alignItems: "center", gap: 6 }}>
                      {s} <SpeakButton text={s} size={12} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tip */}
            {result.tip && (
              <div style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
                <span style={{ fontSize: 13, color: t.accent, fontFamily: "monospace" }}>💡 DICA: </span>
                <span style={{ color: t.textMuted, fontSize: 14 }}>{result.tip}</span>
              </div>
            )}
          </motion.div>
        )}
        {result?.error && (
          <div style={{ textAlign: "center", padding: 40, color: t.textFaint }}>Não foi possível buscar. Tente novamente.</div>
        )}
      </AnimatePresence>
    </div>
  );
}
