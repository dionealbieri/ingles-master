const PREFIX = "im_";

export const storage = {
  get: (key, defaultVal) => {
    try {
      const val = localStorage.getItem(PREFIX + key);
      return val !== null ? JSON.parse(val) : defaultVal;
    } catch { return defaultVal; }
  },
  set: (key, val) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch {}
  },
  getStreak: () => {
    const data = storage.get("streak", { count: 0, lastDate: null });
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (data.lastDate === today) return data;
    if (data.lastDate === yesterday) return data; // still valid
    return { count: 0, lastDate: null }; // reset
  },
  updateStreak: () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const data = storage.get("streak", { count: 0, lastDate: null });
    if (data.lastDate === today) return data;
    const newCount = data.lastDate === yesterday ? data.count + 1 : 1;
    const newData = { count: newCount, lastDate: today };
    storage.set("streak", newData);
    return newData;
  },
  clear: () => {
    Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
  }
};
