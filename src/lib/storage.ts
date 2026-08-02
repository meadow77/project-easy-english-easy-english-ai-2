import type { StoredState, TestResult, Word, WordProgress } from '@/src/types';

export const STORAGE_KEY = 'easy-english-progress-v2';
const LEGACY_STORAGE_KEY = 'easy-english-progress-v1';

export const INITIAL_STATE: StoredState = {
  favorites: [],
  completedWordIds: [],
  wrongWordIds: [],
  progress: {},
  stats: { totalReviews: 0, correctReviews: 0 },
  testResults: [],
};

function unique(values: unknown): string[] {
  return Array.isArray(values) ? [...new Set(values.filter((value): value is string => typeof value === 'string'))] : [];
}

export function loadState(): StoredState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!saved) return INITIAL_STATE;
    const parsed = JSON.parse(saved) as Partial<StoredState>;
    return {
      favorites: unique(parsed.favorites),
      completedWordIds: unique(parsed.completedWordIds),
      wrongWordIds: unique(parsed.wrongWordIds),
      progress: parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {},
      stats: {
        totalReviews: parsed.stats?.totalReviews ?? 0,
        correctReviews: parsed.stats?.correctReviews ?? 0,
        lastStudyDate: parsed.stats?.lastStudyDate,
      },
      testResults: Array.isArray(parsed.testResults) ? parsed.testResults.slice(-100) : [],
      dailyPlan: parsed.dailyPlan && typeof parsed.dailyPlan.date === 'string'
        ? { date: parsed.dailyPlan.date, wordIds: unique(parsed.dailyPlan.wordIds) }
        : undefined,
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function saveState(state: StoredState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function dayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function dueWords(words: Word[], state: StoredState) {
  const today = dayKey();
  const completed = new Set(state.completedWordIds);
  return words.filter((word) => completed.has(word.id) && state.progress[word.id]?.nextReview <= today);
}

export function getProgress(state: StoredState, wordId: string): WordProgress | undefined {
  return state.progress[wordId];
}

function withId(values: string[], id: string, enabled: boolean) {
  if (enabled) return values.includes(id) ? values : [...values, id];
  return values.filter((value) => value !== id);
}

export function setWordCompleted(state: StoredState, wordId: string, completed: boolean): StoredState {
  const progress = { ...state.progress };
  if (completed) {
    const current = progress[wordId];
    progress[wordId] = current ?? {
      repetitions: 1,
      correctStreak: 1,
      interval: 1,
      nextReview: dayKey(addDays(new Date(), 1)),
      mastered: false,
      lastReviewed: dayKey(),
    };
  } else {
    delete progress[wordId];
  }

  return {
    ...state,
    completedWordIds: withId(state.completedWordIds, wordId, completed),
    progress,
  };
}

export function setWordsCompleted(state: StoredState, wordIds: string[], completed: boolean): StoredState {
  const ids = unique(wordIds);
  if (!ids.length) return state;

  return ids.reduce((nextState, wordId) => setWordCompleted(nextState, wordId, completed), state);
}

export function ensureTodayPlan(state: StoredState, sourceWords: Word[]): StoredState {
  const today = dayKey();
  const validIds = new Set(sourceWords.map((word) => word.id));
  const savedIds = state.dailyPlan?.date === today
    ? state.dailyPlan.wordIds.filter((wordId) => validIds.has(wordId))
    : [];

  if (savedIds.length === 20 || (savedIds.length > 0 && sourceWords.length < 20)) {
    return { ...state, dailyPlan: { date: today, wordIds: savedIds } };
  }

  const selected = new Set(savedIds);
  const unlearned = sourceWords.filter((word) => !state.completedWordIds.includes(word.id));
  const candidates = [...dueWords(sourceWords, state), ...unlearned, ...sourceWords];
  for (const word of candidates) {
    if (selected.size >= 20) break;
    selected.add(word.id);
  }

  return { ...state, dailyPlan: { date: today, wordIds: [...selected].slice(0, 20) } };
}

export function toggleFavorite(state: StoredState, wordId: string): StoredState {
  return { ...state, favorites: withId(state.favorites, wordId, !state.favorites.includes(wordId)) };
}

export function toggleWrongWord(state: StoredState, wordId: string): StoredState {
  return { ...state, wrongWordIds: withId(state.wrongWordIds, wordId, !state.wrongWordIds.includes(wordId)) };
}

export function reviewWord(state: StoredState, wordId: string, correct: boolean): StoredState {
  const current = state.progress[wordId] ?? { repetitions: 0, correctStreak: 0, interval: 0, nextReview: dayKey(), mastered: false };
  const intervals = [1, 3, 7, 14, 30, 60, 90];
  const repetitions = correct ? current.repetitions + 1 : 0;
  const correctStreak = correct ? current.correctStreak + 1 : 0;
  const intervalIndex = Math.min(Math.max(repetitions - 1, 0), intervals.length - 1);
  const interval = correct ? intervals[intervalIndex] : 1;
  const nextReview = dayKey(addDays(new Date(), interval));

  return {
    ...state,
    completedWordIds: correct ? withId(state.completedWordIds, wordId, true) : state.completedWordIds,
    wrongWordIds: correct ? state.wrongWordIds : withId(state.wrongWordIds, wordId, true),
    stats: {
      totalReviews: state.stats.totalReviews + 1,
      correctReviews: state.stats.correctReviews + (correct ? 1 : 0),
      lastStudyDate: dayKey(),
    },
    progress: {
      ...state.progress,
      [wordId]: {
        repetitions,
        correctStreak,
        interval,
        nextReview,
        mastered: correctStreak >= 5,
        lastReviewed: dayKey(),
      },
    },
  };
}

export function recordTestResult(state: StoredState, result: TestResult): StoredState {
  return {
    ...state,
    wrongWordIds: [...new Set([...state.wrongWordIds, ...result.wrongWordIds])],
    testResults: [...state.testResults, result].slice(-100),
    stats: {
      totalReviews: state.stats.totalReviews + result.total,
      correctReviews: state.stats.correctReviews + result.correct,
      lastStudyDate: dayKey(),
    },
  };
}
