export type SpeechScore = {
  score: number;
  passed: boolean;
  transcript: string;
  good: string;
  correction: string;
};

type RecognitionAlternative = { transcript: string; confidence: number };
type RecognitionResult = { 0: RecognitionAlternative };
type RecognitionEvent = { results: { 0: RecognitionResult } };

type RecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => RecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

const preferredVoiceNames = [
  'Samantha',
  'Ava',
  'Allison',
  'Susan',
  'Google US English',
  'Microsoft Aria Online',
  'Microsoft Jenny Online',
  'Microsoft Zira',
];

function chooseAmericanVoice(voices: SpeechSynthesisVoice[]) {
  const american = voices.filter((voice) => voice.lang.toLowerCase().replace('_', '-').startsWith('en-us'));
  return preferredVoiceNames.map((name) => american.find((voice) => voice.name.includes(name))).find(Boolean) ?? american[0];
}

export function prepareAmericanVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.getVoices();
}

export function speakAmericanEnglish(text: string, rate = 0.82) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const cleanText = text.trim();
  const utterance = new SpeechSynthesisUtterance(cleanText.toLowerCase() === 'i' ? 'I.' : cleanText);
  const voice = chooseAmericanVoice(window.speechSynthesis.getVoices());
  utterance.lang = 'en-US';
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, () => Array<number>(a.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      matrix[j][i] = b[j - 1] === a[i - 1]
        ? matrix[j - 1][i - 1]
        : Math.min(matrix[j - 1][i - 1] + 1, matrix[j][i - 1] + 1, matrix[j - 1][i] + 1);
    }
  }
  return matrix[b.length][a.length];
}

export function scoreSpeech(target: string, transcript: string, confidence = 0) : SpeechScore {
  const expected = normalize(target);
  const heard = normalize(transcript);
  const aliases: Record<string, string[]> = { i: ['i', 'eye'], two: ['two', 'to', 'too'], one: ['one', 'won'] };
  const exact = expected === heard || aliases[expected]?.includes(heard);
  const distance = levenshtein(expected, heard);
  const similarity = expected || heard ? 1 - distance / Math.max(expected.length, heard.length, 1) : 0;
  const score = exact
    ? Math.max(88, Math.min(100, Math.round((confidence || 0.92) * 100)))
    : Math.max(0, Math.min(87, Math.round(similarity * 85 + confidence * 15)));
  const passed = score >= 70;

  return {
    score,
    passed,
    transcript,
    good: exact ? '단어의 핵심 소리가 정확하게 인식됐어요.' : passed ? '원어민이 이해할 수 있는 수준으로 들렸어요.' : '끝까지 소리 내어 말한 점이 좋아요.',
    correction: passed
      ? '원어민 음성을 한 번 더 듣고 리듬까지 따라 해보세요.'
      : `“${target}”의 첫소리와 끝소리를 더 또렷하게 천천히 말해보세요.`,
  };
}

export function startAmericanRecognition({
  onResult,
  onError,
  onEnd,
}: {
  onResult: (result: SpeechScore) => void;
  onError: () => void;
  onEnd?: () => void;
}) {
  if (typeof window === 'undefined') return null;
  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  recognition.onerror = onError;
  recognition.onend = () => onEnd?.();
  recognition.onresult = (event) => {
    const alternative = event.results[0][0];
    onResult(scoreSpeech('', alternative.transcript, alternative.confidence));
  };
  return recognition;
}

export function recognizeWord({
  target,
  onResult,
  onError,
  onEnd,
}: {
  target: string;
  onResult: (result: SpeechScore) => void;
  onError: () => void;
  onEnd?: () => void;
}) {
  if (typeof window === 'undefined') return null;
  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  recognition.onerror = onError;
  recognition.onend = () => onEnd?.();
  recognition.onresult = (event) => {
    const alternative = event.results[0][0];
    onResult(scoreSpeech(target, alternative.transcript, alternative.confidence));
  };
  recognition.start();
  return recognition;
}