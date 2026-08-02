'use client';

import { useState } from 'react';
import { speakWordWithMeaning } from '@/src/lib/speech';
import AppIcon from './AppIcon';
import WordExamples from './WordExamples';
import type { WordStudyProps } from './word-study-types';

export default function WordCard({
  word,
  favorite,
  completed,
  wrong,
  progress,
  onToggleFavorite,
  onToggleCompleted,
  onToggleWrong,
}: WordStudyProps) {
  const [showExample, setShowExample] = useState(false);

  return (
    <article className="rounded-[26px] border border-emerald-100 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-leaf">
            <span className="rounded-full bg-mint px-2.5 py-1">{word.partOfSpeech}</span>
            <span className="text-muted">{word.category}</span>
            {progress?.mastered && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">완벽 암기</span>}
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight text-ink">{word.word}</h3>
          <p className="mt-1 text-lg font-semibold text-muted">({word.pronunciation}) · {word.meaning}</p>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={favorite ? '즐겨찾기 해제' : '즐겨찾기에 추가'}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition active:scale-95 ${favorite ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}
        >
          <AppIcon name="bookmark" size={22} />
        </button>
      </div>

      <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-base leading-7 text-ink">{word.explanation}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => speakWordWithMeaning(word)} className="flex min-h-[52px] items-center justify-center rounded-2xl bg-mint px-2 text-base font-extrabold text-leaf active:scale-[.98]" aria-label={`${word.word} 영어와 뜻 듣기`}><AppIcon name="listen" size={18} /><span className="ml-1">듣기</span></button>
        <button type="button" onClick={() => setShowExample((value) => !value)} className={`flex min-h-[52px] items-center justify-center rounded-2xl px-2 text-base font-extrabold active:scale-[.98] ${showExample ? 'bg-slate-800 text-white' : 'border border-slate-200 text-ink'}`}><AppIcon name="example" size={18} /><span className="ml-1">예문</span></button>
      </div>

      {showExample && (
        <div className="mt-3 rounded-2xl border border-dashed border-leaf/30 bg-emerald-50 px-4 py-3">
          <WordExamples word={word} />
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onToggleWrong}
          className={`min-h-12 rounded-xl px-3 text-base font-extrabold active:scale-[.98] ${wrong ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-muted'}`}
        >
          <span className="inline-flex items-center gap-1"><AppIcon name="note" size={17} /> {wrong ? '오답 저장됨' : '오답노트'}</span>
        </button>
        <button
          type="button"
          onClick={onToggleCompleted}
          className={`min-h-12 rounded-xl px-3 text-base font-extrabold active:scale-[.98] ${completed ? 'bg-leaf text-white' : 'bg-emerald-50 text-leaf'}`}
        >
          <span className="inline-flex items-center gap-1"><AppIcon name={completed ? 'check' : 'uncheck'} size={17} /> {completed ? '외웠어요' : '외운 단어'}</span>
        </button>
      </div>
      {progress && progress.correctStreak > 0 && <p className="mt-3 text-center text-sm text-muted">연속 정답 {progress.correctStreak}회 · {progress.interval}일 뒤 복습</p>}
    </article>
  );
}
