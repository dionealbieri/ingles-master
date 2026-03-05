import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { askClaude } from "../api.js";

// Fala usando Web Speech — com suporte especial para iOS Safari
function falar(text, lang) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();

    window.speechSynthesis.cancel();

    const tentar = (tentativa = 0) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = lang.startsWith("pt") ? 0.85 : 0.82;
      u.pitch = 1.0;
      u.volume = 1.0;

      // iOS: precisa escolher voz DEPOIS das voices carregarem
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langCode = lang.split("-")[0];
        const v =
          voices.find(v => v.lang === lang) ||
          voices.find(v => v.lang.startsWith(langCode)) ||
          voices[0];
        if (v) u.voice = v;
      }

      // Timeout de segurança — nunca fica preso
      const maxDuration = Math.max(4000, text.length * 80);
      const safetyTimer = setTimeout(() => {
        window.speechSynthesis.cancel();
        resolve();
      }, maxDuration);

      u.onend = () => { clearTimeout(safetyTimer); resolve(); };
      u.onerror = (e) => {
        clearTimeout(safetyTimer);
        // iOS às vezes dá "interrupted" — tenta de novo uma vez
        if (e.error === "interrupted" && tentativa === 0) {
          setTimeout(() => tentar(1), 300);
        } else {
          resolve();
        }
      };

      window.speechSynthesis.speak(u);

      // iOS bug: speechSynthesis para sozinho após 15s
      // Workaround: resume a cada 10s
      const iosKeepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(iosKeepAlive);
        }
      }, 10000);

      u.onend = () => {
        clearTimeout(safetyTimer);
        clearInterval(iosKeepAlive);
        resolve();
      };
    };

    // iOS: pequeno delay para o cancel() processar
    setTimeout(() => tentar(0), 200);
  });
}

async function traduzir(text) {
  const raw = await askClaude(
    `Intérprete PT↔EN. Detecte o idioma e traduza de forma natural.
Responda APENAS JSON válido sem markdown: {"lang":"pt","translation":"texto"}
lang = "pt" se português, "en" se inglês.`,
    text
  );
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

function ouvirFrase(onInterim) {
  return new Promise((resolve) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return resolve("");

    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = true;

    let finalText = "";
    let silenceTimer = null;

    rec.onresult = (e) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      const current = (final || interim).trim();
      if (current) onInterim(current);
      if (final) finalText = final.trim();
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => rec.stop(), 2000);
    };

    rec.onend = () => { clearTimeout(silenceTimer); resolve(finalText); };
    rec.onerror = (e) => {
      clearTimeout(silenceTimer);
      resolve(e.error === "no-speech" ? "" : "");
    };

    setTimeout(() => { try { rec.stop(); } catch {} }, 15000);
    try { rec.start(); } catch { resolve(""); }
  });
}

export function Interpreter({ theme: t }) {
  const [status, setStatus] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [liveText, setLiveText] = useState("");
  const [delaySecs, setDelaySecs] = useState(0);
  const endRef = useRef(null);
  const rodando = useRef(false);
  const delayTimer = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Countdown visual durante o delay pós-fala
  const esperarComContagem = (ms) => {
    return new Promise((resolve) => {
      let remaining = Math.ceil(ms / 1000);
      setDelaySecs(remaining);
      const tick = setInterval(() => {
        remaining--;
        setDelaySecs(remaining);
        if (remaining <= 0) {
          clearInterval(tick);
          resolve();
        }
      }, 1000);
      delayTimer.current = tick;
      // Fallback
      setTimeout(() => { clearInterval(tick); setDelaySecs(0); resolve(); }, ms + 500);
    });
  };

  const ciclo = async () => {
    while (rodando.current) {
      // OUVIR
      setStatus("listening");
      setLiveText("");
      setDelaySecs(0);
      const texto = await ouvirFrase((interim) => setLiveText(interim));

      if (!rodando.current) break;
      if (!texto || texto.trim().length < 2) continue;

      // TRADUZIR
      setStatus("translating");
      setLiveText("");
      let resultado;
      try {
        resultado = await traduzir(texto);
      } catch {
        continue;
      }

      if (!rodando.current) break;

      const isPortugues = resultado.lang === "pt";
      setMessages(prev => [...prev, {
        id: Date.now(),
        original: texto.trim(),
        translated: resultado.translation,
        lang: resultado.lang,
        speaker: isPortugues ? "vovo" : "neta",
      }]);

      // FALAR
      setStatus("speaking");
      await falar(resultado.translation, isPortugues ? "en-US" : "pt-BR");

      if (!rodando.current) break;

      // DELAY de 2s após fala — para o outro se preparar
      setStatus("waiting");
      await esperarComContagem(2000);
      setDelaySecs(0);
    }
    setStatus("idle");
  };

  const iniciar = () => {
    // iOS: precisa de interação do usuário para desbloquear speechSynthesis
    window.speechSynthesis?.cancel();
    // "Esquenta" o TTS com uma utterance vazia
    const warmup = new SpeechSynthesisUtterance(" ");
    warmup.volume = 0;
    window.speechSynthesis?.speak(warmup);

    rodando.current = true;
    setMessages([]);
    ciclo();
  };

  const parar = () => {
    rodando.current = false;
    clearInterval(delayTimer.current);
    window.speechSynthesis?.cancel();
    setStatus("idle");
    setLiveText("");
    setDelaySecs(0);
  };

  const statusInfo = {
    idle:        { label: "",                                    color: t.textFaint, bg: "transparent", border: "transparent" },
    listening:   { label: "🎤 Ouvindo... fale agora",           color: "#4ade80",   bg: "#081a08",     border: "#4ade8055"   },
    translating: { label: "⟳ Traduzindo...",                    color: "#fb923c",   bg: "#1a0f05",     border: "#fb923c55"   },
    speaking:    { label: "🔊 Falando tradução...",              color: "#e8c97a",   bg: "#1a1608",     border: "#e8c97a55"   },
    waiting:     { label: `⏳ Aguarde ${delaySecs}s para falar`, color: "#38bdf8",   bg: "#081520",     border: "#38bdf855"   },
  };
  const si = statusInfo[status] || statusInfo.idle;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>

      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 22, color: t.text, fontWeight: 700, margin: "0 0 4px" }}>🤝 Intérprete ao Vivo</h2>
        <p style={{ color: t.textFaint, fontSize: 13, fontFamily: "monospace", margin: 0 }}>
          PT ↔ EN · automático · mic pausa enquanto fala
        </p>
      </div>

      {/* Status bar */}
      {status !== "idle" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: si.bg, border: `1px solid ${si.border}`, borderRadius: 10, marginBottom: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: si.color, flexShrink: 0, animation: status !== "idle" ? "dot 1s infinite" : "none" }} />
          <span style={{ fontSize: 15, fontFamily: "monospace", color: si.color, fontWeight: 600 }}>{si.label}</span>
        </div>
      )}

      {/* Live text */}
      {status === "listening" && liveText && (
        <div style={{ padding: "10px 16px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 15, color: t.text, fontStyle: "italic" }}>"{liveText}"</span>
        </div>
      )}

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
        {messages.length === 0 && status === "idle" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 14 }}>
            <div style={{ fontSize: 52 }}>👴🎤👧</div>
            <h3 style={{ color: t.text, fontWeight: 700, margin: 0, fontSize: 18 }}>Pronto para conversar!</h3>
            <p style={{ color: t.textMuted, fontSize: 14, lineHeight: 1.9, margin: 0 }}>
              Pressione <strong style={{ color: "#4ade80" }}>Iniciar</strong> e coloque<br />
              o celular no centro da mesa.<br />
              <strong style={{ color: t.accent }}>Fale · App traduz · Outro entende!</strong>
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
                  <span style={{ fontSize: 16 }}>{isVovo ? "👴" : "👧"}</span>
                  <span style={{ fontSize: 12, color: isVovo ? "#e8c97a" : "#38bdf8", fontFamily: "monospace", fontWeight: 700 }}>
                    {isVovo ? "Vovô" : "Neta"}
                  </span>
                  <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 5, fontFamily: "monospace", background: isVovo ? "#e8c97a22" : "#38bdf822", color: isVovo ? "#e8c97a" : "#38bdf8", border: `1px solid ${isVovo ? "#e8c97a44" : "#38bdf844"}` }}>
                    {msg.lang === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
                  </span>
                </div>

                <div style={{ maxWidth: "84%", borderRadius: 12, padding: "10px 14px", background: isVovo ? "#1e1c16" : "#111d2e", border: `1px solid ${isVovo ? "#e8c97a33" : "#38bdf833"}` }}>
                  <div style={{ fontSize: 11, color: isVovo ? "#e8c97a66" : "#38bdf866", fontFamily: "monospace", marginBottom: 2 }}>
                    {isVovo ? "🇧🇷 Disse:" : "🇺🇸 Said:"}
                  </div>
                  <div style={{ fontSize: 16, color: t.text, fontWeight: 600, lineHeight: 1.5 }}>{msg.original}</div>
                </div>

                <div style={{ maxWidth: "84%", borderRadius: 12, padding: "10px 14px", background: t.surface2, border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", marginBottom: 2 }}>
                    {isVovo ? "🇺🇸 Para a neta:" : "🇧🇷 Para o vovô:"}
                  </div>
                  <div style={{ fontSize: 15, color: t.textMuted, lineHeight: 1.5 }}>{msg.translated}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Botão */}
      <div style={{ paddingTop: 14 }}>
        {status === "idle" ? (
          <button onClick={iniciar}
            style={{ width: "100%", padding: "22px", borderRadius: 14, border: "2px solid #4ade80", background: "#4ade8011", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#4ade80", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎤</span> Iniciar Conversa
          </button>
        ) : (
          <button onClick={parar}
            style={{ width: "100%", padding: "22px", borderRadius: 14, border: "2px solid #f87171", background: "#f8717111", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#f87171", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>⏹</span> Encerrar
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
