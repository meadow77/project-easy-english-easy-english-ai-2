'use client';

import { getWordExamples } from '@/src/lib/examples';
import { speakAmericanEnglish } from '@/src/lib/speech';
import type { Word } from '@/src/types';
import AppIcon from './AppIcon';

export default function WordExamples({ word }: { word: Word }) {
  const examples = getWordExamples(word);

  return (
    <div>
      <p className="text-sm font-extrabold text-leaf">실생활 예문 {examples.length}개</p>
      <div className="mt-2 space-y-2.5">
        {examples.map((example, index) => (
          <article key={`${word.id}-${index}`} className="rounded-xl bg-white/80 px-3 py-2.5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-base font-bold leading-6 text-ink"><span className="mr-1 text-sm text-leaf">{index + 1}.</span>{example.english}</p>
                <p className="mt-1 text-sm leading-5 text-muted">{example.korean}</p>
              </div>
              <button
                type="button"
                onClick={() => speakAmericanEnglish(example.english, 0.78)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-leaf active:scale-95"
                aria-label={`${example.english} 발음 듣기`}
                title="예문 발음 듣기"
              >
                <AppIcon name="listen" size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-3 text-sm leading-5 text-muted">{word.explanation}</p>
    </div>
  );
}
