export type PartOfSpeech = '주어' | 'Be동사' | '일반동사' | '조동사' | '의문사' | '전치사' | '형용사' | '부사' | '접속사' | '명사';

export type Word = {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  partOfSpeech: PartOfSpeech;
  category: string;
  explanation: string;
  example: string;
  exampleTranslation: string;
};

export type WordProgress = {
  repetitions: number;
  correctStreak: number;
  interval: number;
  nextReview: string;
  mastered: boolean;
  lastReviewed?: string;
};

export type LearningStats = {
  totalReviews: number;
  correctReviews: number;
  lastStudyDate?: string;
};

export type TestMode = 'en-ko' | 'ko-en' | 'listening' | 'speaking';

export type TestResult = {
  id: string;
  completedAt: string;
  category: string;
  mode: TestMode;
  total: number;
  correct: number;
  wrongWordIds: string[];
};

export type DailyPlan = {
  date: string;
  wordIds: string[];
};

export type StoredState = {
  favorites: string[];
  completedWordIds: string[];
  wrongWordIds: string[];
  progress: Record<string, WordProgress>;
  stats: LearningStats;
  testResults: TestResult[];
  dailyPlan?: DailyPlan;
};

export type Tab = 'today' | 'words' | 'review' | 'favorites' | 'search';
