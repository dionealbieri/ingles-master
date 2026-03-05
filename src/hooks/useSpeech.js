import { useState, useCallback, useRef } from "react";

async function speakOpenAI(text, lang, apiKey) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: "nova",
      speed: lang.startsWith("pt") ? 0.95 : 0.90,
    }),
  });
  if (!response.ok) throw new Error("TTS failed");
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

function speakBrowser(text, lang) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.90;
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
  // Expõe se está falando para o intérprete pausar o microfone
  const speakingRef = useRef(false);

  const speak = useCallback(async (text, options = {}) => {
    if (!text) return;
    const lang = options.lang || "en-US";
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || "";

    // Para tudo que estava tocando
    if (audioRef.current) {
      audioRef.current.pause();
      try { URL.revokeObjectURL(audioRef.current.src); } catch {}
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    setSpeaking(true);
    speakingRef.current = true;

    const done = () => {
      setSpeaking(false);
      speakingRef.current = false;
    };

    try {
      if (apiKey) {
        const url = await speakOpenAI(text, lang, apiKey);
        const audio = new Audio(url);
        audioRef.current = audio;
        // Garante volume máximo
        audio.volume = 1.0;
        audio.onended = () => { done(); try { URL.revokeObjectURL(url); } catch {} };
        audio.onerror = (e) => {
          console.error("Audio error:", e);
          // Fallback para voz do navegador
          speakBrowser(text, lang).then(done);
        };
        // Toca — alguns browsers exigem interação prévia do usuário
        const playPromise = audio.play();
        if (playPromise) {
          playPromise.catch(() => {
            // Se bloqueado pelo browser, usa voz do sistema
            speakBrowser(text, lang).then(done);
          });
        }
      } else {
        await speakBrowser(text, lang);
        done();
      }
    } catch {
      try { await speakBrowser(text, lang); } catch {}
      done();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      try { URL.revokeObjectURL(audioRef.current.src); } catch {}
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    speakingRef.current = false;
  }, []);

  return { speak, stop, speaking, speakingRef, supported: true };
}
