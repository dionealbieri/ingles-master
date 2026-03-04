import { useState } from "react";
import { motion } from "motion/react";
import { storage } from "../utils/storage.js";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const GOALS = [
  { id: "casual",    label: "Casual",     emoji: "🌱", days: 3, minutes: 10, desc: "3x por semana, 10 min" },
  { id: "regular",   label: "Regular",    emoji: "📚", days: 5, minutes: 15, desc: "5x por semana, 15 min" },
  { id: "intensivo", label: "Intensivo",  emoji: "🚀", days: 7, minutes: 25, desc: "Todo dia, 25 min" },
];

const WEEKLY_ACTIVITIES = [
  { id: "lesson",      icon: "📖", label: "Lição do dia",       xp: 50 },
  { id: "flashcards",  icon: "🃏", label: "Revisar flashcards", xp: 20 },
  { id: "grammar",     icon: "📝", label: "Gramática",          xp: 30 },
  { id: "voice",       icon: "🎤", label: "Pronúncia",          xp: 25 },
  { id: "conversation",icon: "🎭", label: "Conversação",        xp: 35 },
];

export function StudyPlan({ completed, xp, streak, theme: t }) {
  const [goal, setGoal] = useState(() => storage.get("studyGoal", "regular"));
  const [checklist, setChecklist] = useState(() => storage.get("weekChecklist", {}));

  const today = new Date().getDay(); // 0=sun
  const todayIdx = today === 0 ? 6 : today - 1;

  const saveGoal = (id) => {
    setGoal(id);
    storage.set("studyGoal", id);
  };

  const toggleCheck = (actId) => {
    const key = `${new Date().toDateString()}_${actId}`;
    const newChecklist = { ...checklist, [key]: !checklist[key] };
    setChecklist(newChecklist);
    storage.set("weekChecklist", newChecklist);
  };

  const isChecked = (actId) => {
    const key = `${new Date().toDateString()}_${actId}`;
    return !!checklist[key];
  };

  const currentGoal = GOALS.find(g => g.id === goal);
  const todayDone = WEEKLY_ACTIVITIES.filter(a => isChecked(a.id)).length;
  const totalXpToday = WEEKLY_ACTIVITIES.filter(a => isChecked(a.id)).reduce((s, a) => s + a.xp, 0);

  // Simulated weekly progress
  const weekDays = DAYS.map((d, i) => ({
    label: d,
    isToday: i === todayIdx,
    done: i < todayIdx ? Math.random() > 0.3 : i === todayIdx ? todayDone > 0 : false,
  }));

  return (
    <div>
      <h2 style={{ fontSize: 22, color: t.text, fontWeight: 700, marginBottom: 8 }}>📅 Plano de Estudos</h2>
      <p style={{ color: t.textFaint, fontSize: 13, fontFamily: "monospace", marginBottom: 24 }}>Sua rotina semanal personalizada</p>

      {/* Meta */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: t.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>🎯 SUA META</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {GOALS.map(g => (
            <button key={g.id} onClick={() => saveGoal(g.id)}
              style={{ background: goal === g.id ? t.accentBg : t.surface2, border: `1px solid ${goal === g.id ? t.accent : t.border}`, borderRadius: 10, padding: "14px 10px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{g.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: goal === g.id ? t.accent : t.text }}>{g.label}</div>
              <div style={{ fontSize: 11, color: t.textFaint, marginTop: 4, fontFamily: "monospace" }}>{g.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Semana */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: t.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>📆 ESTA SEMANA</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {weekDays.map((d, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace", marginBottom: 6 }}>{d.label}</div>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${d.isToday ? t.accent : d.done ? "#4ade80" : t.border}`, background: d.done ? "#4ade8022" : d.isToday ? t.accentBg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: 16 }}>
                {d.done ? "✓" : d.isToday ? "●" : ""}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 20, justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fb923c" }}>{streak}</div>
            <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace" }}>dias seguidos</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.accent }}>{completed}</div>
            <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace" }}>lições totais</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#4ade80" }}>{xp}</div>
            <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "monospace" }}>XP total</div>
          </div>
        </div>
      </div>

      {/* Checklist do dia */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: t.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>✅ HOJE — {new Date().toLocaleDateString("pt-BR")}</div>
          <span style={{ fontSize: 13, color: t.textFaint, fontFamily: "monospace" }}>{todayDone}/{WEEKLY_ACTIVITIES.length} feitos · +{totalXpToday} XP</span>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {WEEKLY_ACTIVITIES.map(a => {
            const checked = isChecked(a.id);
            return (
              <button key={a.id} onClick={() => toggleCheck(a.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: checked ? "#4ade8011" : t.surface2, border: `1px solid ${checked ? "#4ade8033" : t.border}`, borderRadius: 10, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? "#4ade80" : t.border2}`, background: checked ? "#4ade80" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {checked && <span style={{ color: "#0f0e0c", fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                <span style={{ flex: 1, fontSize: 14, color: checked ? "#4ade80" : t.text, textDecoration: checked ? "line-through" : "none" }}>{a.label}</span>
                <span style={{ fontSize: 12, color: t.accent, fontFamily: "monospace" }}>+{a.xp} XP</span>
              </button>
            );
          })}
        </div>
        {todayDone === WEEKLY_ACTIVITIES.length && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16, padding: "12px 16px", background: "#4ade8022", borderRadius: 10, textAlign: "center", color: "#4ade80", fontWeight: 700 }}>
            🎉 Você completou todas as atividades de hoje! +{totalXpToday} XP conquistados!
          </motion.div>
        )}
      </div>

      {/* Dica do dia */}
      <div style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 13, color: t.accent, fontFamily: "monospace", marginBottom: 8 }}>💡 DICA DO DIA</div>
        <p style={{ color: t.textMuted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Estudar <strong style={{ color: t.text }}>{currentGoal?.minutes} minutos por dia</strong> é mais eficaz do que sessões longas esporádicas. 
          A consistência é o segredo para aprender inglês de verdade!
        </p>
      </div>
    </div>
  );
}
