'use client';

import { useState } from 'react';
import type { Word } from '@/src/types';

type Props = {
  word: Word;
  favorite: boolean;
  progress?: { mastered: boolean; correctStreak: number; interval: number };
  onFavorite: () => void;
  onReview: (correct: boolean) => void;
};

type RecognitionEvent = { results: { [key: number]: { [key: number]: { transcript: string } } } };
type Recognition = {
  lang: string;
  start: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
  return true;
}

function getRecognition(): Recognition | null {
  if (typeof window === 'undefined') return null;
  const recognitionWindow = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const SpeechRecognition = recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;
  return SpeechRecognition ? new SpeechRecognition() : null;
}

function scoreSpeech(target: string, heard: string) {
  const clean = (value: string) => value.toLowerCase().replace(/[^a-z ]/g, '').trim();
  const expected = clean(target);
  const spoken = clean(heard);
  if (!expected) return 0;
  if (spoken === expected) return 100;
  if (spoken.includes(expected) || expected.includes(spoken)) return 80;
  return 35;
}

export default function WordCard({ word, favorite, progress, onFavorite, onReview }: Props) {
  const [showExample, setShowExample] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const startPractice = () => {
    const recognition = getRecognition();
    if (!recognition) {
      setFeedback('이 브라우저는 음성 인식을 지원하지 않아요. 발음 듣기 후 소리 내어 따라 말해보세요.');
      return;
    }
    setIsListening(true);
    setFeedback('영어 단어를 또렷하게 말해보세요…');
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const heard = event.results[0][0].transcript;
      const score = scoreSpeech(word.word, heard);
      const isCorrect = score >= 60;
      setFeedback(`${score}점 · ${isCorrect ? '좋아요! 이해할 수 있는 발음이에요.' : '괜찮아요. 발음을 듣고 천천히 다시 말해보세요.'}`);
      setIsListening(false);
      onReview(isCorrect);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setFeedback('마이크 권한과 인터넷 연결을 확인한 뒤 다시 시도해보세요.');
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

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
          <p className="mt-1 text-base font-semibold text-muted">{word.pronunciation} · {word.meaning}</p>
        </div>
        <button onClick={onFavorite} aria-label={favorite ? '즐겨찾기 해제' : '즐겨찾기에 저장'} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition active:scale-95 ${favorite ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>{favorite ? '★' : '☆'}</button>
      </div>

      <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-ink">{word.explanation}</p>
      {showExample && <div className="mt-3 rounded-2xl border border-dashed border-leaf/30 bg-emerald-50 px-4 py-3"><p className="text-xs font-bold text-leaf">문장 보기</p><p className="mt-1 text-lg font-bold text-ink">{word.example}</p></div>}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => { if (!speak(word.word)) setFeedback('이 브라우저에서는 음성 재생을 사용할 수 없어요.'); }} className="min-h-[52px] rounded-2xl bg-mint px-3 text-sm font-extrabold text-leaf active:scale-[.98]">🔊 발음 듣기</button>
        <button onClick={() => setShowExample((value) => !value)} className="min-h-[52px] rounded-2xl border border-slate-200 px-3 text-sm font-extrabold text-ink active:scale-[.98]">{showExample ? '문장 닫기' : '문장 보기'}</button>
      </div>
      <button onClick={startPractice} disabled={isListening} className="mt-2 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-leaf px-3 text-sm font-extrabold text-white active:scale-[.98] disabled:opacity-60">🎙 {isListening ? '듣고 있어요…' : '따라 말하기'}</button>
      {feedback && <p aria-live="polite" className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-semibold leading-5 text-amber-800">{feedback}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
        <button onClick={() => onReview(false)} className="min-h-11 rounded-xl bg-slate-100 px-3 text-sm font-bold text-muted active:scale-[.98]">다시 복습할게요</button>
        <button onClick={() => onReview(true)} className="min-h-11 rounded-xl bg-emerald-50 px-3 text-sm font-extrabold text-leaf active:scale-[.98]">외웠어요</button>
      </div>
      {progress && progress.correctStreak > 0 && <p className="mt-3 text-center text-xs text-muted">연속 정답 {progress.correctStreak}회 · {progress.interval}일 뒤 복습</p>}
    </article>
  );
}
