import { useState, useCallback, useEffect, useRef } from "react";

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
    // Pre-load voices
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();

    // Small delay so cancel() takes effect on mobile
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      const targetLang = options.lang || "en-US";
      utterance.lang = targetLang;
      utterance.rate = options.rate || 0.85;
      utterance.pitch = options.pitch || 1;
      utterance.volume = 1;

      const applyVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        // Find best matching voice for requested language
        const voice =
          voices.find(v => v.lang === targetLang && v.localService) ||
          voices.find(v => v.lang === targetLang) ||
          voices.find(v => v.lang.startsWith(targetLang.split("-")[0]) && v.localService) ||
          voices.find(v => v.lang.startsWith(targetLang.split("-")[0])) ||
          voices[0];
        if (voice) utterance.voice = voice;
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        applyVoice();
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          applyVoice();
          utterance.onstart = () => setSpeaking(true);
          utterance.onend = () => setSpeaking(false);
          utterance.onerror = () => setSpeaking(false);
          window.speechSynthesis.speak(utterance);
        };
      }
    }, 100);
  }, []);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  return { speak, stop, speaking, supported };
}
