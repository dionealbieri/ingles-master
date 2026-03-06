import { useState, useCallback } from "react";

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

      // Melhor seleção de voz — prioriza vozes locais de alta qualidade
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langCode = lang.split("-")[0];
        const preferred = lang.startsWith("pt")
          ? ["Google português do Brasil", "Microsoft Francisca", "Luciana", "Google português"]
          : ["Google US English", "Microsoft Aria", "Microsoft Jenny", "Samantha", "Karen", "Google UK English Female"];

        let voice = null;
        for (const name of preferred) {
          voice = voices.find(v => v.name.includes(name));
          if (voice) break;
        }
        // Fallback: qualquer voz do idioma que não seja "compact" (pior qualidade)
        if (!voice) {
          voice = voices.find(v => v.lang === lang && v.localService && !v.name.toLowerCase().includes("compact")) ||
                  voices.find(v => v.lang === lang) ||
                  voices.find(v => v.lang.startsWith(langCode) && !v.name.toLowerCase().includes("compact")) ||
                  voices.find(v => v.lang.startsWith(langCode)) ||
                  voices[0];
        }
        if (voice) u.voice = voice;
      }

      // Timeout de segurança proporcional ao texto
      const timeout = setTimeout(() => {
        window.speechSynthesis.cancel();
        resolve();
      }, Math.max(6000, text.length * 100));

      u.onend = () => { clearTimeout(timeout); resolve(); };
      u.onerror = (e) => {
        clearTimeout(timeout);
        // iOS às vezes dispara "interrupted" — tenta 1x mais
        if (e.error === "interrupted") {
          setTimeout(() => {
            const u2 = new SpeechSynthesisUtterance(text);
            u2.lang = lang; u2.rate = rate; u2.volume = volume;
            const t2 = setTimeout(() => resolve(), Math.max(6000, text.length * 100));
            u2.onend = () => { clearTimeout(t2); resolve(); };
            u2.onerror = () => { clearTimeout(t2); resolve(); };
            window.speechSynthesis.speak(u2);
          }, 400);
        } else {
          resolve();
        }
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
