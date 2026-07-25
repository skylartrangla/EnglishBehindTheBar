const KEYS = {
  profile: "ebtb.profile",
  progress: "ebtb.progress",
};

export function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.profile)) || null;
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export function clearProfile() {
  localStorage.removeItem(KEYS.profile);
  localStorage.removeItem(KEYS.progress);
}

export function loadProgress() {
  const fallback = {
    completedLessons: [],
    completionDates: [],
    points: 0,
    recordings: 0,
    checkIns: [],
    inventory: ["classic-apron"],
    equipped: {
      outfit: "classic-apron",
      head: "",
      accessory: "",
      background: "",
    },
    examResults: {},
  };

  try {
    const saved = JSON.parse(localStorage.getItem(KEYS.progress)) || {};
    return {
      ...fallback,
      ...saved,
      inventory: saved.inventory?.length ? saved.inventory : fallback.inventory,
      equipped: { ...fallback.equipped, ...(saved.equipped || {}) },
      examResults: saved.examResults || {},
    };
  } catch {
    return fallback;
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEYS.progress, JSON.stringify(progress));
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateStreak(completionDates, recoveryDay = 0, now = new Date()) {
  const completed = new Set(completionDates);
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let streak = 0;

  if (!completed.has(localDateKey(cursor)) && cursor.getDay() !== Number(recoveryDay)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let checked = 0; checked < 370; checked += 1) {
    if (cursor.getDay() === Number(recoveryDay)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (!completed.has(localDateKey(cursor))) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
