import type { StoredState, Word, WordProgress } from '@/src/types';

export const STORAGE_KEY = 'easy-english-progress-v1';
export const INITIAL_STATE: StoredState = {
  favorites: [],
  completedWordIds: [],
  progress: {},
  stats: { totalReviews: 0, correctReviews: 0 },
};

export function loadState(): StoredState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_STATE;
    const parsed = JSON.parse(saved) as Partial<StoredState>;
    return {
      favorites: parsed.favorites ?? [],
      completedWordIds: parsed.completedWordIds ?? [],
      progress: parsed.progress ?? {},
      stats: parsed.stats ?? INITIAL_STATE.stats,
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
  return words.filter((word) => state.progress[word.id] && state.progress[word.id].nextReview <= today);
}

export function getProgress(state: StoredState, wordId: string): WordProgress | undefined {
  return state.progress[wordId];
}

export function reviewWord(state: StoredState, wordId: string, correct: boolean): StoredState {
  const current = state.progress[wordId] ?? { repetitions: 0, correctStreak: 0, interval: 0, nextReview: dayKey(), mastered: false };
  const intervals = [1, 3, 7, 14, 30];
  const repetitions = correct ? current.repetitions + 1 : 0;
  const correctStreak = correct ? current.correctStreak + 1 : 0;
  const intervalIndex = Math.min(Math.max(repetitions - 1, 0), intervals.length - 1);
  const interval = correct ? intervals[intervalIndex] : 1;
  const nextReview = dayKey(addDays(new Date(), interval));
  return {
    ...state,
    completedWordIds: correct && !state.completedWordIds.includes(wordId)
      ? [...state.completedWordIds, wordId]
      : state.completedWordIds,
    stats: {
      totalReviews: state.stats.totalReviews + 1,
      correctReviews: state.stats.correctReviews + (correct ? 1 : 0),
      lastStudyDate: dayKey(),
    },
    progress: {
      ...state.progress,
      [wordId]: { repetitions, correctStreak, interval, nextReview, mastered: correctStreak >= 5, lastReviewed: dayKey() },
    },
  };
}
