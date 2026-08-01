import subjects from './subjects.json';
import beVerbs from './be_verbs.json';
import verbs from './verbs.json';
import modalVerbs from './modal_verbs.json';
import questionWords from './question_words.json';
import prepositions from './prepositions.json';
import adjectives from './adjectives.json';
import adverbs from './adverbs.json';
import nouns from './nouns.json';
import numbers from './numbers.json';
import months from './months.json';
import weekdays from './weekdays.json';
import type { Word } from '@/src/types';

export const words: Word[] = [
  ...subjects,
  ...beVerbs,
  ...verbs,
  ...modalVerbs,
  ...questionWords,
  ...prepositions,
  ...adjectives,
  ...adverbs,
  ...nouns,
  ...numbers,
  ...months,
  ...weekdays,
] as Word[];

export const partOfSpeechGroups = ['주어', 'Be동사', '일반동사', '조동사', '의문사', '전치사', '형용사', '부사', '명사'] as const;

export const nounCategories = ['사람', '음식', '병원', '여행', '공항', '호텔', '쇼핑', '교통', '숫자', '시간', '날짜', '가족', '직업', '감정', '신체'] as const;
