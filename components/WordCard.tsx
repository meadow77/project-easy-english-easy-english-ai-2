'use client';

import { useState } from 'react';
import { speakAmericanEnglish } from '@/src/lib/speech';
import SpeakingPractice from './SpeakingPractice';
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
  onReview,
}: WordStudyProps) {
  const [showExample, setShowExample] = useState(false);
  const [showPractice, setShowPractice] = useState(false);

  return (
    <article className="rounded-[26px] border border-emerald-100 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-leaf">
            <span className="rounded-full bg-mint px-2.5 py-1">{word.partOfSpeech}</span>
            <span className="text-muted">{word.category}</span>
            {progress?.mastered && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">완벽 암기</span>}
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight text-ink">{word.word}</h3>
          <p className="mt-1 text-base font-semibold text-muted">({word.pronunciation}) · {word.meaning}</p>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={favorite ? '즐겨찾기 해제' : '즐겨찾기에 저장'}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition active:scale-95 ${favorite ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}
        >
          {favorite ? '★' : '☆'}
        </button>
      </div>

      <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-ink">{word.explanation}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button type="button" onClick={() => speakAmericanEnglish(word.word)} className="min-h-[52px] rounded-2xl bg-mint px-2 text-sm font-extrabold text-leaf active:scale-[.98]" aria-label={`${word.word} 미국식 발음 듣기`}>🔊<span className="ml-1 hidden min-[360px]:inline">발음</span></button>
        <button type="button" onClick={() => setShowPractice((value) => !value)} className={`min-h-[52px] rounded-2xl px-2 text-sm font-extrabold active:scale-[.98] ${showPractice ? 'bg-leaf text-white' : 'border border-emerald-200 text-leaf'}`}>🗣<span className="ml-1 hidden min-[360px]:inline">말하기</span></button>
        <button type="button" onClick={() => setShowExample((value) => !value)} className={`min-h-[52px] rounded-2xl px-2 text-sm font-extrabold active:scale-[.98] ${showExample ? 'bg-slate-800 text-white' : 'border border-slate-200 text-ink'}`}>📖<span className="ml-1 hidden min-[360px]:inline">예문</span></button>
      </div>

      {showPractice && <div className="mt-3"><SpeakingPractice target={word.word} onEvaluated={onReview} /></div>}

      {showExample && (
        <div className="mt-3 rounded-2xl border border-dashed border-leaf/30 bg-emerald-50 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-leaf">예문</p>
            <button type="button" onClick={() => speakAmericanEnglish(word.example, 0.78)} className="min-h-10 rounded-xl bg-white px-3 text-xs font-extrabold text-leaf shadow-sm">🔊 예문 듣기</button>
          </div>
          <p className="mt-1 text-lg font-bold leading-7 text-ink">{word.example}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{word.exampleTranslation}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onToggleWrong}
          className={`min-h-12 rounded-xl px-3 text-sm font-extrabold active:scale-[.98] ${wrong ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-muted'}`}
        >
          📝 {wrong ? '오답 저장됨' : '오답노트'}
        </button>
        <button
          type="button"
          onClick={onToggleCompleted}
          className={`min-h-12 rounded-xl px-3 text-sm font-extrabold active:scale-[.98] ${completed ? 'bg-leaf text-white' : 'bg-emerald-50 text-leaf'}`}
        >
          {completed ? '☑ 외웠어요' : '☐ 아직 안 외움'}
        </button>
      </div>
      {progress && progress.correctStreak > 0 && <p className="mt-3 text-center text-xs text-muted">연속 정답 {progress.correctStreak}회 · {progress.interval}일 후 복습</p>}
    </article>
  );
}