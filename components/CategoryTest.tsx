'use client';

import { useMemo, useState } from 'react';
import { recognizeWord, speakAmericanEnglish, type SpeechScore } from '@/src/lib/speech';
import type { TestMode, TestResult, Word } from '@/src/types';
import AppIcon, { type AppIconName } from './AppIcon';

type Answer = {
  word: Word;
  correct: boolean;
  response: string;
};

const modeOptions: { id: TestMode; title: string; description: string; icon: AppIconName }[] = [
  { id: 'en-ko', title: '영어 → 한국어', description: '영어를 보고 뜻 고르기', icon: 'words' },
  { id: 'ko-en', title: '한국어 → 영어', description: '뜻을 보고 단어 고르기', icon: 'example' },
  { id: 'listening', title: '발음 듣고 맞추기', description: '소리를 듣고 뜻 고르기', icon: 'listen' },
  { id: 'speaking', title: '말하기 시험', description: '뜻을 보고 영어로 말하기', icon: 'speak' },
];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export default function CategoryTest({
  title,
  words,
  allWords,
  onClose,
  onComplete,
}: {
  title: string;
  words: Word[];
  allWords: Word[];
  onClose: () => void;
  onComplete: (result: TestResult) => void;
}) {
  const [phase, setPhase] = useState<'setup' | 'quiz' | 'result'>('setup');
  const [mode, setMode] = useState<TestMode>('en-ko');
  const [count, setCount] = useState<10 | 20 | 'all'>(10);
  const [quizWords, setQuizWords] = useState<Word[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pendingAnswer, setPendingAnswer] = useState<Answer | null>(null);
  const [speechResult, setSpeechResult] = useState<SpeechScore | null>(null);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState('');

  const question = quizWords[questionIndex];
  const correctAnswerCount = answers.filter((answer) => answer.correct).length;
  const resultScore = Math.round((correctAnswerCount / Math.max(answers.length, 1)) * 100);
  const optionValues = useMemo(() => {
    if (!question || mode === 'speaking') return [];
    const answerFor = (word: Word) => mode === 'ko-en' ? word.word : word.meaning;
    const correct = answerFor(question);
    const pool = unique(allWords.filter((word) => word.id !== question.id).map(answerFor));
    return shuffle([correct, ...shuffle(pool).slice(0, 3)]);
  }, [allWords, mode, question]);

  const startQuiz = (source = words) => {
    const requested = count === 'all' ? source.length : count;
    const selectedWords = shuffle(source).slice(0, Math.min(requested, source.length));
    setQuizWords(selectedWords);
    setQuestionIndex(0);
    setAnswers([]);
    setPendingAnswer(null);
    setSpeechResult(null);
    setSpeechError('');
    setPhase('quiz');
  };

  const saveResult = (finalAnswers: Answer[]) => {
    const wrongWordIds = finalAnswers.filter((answer) => !answer.correct).map((answer) => answer.word.id);
    onComplete({
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `test-${Date.now()}`,
      completedAt: new Date().toISOString(),
      category: title,
      mode,
      total: finalAnswers.length,
      correct: finalAnswers.length - wrongWordIds.length,
      wrongWordIds,
    });
    setAnswers(finalAnswers);
    setPhase('result');
  };

  const goNext = () => {
    if (!question || !pendingAnswer) return;
    const finalAnswers = [...answers, pendingAnswer];
    if (questionIndex >= quizWords.length - 1) {
      saveResult(finalAnswers);
      return;
    }
    setAnswers(finalAnswers);
    setQuestionIndex((value) => value + 1);
    setPendingAnswer(null);
    setSpeechResult(null);
    setSpeechError('');
  };

  const answerChoice = (value: string) => {
    if (!question || pendingAnswer) return;
    const correctValue = mode === 'ko-en' ? question.word : question.meaning;
    setPendingAnswer({ word: question, correct: value === correctValue, response: value });
  };

  const startSpeaking = () => {
    if (!question || pendingAnswer) return;
    setListening(true);
    setSpeechError('');
    setSpeechResult(null);
    const recognition = recognizeWord({
      target: question.word,
      onResult: (result) => {
        setSpeechResult(result);
        setPendingAnswer({ word: question, correct: result.passed, response: result.transcript });
      },
      onError: () => {
        setListening(false);
        setSpeechError('마이크 권한을 확인하고 다시 시도해주세요.');
      },
      onEnd: () => setListening(false),
    });
    if (!recognition) {
      setListening(false);
      setSpeechError('이 브라우저에서는 음성 인식을 사용할 수 없어요.');
    }
  };

  const markUnknown = () => {
    if (!question || pendingAnswer) return;
    setPendingAnswer({ word: question, correct: false, response: '모르겠어요' });
  };

  const retryWrong = () => {
    const wrongWords = answers.filter((answer) => !answer.correct).map((answer) => answer.word);
    if (wrongWords.length) startQuiz(wrongWords);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={`${title} 시험`}>
      <div className="max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-[30px] bg-background px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:rounded-[30px]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold text-leaf">단어 시험</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-muted shadow-sm" aria-label="시험 닫기"><AppIcon name="close" size={19} /></button>
        </div>

        {phase === 'setup' && (
          <div className="mt-6">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-leaf">
              체크하여 외운 단어 <strong>{words.length}개</strong>가 시험 대상이에요.
            </div>

            <p className="mb-3 mt-6 text-sm font-extrabold text-ink">시험 종류</p>
            <div className="grid grid-cols-2 gap-2">
              {modeOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => setMode(option.id)} className={`min-h-24 rounded-2xl border p-3 text-left active:scale-[.98] ${mode === option.id ? 'border-leaf bg-mint' : 'border-slate-200 bg-white'}`}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-leaf"><AppIcon name={option.icon} size={18} /></span>
                  <span className="mt-2 block text-sm font-extrabold text-ink">{option.title}</span>
                  <span className="mt-1 block text-[11px] leading-4 text-muted">{option.description}</span>
                </button>
              ))}
            </div>

            <p className="mb-3 mt-6 text-sm font-extrabold text-ink">문제 수</p>
            <div className="grid grid-cols-3 gap-2">
              {([10, 20, 'all'] as const).map((value) => (
                <button key={value} type="button" onClick={() => setCount(value)} className={`min-h-12 rounded-xl text-sm font-extrabold ${count === value ? 'bg-leaf text-white' : 'bg-white text-muted shadow-sm'}`}>
                  {value === 'all' ? `전체 ${words.length}` : `${value}문제`}
                </button>
              ))}
            </div>

            <button type="button" disabled={words.length === 0} onClick={() => startQuiz()} className="mt-6 min-h-14 w-full rounded-2xl bg-leaf text-base font-black text-white shadow-soft active:scale-[.99] disabled:bg-slate-300">
              {words.length ? '시험 시작' : '먼저 외운 단어를 체크해주세요'}
            </button>
          </div>
        )}

        {phase === 'quiz' && question && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-bold text-muted">
              <span>{questionIndex + 1} / {quizWords.length}</span>
              <span>{modeOptions.find((option) => option.id === mode)?.title}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${((questionIndex + 1) / quizWords.length) * 100}%` }} /></div>

            <div className="mt-7 rounded-[28px] bg-white p-6 text-center shadow-soft">
              {mode === 'en-ko' && <><p className="text-sm font-bold text-muted">뜻을 골라보세요</p><p className="mt-4 text-4xl font-black text-ink">{question.word}</p><p className="mt-2 text-sm font-semibold text-muted">({question.pronunciation})</p></>}
              {mode === 'ko-en' && <><p className="text-sm font-bold text-muted">영어 단어를 골라보세요</p><p className="mt-4 text-3xl font-black text-ink">{question.meaning}</p></>}
              {mode === 'listening' && <><p className="text-sm font-bold text-muted">발음을 듣고 뜻을 골라보세요</p><button type="button" onClick={() => speakAmericanEnglish(question.word)} className="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full bg-mint text-leaf active:scale-95" aria-label="문제 발음 듣기"><AppIcon name="listen" size={34} /></button><p className="mt-3 text-xs font-semibold text-muted">버튼을 눌러 여러 번 들을 수 있어요.</p></>}
              {mode === 'speaking' && <><p className="text-sm font-bold text-muted">영어로 말해보세요</p><p className="mt-4 text-3xl font-black text-ink">{question.meaning}</p><p className="mt-2 text-sm font-semibold text-muted">힌트: ({question.pronunciation})</p><button type="button" onClick={startSpeaking} disabled={listening || Boolean(pendingAnswer)} className="mt-5 inline-flex min-h-14 items-center gap-2 rounded-2xl bg-leaf px-6 text-sm font-black text-white disabled:opacity-60"><AppIcon name="speak" size={18} /> {listening ? '듣는 중…' : '말하기'}</button></>}
            </div>

            {mode !== 'speaking' && (
              <div className="mt-4 grid gap-2">
                {optionValues.map((value) => {
                  const correctValue = mode === 'ko-en' ? question.word : question.meaning;
                  const chosen = pendingAnswer?.response === value;
                  const showCorrect = Boolean(pendingAnswer) && value === correctValue;
                  return <button key={value} type="button" disabled={Boolean(pendingAnswer)} onClick={() => answerChoice(value)} className={`min-h-14 rounded-2xl border px-4 text-left text-sm font-extrabold active:scale-[.99] ${showCorrect ? 'border-leaf bg-emerald-100 text-leaf' : chosen ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-ink'}`}>{value}</button>;
                })}
              </div>
            )}

            {speechResult && (
              <div className={`mt-4 rounded-2xl p-4 ${speechResult.passed ? 'bg-emerald-50 text-leaf' : 'bg-amber-50 text-amber-900'}`}>
                <p className="font-black">{speechResult.score}점 · {speechResult.passed ? '잘 들렸어요!' : '한 번 더 연습해요'}</p>
                <p className="mt-1 text-xs leading-5">인식: {speechResult.transcript}</p>
                <p className="mt-1 text-xs leading-5">{speechResult.correction}</p>
              </div>
            )}
            {speechError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{speechError}</p>}

            {pendingAnswer ? (
              <div className={`mt-4 rounded-2xl p-4 ${pendingAnswer.correct ? 'bg-emerald-50 text-leaf' : 'bg-rose-50 text-rose-700'}`}>
                <p className="font-black">{pendingAnswer.correct ? '정답이에요!' : `정답: ${question.word} · ${question.meaning}`}</p>
                <button type="button" onClick={goNext} className="mt-3 min-h-12 w-full rounded-xl bg-ink text-sm font-black text-white">{questionIndex === quizWords.length - 1 ? '결과 보기' : '다음 문제'}</button>
              </div>
            ) : (
              <button type="button" onClick={markUnknown} className="mt-4 min-h-11 w-full rounded-xl text-sm font-bold text-muted">모르겠어요</button>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div className="mt-6">
            <div className="rounded-[28px] bg-leaf p-6 text-center text-white shadow-soft">
              <p className="text-sm font-bold text-white/80">시험 결과</p>
              <p className="mt-2 text-5xl font-black">{resultScore}점</p>
              <p className="mt-2 text-sm font-bold">{correctAnswerCount} / {answers.length} 정답</p>
            </div>

            <div className="mt-5 space-y-2">
              {answers.map((answer, index) => (
                <div key={`${answer.word.id}-${index}`} className={`rounded-2xl border p-3 ${answer.correct ? 'border-emerald-100 bg-white' : 'border-rose-200 bg-rose-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-extrabold text-ink">{index + 1}. {answer.word.word} <span className="text-sm font-semibold text-muted">({answer.word.pronunciation})</span></p>
                    <span className={answer.correct ? 'text-leaf' : 'text-rose-600'}><AppIcon name={answer.correct ? 'check' : 'close'} size={18} /></span>
                  </div>
                  <p className="mt-1 text-sm text-muted">정답: {answer.word.meaning}</p>
                  {!answer.correct && <p className="mt-1 text-xs text-rose-700">내 답: {answer.response}</p>}
                </div>
              ))}
            </div>

            {answers.some((answer) => !answer.correct) && <button type="button" onClick={retryWrong} className="mt-5 min-h-14 w-full rounded-2xl bg-rose-100 text-sm font-black text-rose-700">틀린 문제만 다시 시험</button>}
            <button type="button" onClick={onClose} className="mt-2 min-h-14 w-full rounded-2xl bg-ink text-sm font-black text-white">시험 마치기</button>
          </div>
        )}
      </div>
    </div>
  );
}
