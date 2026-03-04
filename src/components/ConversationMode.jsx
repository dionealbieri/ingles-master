import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { SCENARIOS } from "../constants.js";
import { getScenarioResponse } from "../lessonService.js";
import { SpeakButton } from "./SpeakButton.jsx";

export function ConversationMode({ level }) {
  const [scenario, setScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const startScenario = async (sc) => {
    setScenario(sc);
    setLoading(true);
    setMessages([]);
    try {
      const intro = await getScenarioResponse("START_CONVERSATION", sc, level, []);
      setMessages([{ role: "assistant", content: intro }]);
    } catch (err) {
      setMessages([{ role: "assistant", content: `⚠️ Erro ao iniciar: ${err.message}` }]);
    }
    setLoading(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const history = newMsgs.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const reply = await getScenarioResponse(text, scenario, level, history);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ Erro: ${err.message}` }]);
    }
    setLoading(false);
  };

  // Extrai a parte em inglês (antes do parêntese de tradução)
  const extractEnglish = (text) => {
    const firstLine = text.split("\n")[0];
    const beforeParen = firstLine.split("(")[0].trim();
    if (beforeParen.length > 3 && beforeParen.length < 200) return beforeParen;
    return null;
  };

  if (!scenario) {
    return (
      <div>
        <h2 style={{ fontSize: 22, color: "#e8e4d9", fontWeight: 700, marginBottom: 8 }}>🎭 Modo Conversação</h2>
        <p style={{ color: "#6b6755", fontSize: 13, fontFamily: "JetBrains Mono, monospace", marginBottom: 24 }}>Escolha um cenário e pratique diálogos reais</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {SCENARIOS.map((sc) => (
            <button key={sc.id} onClick={() => startScenario(sc)}
              style={{ background: "#131210", border: "1px solid #2a2820", borderRadius: 14, padding: 20, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e8c97a55"; e.currentTarget.style.background = "#1a1815"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2820"; e.currentTarget.style.background = "#131210"; }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{sc.emoji}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e4d9", fontFamily: "Lora, Georgia, serif" }}>{sc.title}</div>
              <div style={{ fontSize: 13, color: "#6b6755", marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>{sc.hint}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => { setScenario(null); setMessages([]); }}
          style={{ background: "transparent", border: "1px solid #2a2820", borderRadius: 8, padding: "4px 12px", color: "#6b6755", fontSize: 13, cursor: "pointer", fontFamily: "Lora, Georgia, serif" }}>← Voltar</button>
        <span style={{ fontSize: 20 }}>{scenario.emoji}</span>
        <h2 style={{ fontSize: 18, color: "#e8e4d9", fontWeight: 700, margin: 0 }}>{scenario.title}</h2>
        <span style={{ fontSize: 11, color: "#4a4940", fontFamily: "JetBrains Mono, monospace", marginLeft: "auto" }}>🔊 clique para ouvir cada fala</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && messages.length === 0 && (
          <div style={{ color: "#6b6755", fontFamily: "JetBrains Mono, monospace", textAlign: "center", padding: 32 }}>Iniciando cenário...</div>
        )}
        {messages.map((m, i) => {
          const engPhrase = m.role === "assistant" ? extractEnglish(m.content) : null;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: m.role === "user" ? "#e8c97a22" : "#1a1815", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {m.role === "user" ? "🧑" : scenario.emoji}
              </div>
              <div style={{ background: m.role === "user" ? "#1e1c16" : "#1a1815", border: `1px solid ${m.role === "user" ? "#3a3820" : "#2a2820"}`, borderRadius: 12, padding: "10px 14px", maxWidth: "80%", fontSize: 15, color: "#b5b09e", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {m.content}
                {engPhrase && m.role === "assistant" && (
                  <div style={{ marginTop: 8 }}>
                    <SpeakButton text={engPhrase} size={14} rate={0.8} />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {loading && messages.length > 0 && (
          <div style={{ color: "#6b6755", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>respondendo...</div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Responda em inglês (tente!)..."
          style={{ flex: 1, background: "#1a1815", border: "1px solid #2a2820", borderRadius: 10, padding: "12px 16px", color: "#e8e4d9", fontSize: 15, outline: "none", fontFamily: "Lora, Georgia, serif" }} />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{ background: "#e8c97a", border: "none", borderRadius: 10, padding: "0 20px", color: "#0f0e0c", fontSize: 20, cursor: "pointer", opacity: loading || !input.trim() ? 0.4 : 1 }}>→</button>
      </div>
    </div>
  );
}
