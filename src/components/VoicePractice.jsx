import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "./Card.jsx";
import { useSpeech } from "../hooks/useSpeech.js";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition.js";
import { evaluatePronunciation } from "../lessonService.js";

const PHRASES = [
  { en: "Hello, how are you?",         pt: "Olá, como vai você?" },
  { en: "My name is...",                pt: "Meu nome é..." },
  { en: "Nice to meet you.",            pt: "Prazer em conhecê-lo." },
  { en: "I would like a coffee, please.", pt: "Eu gostaria de um café, por favor." },
  { en: "Where is the bathroom?",      pt: "Onde fica o banheiro?" },
  { en: "How much does it cost?",      pt: "Quanto custa?" },
  { en: "Can you help me, please?",    pt: "Você pode me ajudar, por favor?" },
  { en: "I don't understand.",         pt: "Eu não entendo." },
  { en: "Could you speak more slowly?", pt: "Você pode falar mais devagar?" },
  { en: "Thank you very much!",        pt: "Muito obrigado!" },
];

export function VoicePractice({ knownWords }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const { speak } = useSpeech();
  const { transcript, listening, supported, start, stop } = useSpeechRecognition();

  const phrase = PHRASES[phraseIdx];

  const handleRecord = () => {
    if (listening) {
      stop();
    } else {
      setResult(null);
      start(async (spoken) => {
        setEvaluating(true);
        try {
          const eval_ = await evaluatePronunciation(spoken, phrase.en);
          setResult({ spoken, evaluation: eval_ });
        } catch {
          setResult({ spoken, evaluation: "Não foi possível avaliar. Tente novamente." });
        }
        setEvaluating(false);
      });
    }
  };

  const next = () => {
    setPhraseIdx(i => (i + 1) % PHRASES.length);
    setResult(null);
  };

  if (!supported) {
    return (
      <Card style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎤</div>
        <p style={{ color: "#b5b09e" }}>Reconhecimento de voz não disponível neste navegador.</p>
        <p style={{ color: "#6b6755", fontSize: 13, marginTop: 8 }}>Use o Google Chrome para esta funcionalidade.</p>
      </Card>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, color: "#e8e4d9", fontWeight: 700, marginBottom: 8 }}>🎤 Pratique sua Pronúncia</h2>
      <p style={{ color: "#6b6755", fontSize: 13, fontFamily: "monospace", marginBottom: 24 }}>Ouça, repita e receba avaliação instantânea</p>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#4a4940", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Frase {phraseIdx + 1} de {PHRASES.length}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#e8e4d9", marginBottom: 8, lineHeight: 1.4 }}>{phrase.en}</div>
        <div style={{ fontSize: 15, color: "#6b6755", fontStyle: "italic", marginBottom: 20 }}>{phrase.pt}</div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => speak(phrase.en, { rate: 0.75 })}
            style={{ background: "#1a1815", border: "1px solid #3a3820", borderRadius: 10, padding: "10px 20px", color: "#e8c97a", cursor: "pointer", fontSize: 14, fontFamily: "Lora, Georgia, serif", display: "flex", alignItems: "center", gap: 8 }}>
            🔊 Ouvir modelo
          </button>
          <button onClick={() => speak(phrase.en, { rate: 0.5 })}
            style={{ background: "#1a1815", border: "1px solid #3a3820", borderRadius: 10, padding: "10px 20px", color: "#b5b09e", cursor: "pointer", fontSize: 14, fontFamily: "Lora, Georgia, serif", display: "flex", alignItems: "center", gap: 8 }}>
            🐢 Devagar
          </button>
        </div>
      </Card>

      <Card style={{ textAlign: "center", padding: 36, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#6b6755", fontFamily: "monospace", marginBottom: 20 }}>Agora é sua vez — clique e fale:</div>
        <button onClick={handleRecord}
          style={{ width: 80, height: 80, borderRadius: "50%", border: `3px solid ${listening ? "#f87171" : "#e8c97a"}`, background: listening ? "#f8717122" : "#e8c97a22", cursor: "pointer", fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", transition: "all 0.2s", animation: listening ? "pulse 1s infinite" : "none" }}>
          {listening ? "⏹" : "🎤"}
        </button>
        <div style={{ fontSize: 13, color: listening ? "#f87171" : "#6b6755", fontFamily: "monospace" }}>
          {listening ? "● Gravando... clique para parar" : "Clique para gravar"}
        </div>
        {transcript && <div style={{ marginTop: 12, color: "#b5b09e", fontSize: 15, fontStyle: "italic" }}>Você disse: "{transcript}"</div>}
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }`}</style>
      </Card>

      {evaluating && (
        <Card style={{ textAlign: "center", padding: 24 }}>
          <div style={{ color: "#6b6755", fontFamily: "monospace" }}>Avaliando sua pronúncia...</div>
        </Card>
      )}

      {result && !evaluating && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: "#e8c97a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>📝 Avaliação</div>
            <p style={{ color: "#b5b09e", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result.evaluation}</p>
          </Card>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleRecord} style={{ flex: 1, background: "#1a1815", border: "1px solid #3a3820", borderRadius: 10, padding: "12px", color: "#e8e4d9", cursor: "pointer", fontFamily: "Lora, Georgia, serif" }}>🔄 Tentar novamente</button>
            <button onClick={next} style={{ flex: 1, background: "#e8c97a", border: "none", borderRadius: 10, padding: "12px", color: "#0f0e0c", fontWeight: 700, cursor: "pointer", fontFamily: "Lora, Georgia, serif" }}>Próxima frase →</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
