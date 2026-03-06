import { useState } from "react";
import { motion } from "motion/react";

const DEFAULT_SETTINGS = {
  speechRate: 0.90,
  speechVolume: 1.0,
  openaiVoice: "nova",
  autoSpeak: true,
  interpreterDelay: 2.5,
  fontSize: "normal",
  showPronunciation: true,
  showTranslationHint: true,
  dailyGoal: 10,
};

const OPENAI_VOICES = [
  { value: "nova",    label: "Nova",    desc: "Feminina, jovem e clara — padrão",   flag: "⭐" },
  { value: "shimmer", label: "Shimmer", desc: "Feminina, suave e expressiva",        flag: "✨" },
  { value: "alloy",   label: "Alloy",   desc: "Neutra, equilibrada e profissional",  flag: "🔷" },
  { value: "echo",    label: "Echo",    desc: "Masculina, clara e articulada",       flag: "🔵" },
  { value: "onyx",    label: "Onyx",    desc: "Masculina, grave e autoritária",      flag: "⚫" },
  { value: "fable",   label: "Fable",   desc: "Masculina, calorosa e narrativa",     flag: "📖" },
];

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("app_settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const update = (key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("app_settings", JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    localStorage.setItem("app_settings", JSON.stringify(DEFAULT_SETTINGS));
    setSettings(DEFAULT_SETTINGS);
  };

  return { settings, update, reset };
}

function Slider({ label, description, value, min, max, step, format, onChange, color = "#e8c97a" }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 15, fontFamily: "monospace", color, fontWeight: 700, background: color + "22", padding: "2px 10px", borderRadius: 6 }}>
          {format ? format(value) : value}
        </span>
      </div>
      {description && <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px", lineHeight: 1.5 }}>{description}</p>}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, cursor: "pointer", height: 4 }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555", fontFamily: "monospace", marginTop: 2 }}>
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

function Toggle({ label, description, value, onChange, color = "#e8c97a" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #2a2820" }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>{description}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{ width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer", background: value ? color : "#333", transition: "all 0.2s", position: "relative", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: value ? 27 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "all 0.2s", display: "block" }} />
      </button>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid #2a2820" }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h3 style={{ fontSize: 16, color: "#e8c97a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function Settings({ settings, onUpdate, onReset, theme: t }) {
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);

  const save = (key, value) => {
    onUpdate(key, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const testVoice = async (lang) => {
    if (testing) return;
    setTesting(true);
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || "";
    const text = lang.startsWith("pt") ? "Olá! Este é um teste da voz." : "Hello! This is a voice test.";

    if (apiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: settings.openaiVoice || "nova",
            speed: Math.max(0.25, Math.min(4.0, settings.speechRate || 0.90)),
          }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.volume = settings.speechVolume || 1.0;
          audio.onended = () => { URL.revokeObjectURL(url); setTesting(false); };
          audio.onerror = () => setTesting(false);
          await audio.play();
          return;
        }
      } catch {}
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = settings.speechRate || 0.90; u.volume = settings.speechVolume || 1.0;
      u.onend = () => setTesting(false);
      u.onerror = () => setTesting(false);
      window.speechSynthesis.speak(u);
    } else { setTesting(false); }
  };

  return (
    <div style={{ maxWidth: 600, color: t.text }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: t.text }}>⚙️ Configurações</h2>
          <p style={{ color: t.textFaint, fontSize: 13, fontFamily: "monospace", margin: 0 }}>Personalize o app do seu jeito</p>
        </div>
        {saved && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: "#4ade8022", border: "1px solid #4ade8055", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#4ade80", fontFamily: "monospace" }}>
            ✓ Salvo!
          </motion.div>
        )}
      </div>

      <Section title="Voz e Pronúncia" icon="🔊">
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Escolha a voz</div>
          <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px", lineHeight: 1.5 }}>
            Vozes reais da OpenAI — clique em "Testar" para ouvir antes de escolher
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {OPENAI_VOICES.map(v => (
              <div key={v.value} onClick={() => save("openaiVoice", v.value)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer", border: `1px solid ${settings.openaiVoice === v.value ? "#e8c97a" : "#2a2820"}`, background: settings.openaiVoice === v.value ? "#e8c97a11" : "transparent", transition: "all 0.15s" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{v.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: settings.openaiVoice === v.value ? "#e8c97a" : t.text }}>{v.label}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{v.desc}</div>
                </div>
                {settings.openaiVoice === v.value && <span style={{ fontSize: 12, color: "#e8c97a", fontFamily: "monospace" }}>✓ ativa</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <button onClick={() => testVoice("pt-BR")} disabled={testing}
            style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #e8c97a44", background: "#e8c97a11", color: testing ? "#666" : "#e8c97a", cursor: testing ? "not-allowed" : "pointer", fontSize: 14, fontFamily: "inherit" }}>
            {testing ? "⏳ Tocando..." : "🇧🇷 Testar PT"}
          </button>
          <button onClick={() => testVoice("en-US")} disabled={testing}
            style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #38bdf844", background: "#38bdf811", color: testing ? "#666" : "#38bdf8", cursor: testing ? "not-allowed" : "pointer", fontSize: 14, fontFamily: "inherit" }}>
            {testing ? "⏳ Tocando..." : "🇺🇸 Testar EN"}
          </button>
        </div>

        <Slider label="Velocidade da voz" description="Controla a velocidade de todas as pronúncias"
          value={settings.speechRate} min={0.5} max={1.5} step={0.05}
          format={v => v <= 0.6 ? "Muito lenta" : v <= 0.8 ? "Lenta" : v <= 1.0 ? "Normal" : v <= 1.2 ? "Rápida" : "Muito rápida"}
          onChange={v => save("speechRate", v)} />

        <Slider label="Volume" value={settings.speechVolume} min={0.1} max={1.0} step={0.1}
          format={v => `${Math.round(v * 100)}%`} onChange={v => save("speechVolume", v)} color="#38bdf8" />

        <Toggle label="Falar automaticamente" description="Pronuncia palavras e frases automaticamente nas lições"
          value={settings.autoSpeak} onChange={v => save("autoSpeak", v)} />
      </Section>

      <Section title="Intérprete" icon="🤝">
        <Slider label="Pausa após a tradução" description="Tempo de espera depois que o app terminar de falar"
          value={settings.interpreterDelay} min={1} max={6} step={0.5}
          format={v => `${v}s`} onChange={v => save("interpreterDelay", v)} color="#4ade80" />
      </Section>

      <Section title="Lições" icon="📖">
        <Toggle label="Mostrar dicas de pronúncia" description="Exibe a pronúncia fonética das palavras"
          value={settings.showPronunciation} onChange={v => save("showPronunciation", v)} />
        <Toggle label="Mostrar tradução como dica" description="Mostra a tradução quando você errar um exercício"
          value={settings.showTranslationHint} onChange={v => save("showTranslationHint", v)} />
        <div style={{ marginTop: 16 }}>
          <Slider label="Meta diária" value={settings.dailyGoal} min={5} max={60} step={5}
            format={v => `${v} min`} onChange={v => save("dailyGoal", v)} color="#fb923c" />
        </div>
      </Section>

      <div style={{ paddingTop: 8, borderTop: "1px solid #2a2820" }}>
        <button onClick={() => { if (confirm("Resetar todas as configurações para o padrão?")) { onReset(); setSaved(true); setTimeout(() => setSaved(false), 1500); } }}
          style={{ background: "transparent", border: "1px solid #f8717144", borderRadius: 10, padding: "10px 20px", color: "#f87171", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          🔄 Restaurar padrões
        </button>
      </div>
    </div>
  );
}
