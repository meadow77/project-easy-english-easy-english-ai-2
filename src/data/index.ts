import subjects from './subjects.json';
import beVerbs from './be_verbs.json';
import verbs from './verbs.json';
import modalVerbs from './modal_verbs.json';
import questionWords from './question_words.json';
import prepositions from './prepositions.json';
import adjectives from './adjectives.json';
import adverbs from './adverbs.json';
import conjunctions from './conjunctions.json';
import nouns from './nouns.json';
import type { PartOfSpeech, Word } from '@/src/types';

export const words: Word[] = [
  ...subjects,
  ...beVerbs,
  ...modalVerbs,
  ...questionWords,
  ...verbs,
  ...prepositions,
  ...adjectives,
  ...adverbs,
  ...conjunctions,
  ...nouns,
] as Word[];

export const partOfSpeechGroups: PartOfSpeech[] = [
  '주어',
  'Be동사',
  '조동사',
  '의문사',
  '일반동사',
  '전치사',
  '형용사',
  '부사',
  '접속사',
  '명사',
];

export const compactCardGroups = new Set<PartOfSpeech>(['주어', 'Be동사', '조동사', '의문사']);

export const nounCategories = [
  '사람',
  '가족',
  '직업',
  '병원',
  '신체',
  '음식',
  '음료',
  '쇼핑',
  '여행',
  '공항',
  '호텔',
  '교통',
  '날씨',
  '시간',
  '숫자',
  '집',
  '회사',
  '학교',
  '취미',
  '감정',
  '동물',
  '나라',
] as const;