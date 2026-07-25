import { lessons } from "./lessons.js";

export const economy = {
  lessonReward: 40,
  examPassReward: 400,
  wrongAnswerPenalty: 25,
  passScore: 80,
  specialScore: 90,
};

export const starterItem = {
  id: "classic-apron",
  name: "Classic Bar Apron",
  type: "outfit",
  icon: "◼",
  color: "#087b95",
  accent: "#59ddea",
  price: 0,
  description: "Pu’s first service apron.",
};

export const storeItems = [
  {
    id: "coral-apron",
    name: "Coral Apron",
    type: "outfit",
    icon: "◆",
    color: "#d96864",
    accent: "#ffd0c7",
    price: 300,
    description: "A warm apron for lively weekend shifts.",
  },
  {
    id: "pearl-vest",
    name: "Pearl Service Vest",
    type: "outfit",
    icon: "◇",
    color: "#d8edf0",
    accent: "#087b95",
    price: 520,
    description: "Polished competition-day tailoring.",
  },
  {
    id: "deep-sea-jacket",
    name: "Deep-Sea Jacket",
    type: "outfit",
    icon: "◈",
    color: "#07384b",
    accent: "#81e6c0",
    price: 850,
    description: "A premium jacket with ocean-glass trim.",
  },
  {
    id: "blue-bow",
    name: "Ocean Bow",
    type: "head",
    icon: "⋈",
    color: "#59ddea",
    price: 260,
    description: "A bright bow for a friendly service look.",
  },
  {
    id: "sailor-cap",
    name: "Night Sailor Cap",
    type: "head",
    icon: "⌁",
    color: "#eafcff",
    price: 380,
    description: "A crisp cap inspired by midnight voyages.",
  },
  {
    id: "sparkle-clip",
    name: "Sea-Spark Clip",
    type: "head",
    icon: "✦",
    color: "#81e6c0",
    price: 450,
    description: "A small glow for confident presentations.",
  },
  {
    id: "copper-shaker",
    name: "Copper Shaker",
    type: "accessory",
    icon: "▰",
    color: "#c9815f",
    price: 250,
    description: "A dependable shaker for daily practice.",
  },
  {
    id: "citrus-pin",
    name: "Citrus Pin",
    type: "accessory",
    icon: "●",
    color: "#f4c95d",
    price: 320,
    description: "A sunny pin for flavor-language lessons.",
  },
  {
    id: "neon-glass",
    name: "Neon Coupe",
    type: "accessory",
    icon: "▽",
    color: "#ff7f72",
    price: 600,
    description: "A glowing coupe for competition practice.",
  },
  {
    id: "midnight-bar",
    name: "Midnight Bar",
    type: "background",
    icon: "☾",
    color: "#07131d",
    accent: "#ff7f72",
    price: 650,
    description: "A quiet late-shift bar backdrop.",
  },
  {
    id: "ocean-window",
    name: "Ocean Window",
    type: "background",
    icon: "≈",
    color: "#07536a",
    accent: "#59ddea",
    price: 850,
    description: "Moving blue light beyond the back bar.",
  },
  {
    id: "competition-stage",
    name: "Competition Stage",
    type: "background",
    icon: "✧",
    color: "#251a3a",
    accent: "#81e6c0",
    price: 1000,
    description: "A premium stage for rehearsing the final.",
  },
];

export const examSpecialItems = [
  {
    checkpoint: 4,
    id: "welcome-pearl",
    name: "Welcome Pearl",
    type: "accessory",
    icon: "◉",
    color: "#eafcff",
    description: "Earned by scoring at least 90% on the Week 4 exam.",
  },
  {
    checkpoint: 8,
    id: "flavor-compass",
    name: "Flavor Compass",
    type: "accessory",
    icon: "✣",
    color: "#f4c95d",
    description: "Earned by scoring at least 90% on the Week 8 exam.",
  },
  {
    checkpoint: 12,
    id: "service-crown",
    name: "Service Crown",
    type: "head",
    icon: "♛",
    color: "#81e6c0",
    description: "Earned by scoring at least 90% on the Week 12 exam.",
  },
  {
    checkpoint: 16,
    id: "nightlife-star",
    name: "Nightlife Star",
    type: "head",
    icon: "★",
    color: "#ff7f72",
    description: "Earned by scoring at least 90% on the Week 16 exam.",
  },
  {
    checkpoint: 20,
    id: "story-cape",
    name: "Storyteller Cape",
    type: "outfit",
    icon: "❖",
    color: "#513f78",
    accent: "#e8d7ff",
    description: "Earned by scoring at least 90% on the Week 20 exam.",
  },
  {
    checkpoint: 24,
    id: "master-halo",
    name: "Master Bartender Halo",
    type: "head",
    icon: "✺",
    color: "#f4c95d",
    description: "Earned by scoring at least 90% on the final exam.",
  },
];

export const allAvatarItems = [starterItem, ...storeItems, ...examSpecialItems];
export const examCheckpoints = [4, 8, 12, 16, 20, 24];

function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = key(item).toLowerCase();
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function rotateOptions(options, shift) {
  if (!options.length) return [];
  const offset = shift % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
}

function buildExam(checkpoint) {
  const blockLessons = lessons.filter(
    (lesson) => lesson.week > checkpoint - 4 && lesson.week <= checkpoint,
  );
  const vocabulary = uniqueBy(
    blockLessons.flatMap((lesson) =>
      lesson.vocabulary.map(([en, vi]) => ({ en, vi, lessonId: lesson.id })),
    ),
    (item) => item.en,
  );
  const phrases = uniqueBy(
    blockLessons.flatMap((lesson) =>
      lesson.warmup.map((phrase) => ({ ...phrase, lessonId: lesson.id })),
    ),
    (item) => item.en,
  );

  const vocabularyQuestions = vocabulary.slice(0, 6).map((item, index) => {
    const distractors = vocabulary
      .filter((candidate) => candidate.vi !== item.vi)
      .slice(index + 1, index + 4)
      .map((candidate) => candidate.vi);
    const options = rotateOptions([item.vi, ...distractors], index + checkpoint);
    return {
      id: `${checkpoint}-v-${index}`,
      prompt: `What does “${item.en}” mean?`,
      options,
      answer: options.indexOf(item.vi),
    };
  });

  const phraseQuestions = phrases.slice(0, 4).map((item, index) => {
    const distractors = phrases
      .filter((candidate) => candidate.en !== item.en)
      .slice(index + 2, index + 5)
      .map((candidate) => candidate.en);
    const options = rotateOptions([item.en, ...distractors], checkpoint + index + 1);
    return {
      id: `${checkpoint}-p-${index}`,
      prompt: `Which English phrase means “${item.vi}”?`,
      options,
      answer: options.indexOf(item.en),
    };
  });

  return [...vocabularyQuestions, ...phraseQuestions];
}

export const examQuestions = Object.fromEntries(
  examCheckpoints.map((checkpoint) => [checkpoint, buildExam(checkpoint)]),
);

export function isWeekUnlocked(week, examResults = {}) {
  if (week <= 4) return true;
  const previousCheckpoint = Math.floor((week - 1) / 4) * 4;
  return Boolean(examResults[previousCheckpoint]?.passed);
}

export function isExamReady(checkpoint, progress) {
  const previousCheckpoint = checkpoint - 4;
  if (previousCheckpoint && !progress.examResults?.[previousCheckpoint]?.passed) return false;
  const requiredIds = lessons
    .filter((lesson) => lesson.week > checkpoint - 4 && lesson.week <= checkpoint)
    .map((lesson) => lesson.id);
  return requiredIds.every((id) => progress.completedLessons.includes(id));
}
