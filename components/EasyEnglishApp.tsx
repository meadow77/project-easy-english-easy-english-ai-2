'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { nounCategories, partOfSpeechGroups, words } from '@/src/data';
import { dayKey, dueWords, INITIAL_STATE, loadState, reviewWord, saveState } from '@/src/lib/storage';
import type { StoredState, Tab, Word } from '@/src/types';
import WordCard from './WordCard';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: '오늘', icon: '☀' },
  { id: 'words', label: '단어', icon: 'A' },
  { id: 'review', label: '복습', icon: '↻' },
  { id: 'favorites', label: '즐겨찾기', icon: '★' },
  { id: 'search', label: '검색', icon: '⌕' },
];

function SectionTitle({ title, description, count }: { title: string; description?: string; count?: number }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm leading-5 text-muted">{description}</p>}
      </div>
      {count !== undefined && <span className="shrink-0 rounded-full bg-mint px-3 py-1 text-sm font-bold text-leaf">{count}개</span>}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center shadow-soft">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-4 text-lg font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

export default function EasyEnglishApp() {
  const [tab, setTab] = useState<Tab>('today');
  const [state, setState] = useState<StoredState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [selectedPart, setSelectedPart] = useState<string>('전체');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [hydrated, state]);

  const newWords = useMemo(() => {
    const untouched = words.filter((word) => !state.progress[word.id]);
    return (untouched.length >= 30 ? untouched : words).slice(0, 30);
  }, [state.progress]);
  const due = useMemo(() => dueWords(words, state), [state]);
  const todayReview = useMemo(() => {
    const fallback = words.filter((word) => !newWords.some((newWord) => newWord.id === word.id));
    return (due.length ? due : fallback).slice(0, 20);
  }, [due, newWords]);
  const todayWords = useMemo(() => [...newWords, ...todayReview], [newWords, todayReview]);
  const completedToday = todayWords.filter((word) => state.progress[word.id]?.lastReviewed === dayKey()).length;

  const handleReview = (wordId: string, correct: boolean) => {
    setState((current) => reviewWord(current, wordId, correct));
  };

  const handleFavorite = (wordId: string) => {
    setState((current) => ({
      ...current,
      favorites: current.favorites.includes(wordId)
        ? current.favorites.filter((id) => id !== wordId)
        : [...current.favorites, wordId],
    }));
  };

  const cardProps = (word: Word): ComponentProps<typeof WordCard> => ({
    word,
    favorite: state.favorites.includes(word.id),
    progress: state.progress[word.id],
    onFavorite: () => handleFavorite(word.id),
    onReview: (correct: boolean) => handleReview(word.id, correct),
  });

  const renderPage = () => {
    if (tab === 'today') {
      return <TodayPage todayWords={todayWords} completedToday={completedToday} state={state} onNavigate={setTab} getProps={cardProps} />;
    }
    if (tab === 'words') {
      const filtered = words.filter((word) => (
        (selectedPart === '전체' || word.partOfSpeech === selectedPart)
        && (selectedCategory === '전체' || word.category === selectedCategory)
      ));
      return <WordsPage words={filtered} selectedPart={selectedPart} selectedCategory={selectedCategory} onPartChange={(value) => { setSelectedPart(value); setSelectedCategory('전체'); }} onCategoryChange={setSelectedCategory} getProps={cardProps} />;
    }
    if (tab === 'review') return <ReviewPage words={due} getProps={cardProps} />;
    if (tab === 'favorites') return <FavoritesPage words={words.filter((word) => state.favorites.includes(word.id))} getProps={cardProps} />;

    const results = words.filter((word) => (
      `${word.word} ${word.meaning} ${word.pronunciation} ${word.category} ${word.partOfSpeech}`.toLowerCase().includes(query.toLowerCase())
    )).slice(0, 50);
    return <SearchPage query={query} onQueryChange={setQuery} words={results} getProps={cardProps} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto min-h-screen max-w-2xl bg-background px-5 pb-32 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-8">
        <header className="mb-8 flex items-center justify-between">
          <button onClick={() => setTab('today')} className="min-h-11 text-left" aria-label="오늘의 학습으로 이동">
            <p className="text-xl font-extrabold tracking-tight text-ink">Easy English</p>
            <p className="mt-1 text-sm font-semibold text-muted">Speak English Every Day</p>
          </button>
          <button onClick={() => setTab('favorites')} aria-label="즐겨찾기 보기" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl text-amber-500 shadow-soft">★</button>
        </header>
        {renderPage()}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-emerald-100 bg-white/95 pb-safe shadow-[0_-8px_24px_rgba(27,55,39,.06)] backdrop-blur-md" aria-label="주요 메뉴">
        <div className="mx-auto grid max-w-2xl grid-cols-5 px-2 pt-2">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition ${tab === item.id ? 'bg-mint text-leaf' : 'text-slate-400'}`} aria-current={tab === item.id ? 'page' : undefined}>
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function TodayPage({ todayWords, completedToday, state, onNavigate, getProps }: { todayWords: Word[]; completedToday: number; state: StoredState; onNavigate: (tab: Tab) => void; getProps: (word: Word) => ComponentProps<typeof WordCard> }) {
  const learned = state.completedWordIds.length;
  const reviewNeeded = dueWords(words, state).length;
  const completionRate = words.length ? Math.round((learned / words.length) * 100) : 0;

  return (
    <div>
      <section className="mb-5 overflow-hidden rounded-[28px] bg-leaf p-6 text-white shadow-soft">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-100">Today&apos;s learning</p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">오늘의 학습</h1>
            <p className="mt-2 text-sm text-emerald-50">새 단어 30개 · 복습 20개</p>
          </div>
          <span className="rounded-2xl bg-white/15 px-3 py-2 text-sm font-extrabold">{completedToday} / 50</span>
        </div>
        <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.min((completedToday / 50) * 100, 100)}%` }} />
        </div>
        <button onClick={() => document.getElementById('today-cards')?.scrollIntoView({ behavior: 'smooth' })} className="mt-5 min-h-14 w-full rounded-2xl bg-white px-5 text-base font-extrabold text-leaf active:scale-[.99]">오늘 학습 시작하기</button>
      </section>

      <section className="mb-7 grid grid-cols-2 gap-3">
        <QuickAction icon="A" title="회화 필수 단어" subtitle="품사별로 보기" onClick={() => onNavigate('words')} />
        <QuickAction icon="↻" title="복습" subtitle={reviewNeeded ? `${reviewNeeded}개 기다려요` : '복습 일정 확인'} onClick={() => onNavigate('review')} />
        <QuickAction icon="★" title="즐겨찾기" subtitle={`${state.favorites.length}개 저장됨`} onClick={() => onNavigate('favorites')} />
        <QuickAction icon="⌕" title="검색" subtitle="영어 · 한국어" onClick={() => onNavigate('search')} />
      </section>

      <section className="mb-7 grid grid-cols-4 gap-2">
        <StatBox label="전체" value={words.length} />
        <StatBox label="학습 완료" value={learned} />
        <StatBox label="복습 필요" value={reviewNeeded} />
        <StatBox label="학습률" value={`${completionRate}%`} />
      </section>

      <section id="today-cards">
        <SectionTitle title="오늘의 단어" description="듣고, 따라 말하고, 천천히 익혀보세요." count={todayWords.length} />
        <div className="space-y-4">{todayWords.map((word) => <WordCard key={word.id} {...getProps(word)} />)}</div>
      </section>
    </div>
  );
}

function QuickAction({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle: string; onClick: () => void }) {
  return <button onClick={onClick} className="min-h-28 rounded-3xl bg-white p-4 text-left shadow-soft transition active:scale-[.98]"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint text-lg font-extrabold text-leaf">{icon}</span><span className="mt-3 block text-sm font-extrabold text-ink">{title}</span><span className="mt-1 block text-xs text-muted">{subtitle}</span></button>;
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-emerald-100 bg-white p-3 text-center shadow-sm"><p className="text-lg font-extrabold text-ink">{value}</p><p className="mt-1 text-[11px] font-semibold text-muted">{label}</p></div>;
}

function WordsPage({ words: filtered, selectedPart, selectedCategory, onPartChange, onCategoryChange, getProps }: { words: Word[]; selectedPart: string; selectedCategory: string; onPartChange: (value: string) => void; onCategoryChange: (value: string) => void; getProps: (word: Word) => ComponentProps<typeof WordCard> }) {
  return <div><SectionTitle title="회화 필수 단어" description="자주 쓰는 단어부터 천천히 익혀요." count={filtered.length} /><div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-2">{['전체', ...partOfSpeechGroups].map((part) => <button key={part} onClick={() => onPartChange(part)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${selectedPart === part ? 'bg-leaf text-white' : 'bg-white text-muted shadow-sm'}`}>{part}</button>)}</div>{selectedPart === '명사' && <div className="mb-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">{['전체', ...nounCategories].map((category) => <button key={category} onClick={() => onCategoryChange(category)} className={`min-h-10 shrink-0 rounded-full border px-3 text-xs font-bold ${selectedCategory === category ? 'border-leaf bg-mint text-leaf' : 'border-slate-200 bg-white text-muted'}`}>{category}</button>)}</div>}<div className="space-y-4">{filtered.map((word) => <WordCard key={word.id} {...getProps(word)} />)}</div></div>;
}

function ReviewPage({ words: due, getProps }: { words: Word[]; getProps: (word: Word) => ComponentProps<typeof WordCard> }) {
  return <div><SectionTitle title="복습" description="잊기 전에 다시 만나면 오래 기억돼요." count={due.length} />{due.length === 0 ? <EmptyState icon="🌱" title="오늘 복습할 단어가 없어요" description="새 단어를 공부하면 1일 후부터 자동으로 복습 목록에 들어옵니다." /> : <><div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">간격 반복: 1일 → 3일 → 7일 → 14일 → 30일</div><div className="space-y-4">{due.map((word) => <WordCard key={word.id} {...getProps(word)} />)}</div></>}</div>;
}

function FavoritesPage({ words: favoriteWords, getProps }: { words: Word[]; getProps: (word: Word) => ComponentProps<typeof WordCard> }) {
  return <div><SectionTitle title="즐겨찾기" description="저장한 단어만 모아서 복습해요." count={favoriteWords.length} />{favoriteWords.length === 0 ? <EmptyState icon="☆" title="아직 저장한 단어가 없어요" description="단어 카드 오른쪽 위 별표를 눌러 저장해보세요." /> : <div className="space-y-4">{favoriteWords.map((word) => <WordCard key={word.id} {...getProps(word)} />)}</div>}</div>;
}

function SearchPage({ query, onQueryChange, words: results, getProps }: { query: string; onQueryChange: (value: string) => void; words: Word[]; getProps: (word: Word) => ComponentProps<typeof WordCard> }) {
  return <div><SectionTitle title="검색" description="영어, 한국어, 한글 발음으로 찾아보세요." /><div className="mb-5 flex min-h-14 items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 shadow-soft"><span className="text-2xl text-muted">⌕</span><input autoFocus value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="예: 공항, water, 워터" className="min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none placeholder:text-slate-400" /></div>{query ? <><p className="mb-4 text-sm text-muted"><strong className="text-ink">{results.length}개</strong>를 찾았어요.</p><div className="space-y-4">{results.map((word) => <WordCard key={word.id} {...getProps(word)} />)}</div></> : <EmptyState icon="⌕" title="무엇을 찾고 있나요?" description="영어 단어 또는 한국어 뜻을 입력해보세요." />}</div>;
}
