import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { getTutorResponse } from "../lessonService.js";
import { SpeakButton } from "./SpeakButton.jsx";

export function TutorChat({ level, knownWords }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Olá! Sou seu tutor de inglês. 😊 Pode me perguntar qualquer coisa em português — tradução, pronúncia, dúvidas — ou praticar conversação em inglês. Como posso ajudar?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const history = newMsgs.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const reply = await getTutorResponse(text, level, knownWords, history);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ Erro: ${err.message}` }]);
    }
    setLoading(false);
  };

  // Extrai frases em inglês de uma mensagem (entre aspas ou parênteses)
  const extractEnglish = (text) => {
    const matches = text.match(/"([^"]+)"/g) || text.match(/\(([A-Za-z][^)]+)\)/g);
    if (matches && matches.length > 0) return matches[0].replace(/['"()]/g, "");
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, color: "#e8e4d9", fontWeight: 700, margin: 0 }}>💬 Tutor Amigo</h2>
        <p style={{ color: "#6b6755", fontSize: 13, margin: "4px 0 0", fontFamily: "JetBrains Mono, monospace" }}>Tire dúvidas ou pratique conversação</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 8 }}>
        {messages.map((m, i) => {
          const engPhrase = m.role === "assistant" ? extractEnglish(m.content) : null;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: m.role === "user" ? "#e8c97a22" : "#1a1815", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {m.role === "user" ? "🧑" : "🤖"}
              </div>
              <div style={{ background: m.role === "user" ? "#1e1c16" : "#1a1815", border: `1px solid ${m.role === "user" ? "#3a3820" : "#2a2820"}`, borderRadius: 12, padding: "10px 14px", maxWidth: "80%", fontSize: 15, color: "#b5b09e", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {m.content}
                {engPhrase && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <SpeakButton text={engPhrase} size={13} rate={0.8} />
                    <span style={{ fontSize: 11, color: "#4a4940", fontFamily: "JetBrains Mono, monospace" }}>ouvir em inglês</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {loading && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a1815", display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
            <div style={{ background: "#1a1815", border: "1px solid #2a2820", borderRadius: 12, padding: "10px 14px", color: "#6b6755", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>digitando...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Pergunte algo ou pratique em inglês..."
          style={{ flex: 1, background: "#1a1815", border: "1px solid #2a2820", borderRadius: 10, padding: "12px 16px", color: "#e8e4d9", fontSize: 15, outline: "none", fontFamily: "Lora, Georgia, serif" }} />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{ background: "#e8c97a", border: "none", borderRadius: 10, padding: "0 20px", color: "#0f0e0c", fontSize: 20, cursor: "pointer", opacity: loading || !input.trim() ? 0.4 : 1 }}>→</button>
      </div>
    </div>
  );
}
