import { useState, useCallback } from "react";

function getSettings() {
  try { return JSON.parse(localStorage.getItem("app_settings") || "{}"); }
  catch { return {}; }
}

function playAudio(url) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.volume = 1.0;
    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      try { URL.revokeObjectURL(url); } catch {}
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.ontimeupdate = () => {
      if (audio.duration && audio.currentTime >= audio.duration - 0.1) done();
    };
    audio.onloadedmetadata = () => {
      setTimeout(done, (audio.duration || 10) * 1000 + 1500);
    };
    setTimeout(done, 30000);
    audio.play().catch(() => done());
  });
}

async function speakOpenAI(text, lang, rate, voice) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || "";
  if (!apiKey) throw new Error("no key");
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "tts-1", input: text, voice: voice || "nova", speed: Math.max(0.25, Math.min(4.0, rate)) }),
  });
  if (!res.ok) throw new Error("TTS API error");
  const blob = await res.blob();
  await playAudio(URL.createObjectURL(blob));
}

function speakBrowser(text, lang, rate, volume) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = rate; u.pitch = 1.0; u.volume = volume;
      const voices = window.speechSynthesis.getVoices();
      const langCode = lang.split("-")[0];
      const preferred = lang.startsWith("pt")
        ? ["Google português do Brasil", "Microsoft Francisca", "Luciana"]
        : ["Google US English", "Microsoft Aria", "Samantha", "Karen"];
      let voice = null;
      for (const name of preferred) { voice = voices.find(v => v.name.includes(name)); if (voice) break; }
      if (!voice) voice = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(langCode)) || voices[0];
      if (voice) u.voice = voice;
      const timeout = setTimeout(() => { window.speechSynthesis.cancel(); resolve(); }, Math.max(6000, text.length * 100));
      u.onend = () => { clearTimeout(timeout); resolve(); };
      u.onerror = (e) => { clearTimeout(timeout); if (e.error === "interrupted") setTimeout(() => resolve(), 300); else resolve(); };
      window.speechSynthesis.speak(u);
    }, 200);
  });
}

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(async (text, options = {}) => {
    if (!text) return;
    const s = getSettings();
    const rate = options.rate ?? s.speechRate ?? 0.90;
    const volume = options.volume ?? s.speechVolume ?? 1.0;
    const voice = s.openaiVoice || "nova";
    const lang = options.lang || "en-US";
    window.speechSynthesis?.cancel();
    setSpeaking(true);
    try {
      await speakOpenAI(text, lang, rate, voice);
    } catch {
      await speakBrowser(text, lang, rate, volume);
    }
    setSpeaking(false);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported: true };
}
