export const LEVELS = [
  { id: "beginner",     label: "Iniciante",     emoji: "🌱", color: "#4ade80", desc: "Do zero — saudações, números, cores" },
  { id: "elementary",   label: "Elementar",     emoji: "🌿", color: "#34d399", desc: "Rotina, família, verbos simples" },
  { id: "intermediate", label: "Intermediário", emoji: "🌳", color: "#38bdf8", desc: "Passado/futuro, viagens, trabalho" },
  { id: "advanced",     label: "Avançado",      emoji: "🚀", color: "#a78bfa", desc: "Expressões idiomáticas, debates, fluência" },
];

export const SCENARIOS = [
  { id: "cafe",     emoji: "☕", title: "No Café",      hint: "Peça um café e um pão de queijo" },
  { id: "hotel",    emoji: "🏨", title: "No Hotel",     hint: "Faça check-in e pergunte o WiFi" },
  { id: "airport",  emoji: "✈️", title: "No Aeroporto", hint: "Encontre seu portão de embarque" },
  { id: "doctor",   emoji: "🏥", title: "No Médico",    hint: "Descreva seus sintomas" },
  { id: "shopping", emoji: "🛍️", title: "Shopping",     hint: "Compre uma roupa e pergunte o preço" },
  { id: "friend",   emoji: "👋", title: "Novo Amigo",   hint: "Se apresente e conheça alguém" },
];

export const TABS = [
  { id: "lesson",       icon: "📖", label: "Lição" },
  { id: "grammar",      icon: "📝", label: "Gramática" },
  { id: "review",       icon: "🃏", label: "Flashcards" },
  { id: "voice",        icon: "🎤", label: "Pronúncia" },
  { id: "interpreter",  icon: "🤝", label: "Intérprete" },
  { id: "chat",         icon: "💬", label: "Tutor IA" },
  { id: "conversation", icon: "🎭", label: "Conversação" },
  { id: "dictionary",   icon: "🌐", label: "Dicionário" },
  { id: "plan",         icon: "📅", label: "Plano" },
  { id: "progress",     icon: "📊", label: "Progresso" },
];

export const LEVEL_CONTEXT = {
  beginner:     "saudações básicas, números 1-10, cores, dias da semana. Frases de 2-3 palavras.",
  elementary:   "verbos de ação, comida, família, rotina diária. Frases simples no presente.",
  intermediate: "passado simples, futuro, trabalho, viagens. Diálogos estruturados.",
  advanced:     "expressões idiomáticas, condicionais, phrasal verbs, opiniões complexas.",
};
