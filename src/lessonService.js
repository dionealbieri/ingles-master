import { askClaude } from "./api.js";
import { LEVEL_CONTEXT } from "./constants.js";

// Temas rotativos — garante variedade todos os dias
const TOPICS = {
  beginner: [
    "Cumprimentos e apresentações", "Números e cores", "Família e pessoas",
    "Comida e bebida", "Dias da semana e meses", "Lugares na cidade",
    "Animais e natureza", "Partes do corpo", "Roupas e acessórios", "Casa e móveis",
    "Clima e tempo", "Hobbies e atividades", "Meios de transporte", "Compras básicas",
  ],
  elementary: [
    "Rotina diária", "Trabalho e profissões", "Viagens e turismo", "Restaurante e pedidos",
    "Saúde e consulta médica", "Esportes e exercícios", "Tecnologia e internet",
    "Filmes e entretenimento", "Música e cultura", "Escola e estudo",
    "Amizades e relacionamentos", "Dinheiro e finanças básicas", "Férias e lazer", "Supermercado",
  ],
  intermediate: [
    "Negócios e reuniões", "Notícias e eventos atuais", "Meio ambiente", "Política e sociedade",
    "Saúde mental e bem-estar", "Ciência e tecnologia", "Arte e literatura", "Viagem de negócios",
    "Expressões idiomáticas", "Phrasal verbs comuns", "Entrevista de emprego", "Debates e opiniões",
    "Cultura americana vs brasileira", "Redes sociais e comunicação",
  ],
  advanced: [
    "Expressões gírias americanas", "Apresentações profissionais", "Negociação e persuasão",
    "Literatura e análise crítica", "Filosofia e ética", "Economia global",
    "Humor e ironia em inglês", "Sotaques e dialetos", "Escrita formal e informal",
    "TED Talks e apresentações", "Podcasts e mídia", "Debate acadêmico",
    "Inovação e empreendedorismo", "Liderança e gestão",
  ],
};

// Pega o tópico do dia baseado na data — muda todo dia automaticamente
function getTopicOfDay(level) {
  const topics = TOPICS[level] || TOPICS.beginner;
  const today = new Date();
  const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  return topics[dayIndex % topics.length];
}

// Verifica se a lição foi gerada hoje
function getLessonCacheKey(level) {
  const today = new Date().toDateString();
  return `lesson_${level}_${today}`;
}

export async function generateLesson(level, knownWords = []) {
  // Verifica cache do dia
  const cacheKey = getLessonCacheKey(level);
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }

  const topic = getTopicOfDay(level);
  const prev = knownWords.length > 0
    ? `Palavras já aprendidas (não repita estas): ${knownWords.slice(-20).join(", ")}.`
    : "";

  const prompt = `Crie uma micro-lição de inglês para nível ${level}.
Tema OBRIGATÓRIO de hoje: "${topic}". ${prev}

Responda APENAS com JSON válido:
{
  "title": "título da lição relacionado com ${topic}",
  "topic": "${topic}",
  "explanation": "explicação em português, 2-3 frases acolhedoras sobre ${topic}",
  "vocabulary": [
    {"word": "palavra", "translation": "tradução", "pronunciation": "como-se-lê", "example": "frase de exemplo"}
  ],
  "dialogue": [
    {"speaker": "A", "en": "frase em inglês", "pt": "tradução"},
    {"speaker": "B", "en": "resposta", "pt": "tradução"}
  ],
  "exercises": [
    {
      "type": "multiple_choice",
      "question": "pergunta",
      "options": ["a","b","c","d"],
      "answer": "resposta correta",
      "explanation": "explicação"
    },
    {
      "type": "fill_blank",
      "question": "Complete: '___ ...'",
      "answer": "resposta",
      "hint": "dica"
    },
    {
      "type": "reorder",
      "question": "Reordene para formar a frase:",
      "words": ["palavra1","palavra2","palavra3","palavra4"],
      "answer": "frase correta"
    },
    {
      "type": "translate",
      "question": "Traduza para o inglês: 'frase em português'",
      "answer": "tradução correta",
      "hint": "dica"
    }
  ],
  "listenPhrase": "frase curta relacionada com ${topic} para o aluno ouvir",
  "tip": "dica rápida de pronúncia ou cultura sobre ${topic}"
}
Inclua exatamente 5 palavras no vocabulário e pelo menos 4 linhas no diálogo.
IMPORTANTE: Todas as palavras e frases devem ser sobre o tema "${topic}".`;

  const raw = await askClaude(
    "Você é um gerador de lições de inglês. Retorne APENAS JSON válido, sem texto extra.",
    prompt
  );
  const clean = raw.replace(/```json|```/g, "").trim();
  const lesson = JSON.parse(clean);

  // Salva no cache do dia
  try { localStorage.setItem(cacheKey, JSON.stringify(lesson)); } catch {}

  return lesson;
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
