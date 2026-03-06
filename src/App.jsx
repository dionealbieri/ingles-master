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
import { LoadingLesson, ErrorCard } from "./components/Card.jsx";
import { LEVELS } from "./constants.js";
import { generateLesson } from "./lessonService.js";
import { storage } from "./utils/storage.js";
import { createCard } from "./utils/spacedRepetition.js";
import { useTheme } from "./hooks/useTheme.js";
import { Settings, useSettings } from "./components/Settings.jsx";

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
      { id: "settings",     icon: "⚙️",  label: "Configurações" },
    ]
  },
];

const ALL_TABS = TABS_GROUPED.flatMap(g => g.items);

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
  const { settings, update: updateSetting, reset: resetSettings } = useSettings();
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => { scheduleReminder(); }, []);

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

  const handleLogout = () => {
    storage.clear();
    window.location.reload();
  };

  const handleTabChange = (id) => {
    setTab(id);
    setMobileNavOpen(false);
  };

  const currentLevel = LEVELS.find(l => l.id === level);
  const currentTabLabel = ALL_TABS.find(tb => tb.id === tab)?.label || "";
  const currentTabIcon = ALL_TABS.find(tb => tb.id === tab)?.icon || "";

  if (showPlacement) return <PlacementTest onComplete={handlePlacementComplete} onSkip={() => { storage.set("placementDone", true); setShowPlacement(false); }} />;
  if (showLevelPicker || !level) return <LevelPicker onPick={handlePickLevel} />;

  const Sidebar = ({ mobile = false }) => (
    <div style={{
      width: mobile ? "100%" : 210,
      background: t.surface,
      borderRight: mobile ? "none" : `1px solid ${t.border}`,
      display: "flex",
      flexDirection: "column",
      padding: mobile ? "8px 0 24px" : "16px 8px",
      gap: 2,
      overflowY: "auto",
      height: mobile ? "auto" : "calc(100vh - 57px)",
      position: mobile ? "relative" : "sticky",
      top: mobile ? 0 : 57,
      flexShrink: 0,
    }}>
      {TABS_GROUPED.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: t.textVeryFaint, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5, padding: mobile ? "8px 20px 4px" : "4px 10px 6px" }}>
            {group.group}
          </div>
          {group.items.map(tb => (
            <button key={tb.id} onClick={() => handleTabChange(tb.id)}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", gap: 12,
                padding: mobile ? "14px 20px" : "9px 12px",
                borderRadius: mobile ? 0 : 8,
                border: "none",
                cursor: "pointer",
                background: tab === tb.id ? t.accentBg : "transparent",
                color: tab === tb.id ? t.accent : t.textFaint,
                fontSize: mobile ? 16 : 14,
                textAlign: "left",
                fontFamily: "Lora, Georgia, serif",
                transition: "all 0.15s",
                fontWeight: tab === tb.id ? 600 : 400,
                borderLeft: mobile && tab === tb.id ? `3px solid ${t.accent}` : mobile ? "3px solid transparent" : "none",
              }}>
              <span style={{ fontSize: mobile ? 22 : 18 }}>{tb.icon}</span>
              <span>{tb.label}</span>
            </button>
          ))}
        </div>
      ))}

      {/* Logout button */}
      <div style={{ marginTop: "auto", padding: mobile ? "16px 12px 0" : "8px 4px 0", borderTop: `1px solid ${t.border}` }}>
        <button onClick={() => setShowLogoutConfirm(true)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: mobile ? "14px 20px" : "9px 12px",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent", color: "#f87171",
            fontSize: mobile ? 16 : 14,
            fontFamily: "Lora, Georgia, serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#f8717111"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <span style={{ fontSize: mobile ? 22 : 18 }}>🚪</span>
          <span>Sair / Reiniciar</span>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "Lora, Georgia, serif", minHeight: "100vh", background: t.bg, color: t.text, transition: "all 0.3s" }}>

      {/* Notification banner */}
      {!notifRequested && "Notification" in window && Notification.permission === "default" && (
        <div style={{ background: t.accentBg, borderBottom: `1px solid ${t.accent}44`, padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 13, color: t.textMuted }}>🔔 Ative lembretes diários!</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setNotifRequested(true)} style={{ background: "transparent", border: "none", color: t.textFaint, fontSize: 12, cursor: "pointer" }}>Não</button>
            <button onClick={async () => { await Notification.requestPermission(); setNotifRequested(true); scheduleReminder(); }}
              style={{ background: t.accent, border: "none", borderRadius: 6, padding: "4px 12px", color: "#0f0e0c", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Ativar</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${t.border}`, padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", background: t.surface, position: "sticky", top: 0, zIndex: 20 }}>
        {/* Mobile: hamburger + tab name */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Hamburger — só no mobile */}
          <button onClick={() => setMobileNavOpen(o => !o)}
            className="mobile-only"
            style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 8, width: 40, height: 40, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {mobileNavOpen ? "✕" : "☰"}
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: t.accent }}>🇺🇸 Inglês Master</span>
          {/* Tab atual no mobile */}
          <span className="mobile-only" style={{ fontSize: 14, color: t.textFaint }}>{currentTabIcon} {currentTabLabel}</span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 8, padding: "3px 10px", fontSize: 12, color: "#fb923c", display: "flex", alignItems: "center", gap: 4 }}>
            🔥 <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{streak}</span>
          </div>
          <div style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 8, padding: "3px 10px", fontSize: 12, color: t.accent, display: "flex", alignItems: "center", gap: 4 }}>
            ⚡ <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{xp}</span>
          </div>
          <button onClick={toggleTheme}
            style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isDark ? "☀️" : "🌙"}
          </button>
          <button onClick={() => setShowLevelPicker(true)}
            className="desktop-only"
            style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 8, padding: "3px 10px", color: t.textFaint, fontSize: 12, cursor: "pointer" }}>
            {currentLevel?.emoji} {currentLevel?.label}
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 30, top: 56 }} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: "tween", duration: 0.22 }}
              style={{ position: "fixed", left: 0, top: 56, bottom: 0, width: 260, zIndex: 40, background: t.surface, borderRight: `1px solid ${t.border}`, overflowY: "auto" }}>
              <Sidebar mobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
        {/* Desktop sidebar */}
        <div className="desktop-only" style={{ flexShrink: 0 }}>
          <Sidebar />
        </div>

        {/* Main */}
        <main style={{ flex: 1, padding: "20px 16px", overflowY: "auto", maxWidth: 860, width: "100%" }}>
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
            {tab === "grammar"      && <motion.div key="grammar"  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Grammar level={level} theme={t} /></motion.div>}
            {tab === "plan"         && <motion.div key="plan"     initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><StudyPlan completed={completedLessons} xp={xp} streak={streak} theme={t} /></motion.div>}
            {tab === "review"       && <motion.div key="review"   initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Flashcards cards={cards} onUpdateCards={c => { setCards(c); storage.set("cards", c); }} theme={t} /></motion.div>}
            {tab === "voice"        && <motion.div key="voice"    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><VoicePractice knownWords={knownWords} theme={t} /></motion.div>}
            {tab === "interpreter"  && <motion.div key="interp"   initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Interpreter theme={t} /></motion.div>}
            {tab === "chat"         && <motion.div key="chat"     initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><TutorChat level={level} knownWords={knownWords} theme={t} /></motion.div>}
            {tab === "conversation" && <motion.div key="conv"     initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><ConversationMode level={level} theme={t} /></motion.div>}
            {tab === "dictionary"   && <motion.div key="dict"     initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Dictionary theme={t} /></motion.div>}
            {tab === "progress"     && <motion.div key="prog"     initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><ProgressReport streak={streak} xp={xp} completed={completedLessons} words={knownWords} level={currentLevel} history={history} cards={cards} onReset={handleLogout} theme={t} /></motion.div>}
          </AnimatePresence>
        </main>
      </div>

      {/* Logout confirm modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              style={{ position: "fixed", inset: 0, background: "#000000aa", zIndex: 50 }} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ position: "fixed", inset: 0, zIndex: 51, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", pointerEvents: "none" }}>
              <div style={{ width: "100%", maxWidth: 360, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, textAlign: "center", pointerEvents: "all" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚪</div>
              <h3 style={{ fontSize: 20, color: t.text, fontWeight: 700, marginBottom: 8 }}>Sair do app?</h3>
              <p style={{ color: t.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Isso vai apagar todo o seu progresso — lições, flashcards e XP.<br />
                <strong style={{ color: "#f87171" }}>Essa ação não pode ser desfeita.</strong>
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowLogoutConfirm(false)}
                  style={{ flex: 1, padding: "14px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface2, color: t.text, fontSize: 16, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                  Cancelar
                </button>
                <button onClick={handleLogout}
                  style={{ flex: 1, padding: "14px", borderRadius: 10, border: "none", background: "#f87171", color: "#fff", fontSize: 16, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                  Sair
                </button>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) { .desktop-only { display: none !important; } }
        @media (min-width: 769px) { .mobile-only { display: none !important; } }
      `}</style>
    </div>
  );
}
