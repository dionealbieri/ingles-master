import { useState, useRef, useCallback } from "react";

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const recRef = useRef(null);

  const start = useCallback((onResult) => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => { setListening(true); setTranscript(""); };
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      onResult && onResult(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }, [supported]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { transcript, listening, supported, start, stop };
}
