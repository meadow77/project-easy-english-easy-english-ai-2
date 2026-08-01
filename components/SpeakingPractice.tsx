'use client';

import { useState } from 'react';
import { recognizeWord, type SpeechScore } from '@/src/lib/speech';

export default function SpeakingPractice({
  target,
  onEvaluated,
  compact = false,
}: {
  target: string;
  onEvaluated?: (correct: boolean) => void;
  compact?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<SpeechScore | null>(null);
  const [error, setError] = useState('');

  const start = () => {
    setError('');
    setResult(null);
    setListening(true);
    const recognition = recognizeWord({
      target,
      onResult: (nextResult) => {
        setResult(nextResult);
        onEvaluated?.(nextResult.passed);
      },
      onError: () => {
        setListening(false);
        setError('마이크 권한을 확인한 뒤 다시 말해보세요.');
      },
      onEnd: () => setListening(false),
    });

    if (!recognition) {
      setListening(false);
      setError('이 브라우저에서는 음성 인식을 사용할 수 없어요. iPhone Safari 또는 Chrome에서 시도해주세요.');
    }
  };

  return (
    <div className={compact ? 'rounded-xl bg-emerald-50 p-3' : 'rounded-2xl bg-emerald-50 p-4'}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold text-leaf">말하기 연습</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">“{target}”라고 말해보세요.</p>
        </div>
        <button
          type="button"
          onClick={start}
          disabled={listening}
          className="min-h-11 shrink-0 rounded-xl bg-leaf px-4 text-sm font-extrabold text-white active:scale-[.98] disabled:opacity-60"
        >
          {listening ? '듣는 중…' : result ? '다시 연습' : '말하기'}
        </button>
      </div>

      {result && (
        <div className="mt-3 border-t border-emerald-100 pt-3" aria-live="polite">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-sm font-extrabold ${result.passed ? 'bg-white text-leaf' : 'bg-amber-100 text-amber-800'}`}>{result.score}점</span>
            <span className="text-xs font-semibold text-muted">인식: {result.transcript}</span>
          </div>
          <p className="mt-2 text-xs font-bold text-ink">잘한 부분 · {result.good}</p>
          <p className="mt-1 text-xs leading-5 text-muted">고칠 부분 · {result.correction}</p>
        </div>
      )}
      {error && <p className="mt-3 text-xs font-semibold leading-5 text-rose-700" aria-live="polite">{error}</p>}
    </div>
  );
}