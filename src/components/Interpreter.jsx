import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { askClaude } from "../api.js";
import { useSpeech } from "../hooks/useSpeech.js";

// Detecta idioma e traduz em uma só chamada
async function detectAndTranslate(text) {
  const raw = await askClaude(
    `Você é um intérprete instantâneo PT↔EN.
Regras ESTRITAS:
- Detecte se o texto é português ou inglês
- Traduza para o outro idioma de forma natural
- Responda APENAS com JSON: {"lang":"pt" ou "en","translation":"texto traduzido"}
- Nunca adicione explicações, aspas extras ou markdown`,
    `Texto: ${text}`
  );
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export function Interpreter({ theme: t }) {
  const [phase, setPhase] = useState("idle"); // idle | listening | translating
  const [messages, setMessages] = useState([]);
  const [liveText, setLiveText] = useState("");
  const [liveDetected, setLiveDetected] = useState(null); // "pt" | "en" | null
  const recRef = useRef(null);
  const endRef = useRef(null);
  const liveRef = useRef("");
  const silenceTimer = useRef(null);
  const isRunning = useRef(false);
  const { speak, stop: stopSpeech } = useSpeech();

  const supported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveText]);

  // Heurística rápida de idioma pelo texto interim (sem chamar API)
  const guessLang = (text) => {
    const ptWords = /\b(eu|você|ele|ela|nós|eles|mas|para|com|que|não|sim|bom|boa|dia|olá|obrigado|por|favor|como|está|tudo|bem|quero|preciso|tenho|pode|isso|aqui|muito|pouco|então)\b/i;
    const enWords = /\b(i|you|he|she|we|they|the|and|but|for|with|that|not|yes|good|day|hello|thank|please|how|are|all|well|want|need|have|can|this|here|very|little|so)\b/i;
    const ptScore = (text.match(ptWords) || []).length;
    const enScore = (text.match(enWords) || []).length;
    if (ptScore === 0 && enScore === 0) return null;
    return ptScore >= enScore ? "pt" : "en";
  };

  const processUtterance = useCallback(async (text) => {
    if (!text || text.trim().length < 2) return;
    setPhase("translating");
    setLiveText("");
    setLiveDetected(null);
    liveRef.current = "";

    try {
      const result = await detectAndTranslate(text.trim());
      const isPortuguese = result.lang === "pt";
      const msg = {
        id: Date.now(),
        original: text.trim(),
        translated: result.translation,
        lang: result.lang,
        speaker: isPortuguese ? "vovo" : "neta",
      };
      setMessages(prev => [...prev, msg]);

      // Fala a tradução para o outro entender
      const targetLang = isPortuguese ? "en-US" : "pt-BR";
      speak(result.translation, { lang: targetLang, rate: 0.88 });
    } catch {
      // silently fail, continue listening
    }

    setPhase("listening");
    restartRecognition();
  }, [speak]);

  const restartRecognition = useCallback(() => {
    if (!supported || !isRunning.current) return;
    clearTimeout(silenceTimer.current);

    try { recRef.current?.stop(); } catch {}

    setTimeout(() => {
      if (!isRunning.current) return;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      recRef.current = rec;
      // Usa pt-BR como base — o sistema aceita inglês também na maioria dos browsers
      rec.lang = "pt-BR";
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (e) => {
        let interim = "";
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        const current = (final || interim).trim();
        liveRef.current = current;
        setLiveText(current);

        // Atualiza detecção de idioma em tempo real
        const guessed = guessLang(current);
        if (guessed) setLiveDetected(guessed);

        // Silêncio de 1.5s após fala = processar
        if (current.length > 0) {
          clearTimeout(silenceTimer.current);
          silenceTimer.current = setTimeout(() => {
            rec.stop();
          }, 1500);
        }
      };

      rec.onend = () => {
        const captured = liveRef.current.trim();
        if (captured.length >= 2 && isRunning.current) {
          processUtterance(captured);
        } else if (isRunning.current) {
          // Nada captado — reinicia
          setTimeout(() => restartRecognition(), 300);
        }
      };

      rec.onerror = (e) => {
        if (e.error === "no-speech" && isRunning.current) {
          setTimeout(() => restartRecognition(), 300);
        }
      };

      try { rec.start(); } catch {}
    }, 200);
  }, [supported, processUtterance]);

  const startListening = () => {
    if (!supported) return;
    stopSpeech();
    isRunning.current = true;
    setPhase("listening");
    setMessages([]);
    setLiveText("");
    setLiveDetected(null);
    restartRecognition();
  };

  const stopListening = () => {
    isRunning.current = false;
    clearTimeout(silenceTimer.current);
    try { recRef.current?.stop(); } catch {}
    setPhase("idle");
    setLiveText("");
    setLiveDetected(null);
    stopSpeech();
  };

  const clearConversation = () => {
    setMessages([]);
  };

  // Indicador de idioma detectado
  const LangBadge = ({ lang }) => (
    <span style={{
      fontSize: 11, fontFamily: "monospace", padding: "2px 8px", borderRadius: 6,
      background: lang === "pt" ? "#e8c97a22" : "#38bdf822",
      color: lang === "pt" ? "#e8c97a" : "#38bdf8",
      border: `1px solid ${lang === "pt" ? "#e8c97a44" : "#38bdf844"}`,
    }}>
      {lang === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
    </span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, color: t.text, fontWeight: 700, margin: "0 0 4px" }}>🤝 Intérprete ao Vivo</h2>
        <p style={{ color: t.textFaint, fontSize: 13, fontFamily: "monospace", margin: 0 }}>
          Detecção automática · fale em PT ou EN · traduz instantaneamente
        </p>
      </div>

      {/* Conversation */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4 }}>

        {messages.length === 0 && phase === "idle" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center", gap: 12 }}>
            <div style={{ fontSize: 64 }}>👴🎤👧</div>
            <h3 style={{ color: t.text, fontWeight: 700, margin: 0, fontSize: 18 }}>Pronto para conversar!</h3>
            <p style={{ color: t.textMuted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              Pressione <strong style={{ color: t.accent }}>Iniciar</strong> e coloque o celular no centro.<br />
              Fale naturalmente — o app detecta PT ou EN sozinho<br />
              e fala a tradução automaticamente.
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              {[
                { emoji: "👴", label: "Vovô fala PT", color: "#e8c97a" },
                { emoji: "🔄", label: "App traduz", color: t.textFaint },
                { emoji: "👧", label: "Neta ouve EN", color: "#38bdf8" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, color: s.color, fontFamily: "monospace", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map(msg => {
            const isVovo = msg.speaker === "vovo";
            return (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: isVovo ? "flex-start" : "flex-end", gap: 5 }}>

                {/* Speaker + idioma */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: isVovo ? 4 : 0, paddingRight: isVovo ? 0 : 4 }}>
                  <span style={{ fontSize: 18 }}>{isVovo ? "👴" : "👧"}</span>
                  <span style={{ fontSize: 12, color: isVovo ? "#e8c97a" : "#38bdf8", fontFamily: "monospace", fontWeight: 700 }}>
                    {isVovo ? "Vovô" : "Neta"}
                  </span>
                  <LangBadge lang={msg.lang} />
                </div>

                {/* Fala original */}
                <div style={{
                  maxWidth: "80%", borderRadius: 14, padding: "10px 16px",
                  background: isVovo ? "#1e1c16" : "#111d2e",
                  border: `1px solid ${isVovo ? "#e8c97a33" : "#38bdf833"}`,
                }}>
                  <div style={{ fontSize: 11, color: isVovo ? "#e8c97a99" : "#38bdf899", fontFamily: "monospace", marginBottom: 3 }}>
                    {isVovo ? "🇧🇷 Disse:" : "🇺🇸 Said:"}
                  </div>
                  <div style={{ fontSize: 16, color: t.text, fontWeight: 600, lineHeight: 1.5 }}>{msg.original}</div>
                </div>

                {/* Tradução */}
                <div style={{
                  maxWidth: "80%", borderRadius: 14, padding: "10px 16px",
                  background: t.surface2, border: `1px solid ${t.border}`,
                }}>
                  <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", marginBottom: 3 }}>
                    {isVovo ? "🇺🇸 Tradução para a neta:" : "🇧🇷 Tradução para o vovô:"}
                  </div>
                  <div style={{ fontSize: 15, color: t.textMuted, lineHeight: 1.5 }}>{msg.translated}</div>
                  <button onClick={() => speak(msg.translated, { lang: isVovo ? "en-US" : "pt-BR", rate: 0.88 })}
                    style={{ marginTop: 6, background: "transparent", border: `1px solid ${t.border}`, borderRadius: 6, padding: "2px 10px", cursor: "pointer", fontSize: 12, color: t.textFaint, fontFamily: "monospace" }}>
                    🔊 ouvir de novo
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Live caption */}
        <AnimatePresence>
          {phase === "listening" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "14px 18px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: liveText ? 8 : 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "liveDot 1s infinite" }} />
                <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "monospace" }}>Ouvindo...</span>
                {liveDetected && <LangBadge lang={liveDetected} />}
              </div>
              {liveText && (
                <div style={{ fontSize: 16, color: t.text, lineHeight: 1.5, fontStyle: "italic" }}>"{liveText}"</div>
              )}
            </motion.div>
          )}
          {phase === "translating" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "14px 18px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                <span style={{ fontSize: 13, color: t.textFaint, fontFamily: "monospace" }}>Traduzindo...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      {/* Controls */}
      <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {!supported ? (
          <div style={{ padding: 16, background: t.surface2, borderRadius: 12, textAlign: "center", color: t.textFaint, fontSize: 13 }}>
            ⚠️ Use o <strong>Google Chrome</strong> para o microfone funcionar
          </div>
        ) : phase === "idle" ? (
          <button onClick={startListening}
            style={{ width: "100%", padding: "20px", borderRadius: 14, border: "2px solid #4ade80", background: "#4ade8022", cursor: "pointer", fontSize: 17, fontWeight: 700, color: "#4ade80", fontFamily: "Lora, Georgia, serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎤</span>
            Iniciar Conversa
          </button>
        ) : (
          <button onClick={stopListening}
            style={{ width: "100%", padding: "20px", borderRadius: 14, border: "2px solid #f87171", background: "#f8717122", cursor: "pointer", fontSize: 17, fontWeight: 700, color: "#f87171", fontFamily: "Lora, Georgia, serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, animation: "borderPulse 2s infinite" }}>
            <span style={{ fontSize: 28 }}>⏹</span>
            Encerrar Conversa
          </button>
        )}

        {messages.length > 0 && phase === "idle" && (
          <button onClick={clearConversation}
            style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 10, padding: "8px", color: t.textFaint, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            🗑️ Limpar conversa
          </button>
        )}
      </div>

      <style>{`
        @keyframes liveDot { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes borderPulse { 0%,100%{box-shadow:0 0 0 0 #f8717144} 50%{box-shadow:0 0 0 8px #f8717100} }
      `}</style>
    </div>
  );
}
