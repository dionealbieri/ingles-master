import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LevelPicker } from "./components/LevelPicker.jsx";
import { PlacementTest } from "./components/PlacementTest.jsx";
import { LessonView, LessonSuccess } from "./components/LessonView.jsx";
import { TutorChat } from "./components/TutorChat.jsx";
import { ConversationMode } from "./components/ConversationMode.jsx";
import { Flashcards } from "./components/Flashcards.jsx";
import { VoicePractice } from "./components/VoicePractice.jsx";
import { ProgressReport } from "./components/ProgressReport.jsx";
import { Grammar } from "./components/Grammar.jsx";
import { StudyPlan } from "./components/StudyPlan.jsx";
import { Dictionary } from "./components/Dictionary.jsx";
import { Interpreter } from "./components/Interpreter.jsx";
import { hasApiKey } from "./api.js";
import { LoadingLesson, ErrorCard } from "./components/Card.jsx";
import { LEVELS, TABS } from "./constants.js";
import { generateLesson } from "./lessonService.js";
import { storage } from "./utils/storage.js";
import { createCard } from "./utils/spacedRepetition.js";
import { useTheme } from "./hooks/useTheme.js";

async function requestNotifications() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") await Notification.requestPermission();
}

function scheduleReminder() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const today = new Date().toDateString();
  if (storage.get("lastReminder", null) === today) return;
  const now = new Date();
  const target = new Date();
  target.setHours(20, 0, 0, 0);
  if (now < target) {
    setTimeout(() => {
      new Notification("🇺🇸 Inglês Master", {
        body: "Hora de praticar inglês! Só 10 minutinhos fazem diferença. 💪",
        icon: "/icon-192.png",
      });
      storage.set("lastReminder", today);
    }, target - now);
  }
}

export default function App() {
  const { theme: t, isDark, toggle: toggleTheme } = useTheme();
  const [tab, setTab] = useState("lesson");
  const [level, setLevel] = useState(() => storage.get("level", null));
  const [knownWords, setKnownWords] = useState(() => storage.get("knownWords", []));
  const [streak, setStreak] = useState(() => storage.getStreak().count);
  const [xp, setXp] = useState(() => storage.get("xp", 0));
  const [completedLessons, setCompletedLessons] = useState(() => storage.get("completed", 0));
  const [history, setHistory] = useState(() => storage.get("history", []));
  const [cards, setCards] = useState(() => storage.get("cards", {}));
  const [lesson, setLesson] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonError, setLessonError] = useState(false);
  const [lessonDone, setLessonDone] = useState(false);
  const [lessonScore, setLessonScore] = useState({ score: 0, total: 0 });
  const [showLevelPicker, setShowLevelPicker] = useState(!storage.get("level", null));
  const [showPlacement, setShowPlacement] = useState(!storage.get("placementDone", false));
  const [notifRequested, setNotifRequested] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { scheduleReminder(); }, []);

  // Auto-load lesson when app opens with a saved level
  useEffect(() => {
    if (level && !lesson && !loadingLesson && !showLevelPicker && !showPlacement) {
      loadLesson(level, knownWords);
    }
  }, [level, showLevelPicker, showPlacement]);

  const loadLesson = useCallback(async (lvl, words) => {
    setLoadingLesson(true);
    setLessonError(false);
    setLesson(null);
    setLessonDone(false);
    try {
      const l = await generateLesson(lvl, words ?? knownWords);
      setLesson(l);
    } catch { setLessonError(true); }
    setLoadingLesson(false);
  }, [knownWords]);

  const handlePickLevel = (lvl) => {
    setLevel(lvl);
    storage.set("level", lvl);
    setShowLevelPicker(false);
    loadLesson(lvl, knownWords);
  };

  const handlePlacementComplete = (lvl) => {
    storage.set("placementDone", true);
    setShowPlacement(false);
    handlePickLevel(lvl);
  };

  const handleLessonComplete = (words, score, total) => {
    setLessonDone(true);
    setLessonScore({ score, total });
    const updated = [...new Set([...knownWords, ...words])];
    setKnownWords(updated);
    storage.set("knownWords", updated);
    const newCards = { ...cards };
    words.forEach(w => {
      if (!newCards[w]) {
        const vocab = lesson?.vocabulary?.find(v => v.word === w);
        newCards[w] = createCard(w, vocab?.translation || w);
      }
    });
    setCards(newCards);
    storage.set("cards", newCards);
    const newXp = xp + 50 + (score >= total * 0.8 ? 20 : 0);
    setXp(newXp);
    storage.set("xp", newXp);
    const newStreak = storage.updateStreak();
    setStreak(newStreak.count);
    const newCompleted = completedLessons + 1;
    setCompletedLessons(newCompleted);
    storage.set("completed", newCompleted);
    const newHistory = [...history, { date: new Date().toLocaleDateString("pt-BR"), title: lesson?.title || "Lição", words: words.length, score, total }];
    setHistory(newHistory);
    storage.set("history", newHistory);
  };

  const currentLevel = LEVELS.find(l => l.id === level);

  const handleTabChange = (id) => {
    setTab(id);
    setMobileMenuOpen(false);
  };

  if (showPlacement) return <PlacementTest onComplete={handlePlacementComplete} onSkip={() => { storage.set("placementDone", true); setShowPlacement(false); }} />;
  if (showLevelPicker || !level) return <LevelPicker onPick={handlePickLevel} />;

  const TABS_GROUPED = [
    {
      group: "Aprender",
      items: [
        { id: "lesson",       icon: "📖", label: "Lição do Dia" },
        { id: "grammar",      icon: "📝", label: "Gramática" },
        { id: "plan",         icon: "📅", label: "Plano de Estudos" },
      ]
    },
    {
      group: "Praticar",
      items: [
        { id: "review",       icon: "🃏", label: "Flashcards" },
        { id: "voice",        icon: "🎤", label: "Pronúncia" },
        { id: "interpreter",  icon: "🤝", label: "Intérprete" },
        { id: "chat",         icon: "💬", label: "Tutor IA" },
        { id: "conversation", icon: "🎭", label: "Conversação" },
      ]
    },
    {
      group: "Ferramentas",
      items: [
        { id: "dictionary",   icon: "🌐", label: "Dicionário" },
        { id: "progress",     icon: "📊", label: "Meu Progresso" },
      ]
    },
  ];

  const allTabs = TABS_GROUPED.flatMap(g => g.items);
  const currentTabLabel = allTabs.find(t => t.id === tab)?.label || "";

  return (
    <div style={{ fontFamily: "Lora, Georgia, serif", minHeight: "100vh", background: t.bg, color: t.text, transition: "all 0.3s" }}>

      {/* Notification banner */}
      {!notifRequested && "Notification" in window && Notification.permission === "default" && (
        <div style={{ background: t.accentBg, borderBottom: `1px solid ${t.accent}44`, padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 13, color: t.textMuted }}>🔔 Ative lembretes diários para não perder sua sequência!</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setNotifRequested(true)} style={{ background: "transparent", border: "none", color: t.textFaint, fontSize: 12, cursor: "pointer" }}>Não agora</button>
            <button onClick={async () => { await requestNotifications(); setNotifRequested(true); scheduleReminder(); }}
              style={{ background: t.accent, border: "none", borderRadius: 6, padding: "4px 12px", color: "#0f0e0c", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Ativar</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${t.border}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: t.surface, position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: t.accent }}>🇺🇸 Inglês Master</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 8, padding: "3px 10px", fontSize: 12, color: "#fb923c", display: "flex", alignItems: "center", gap: 4 }}>
            🔥 <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{streak} dias</span>
          </div>
          <div style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 8, padding: "3px 10px", fontSize: 12, color: t.accent, display: "flex", alignItems: "center", gap: 4 }}>
            ⚡ <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{xp} XP</span>
          </div>
          <button onClick={toggleTheme} title={isDark ? "Modo claro" : "Modo escuro"}
            style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isDark ? "☀️" : "🌙"}
          </button>
          <button onClick={() => setShowLevelPicker(true)}
            style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 8, padding: "3px 10px", color: t.textFaint, fontSize: 12, cursor: "pointer" }}>
            {currentLevel?.emoji} {currentLevel?.label}
          </button>
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 57px)" }}>

        {/* Sidebar — desktop */}
        <nav style={{ width: 200, borderRight: `1px solid ${t.border}`, background: t.surface, flexShrink: 0, position: "sticky", top: 57, height: "calc(100vh - 57px)", overflowY: "auto", padding: "16px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {TABS_GROUPED.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: t.textVeryFaint, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5, padding: "4px 10px 6px" }}>{group.group}</div>
              {group.items.map(tb => (
                <button key={tb.id} onClick={() => handleTabChange(tb.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: tab === tb.id ? t.accentBg : "transparent", color: tab === tb.id ? t.accent : t.textFaint, fontSize: 14, textAlign: "left", fontFamily: "Lora, Georgia, serif", transition: "all 0.15s", fontWeight: tab === tb.id ? 600 : 400, outline: tab === tb.id ? `1px solid ${t.accent}44` : "none" }}
                  onMouseEnter={e => { if (tab !== tb.id) e.currentTarget.style.background = t.surface2; }}
                  onMouseLeave={e => { if (tab !== tb.id) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ fontSize: 18 }}>{tb.icon}</span>
                  <span>{tb.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxWidth: 800 }}>
          <AnimatePresence mode="wait">
            {tab === "lesson" && (
              <motion.div key="lesson" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {loadingLesson ? <LoadingLesson theme={t} /> :
                  lessonError ? <ErrorCard onRetry={() => loadLesson(level)} theme={t} /> :
                  lesson ? (lessonDone
                    ? <LessonSuccess lesson={lesson} score={lessonScore.score} total={lessonScore.total} onNext={() => loadLesson(level)} setTab={setTab} theme={t} />
                    : <LessonView lesson={lesson} level={currentLevel} onComplete={handleLessonComplete} theme={t} />
                  ) : null}
              </motion.div>
            )}
            {tab === "grammar" && <motion.div key="grammar" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Grammar level={level} theme={t} /></motion.div>}
            {tab === "plan" && <motion.div key="plan" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><StudyPlan completed={completedLessons} xp={xp} streak={streak} theme={t} /></motion.div>}
            {tab === "review" && <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Flashcards cards={cards} onUpdateCards={c => { setCards(c); storage.set("cards", c); }} theme={t} /></motion.div>}
            {tab === "interpreter" && <motion.div key="interp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Interpreter theme={t} /></motion.div>}
            {tab === "voice" && <motion.div key="voice" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><VoicePractice knownWords={knownWords} theme={t} /></motion.div>}
            {tab === "chat" && <motion.div key="chat" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><TutorChat level={level} knownWords={knownWords} theme={t} /></motion.div>}
            {tab === "conversation" && <motion.div key="conv" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><ConversationMode level={level} theme={t} /></motion.div>}
            {tab === "dictionary" && <motion.div key="dict" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Dictionary theme={t} /></motion.div>}
            {tab === "progress" && <motion.div key="prog" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><ProgressReport streak={streak} xp={xp} completed={completedLessons} words={knownWords} level={currentLevel} history={history} cards={cards} onReset={() => { storage.clear(); window.location.reload(); }} theme={t} /></motion.div>}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
