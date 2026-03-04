// Chave de API — vem do Vercel (variável de ambiente) ou do .env.local
function getApiKey() {
  return import.meta.env.VITE_OPENAI_API_KEY || "";
}

export function hasApiKey() {
  return !!getApiKey();
}

export async function askClaude(systemPrompt, userMessage, history = []) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 1000, messages }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
