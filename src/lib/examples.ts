import examplePatternsJson from '@/src/data/example_patterns.json';
import type { Word, WordExample } from '@/src/types';

type ExamplePatterns = {
  templates: Record<string, WordExample[]>;
  categories: Record<string, WordExample[]>;
  special: Record<string, WordExample[]>;
};

const examplePatterns = examplePatternsJson as ExamplePatterns;
const exampleCache = new Map<string, WordExample[]>();

function fillTemplate(value: string, word: Word) {
  return value
    .replace(/\{word\}/g, word.word)
    .replace(/\{meaning\}/g, word.meaning);
}

export function getWordExamples(word: Word): WordExample[] {
  const cached = exampleCache.get(word.id);
  if (cached) return cached;

  const source = examplePatterns.special[word.word.toLocaleLowerCase('en-US')]
    ?? examplePatterns.categories[word.category]
    ?? examplePatterns.templates[word.partOfSpeech]
    ?? examplePatterns.templates.default
    ?? [];

  const examples = source.slice(0, 3).map((example) => ({
    english: fillTemplate(example.english, word),
    korean: fillTemplate(example.korean, word),
  }));

  const fallback: WordExample[] = [
    { english: word.example, korean: word.exampleTranslation },
    { english: `Please remember ${word.word}.`, korean: `${word.meaning}를 기억해 보세요.` },
    { english: `Let's practice ${word.word} together.`, korean: `${word.meaning}를 함께 연습해 봐요.` },
  ];

  const result = [...examples, ...fallback].slice(0, 3);
  exampleCache.set(word.id, result);
  return result;
}
