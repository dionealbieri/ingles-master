import { useState, useCallback, useEffect, useRef } from "react";

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = options.lang || "en-US";
      const isPortuguese = targetLang.startsWith("pt");

      utterance.lang = targetLang;
      // Natural rate — not too slow, not too fast
      utterance.rate = options.rate || (isPortuguese ? 0.95 : 0.90);
      utterance.pitch = 1.0;   // Natural pitch, no distortion
      utterance.volume = 1.0;

      const applyBestVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const langCode = targetLang.split("-")[0]; // "en" or "pt"

        // Priority: natural/premium online voices first, then local
        const preferred = isPortuguese
          ? ["Google português do Brasil", "Microsoft Francisca", "Luciana", "Google português"]
          : ["Google US English", "Microsoft Aria", "Microsoft Jenny", "Samantha", "Karen", "Google UK English Female"];

        // Try preferred voices by name
        let voice = null;
        for (const name of preferred) {
          voice = voices.find(v => v.name.includes(name));
          if (voice) break;
        }

        // Fallback: any voice matching the language
        if (!voice) {
          voice = voices.find(v => v.lang === targetLang && !v.name.toLowerCase().includes("compact")) ||
                  voices.find(v => v.lang.startsWith(langCode) && !v.name.toLowerCase().includes("compact")) ||
                  voices.find(v => v.lang.startsWith(langCode)) ||
                  voices[0];
        }

        if (voice) {
          utterance.voice = voice;
          // Adjust rate per voice type
          if (voice.name.includes("Google")) utterance.rate = isPortuguese ? 0.90 : 0.85;
        }
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        applyBestVoice();
      } else {
        window.speechSynthesis.onvoiceschanged = applyBestVoice;
      }

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }, 120);
  }, []);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  return { speak, stop, speaking, supported };
}
