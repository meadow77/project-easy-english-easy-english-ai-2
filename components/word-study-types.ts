import type { Word, WordProgress } from '@/src/types';

export type WordStudyProps = {
  word: Word;
  favorite: boolean;
  completed: boolean;
  wrong: boolean;
  progress?: WordProgress;
  onToggleFavorite: () => void;
  onToggleCompleted: () => void;
  onToggleWrong: () => void;
  onReview: (correct: boolean) => void;
};