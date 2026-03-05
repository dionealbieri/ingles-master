import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { askClaude } from "../api.js";

// Fala usando OpenAI TTS — retorna Promise que resolve quando TERMINA
async function speakText(text, lang) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || "";
  if (!apiKey) return speakBrowser(text, lang);

  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "tts-1", input: text, voice: "nova", speed: 0.92 }),
    });
    if (!res.ok) throw new Error("TTS failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.volume = 1.0;
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      audio.play().catch(() => { speakBrowser(text, lang).then(resolve); });
    });
  } catch {
    return speakBrowser(text, lang);
  }
}

function speakBrowser(text, lang) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = 0.90; u.pitch = 1; u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = lang.startsWith("pt")
      ? ["Google português do Brasil", "Luciana"]
      : ["Google US English", "Samantha", "Karen"];
    let voice = null;
    for (const n of preferred) { voice = voices.find(v => v.name.includes(n)); if (voice) break; }
    if (!voice) voice = voices.find(v => v.lang.startsWith(lang.split("-")[0]));
    if (voice) u.voice = voice;
    u.onend = resolve; u.onerror = resolve;
    window.speechSynthesis.speak(u);
  });
}

async function translate(text) {
  const raw = await askClaude(
    `Intérprete PT↔EN. Detecte o idioma e traduza naturalmente.
Responda APENAS JSON: {"lang":"pt" ou "en","translation":"tradução"}`,
    `Texto: ${text}`
  );
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

export function Interpreter({ theme: t }) {
  const [status, setStatus] = useState("idle"); // idle | listening | speaking | translating
  const [messages, setMessages] = useState([]);
  const [liveText, setLiveText] = useState("");
  const endRef = useRef(null);
  const recRef = useRef(null);
  const isOn = useRef(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Inicia 1 ciclo de escuta → traduz → fala → repete
  const runCycle = async () => {
    if (!isOn.current) return;

    // 1. ESCUTA
    setStatus("listening");
    setLiveText("");
    const spoken = await listenOnce((interim) => setLiveText(interim));

    if (!isOn.current) return;
    if (!spoken || spoken.trim().length < 2) {
      // Nada captado — tenta de novo
      setTimeout(() => runCycle(), 200);
      return;
    }

    // 2. TRADUZ
    setStatus("translating");
    setLiveText("");
    let result;
    try {
      result = await translate(spoken.trim());
    } catch {
      setTimeout(() => runCycle(), 500);
      return;
    }

    const isPortuguese = result.lang === "pt";
    const msg = {
      id: Date.now(),
      original: spoken.trim(),
      translated: result.translation,
      lang: result.lang,
      speaker: isPortuguese ? "vovo" : "neta",
    };
    setMessages(prev => [...prev, msg]);

    // 3. FALA — mic fica desligado aqui
    setStatus("speaking");
    await speakText(result.translation, isPortuguese ? "en-US" : "pt-BR");

    // 4. REPETE o ciclo
    if (isOn.current) {
      setTimeout(() => runCycle(), 400);
    }
  };

  // Escuta UMA frase e retorna o texto
  const listenOnce = (onInterim) => {
    return new Promise((resolve) => {
      if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
        return resolve("");
      }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      recRef.current = rec;
      rec.lang = "pt-BR";
      rec.continuous = false;
      rec.interimResults = true;

      let finalText = "";
      let silenceTimer = null;

      rec.onresult = (e) => {
        let interim = "", final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const txt = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += txt;
          else interim += txt;
        }
        const current = (final || interim).trim();
        if (current) onInterim(current);
        if (final) finalText = final;

        // Para depois de 1.8s de silêncio
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => rec.stop(), 1800);
      };

      rec.onend = () => {
        clearTimeout(silenceTimer);
        resolve(finalText || "");
      };

      rec.onerror = (e) => {
        clearTimeout(silenceTimer);
        if (e.error === "no-speech") resolve("");
        else resolve("");
      };

      try { rec.start(); } catch { resolve(""); }
    });
  };

  const start = () => {
    window.speechSynthesis?.cancel();
    isOn.current = true;
    setMessages([]);
    runCycle();
  };

  const stop = () => {
    isOn.current = false;
    try { recRef.current?.stop(); } catch {}
    window.speechSynthesis?.cancel();
    setStatus("idle");
    setLiveText("");
  };

  const statusConfig = {
    idle:        { color: t.textFaint,  bg: t.surface2,  dot: t.border,    label: "" },
    listening:   { color: "#4ade80",    bg: "#0f2d1a",   dot: "#4ade80",   label: "🎤 Ouvindo — fale em PT ou EN..." },
    translating: { color: "#fb923c",    bg: "#2d1a0f",   dot: "#fb923c",   label: "⟳ Traduzindo..." },
    speaking:    { color: "#e8c97a",    bg: "#1e1c16",   dot: "#e8c97a",   label: "🔊 Falando tradução — aguarde..." },
  };
  const sc = statusConfig[status];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>

      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 22, color: t.text, fontWeight: 700, margin: "0 0 4px" }}>🤝 Intérprete ao Vivo</h2>
        <p style={{ color: t.textFaint, fontSize: 13, fontFamily: "monospace", margin: 0 }}>
          Fale PT ou EN · microfone pausa enquanto o app fala
        </p>
      </div>

      {/* Status bar */}
      {status !== "idle" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: sc.bg, border: `1px solid ${sc.dot}44`, borderRadius: 10, marginBottom: 12 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: sc.dot, display: "inline-block", animation: "dot 1s infinite" }} />
          <span style={{ fontSize: 14, fontFamily: "monospace", color: sc.color, fontWeight: 600 }}>{sc.label}</span>
        </div>
      )}

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4 }}>
        {messages.length === 0 && status === "idle" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center", gap: 16 }}>
            <div style={{ fontSize: 64 }}>👴🎤👧</div>
            <h3 style={{ color: t.text, fontWeight: 700, margin: 0, fontSize: 18 }}>Pronto para conversar!</h3>
            <p style={{ color: t.textMuted, fontSize: 14, lineHeight: 1.9, margin: 0 }}>
              Pressione <strong style={{ color: "#4ade80" }}>Iniciar</strong> e coloque o celular no centro.<br />
              Fale naturalmente — PT ou EN.<br />
              O mic pausa sozinho enquanto o app fala. ✅
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map(msg => {
            const isVovo = msg.speaker === "vovo";
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: isVovo ? "flex-start" : "flex-end", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 4px" }}>
                  <span style={{ fontSize: 18 }}>{isVovo ? "👴" : "👧"}</span>
                  <span style={{ fontSize: 12, color: isVovo ? "#e8c97a" : "#38bdf8", fontFamily: "monospace", fontWeight: 700 }}>
                    {isVovo ? "Vovô" : "Neta"}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", padding: "1px 7px", borderRadius: 5, background: isVovo ? "#e8c97a22" : "#38bdf822", color: isVovo ? "#e8c97a" : "#38bdf8", border: `1px solid ${isVovo ? "#e8c97a44" : "#38bdf844"}` }}>
                    {msg.lang === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
                  </span>
                </div>
                <div style={{ maxWidth: "82%", borderRadius: 14, padding: "10px 16px", background: isVovo ? "#1e1c16" : "#111d2e", border: `1px solid ${isVovo ? "#e8c97a33" : "#38bdf833"}` }}>
                  <div style={{ fontSize: 11, color: isVovo ? "#e8c97a77" : "#38bdf877", fontFamily: "monospace", marginBottom: 3 }}>{isVovo ? "🇧🇷 Disse:" : "🇺🇸 Said:"}</div>
                  <div style={{ fontSize: 16, color: t.text, fontWeight: 600, lineHeight: 1.5 }}>{msg.original}</div>
                </div>
                <div style={{ maxWidth: "82%", borderRadius: 14, padding: "10px 16px", background: t.surface2, border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", marginBottom: 3 }}>{isVovo ? "🇺🇸 Para a neta:" : "🇧🇷 Para o vovô:"}</div>
                  <div style={{ fontSize: 15, color: t.textMuted, lineHeight: 1.5 }}>{msg.translated}</div>
                  <button onClick={() => speakText(msg.translated, isVovo ? "en-US" : "pt-BR")}
                    style={{ marginTop: 8, background: "transparent", border: `1px solid ${t.border}`, borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, color: t.textFaint, fontFamily: "monospace" }}>
                    🔊 ouvir de novo
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Live caption */}
        {status === "listening" && liveText && (
          <div style={{ padding: "10px 16px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12 }}>
            <div style={{ fontSize: 15, color: t.text, fontStyle: "italic" }}>"{liveText}"</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Botão */}
      <div style={{ paddingTop: 16 }}>
        {status === "idle" ? (
          <button onClick={start}
            style={{ width: "100%", padding: "22px", borderRadius: 14, border: "2px solid #4ade80", background: "#4ade8022", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#4ade80", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 30 }}>🎤</span> Iniciar Conversa
          </button>
        ) : (
          <button onClick={stop}
            style={{ width: "100%", padding: "22px", borderRadius: 14, border: "2px solid #f87171", background: "#f8717122", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#f87171", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 30 }}>⏹</span> Encerrar Conversa
          </button>
        )}
        {messages.length > 0 && status === "idle" && (
          <button onClick={() => setMessages([])}
            style={{ width: "100%", marginTop: 10, background: "transparent", border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px", color: t.textFaint, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            🗑️ Limpar conversa
          </button>
        )}
      </div>

      <style>{`@keyframes dot{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  );
}
