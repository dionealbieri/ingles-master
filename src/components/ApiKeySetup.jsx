import { useState } from "react";
import { motion } from "motion/react";

export function ApiKeySetup({ onSave }) {
  const [key, setKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  const test = async () => {
    if (!key.startsWith("sk-")) {
      setError("A chave deve começar com sk-");
      return;
    }
    setTesting(true);
    setError("");
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 5, messages: [{ role: "user", content: "hi" }] }),
      });
      if (res.ok) {
        localStorage.setItem("im_openai_key", key);
        onSave(key);
      } else {
        const d = await res.json();
        setError(d?.error?.message || "Chave inválida. Verifique e tente novamente.");
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    }
    setTesting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0e0c", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Lora, Georgia, serif" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🇺🇸</div>
          <h1 style={{ fontSize: 28, color: "#e8c97a", fontWeight: 700, margin: "0 0 8px" }}>Inglês Master</h1>
          <p style={{ color: "#b5b09e", fontSize: 15 }}>Configure sua chave de API para começar</p>
        </div>

        <div style={{ background: "#131210", border: "1px solid #2a2820", borderRadius: 14, padding: 28 }}>
          <div style={{ fontSize: 13, color: "#e8c97a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>🔑 Chave OpenAI</div>

          <div style={{ background: "#1a1815", border: "1px solid #2a2820", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <p style={{ color: "#b5b09e", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: "#e8e4d9" }}>Como obter sua chave:</strong><br />
              1. Acesse <a href="https://platform.openai.com/api-keys" target="_blank" style={{ color: "#e8c97a" }}>platform.openai.com/api-keys</a><br />
              2. Crie uma conta e adicione R$25 de crédito<br />
              3. Clique em <strong style={{ color: "#e8e4d9" }}>"Create new secret key"</strong><br />
              4. Cole a chave abaixo
            </p>
          </div>

          <input
            value={key}
            onChange={e => { setKey(e.target.value); setError(""); }}
            placeholder="sk-proj-..."
            type="password"
            style={{ width: "100%", background: "#1a1815", border: `1px solid ${error ? "#f87171" : "#3a3820"}`, borderRadius: 10, padding: "12px 16px", color: "#e8e4d9", fontSize: 15, outline: "none", fontFamily: "monospace", marginBottom: 12 }}
          />

          {error && (
            <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "#2d0f0f", borderRadius: 8 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={test}
            disabled={testing || !key.trim()}
            style={{ width: "100%", background: key.trim() ? "#e8c97a" : "#2a2820", border: "none", borderRadius: 10, padding: "14px", color: key.trim() ? "#0f0e0c" : "#6b6755", fontSize: 15, fontWeight: 700, cursor: key.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {testing ? "Testando..." : "Salvar e Entrar →"}
          </button>

          <p style={{ color: "#4a4940", fontSize: 12, textAlign: "center", marginTop: 12, fontFamily: "monospace" }}>
            🔒 A chave fica salva só no seu celular/computador
          </p>
        </div>
      </motion.div>
    </div>
  );
}
