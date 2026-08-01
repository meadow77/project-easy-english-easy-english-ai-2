'use client';

import { useEffect, useMemo, useState } from 'react';
import { compactCardGroups, nounCategories, partOfSpeechGroups, words } from '@/src/data';
import { prepareAmericanVoice } from '@/src/lib/speech';
import {
  dayKey,
  dueWords,
  INITIAL_STATE,
  loadState,
  recordTestResult,
  reviewWord,
  saveState,
  setWordCompleted,
  toggleFavorite,
  toggleWrongWord,
} from '@/src/lib/storage';
import type { PartOfSpeech, StoredState, Tab, TestResult, Word } from '@/src/types';
import CategoryTest from './CategoryTest';
import WordCard from './WordCard';
import WordListRow from './WordListRow';
import type { WordStudyProps } from './word-study-types';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: '오늘', icon: '☀' },
  { id: 'words', label: '단어', icon: 'A' },
  { id: 'review', label: '복습', icon: '↻' },
  { id: 'favorites', label: '즐겨찾기', icon: '★' },
  { id: 'search', label: '검색', icon: '⌕' },
];

type TestConfig = { title: string; words: Word[] };
type SelectedPart = PartOfSpeech | '전체';

export default function EasyEnglishApp() {
  const [tab, setTab] = useState<Tab>('today');
  const [state, setState] = useState<StoredState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SelectedPart>('일반동사');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [query, setQuery] = useState('');
  const [reviewMode, setReviewMode] = useState<'schedule' | 'wrong'>('schedule');
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
    prepareAmericanVoice();
    window.speechSynthesis?.addEventListener?.('voiceschanged', prepareAmericanVoice);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', prepareAmericanVoice);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [hydrated, state]);

  const completedSet = useMemo(() => new Set(state.completedWordIds), [state.completedWordIds]);
  const favoriteSet = useMemo(() => new Set(state.favorites), [state.favorites]);
  const wrongSet = useMemo(() => new Set(state.wrongWordIds), [state.wrongWordIds]);
  const due = useMemo(() => dueWords(words, state), [state]);

  const newWords = useMemo(() => {
    const untouched = words.filter((word) => !state.progress[word.id] && !completedSet.has(word.id));
    return (untouched.length >= 30 ? untouched : words.filter((word) => !completedSet.has(word.id))).slice(0, 30);
  }, [completedSet, state.progress]);

  const todayReview = useMemo(() => {
    const newIds = new Set(newWords.map((word) => word.id));
    const fallback = words.filter((word) => completedSet.has(word.id) && !newIds.has(word.id));
    const base = due.length ? due : fallback;
    const fill = words.filter((word) => !newIds.has(word.id) && !base.some((candidate) => candidate.id === word.id));
    return [...base, ...fill].slice(0, 20);
  }, [completedSet, due, newWords]);

  const todayWords = useMemo(() => [...newWords, ...todayReview], [newWords, todayReview]);
  const completedToday = todayWords.filter((word) => state.progress[word.id]?.lastReviewed === dayKey()).length;
  const favoriteWords = useMemo(() => words.filter((word) => favoriteSet.has(word.id)), [favoriteSet]);
  const wrongWords = useMemo(() => words.filter((word) => wrongSet.has(word.id)), [wrongSet]);
  const masteredCount = Object.values(state.progress).filter((progress) => progress.mastered).length;
  const completionRate = Math.round((state.completedWordIds.length / words.length) * 100);

  const filteredWords = useMemo(() => {
    if (selectedPart === '전체') return words;
    return words.filter((word) => word.partOfSpeech === selectedPart && (selectedPart !== '명사' || selectedCategory === '전체' || word.category === selectedCategory));
  }, [selectedCategory, selectedPart]);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ko-KR');
    if (!normalized) return [];
    return words.filter((word) => [word.word, word.pronunciation, word.meaning, word.category, word.partOfSpeech].some((value) => value.toLocaleLowerCase('ko-KR').includes(normalized)));
  }, [query]);

  const getProps = (word: Word): WordStudyProps => ({
    word,
    favorite: favoriteSet.has(word.id),
    completed: completedSet.has(word.id),
    wrong: wrongSet.has(word.id),
    progress: state.progress[word.id],
    onToggleFavorite: () => setState((current) => toggleFavorite(current, word.id)),
    onToggleCompleted: () => setState((current) => setWordCompleted(current, word.id, !current.completedWordIds.includes(word.id))),
    onToggleWrong: () => setState((current) => toggleWrongWord(current, word.id)),
    onReview: (correct) => setState((current) => reviewWord(current, word.id, correct)),
  });

  const changePart = (part: SelectedPart) => {
    setSelectedPart(part);
    setSelectedCategory('전체');
  };

  const openWords = (part: SelectedPart = '일반동사') => {
    setSelectedPart(part);
    setSelectedCategory('전체');
    setTab('words');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTestComplete = (result: TestResult) => {
    setState((current) => recordTestResult(current, result));
  };

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl items-center justify-center bg-background px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <div className="text-center" role="status" aria-live="polite">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-xl font-black text-leaf">A</span>
          <p className="mt-4 text-sm font-extrabold text-ink">학습 기록을 불러오는 중…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-xl bg-background pb-28 md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-[34px] md:shadow-2xl">
      <main className="px-4 pb-8 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6">
        {tab === 'today' && (
          <TodayPage
            state={state}
            dueCount={due.length}
            newWords={newWords}
            reviewWords={todayReview}
            todayWords={todayWords}
            completedToday={completedToday}
            masteredCount={masteredCount}
            completionRate={completionRate}
            getProps={getProps}
            onOpenWords={() => openWords('일반동사')}
            onOpenReview={() => setTab('review')}
            onOpenFavorites={() => setTab('favorites')}
            onOpenSearch={() => setTab('search')}
          />
        )}

        {tab === 'words' && (
          <WordsPage
            selectedPart={selectedPart}
            selectedCategory={selectedCategory}
            filteredWords={filteredWords}
            completedSet={completedSet}
            getProps={getProps}
            onPartChange={changePart}
            onCategoryChange={setSelectedCategory}
            onStartTest={(title, testWords) => setTestConfig({ title, words: testWords })}
          />
        )}

        {tab === 'review' && (
          <ReviewPage
            mode={reviewMode}
            dueWords={due}
            wrongWords={wrongWords}
            completedSet={completedSet}
            getProps={getProps}
            onModeChange={setReviewMode}
            onStartWrongTest={() => setTestConfig({ title: '오답 단어', words: wrongWords.filter((word) => completedSet.has(word.id)) })}
          />
        )}

        {tab === 'favorites' && <SimpleCollectionPage title="즐겨찾기" description="별표로 저장한 단어만 빠르게 복습해요." emptyTitle="아직 저장한 단어가 없어요" emptyDescription="단어 옆 별표를 누르면 이곳에 모여요." words={favoriteWords} getProps={getProps} />}

        {tab === 'search' && <SearchPage query={query} onQueryChange={setQuery} results={searchResults} getProps={getProps} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl border-t border-emerald-100 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(27,67,46,.08)] backdrop-blur-xl md:bottom-6 md:rounded-b-[34px]" aria-label="메인 메뉴">
        <div className="grid h-[72px] grid-cols-5">
          {tabs.map((item) => (
            <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-extrabold active:scale-95 ${tab === item.id ? 'text-leaf' : 'text-slate-400'}`} aria-current={tab === item.id ? 'page' : undefined}>
              <span className={`flex h-7 min-w-7 items-center justify-center rounded-xl text-base ${tab === item.id ? 'bg-mint' : ''}`}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {testConfig && <CategoryTest title={testConfig.title} words={testConfig.words} allWords={words} onClose={() => setTestConfig(null)} onComplete={handleTestComplete} />}
    </div>
  );
}

function TodayPage({
  state,
  dueCount,
  newWords,
  reviewWords,
  todayWords,
  completedToday,
  masteredCount,
  completionRate,
  getProps,
  onOpenWords,
  onOpenReview,
  onOpenFavorites,
  onOpenSearch,
}: {
  state: StoredState;
  dueCount: number;
  newWords: Word[];
  reviewWords: Word[];
  todayWords: Word[];
  completedToday: number;
  masteredCount: number;
  completionRate: number;
  getProps: (word: Word) => WordStudyProps;
  onOpenWords: () => void;
  onOpenReview: () => void;
  onOpenFavorites: () => void;
  onOpenSearch: () => void;
}) {
  const todayRate = Math.round((completedToday / Math.max(todayWords.length, 1)) * 100);
  return (
    <div>
      <header className="mb-5">
        <p className="text-[13px] font-black uppercase tracking-[.18em] text-leaf">Easy English</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">Speak English Every Day</h1>
        <p className="mt-2 text-sm leading-6 text-muted">매일 자주 쓰는 단어를 듣고, 말하고, 확인해보세요.</p>
      </header>

      <section className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#1f7a4d] via-[#228c59] to-[#42a873] p-5 text-white shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-sm font-extrabold text-white/80">오늘의 학습</p><h2 className="mt-1 text-2xl font-black">{completedToday} / {todayWords.length} 완료</h2></div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">약 15분</span>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${todayRate}%` }} /></div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/12 p-3"><p className="text-xs font-semibold text-white/75">새 단어</p><p className="mt-1 text-xl font-black">{newWords.length}개</p></div>
          <div className="rounded-2xl bg-white/12 p-3"><p className="text-xs font-semibold text-white/75">복습</p><p className="mt-1 text-xl font-black">{reviewWords.length}개</p></div>
        </div>
        <button type="button" onClick={() => document.getElementById('today-word-list')?.scrollIntoView({ behavior: 'smooth' })} className="mt-4 min-h-14 w-full rounded-2xl bg-white text-base font-black text-leaf active:scale-[.99]">오늘 학습 시작</button>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <QuickAction icon="A" title="회화 필수 단어" subtitle="540개 핵심 단어" onClick={onOpenWords} />
        <QuickAction icon="↻" title="복습" subtitle={`${dueCount}개 복습 필요`} onClick={onOpenReview} />
        <QuickAction icon="★" title="즐겨찾기" subtitle={`${state.favorites.length}개 저장`} onClick={onOpenFavorites} />
        <QuickAction icon="⌕" title="검색" subtitle="영어·한국어 검색" onClick={onOpenSearch} />
      </section>

      <section className="mt-5 grid grid-cols-4 gap-2">
        <StatBox label="전체 단어" value={words.length} />
        <StatBox label="외운 단어" value={state.completedWordIds.length} />
        <StatBox label="완벽 암기" value={masteredCount} />
        <StatBox label="학습률" value={`${completionRate}%`} />
      </section>

      <section id="today-word-list" className="mt-8 scroll-mt-4">
        <SectionTitle title="오늘의 단어" description="체크하면 자동 저장되고, 내일부터 간격 복습에 들어가요." count={todayWords.length} />
        <WordCollection words={todayWords} getProps={getProps} layout="list" />
      </section>
    </div>
  );
}

function WordsPage({
  selectedPart,
  selectedCategory,
  filteredWords,
  completedSet,
  getProps,
  onPartChange,
  onCategoryChange,
  onStartTest,
}: {
  selectedPart: SelectedPart;
  selectedCategory: string;
  filteredWords: Word[];
  completedSet: Set<string>;
  getProps: (word: Word) => WordStudyProps;
  onPartChange: (part: SelectedPart) => void;
  onCategoryChange: (category: string) => void;
  onStartTest: (title: string, words: Word[]) => void;
}) {
  const completedCount = filteredWords.filter((word) => completedSet.has(word.id)).length;
  const title = selectedPart === '명사' && selectedCategory !== '전체' ? `${selectedCategory} 명사` : selectedPart;
  const eligibleWords = filteredWords.filter((word) => completedSet.has(word.id));
  const layout = selectedPart !== '전체' && compactCardGroups.has(selectedPart) ? 'cards' : 'list';

  return (
    <div>
      <SectionTitle title="회화 필수 단어" description="사용 빈도가 높은 순서로 정리했어요." count={words.length} />
      <ChipRow values={['전체', ...partOfSpeechGroups]} selected={selectedPart} onChange={(value) => onPartChange(value as SelectedPart)} />

      {selectedPart === '명사' && <div className="mt-3"><ChipRow values={['전체', ...nounCategories]} selected={selectedCategory} onChange={onCategoryChange} small /></div>}

      {selectedPart === '전체' ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {partOfSpeechGroups.map((part) => {
            const partWords = words.filter((word) => word.partOfSpeech === part);
            const done = partWords.filter((word) => completedSet.has(word.id)).length;
            return (
              <button key={part} type="button" onClick={() => onPartChange(part)} className="min-h-28 rounded-3xl bg-white p-4 text-left shadow-soft active:scale-[.98]">
                <div className="flex items-center justify-between"><span className="text-lg font-black text-ink">{part}</span><span className="text-xs font-bold text-leaf">{partWords.length}개</span></div>
                <p className="mt-5 text-xs font-semibold text-muted">{done} / {partWords.length} 완료</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-leaf" style={{ width: `${(done / partWords.length) * 100}%` }} /></div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          <StudyHeader title={title} completed={completedCount} total={filteredWords.length} eligibleCount={eligibleWords.length} onStartTest={() => onStartTest(title, eligibleWords)} />
          <p className="mb-3 mt-4 whitespace-nowrap text-[11px] leading-4 text-muted">☐ 미암기 · ☑ 암기 · 🔊 듣기 · 🗣 말하기 · 📖 예문 · 📝 오답</p>
          <WordCollection words={filteredWords} getProps={getProps} layout={layout} />
        </div>
      )}
    </div>
  );
}

function ReviewPage({ mode, dueWords: scheduled, wrongWords, completedSet, getProps, onModeChange, onStartWrongTest }: { mode: 'schedule' | 'wrong'; dueWords: Word[]; wrongWords: Word[]; completedSet: Set<string>; getProps: (word: Word) => WordStudyProps; onModeChange: (mode: 'schedule' | 'wrong') => void; onStartWrongTest: () => void }) {
  const currentWords = mode === 'schedule' ? scheduled : wrongWords;
  const testableWrongCount = wrongWords.filter((word) => completedSet.has(word.id)).length;
  return (
    <div>
      <SectionTitle title="복습" description="간격 복습과 오답노트를 한곳에서 확인해요." count={currentWords.length} />
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
        <button type="button" onClick={() => onModeChange('schedule')} className={`min-h-11 rounded-xl text-sm font-extrabold ${mode === 'schedule' ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>오늘 복습 {scheduled.length}</button>
        <button type="button" onClick={() => onModeChange('wrong')} className={`min-h-11 rounded-xl text-sm font-extrabold ${mode === 'wrong' ? 'bg-white text-rose-700 shadow-sm' : 'text-muted'}`}>오답노트 {wrongWords.length}</button>
      </div>

      {mode === 'schedule' && <div className="mb-5 mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">자동 복습: 1일 → 3일 → 7일 → 14일 → 30일 → 60일 → 90일</div>}
      {mode === 'wrong' && wrongWords.length > 0 && <button type="button" disabled={testableWrongCount === 0} onClick={onStartWrongTest} className="mb-4 mt-4 min-h-12 w-full rounded-2xl bg-rose-100 text-sm font-black text-rose-700 disabled:opacity-50">오답만 다시 시험 ({testableWrongCount}개)</button>}

      {currentWords.length ? <WordCollection words={currentWords} getProps={getProps} layout={currentWords.length > 10 ? 'list' : 'cards'} /> : <EmptyState icon={mode === 'schedule' ? '🌱' : '📝'} title={mode === 'schedule' ? '오늘 복습할 단어가 없어요' : '오답노트가 비어 있어요'} description={mode === 'schedule' ? '단어를 외움으로 체크하면 다음 날부터 자동 복습돼요.' : '어려운 단어의 📝 버튼을 누르면 이곳에 저장돼요.'} />}
    </div>
  );
}

function SearchPage({ query, onQueryChange, results, getProps }: { query: string; onQueryChange: (value: string) => void; results: Word[]; getProps: (word: Word) => WordStudyProps }) {
  return (
    <div>
      <SectionTitle title="검색" description="영어, 한국어 뜻, 한글 발음으로 찾아보세요." />
      <div className="mb-5 flex min-h-14 items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 shadow-soft">
        <span className="text-2xl text-muted">⌕</span>
        <input autoFocus value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="예: airport, 공항, 에어포트" className="min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none placeholder:text-slate-400" />
      </div>
      {query ? <><p className="mb-4 text-sm text-muted"><strong className="text-ink">{results.length}개</strong>를 찾았어요.</p><WordCollection words={results} getProps={getProps} layout={results.length > 10 ? 'list' : 'cards'} /></> : <EmptyState icon="⌕" title="무엇을 찾고 있나요?" description="영어 단어 또는 한국어 뜻을 입력해보세요." />}
    </div>
  );
}

function SimpleCollectionPage({ title, description, emptyTitle, emptyDescription, words: collection, getProps }: { title: string; description: string; emptyTitle: string; emptyDescription: string; words: Word[]; getProps: (word: Word) => WordStudyProps }) {
  return <div><SectionTitle title={title} description={description} count={collection.length} />{collection.length ? <WordCollection words={collection} getProps={getProps} layout={collection.length > 10 ? 'list' : 'cards'} /> : <EmptyState icon="☆" title={emptyTitle} description={emptyDescription} />}</div>;
}

function WordCollection({ words: collection, getProps, layout }: { words: Word[]; getProps: (word: Word) => WordStudyProps; layout: 'cards' | 'list' }) {
  if (!collection.length) return <EmptyState icon="📚" title="표시할 단어가 없어요" description="다른 카테고리를 선택해보세요." />;
  if (layout === 'cards') return <div className="space-y-4">{collection.map((word) => <WordCard key={word.id} {...getProps(word)} />)}</div>;
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{collection.map((word, index) => <WordListRow key={word.id} index={index + 1} {...getProps(word)} />)}</div>;
}

function StudyHeader({ title, completed, total, eligibleCount, onStartTest }: { title: string; completed: number; total: number; eligibleCount: number; onStartTest: () => void }) {
  const rate = Math.round((completed / Math.max(total, 1)) * 100);
  return (
    <div className="rounded-3xl bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-2xl font-black text-ink">{title}</h2><p className="mt-1 text-sm font-extrabold text-leaf">{completed} / {total} 완료</p></div>
        <button type="button" disabled={eligibleCount === 0} onClick={onStartTest} className="min-h-12 shrink-0 rounded-2xl bg-ink px-4 text-sm font-black text-white active:scale-95 disabled:bg-slate-300">시험 보기</button>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${rate}%` }} /></div>
      <p className="mt-2 text-right text-[11px] font-semibold text-muted">체크한 {eligibleCount}개 단어가 시험 대상</p>
    </div>
  );
}

function ChipRow({ values, selected, onChange, small = false }: { values: readonly string[]; selected: string; onChange: (value: string) => void; small?: boolean }) {
  return <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 scrollbar-none">{values.map((value) => <button key={value} type="button" onClick={() => onChange(value)} className={`${small ? 'min-h-10 px-3 text-xs' : 'min-h-11 px-4 text-sm'} shrink-0 rounded-full font-extrabold ${selected === value ? 'bg-leaf text-white' : 'bg-white text-muted shadow-sm'}`}>{value}</button>)}</div>;
}

function SectionTitle({ title, description, count }: { title: string; description?: string; count?: number }) {
  return <div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="text-2xl font-black tracking-tight text-ink">{title}</h2>{description && <p className="mt-1 text-sm leading-5 text-muted">{description}</p>}</div>{count !== undefined && <span className="shrink-0 rounded-full bg-mint px-3 py-1 text-sm font-bold text-leaf">{count}개</span>}</div>;
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center shadow-soft"><div className="text-4xl">{icon}</div><h3 className="mt-4 text-lg font-black text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{description}</p></div>;
}

function QuickAction({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-28 rounded-3xl bg-white p-4 text-left shadow-soft transition active:scale-[.98]"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint text-lg font-black text-leaf">{icon}</span><span className="mt-3 block text-sm font-black text-ink">{title}</span><span className="mt-1 block text-xs text-muted">{subtitle}</span></button>;
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-emerald-100 bg-white p-3 text-center shadow-sm"><p className="text-lg font-black text-ink">{value}</p><p className="mt-1 text-[10px] font-semibold text-muted">{label}</p></div>;
}