'use client';

import { useState } from 'react';
import { speakAmericanEnglish, speakWordWithMeaning } from '@/src/lib/speech';
import AppIcon, { type AppIconName } from './AppIcon';
import SpeakingPractice from './SpeakingPractice';
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
  onReview,
}: WordStudyProps & { index: number }) {
  const [panel, setPanel] = useState<'example' | 'practice' | null>(null);

  return (
    <article className={`word-list-row border-b border-slate-100 bg-white last:border-b-0 ${completed ? 'bg-emerald-50/35' : ''}`}>
      <div className="flex min-h-[64px] items-center gap-1.5 px-2 py-2">
        <span className="w-7 shrink-0 text-right text-xs font-bold tabular-nums text-slate-400">{index}.</span>
        <button
          type="button"
          onClick={onToggleCompleted}
          aria-label={completed ? `${word.word} 아직 안 외움으로 변경` : `${word.word} 외움으로 표시`}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg font-black active:scale-95 ${completed ? 'border-leaf bg-leaf text-white' : 'border-slate-300 bg-white text-slate-400'}`}
        >
          <AppIcon name={completed ? 'check' : 'uncheck'} size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1">
            <strong className="truncate text-[17px] font-extrabold leading-5 text-ink">{word.word}</strong>
            <button type="button" onClick={onToggleFavorite} aria-label={favorite ? '즐겨찾기 해제' : '즐겨찾기 저장'} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${favorite ? 'text-amber-500' : 'text-slate-300'}`}><AppIcon name="bookmark" size={16} /></button>
          </div>
          <p className="mt-0.5 truncate text-[12px] font-semibold leading-4 text-muted">({word.pronunciation}) <span className="text-ink">{word.meaning}</span>{progress?.mastered ? ' · 완벽 암기' : ''}</p>
        </div>

        <div className="grid shrink-0 grid-cols-4 gap-0.5">
          <ActionButton label={`${word.word}와 한국어 뜻 듣기`} icon="listen" onClick={() => speakWordWithMeaning(word)} />
          <ActionButton label={`${word.word} 말하기 연습`} icon="speak" active={panel === 'practice'} onClick={() => setPanel((value) => value === 'practice' ? null : 'practice')} />
          <ActionButton label={`${word.word} 예문 보기`} icon="example" active={panel === 'example'} onClick={() => setPanel((value) => value === 'example' ? null : 'example')} />
          <ActionButton label={`${word.word} 오답노트`} icon="note" active={wrong} danger={wrong} onClick={onToggleWrong} />
        </div>
      </div>

      {panel === 'practice' && (
        <div className="border-t border-emerald-100 px-3 py-3">
          <SpeakingPractice target={word.word} onEvaluated={onReview} compact />
        </div>
      )}

      {panel === 'example' && (
        <div className="border-t border-emerald-100 bg-emerald-50/60 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold text-leaf">예문</p>
              <p className="mt-1 text-base font-extrabold leading-6 text-ink">{word.example}</p>
              <p className="mt-1 text-sm leading-5 text-muted">{word.exampleTranslation}</p>
            </div>
            <button type="button" onClick={() => speakAmericanEnglish(word.example, 0.78)} className="flex min-h-10 shrink-0 items-center gap-1 rounded-xl bg-white px-3 text-xs font-extrabold text-leaf shadow-sm"><AppIcon name="listen" size={15} /> 듣기</button>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">{word.explanation}</p>
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
      className={`flex h-10 w-9 items-center justify-center rounded-lg active:scale-90 ${danger ? 'bg-rose-100 text-rose-600' : active ? 'bg-emerald-100 text-leaf' : 'bg-slate-50 text-slate-500'}`}
    >
      <AppIcon name={icon} size={17} />
    </button>
  );
}
