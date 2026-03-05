import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { askClaude } from "../api.js";
import { useSpeech } from "../hooks/useSpeech.js";

async function detectAndTranslate(text) {
  const raw = await askClaude(
    `Você é um intérprete instantâneo PT↔EN.
Detecte se o texto é português ou inglês e traduza para o outro idioma de forma natural e coloquial.
Responda APENAS com JSON válido: {"lang":"pt" ou "en","translation":"texto traduzido"}
Sem explicações, sem markdown.`,
    `Texto: ${text}`
  );
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

export function Interpreter({ theme: t }) {
  const [phase, setPhase] = useState("idle"); // idle | listening | translating
  const [messages, setMessages] = useState([]);
  const [liveText, setLiveText] = useState("");
  const [liveDetected, setLiveDetected] = useState(null);
  const recRef = useRef(null);
  const endRef = useRef(null);
  const liveRef = useRef("");
  const silenceTimer = useRef(null);
  const isRunning = useRef(false);
  const { speak, stop: stopSpeech, speaking, speakingRef } = useSpeech();

  const supported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveText]);

  const guessLang = (text) => {
    const ptWords = /\b(eu|você|ele|ela|nós|mas|para|com|que|não|sim|bom|boa|dia|olá|obrigado|por|favor|como|está|tudo|bem|quero|preciso|tenho|pode|isso|aqui|muito|então|minha|meu|nossa|aqui|gente)\b/i;
    const enWords = /\b(i|you|he|she|we|they|the|and|but|for|with|that|not|yes|good|day|hello|thank|please|how|are|well|want|need|have|can|this|here|very|my|our|your|what|where|when)\b/i;
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

      // Fala tradução — microfone fica pausado enquanto fala (via speakingRef)
      const targetLang = isPortuguese ? "en-US" : "pt-BR";
      await speak(result.translation, { lang: targetLang, rate: 0.90 });

    } catch {
      // silently fail
    }

    // Só reinicia o mic APÓS o áudio terminar
    if (isRunning.current) {
      setPhase("listening");
      restartRecognition();
    }
  }, [speak]);

  const restartRecognition = useCallback(() => {
    if (!supported || !isRunning.current) return;
    clearTimeout(silenceTimer.current);
    try { recRef.current?.stop(); } catch {}

    // Aguarda o áudio terminar antes de ligar o mic
    const waitAndStart = () => {
      if (speakingRef.current) {
        // Ainda falando — espera mais 300ms
        setTimeout(waitAndStart, 300);
        return;
      }
      if (!isRunning.current) return;

      setTimeout(() => {
        if (!isRunning.current || speakingRef.current) return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SR();
        recRef.current = rec;
        rec.lang = "pt-BR";
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onresult = (e) => {
          // Ignora se o app está falando
          if (speakingRef.current) return;

          let interim = "", final = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const txt = e.results[i][0].transcript;
            if (e.results[i].isFinal) final += txt;
            else interim += txt;
          }
          const current = (final || interim).trim();
          liveRef.current = current;
          setLiveText(current);
          const guessed = guessLang(current);
          if (guessed) setLiveDetected(guessed);

          if (current.length > 0) {
            clearTimeout(silenceTimer.current);
            silenceTimer.current = setTimeout(() => rec.stop(), 1800);
          }
        };

        rec.onend = () => {
          const captured = liveRef.current.trim();
          // Descarta se o app estava falando (captou o próprio áudio)
          if (speakingRef.current) {
            liveRef.current = "";
            setLiveText("");
            setTimeout(() => restartRecognition(), 500);
            return;
          }
          if (captured.length >= 2 && isRunning.current) {
            processUtterance(captured);
          } else if (isRunning.current) {
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
    };

    waitAndStart();
  }, [supported, processUtterance, speakingRef]);

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
    stopSpeech();
    setPhase("idle");
    setLiveText("");
    setLiveDetected(null);
  };

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

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, color: t.text, fontWeight: 700, margin: "0 0 4px" }}>🤝 Intérprete ao Vivo</h2>
        <p style={{ color: t.textFaint, fontSize: 13, fontFamily: "monospace", margin: 0 }}>
          Fale PT ou EN · tradução automática · microfone pausa enquanto o app fala
        </p>
      </div>

      {/* Indicador de status */}
      {phase !== "idle" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: speaking ? "#1e1c16" : phase === "translating" ? t.surface : "#0f1f0f", border: `1px solid ${speaking ? "#e8c97a44" : phase === "translating" ? t.border : "#4ade8044"}`, borderRadius: 10, marginBottom: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: speaking ? "#e8c97a" : phase === "translating" ? "#fb923c" : "#4ade80", display: "inline-block", animation: "dot 1s infinite" }} />
          <span style={{ fontSize: 13, fontFamily: "monospace", color: speaking ? "#e8c97a" : phase === "translating" ? "#fb923c" : "#4ade80" }}>
            {speaking ? "🔊 Falando tradução... (mic pausado)" : phase === "translating" ? "⟳ Traduzindo..." : "🎤 Ouvindo..."}
          </span>
          {liveDetected && phase === "listening" && <LangBadge lang={liveDetected} />}
        </div>
      )}

      {/* Conversa */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4 }}>

        {messages.length === 0 && phase === "idle" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center", gap: 16 }}>
            <div style={{ fontSize: 64 }}>👴🎤👧</div>
            <h3 style={{ color: t.text, fontWeight: 700, margin: 0, fontSize: 18 }}>Pronto para conversar!</h3>
            <p style={{ color: t.textMuted, fontSize: 14, lineHeight: 1.8, margin: 0 }}>
              Pressione <strong style={{ color: "#4ade80" }}>Iniciar</strong> e coloque o celular no centro.<br />
              Fale naturalmente em PT ou EN.<br />
              O mic <strong style={{ color: t.accent }}>pausa automaticamente</strong> enquanto<br />
              o app fala a tradução — sem eco! 🎉
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map(msg => {
            const isVovo = msg.speaker === "vovo";
            return (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: isVovo ? "flex-start" : "flex-end", gap: 5 }}>

                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
                  <span style={{ fontSize: 18 }}>{isVovo ? "👴" : "👧"}</span>
                  <span style={{ fontSize: 12, color: isVovo ? "#e8c97a" : "#38bdf8", fontFamily: "monospace", fontWeight: 700 }}>
                    {isVovo ? "Vovô" : "Neta"}
                  </span>
                  <LangBadge lang={msg.lang} />
                </div>

                {/* Fala original */}
                <div style={{ maxWidth: "82%", borderRadius: 14, padding: "10px 16px", background: isVovo ? "#1e1c16" : "#111d2e", border: `1px solid ${isVovo ? "#e8c97a33" : "#38bdf833"}` }}>
                  <div style={{ fontSize: 11, color: isVovo ? "#e8c97a88" : "#38bdf888", fontFamily: "monospace", marginBottom: 3 }}>
                    {isVovo ? "🇧🇷 Disse:" : "🇺🇸 Said:"}
                  </div>
                  <div style={{ fontSize: 16, color: t.text, fontWeight: 600, lineHeight: 1.5 }}>{msg.original}</div>
                </div>

                {/* Tradução */}
                <div style={{ maxWidth: "82%", borderRadius: 14, padding: "10px 16px", background: t.surface2, border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", marginBottom: 3 }}>
                    {isVovo ? "🇺🇸 Tradução para a neta:" : "🇧🇷 Tradução para o vovô:"}
                  </div>
                  <div style={{ fontSize: 15, color: t.textMuted, lineHeight: 1.5 }}>{msg.translated}</div>
                  <button onClick={() => speak(msg.translated, { lang: isVovo ? "en-US" : "pt-BR" })}
                    style={{ marginTop: 8, background: "transparent", border: `1px solid ${t.border}`, borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, color: t.textFaint, fontFamily: "monospace" }}>
                    🔊 ouvir de novo
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Live caption */}
        <AnimatePresence>
          {phase === "listening" && liveText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "12px 16px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12 }}>
              <div style={{ fontSize: 15, color: t.text, fontStyle: "italic" }}>"{liveText}"</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      {/* Botões */}
      <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {!supported ? (
          <div style={{ padding: 16, background: t.surface2, borderRadius: 12, textAlign: "center", color: t.textFaint, fontSize: 13 }}>
            ⚠️ Use o <strong>Google Chrome</strong> para o microfone funcionar
          </div>
        ) : phase === "idle" ? (
          <button onClick={startListening}
            style={{ width: "100%", padding: "22px", borderRadius: 14, border: "2px solid #4ade80", background: "#4ade8022", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#4ade80", fontFamily: "Lora, Georgia, serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 30 }}>🎤</span> Iniciar Conversa
          </button>
        ) : (
          <button onClick={stopListening}
            style={{ width: "100%", padding: "22px", borderRadius: 14, border: "2px solid #f87171", background: "#f8717122", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#f87171", fontFamily: "Lora, Georgia, serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, animation: "borderPulse 2s infinite" }}>
            <span style={{ fontSize: 30 }}>⏹</span> Encerrar Conversa
          </button>
        )}

        {messages.length > 0 && phase === "idle" && (
          <button onClick={() => setMessages([])}
            style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px", color: t.textFaint, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            🗑️ Limpar conversa
          </button>
        )}
      </div>

      <style>{`
        @keyframes dot { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes borderPulse { 0%,100%{box-shadow:0 0 0 0 #f8717144} 50%{box-shadow:0 0 0 8px #f8717100} }
      `}</style>
    </div>
  );
}
