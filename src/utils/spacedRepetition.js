// Algoritmo SM-2 simplificado
export function createCard(word, translation) {
  return {
    word, translation,
    easeFactor: 2.5,
    interval: 1,       // dias até próxima revisão
    repetitions: 0,
    nextReview: Date.now(), // disponível imediatamente
    totalCorrect: 0,
    totalIncorrect: 0,
    addedAt: Date.now(),
  };
}

// grade: 0=errou, 1=difícil, 2=bom, 3=fácil
export function reviewCard(card, grade) {
  let { easeFactor, interval, repetitions } = card;

  if (grade === 0) {
    repetitions = 0;
    interval = 1;
  } else if (grade === 1) {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
    if (grade === 3) easeFactor = Math.min(3.0, easeFactor + 0.1);
  }

  const nextReview = Date.now() + interval * 86400000;
  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    totalCorrect: card.totalCorrect + (grade >= 2 ? 1 : 0),
    totalIncorrect: card.totalIncorrect + (grade < 2 ? 1 : 0),
  };
}

export function getDueCards(cards) {
  const now = Date.now();
  return Object.values(cards).filter(c => c.nextReview <= now);
}

export function getCardStats(cards) {
  const all = Object.values(cards);
  const due = getDueCards(cards);
  const mastered = all.filter(c => c.interval >= 21);
  const learning = all.filter(c => c.interval < 21 && c.repetitions > 0);
  return { total: all.length, due: due.length, mastered: mastered.length, learning: learning.length };
}
