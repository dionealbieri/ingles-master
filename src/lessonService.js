import { askClaude } from "./api.js";
import { LEVEL_CONTEXT } from "./constants.js";

export async function generateLesson(level, knownWords = []) {
  const prev = knownWords.length > 0
    ? `Palavras já aprendidas (tente revisar algumas): ${knownWords.slice(-15).join(", ")}.`
    : "";

  const prompt = `Crie uma micro-lição de inglês para nível ${level}. ${prev}
Tema: ${LEVEL_CONTEXT[level]}

Responda APENAS com JSON válido:
{
  "title": "título da lição",
  "topic": "tópico",
  "explanation": "explicação em português, 2-3 frases acolhedoras",
  "vocabulary": [
    {"word": "hello", "translation": "olá", "pronunciation": "rê-LÔU", "example": "Hello, my name is Ana."}
  ],
  "dialogue": [
    {"speaker": "A", "en": "Hello!", "pt": "Olá!"},
    {"speaker": "B", "en": "Hi! How are you?", "pt": "Oi! Como vai?"}
  ],
  "exercises": [
    {
      "type": "multiple_choice",
      "question": "Como se diz 'Bom dia'?",
      "options": ["Good morning", "Good night", "Good afternoon", "Goodbye"],
      "answer": "Good morning",
      "explanation": "Good morning = Bom dia, usado até o meio-dia."
    },
    {
      "type": "fill_blank",
      "question": "Complete: '___ are you?' (Como vai você?)",
      "answer": "How",
      "hint": "Começa com H"
    },
    {
      "type": "reorder",
      "question": "Reordene as palavras para formar a frase 'Meu nome é Ana':",
      "words": ["name", "is", "My", "Ana"],
      "answer": "My name is Ana"
    },
    {
      "type": "translate",
      "question": "Traduza para o inglês: 'Bom dia, tudo bem?'",
      "answer": "Good morning, how are you?",
      "hint": "Use 'Good morning' e 'how are you'"
    }
  ],
  "listenPhrase": "Hello, my name is Ana. Good morning!",
  "tip": "dica rápida de pronúncia ou cultura"
}
Inclua exatamente 5 palavras no vocabulário e pelo menos 4 linhas no diálogo.`;

  const raw = await askClaude(
    "Você é um gerador de lições de inglês. Retorne APENAS JSON válido, sem texto extra.",
    prompt
  );
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function generatePlacementTest() {
  const prompt = `Crie um teste de nivelamento de inglês com 12 perguntas de múltipla escolha, 3 de cada nível: iniciante, elementar, intermediário, avançado.

Retorne APENAS JSON válido:
{
  "questions": [
    {
      "level": "beginner",
      "question": "Como se diz 'olá' em inglês?",
      "options": ["Hello", "Goodbye", "Please", "Thanks"],
      "answer": "Hello"
    }
  ]
}`;
  const raw = await askClaude("Gere teste de nivelamento de inglês. APENAS JSON.", prompt);
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function getTutorResponse(message, level, knownWords, history) {
  const lvlLabel = { beginner: "Iniciante", elementary: "Elementar", intermediate: "Intermediário", advanced: "Avançado" }[level] || "Iniciante";
  const system = `Você é um tutor de inglês gentil e paciente para brasileiros. Nível do aluno: ${lvlLabel}.
Palavras que já aprendeu: ${knownWords.slice(-30).join(", ") || "nenhuma ainda"}.
- Responda em português, mas sempre inclua o equivalente em inglês entre aspas ou parênteses.
- Se o aluno escrever em inglês, corrija erros de forma encorajadora.
- Se perguntarem pronúncia, escreva como se lê em português entre colchetes. Ex: [rê-LÔU].
- Mantenha respostas curtas e claras.
- Sempre termine com uma pergunta ou incentivo.`;
  return askClaude(system, message, history);
}

export async function getScenarioResponse(message, scenario, level, history) {
  const lvlLabel = { beginner: "Iniciante", elementary: "Elementar", intermediate: "Intermediário", advanced: "Avançado" }[level] || "Iniciante";
  const system = `Você é um personagem no cenário: "${scenario.title}". Contexto: ${scenario.hint}. Nível do aluno: ${lvlLabel}.
- Fale EM INGLÊS como o personagem.
- Coloque a tradução em português entre parênteses após cada fala.
- Corrija erros gentilmente ao final.
- Mantenha frases curtas.
- Ao receber "START_CONVERSATION", inicie com uma saudação natural.`;
  return askClaude(system, message, history);
}

export async function evaluatePronunciation(spoken, expected) {
  const system = "Você é um avaliador de pronúncia de inglês. Seja encorajador e específico. Responda em português.";
  const prompt = `O aluno tentou falar: "${expected}"
O que foi reconhecido: "${spoken}"

Avalie em 3 linhas:
1. Nota de 0-10
2. O que foi bom
3. O que melhorar (se houver)`;
  return askClaude(system, prompt);
}

export async function generateQuiz(words) {
  const prompt = `Quiz rápido com estas palavras: ${words.slice(-8).join(", ")}.
APENAS JSON: {"question": "...", "options": ["a","b","c","d"], "answer": "...", "explanation": "..."}`;
  const raw = await askClaude("Gere quiz de inglês. APENAS JSON.", prompt);
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}
