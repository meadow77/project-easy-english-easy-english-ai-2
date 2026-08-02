'use client';

import { useState } from 'react';
import { getWordExamples } from '@/src/lib/examples';
import type { TestResult, Word } from '@/src/types';
import AppIcon from './AppIcon';

type SentenceQuestion = {
  word: Word;
  sentence: string;
  translation: string;
  choices: string[];
};

type Answer = {
  question: SentenceQuestion;
  response: string;
  correct: boolean;
};

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function blankWord(sentence: string, word: string) {
  const location = sentence.toLocaleLowerCase('en-US').indexOf(word.toLocaleLowerCase('en-US'));
  if (location < 0) return sentence;
  return `${sentence.slice(0, location)}_____${sentence.slice(location + word.length)}`;
}

function createQuestion(word: Word, allWords: Word[], exampleIndex: number): SentenceQuestion {
  const examples = getWordExamples(word);
  const example = examples.find((item) => item.english.toLocaleLowerCase('en-US').includes(word.word.toLocaleLowerCase('en-US')))
    ?? examples[exampleIndex % examples.length];
  const distractors = shuffle(
    [...new Set(allWords.filter((item) => item.id !== word.id).map((item) => item.word))],
  ).slice(0, 3);

  return {
    word,
    sentence: blankWord(example.english, word.word),
    translation: example.korean,
    choices: shuffle([word.word, ...distractors]),
  };
}

export default function SentenceTest({
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
  const [count, setCount] = useState<10 | 20 | 'all'>(10);
  const [questions, setQuestions] = useState<SentenceQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pendingAnswer, setPendingAnswer] = useState<Answer | null>(null);

  const question = questions[questionIndex];
  const correctCount = answers.filter((answer) => answer.correct).length;
  const score = Math.round((correctCount / Math.max(answers.length, 1)) * 100);

  const startQuiz = (source = words) => {
    const requested = count === 'all' ? source.length : count;
    const selected = shuffle(source).slice(0, Math.min(requested, source.length));
    setQuestions(selected.map((word, index) => createQuestion(word, allWords, index)));
    setQuestionIndex(0);
    setAnswers([]);
    setPendingAnswer(null);
    setPhase('quiz');
  };

  const saveResult = (finalAnswers: Answer[]) => {
    const wrongWordIds = finalAnswers.filter((answer) => !answer.correct).map((answer) => answer.question.word.id);
    onComplete({
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `sentence-test-${Date.now()}`,
      completedAt: new Date().toISOString(),
      category: title,
      mode: 'sentence',
      total: finalAnswers.length,
      correct: finalAnswers.length - wrongWordIds.length,
      wrongWordIds,
    });
    setAnswers(finalAnswers);
    setPhase('result');
  };

  const answerChoice = (choice: string) => {
    if (!question || pendingAnswer) return;
    setPendingAnswer({ question, response: choice, correct: choice === question.word.word });
  };

  const goNext = () => {
    if (!pendingAnswer) return;
    const finalAnswers = [...answers, pendingAnswer];
    if (questionIndex >= questions.length - 1) {
      saveResult(finalAnswers);
      return;
    }
    setAnswers(finalAnswers);
    setQuestionIndex((value) => value + 1);
    setPendingAnswer(null);
  };

  const retryWrong = () => {
    const wrongWords = answers.filter((answer) => !answer.correct).map((answer) => answer.question.word);
    if (wrongWords.length) startQuiz(wrongWords);
  };

  return (
    <div className="fixed inset-0 z-[100] min-h-[100dvh] overflow-y-auto bg-[var(--background)]" role="dialog" aria-modal="true" aria-label={`${title} 문장 시험`}>
      <div className="mx-auto min-h-[100dvh] w-full max-w-xl bg-[var(--background)] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-leaf">문장 시험</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-muted shadow-sm" aria-label="시험 닫기"><AppIcon name="close" size={20} /></button>
        </div>

        {phase === 'setup' && (
          <div className="mt-7">
            <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-base font-semibold leading-7 text-leaf">
              체크하여 외운 단어 <strong>{words.length}개</strong>로 빈칸 문장을 풀어요.
            </div>
            <p className="mb-3 mt-7 text-lg font-extrabold text-ink">문제 수</p>
            <div className="grid grid-cols-3 gap-2">
              {([10, 20, 'all'] as const).map((value) => (
                <button key={value} type="button" onClick={() => setCount(value)} className={`min-h-14 rounded-2xl text-base font-extrabold ${count === value ? 'bg-leaf text-white' : 'bg-white text-muted shadow-sm'}`}>
                  {value === 'all' ? `전체 ${words.length}` : `${value}문제`}
                </button>
              ))}
            </div>
            <button type="button" disabled={words.length === 0} onClick={() => startQuiz()} className="mt-7 min-h-14 w-full rounded-2xl bg-leaf text-lg font-black text-white shadow-soft active:scale-[.99] disabled:bg-slate-300">
              {words.length ? '문장 시험 시작' : '먼저 외운 단어를 체크해 주세요'}
            </button>
          </div>
        )}

        {phase === 'quiz' && question && (
          <div className="mt-7">
            <div className="flex items-center justify-between text-sm font-bold text-muted"><span>{questionIndex + 1} / {questions.length}</span><span>빈칸에 알맞은 단어</span></div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>

            <section className="mt-7 rounded-[28px] bg-white p-6 shadow-soft">
              <p className="text-base font-bold text-muted">문장을 읽고 빈칸에 들어갈 단어를 골라보세요.</p>
              <p className="mt-5 text-2xl font-black leading-10 text-ink">{question.sentence}</p>
              <p className="mt-4 text-base leading-7 text-muted">{question.translation}</p>
            </section>

            <div className="mt-5 grid gap-3">
              {question.choices.map((choice, index) => {
                const selected = pendingAnswer?.response === choice;
                const correct = pendingAnswer && choice === question.word.word;
                return <button key={choice} type="button" disabled={Boolean(pendingAnswer)} onClick={() => answerChoice(choice)} className={`min-h-14 rounded-2xl border px-4 text-left text-lg font-extrabold active:scale-[.99] ${correct ? 'border-leaf bg-emerald-100 text-leaf' : selected ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-ink'}`}><span className="mr-2 text-base text-muted">{String.fromCharCode(9312 + index)}</span>{choice}</button>;
              })}
            </div>

            {pendingAnswer && (
              <div className={`mt-5 rounded-2xl p-4 ${pendingAnswer.correct ? 'bg-emerald-50 text-leaf' : 'bg-rose-50 text-rose-700'}`}>
                <p className="text-lg font-black">{pendingAnswer.correct ? '정답이에요!' : `정답: ${question.word.word} · ${question.word.meaning}`}</p>
                <button type="button" onClick={goNext} className="mt-4 min-h-13 w-full rounded-xl bg-ink text-base font-black text-white">{questionIndex === questions.length - 1 ? '결과 보기' : '다음 문제'}</button>
              </div>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div className="mt-7">
            <section className="rounded-[28px] bg-leaf p-6 text-center text-white shadow-soft"><p className="text-base font-bold text-white/80">문장 시험 결과</p><p className="mt-2 text-5xl font-black">{score}점</p><p className="mt-2 text-lg font-bold">{correctCount} / {answers.length} 정답</p></section>
            <div className="mt-5 space-y-3">
              {answers.map((answer, index) => (
                <article key={`${answer.question.word.id}-${index}`} className={`rounded-2xl border p-4 ${answer.correct ? 'border-emerald-100 bg-white' : 'border-rose-200 bg-rose-50'}`}>
                  <div className="flex items-start justify-between gap-3"><div><p className="text-base font-extrabold text-ink">{index + 1}. {answer.question.sentence}</p><p className="mt-2 text-sm text-muted">정답: {answer.question.word.word} · {answer.question.word.meaning}</p>{!answer.correct && <p className="mt-1 text-sm text-rose-700">내 답: {answer.response}</p>}</div><span className={answer.correct ? 'text-leaf' : 'text-rose-600'}><AppIcon name={answer.correct ? 'check' : 'close'} size={19} /></span></div>
                </article>
              ))}
            </div>
            {answers.some((answer) => !answer.correct) && <button type="button" onClick={retryWrong} className="mt-5 min-h-14 w-full rounded-2xl bg-rose-100 text-base font-black text-rose-700">틀린 문제만 다시 시험</button>}
            <button type="button" onClick={onClose} className="mt-2 min-h-14 w-full rounded-2xl bg-ink text-base font-black text-white">시험 마치기</button>
          </div>
        )}
      </div>
    </div>
  );
}
