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
    habitCheckIns: [],
    lateMarks: 0,
    streakDebt: 0,
    recoveryTokens: 0,
    minigameRewardWeeks: [],
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

export function localWeekKey(date = new Date()) {
  const cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = cursor.getDay() || 7;
  cursor.setDate(cursor.getDate() + 4 - day);
  const yearStart = new Date(cursor.getFullYear(), 0, 1);
  const week = Math.ceil(((cursor - yearStart) / 86400000 + 1) / 7);
  return `${cursor.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function evaluateStudyCheckIn(studyTime, recoveryDay = 0, now = new Date()) {
  const [hours, minutes] = String(studyTime || "19:00").split(":").map(Number);
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours || 0,
    minutes || 0,
  );
  const minutesFromTarget = Math.round((now - target) / 60000);
  const isRecoveryDay = now.getDay() === Number(recoveryDay);

  return {
    date: localDateKey(now),
    checkedAt: now.toISOString(),
    minutesFromTarget,
    status: isRecoveryDay
      ? "recovery-day"
      : Math.abs(minutesFromTarget) <= 30
        ? "on-time"
        : "outside-window",
  };
}

export function calculateHabitStreak(habitCheckIns, recoveryDay = 0, now = new Date()) {
  const protectedDates = new Set(
    habitCheckIns
      .filter((entry) => entry.status !== "debt")
      .map((entry) => entry.date),
  );
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let streak = 0;

  if (!protectedDates.has(localDateKey(cursor)) && cursor.getDay() !== Number(recoveryDay)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let checked = 0; checked < 370; checked += 1) {
    if (cursor.getDay() === Number(recoveryDay)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (!protectedDates.has(localDateKey(cursor))) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
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
