import { useState, useCallback, useRef } from "react";

function getSettings() {
  try {
    const s = localStorage.getItem("app_settings");
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

function speakBrowser(text, lang, rate, volume) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      u.pitch = 1.0;
      u.volume = volume;
      const voices = window.speechSynthesis.getVoices();
      const langCode = lang.split("-")[0];
      const v = voices.find(v => v.lang === lang && v.localService) ||
                voices.find(v => v.lang === lang) ||
                voices.find(v => v.lang.startsWith(langCode)) ||
                voices[0];
      if (v) u.voice = v;
      const timeout = setTimeout(() => { window.speechSynthesis.cancel(); resolve(); }, Math.max(5000, text.length * 100));
      u.onend = () => { clearTimeout(timeout); resolve(); };
      u.onerror = (e) => {
        clearTimeout(timeout);
        if (e.error === "interrupted") { setTimeout(() => resolve(), 300); }
        else resolve();
      };
      window.speechSynthesis.speak(u);
    }, 200);
  });
}

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(async (text, options = {}) => {
    if (!text) return;
    const s = getSettings();
    const rate = options.rate ?? s.speechRate ?? 0.70;
    const volume = options.volume ?? s.speechVolume ?? 1.0;
    const lang = options.lang || "en-US";

    window.speechSynthesis?.cancel();
    setSpeaking(true);
    await speakBrowser(text, lang, rate, volume);
    setSpeaking(false);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported: "speechSynthesis" in window };
}
