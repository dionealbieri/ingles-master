import { useState, useCallback, useRef } from "react";

// Usa OpenAI TTS — voz humana de verdade
async function speakWithOpenAI(text, lang, apiKey) {
  // Escolhe voz conforme idioma
  // nova = feminina natural (ótima para EN e PT)
  // onyx = masculina grave (boa para EN)
  const voice = lang.startsWith("pt") ? "nova" : "nova";

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "tts-1",       // tts-1-hd = qualidade máxima (mais lento)
      input: text,
      voice: voice,
      speed: lang.startsWith("pt") ? 0.95 : 0.90,
    }),
  });

  if (!response.ok) throw new Error("TTS failed");

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// Fallback: voz do navegador (sem key)
function speakBrowser(text, lang, rate = 0.90) {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const langCode = lang.split("-")[0];
    const preferred = lang.startsWith("pt")
      ? ["Google português do Brasil", "Luciana", "Microsoft Francisca"]
      : ["Google US English", "Samantha", "Microsoft Aria", "Karen"];

    let voice = null;
    for (const name of preferred) {
      voice = voices.find(v => v.name.includes(name));
      if (voice) break;
    }
    if (!voice) voice = voices.find(v => v.lang.startsWith(langCode)) || voices[0];
    if (voice) utterance.voice = voice;

    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  });
}

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);

  const speak = useCallback(async (text, options = {}) => {
    if (!text) return;
    const lang = options.lang || "en-US";
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || "";

    // Para áudio anterior
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(true);

    try {
      if (apiKey) {
        // 🌟 OpenAI TTS — voz humana natural
        const url = await speakWithOpenAI(text, lang, apiKey);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setSpeaking(false);
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => setSpeaking(false);
        await audio.play();
      } else {
        // Fallback navegador
        await speakBrowser(text, lang, options.rate);
        setSpeaking(false);
      }
    } catch {
      // Se OpenAI falhar, tenta navegador
      try {
        await speakBrowser(text, lang, options.rate);
      } catch {}
      setSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported: true };
}
