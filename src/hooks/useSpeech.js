import { useState, useCallback, useEffect, useRef } from "react";

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!("speechSynthesis" in window)) return;

    // Cancela qualquer fala em andamento
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configurações de voz
    utterance.lang = options.lang || "en-US";
    utterance.rate = options.rate || 0.85;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Tenta encontrar uma voz em inglês
    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const enVoice =
        voices.find((v) => v.lang === "en-US" && v.localService) ||
        voices.find((v) => v.lang.startsWith("en-US")) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
      if (enVoice) utterance.voice = enVoice;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  return { speak, stop, speaking, supported };
}
