'use client';

import { useState } from 'react';
import { speakWordWithMeaning } from '@/src/lib/speech';
import AppIcon, { type AppIconName } from './AppIcon';
import WordExamples from './WordExamples';
import type { WordStudyProps } from './word-study-types';

export default function WordListRow({
  index,
  word,
  favorite,
  completed,
  wrong,
  progress,
  onToggleFavorite,
  onToggleCompleted,
  onToggleWrong,
}: WordStudyProps & { index: number }) {
  const [showExample, setShowExample] = useState(false);

  return (
    <article className={`word-list-row border-b border-slate-100 bg-white last:border-b-0 ${completed ? 'bg-emerald-50/35' : ''}`}>
      <div className="flex min-h-[60px] items-center gap-1 px-2 py-2">
        <span className="w-5 shrink-0 text-right text-[11px] font-bold tabular-nums text-slate-400">{index}.</span>
        <button
          type="button"
          onClick={onToggleCompleted}
          aria-label={completed ? `${word.word} 외운 상태 해제` : `${word.word} 외운 상태로 표시`}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border active:scale-95 ${completed ? 'border-leaf bg-leaf text-white' : 'border-slate-300 bg-white text-slate-400'}`}
        >
          <AppIcon name={completed ? 'check' : 'uncheck'} size={14} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1">
            <strong className="truncate text-[17px] font-extrabold leading-5 text-ink">{word.word}</strong>
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-label={favorite ? '즐겨찾기 해제' : '즐겨찾기에 추가'}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${favorite ? 'text-amber-500' : 'text-slate-300'}`}
            >
              <AppIcon name="bookmark" size={16} />
            </button>
          </div>
          <p className="mt-0.5 truncate text-[13px] font-semibold leading-4 text-muted">({word.pronunciation}) <span className="text-ink">{word.meaning}</span>{progress?.mastered ? ' · 완벽 암기' : ''}</p>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-0.5">
          <ActionButton label={`${word.word} 영어와 뜻 듣기`} icon="listen" onClick={() => speakWordWithMeaning(word)} />
          <ActionButton label={`${word.word} 예문 보기`} icon="example" active={showExample} onClick={() => setShowExample((value) => !value)} />
          <ActionButton label={`${word.word} 오답노트`} icon="note" danger={wrong} onClick={onToggleWrong} />
        </div>
      </div>

      {showExample && (
        <div className="border-t border-emerald-100 bg-emerald-50/60 px-3 py-3">
          <WordExamples word={word} />
        </div>
      )}
    </article>
  );
}

function ActionButton({ label, icon, onClick, active = false, danger = false }: { label: string; icon: AppIconName; onClick: () => void; active?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-9 w-8 items-center justify-center rounded-lg active:scale-90 ${danger ? 'bg-rose-100 text-rose-600' : active ? 'bg-emerald-100 text-leaf' : 'bg-slate-50 text-slate-500'}`}
    >
      <AppIcon name={icon} size={17} />
    </button>
  );
}
