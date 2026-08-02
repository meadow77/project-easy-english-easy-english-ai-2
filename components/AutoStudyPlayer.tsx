'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Word } from '@/src/types';
import { beginSpeechSession, cancelSpeech, createSpeechUtterance, getStudySpeechSegments, isSpeechSessionActive, type StudyPlaybackMode } from '@/src/lib/speech';
import AppIcon from './AppIcon';

type PlaybackTarget = 'all' | 'completed' | 'favorites' | 'wrong';
type PlaybackStatus = 'idle' | 'playing' | 'paused';

const targetOptions: { id: PlaybackTarget; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'completed', label: '체크한 단어' },
  { id: 'favorites', label: '즐겨찾기' },
  { id: 'wrong', label: '오답노트' },
];

const modeOptions: { id: StudyPlaybackMode; label: string }[] = [
  { id: 'en-ko', label: '영어 → 한국어' },
  { id: 'en-ko-en', label: '영어 → 한국어 → 영어' },
  { id: 'ko-en', label: '한국어 → 영어' },
];

export default function AutoStudyPlayer({
  words,
  completedIds,
  favoriteIds,
  wrongIds,
  className = '',
}: {
  words: Word[];
  completedIds: Set<string>;
  favoriteIds: Set<string>;
  wrongIds: Set<string>;
  className?: string;
}) {
  const [target, setTarget] = useState<PlaybackTarget>('all');
  const [speed, setSpeed] = useState<0.8 | 1 | 1.2>(1);
  const [repeat, setRepeat] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<StudyPlaybackMode>('en-ko-en');
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [error, setError] = useState('');

  const runIdRef = useRef(0);
  const queueRef = useRef<Word[]>([]);
  const settingsRef = useRef({ speed, repeat, mode });

  useEffect(() => {
    settingsRef.current = { speed, repeat, mode };
  }, [mode, repeat, speed]);

  useEffect(() => () => {
    runIdRef.current += 1;
    cancelSpeech();
  }, []);

  const wordsByTarget = useMemo<Record<PlaybackTarget, Word[]>>(() => ({
    all: words,
    completed: words.filter((word) => completedIds.has(word.id)),
    favorites: words.filter((word) => favoriteIds.has(word.id)),
    wrong: words.filter((word) => wrongIds.has(word.id)),
  }), [completedIds, favoriteIds, words, wrongIds]);

  const selectedWords = wordsByTarget[target];
  const targetLabel = targetOptions.find((option) => option.id === target)?.label ?? '전체';

  const stop = () => {
    runIdRef.current += 1;
    cancelSpeech();
    setStatus('idle');
    setCurrentWord(null);
  };

  const playSegment = (wordIndex: number, repeatIndex: number, segmentIndex: number, runId: number, speechSession: number) => {
    if (runId !== runIdRef.current) return;
    if (!isSpeechSessionActive(speechSession)) {
      setStatus('idle');
      setCurrentWord(null);
      return;
    }
    const queue = queueRef.current;
    const word = queue[wordIndex];
    if (!word) {
      setStatus('idle');
      setCurrentWord(null);
      return;
    }

    setCurrentWord(word);
    const segments = getStudySpeechSegments(word, settingsRef.current.mode);
    const segment = segments[segmentIndex];
    if (!segment) return;
    const utterance = createSpeechUtterance(segment.text, segment.lang, settingsRef.current.speed);
    if (!utterance) {
      setError('이 기기에서는 음성 재생을 사용할 수 없어요. Safari 설정을 확인해주세요.');
      setStatus('idle');
      return;
    }

    utterance.onend = () => {
      if (runId !== runIdRef.current || !isSpeechSessionActive(speechSession)) return;
      const nextSegment = segmentIndex + 1;
      if (nextSegment < segments.length) {
        window.setTimeout(() => playSegment(wordIndex, repeatIndex, nextSegment, runId, speechSession), 180);
        return;
      }

      const nextWord = wordIndex + 1;
      if (nextWord < queue.length) {
        window.setTimeout(() => playSegment(nextWord, repeatIndex, 0, runId, speechSession), 520);
        return;
      }

      if (repeatIndex + 1 < settingsRef.current.repeat) {
        window.setTimeout(() => playSegment(0, repeatIndex + 1, 0, runId, speechSession), 700);
        return;
      }

      setStatus('idle');
      setCurrentWord(null);
    };

    utterance.onerror = () => {
      if (runId !== runIdRef.current || !isSpeechSessionActive(speechSession)) return;
      setError('음성 재생을 다시 시도해주세요.');
      setStatus('idle');
      setCurrentWord(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  const start = () => {
    if (!selectedWords.length) {
      setError(`${targetLabel}에 재생할 단어가 없어요.`);
      return;
    }
    setError('');
    const nextRunId = runIdRef.current + 1;
    runIdRef.current = nextRunId;
    const speechSession = beginSpeechSession();
    queueRef.current = selectedWords;
    setStatus('playing');
    playSegment(0, 0, 0, nextRunId, speechSession);
  };

  const pause = () => {
    window.speechSynthesis?.pause();
    setStatus('paused');
  };

  const resume = () => {
    window.speechSynthesis?.resume();
    setStatus('playing');
  };

  const changeSetting = <T,>(setter: (value: T) => void, value: T) => {
    if (status !== 'idle') stop();
    setter(value);
  };

  return (
    <section className={`rounded-[24px] border border-sky-100 bg-gradient-to-br from-[#f0fbff] via-white to-[#f7f4ff] p-4 shadow-soft ${className}`} aria-label="자동 암기 모드">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600"><AppIcon name="play" size={19} /></span>
          <div>
            <h3 className="text-base font-black text-ink">자동 암기 모드</h3>
            <p className="mt-0.5 text-xs font-semibold text-muted">{targetLabel} {selectedWords.length}개 · {repeat}회 반복</p>
          </div>
        </div>
        {currentWord && <span className="max-w-24 truncate rounded-full bg-white px-2.5 py-1 text-xs font-black text-sky-700 shadow-sm">{currentWord.word}</span>}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {status === 'idle' ? (
          <button type="button" onClick={start} className="col-span-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 text-sm font-black text-white shadow-sm active:scale-[.98]"><AppIcon name="play" size={17} /> 전체 재생</button>
        ) : (
          <>
            <button type="button" onClick={status === 'paused' ? resume : pause} className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 text-sm font-black text-white active:scale-[.98]"><AppIcon name={status === 'paused' ? 'play' : 'pause'} size={17} /> {status === 'paused' ? '이어듣기' : '일시정지'}</button>
            <button type="button" onClick={stop} className="flex min-h-12 items-center justify-center rounded-2xl bg-slate-800 text-white active:scale-[.98]" aria-label="자동 재생 정지"><AppIcon name="stop" size={17} /></button>
          </>
        )}
      </div>

      <div className="mt-4 space-y-3 border-t border-sky-100 pt-4">
        <ControlRow label="재생 대상">
          <div className="grid grid-cols-2 gap-1.5">
            {targetOptions.map((option) => <ControlButton key={option.id} active={target === option.id} onClick={() => changeSetting(setTarget, option.id)}>{option.label}</ControlButton>)}
          </div>
        </ControlRow>
        <ControlRow label="재생 속도">
          <div className="grid grid-cols-3 gap-1.5">
            {([0.8, 1, 1.2] as const).map((value) => <ControlButton key={value} active={speed === value} onClick={() => changeSetting(setSpeed, value)}>{value.toFixed(1)}배</ControlButton>)}
          </div>
        </ControlRow>
        <ControlRow label="반복 횟수">
          <div className="grid grid-cols-3 gap-1.5">
            {([1, 2, 3] as const).map((value) => <ControlButton key={value} active={repeat === value} onClick={() => changeSetting(setRepeat, value)}>{value}회</ControlButton>)}
          </div>
        </ControlRow>
        <ControlRow label="재생 방식">
          <div className="grid grid-cols-1 gap-1.5">
            {modeOptions.map((option) => <ControlButton key={option.id} active={mode === option.id} onClick={() => changeSetting(setMode, option.id)}>{option.label}{option.id === 'en-ko-en' ? ' · 추천' : ''}</ControlButton>)}
          </div>
        </ControlRow>
      </div>
      {error && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800" aria-live="polite">{error}</p>}
    </section>
  );
}

function ControlRow({ label, children }: { label: string; children: ReactNode }) {
  return <div><p className="mb-1.5 text-xs font-extrabold text-muted">{label}</p>{children}</div>;
}

function ControlButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`min-h-9 rounded-xl px-2 text-xs font-extrabold transition active:scale-[.98] ${active ? 'bg-sky-500 text-white shadow-sm' : 'bg-white text-muted ring-1 ring-sky-100'}`}>{children}</button>;
}
