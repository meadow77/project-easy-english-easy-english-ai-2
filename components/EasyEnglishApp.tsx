'use client';

import { useEffect, useMemo, useState } from 'react';
import { compactCardGroups, nounCategories, partOfSpeechGroups, words } from '@/src/data';
import { prepareAmericanVoice } from '@/src/lib/speech';
import {
  dayKey,
  dueWords,
  ensureTodayPlan,
  INITIAL_STATE,
  loadState,
  recordTestResult,
  reviewWord,
  saveState,
  setWordCompleted,
  setWordsCompleted,
  toggleFavorite,
  toggleWrongWord,
} from '@/src/lib/storage';
import type { PartOfSpeech, StoredState, Tab, TestResult, Word } from '@/src/types';
import AppIcon, { type AppIconName } from './AppIcon';
import CategoryTest from './CategoryTest';
import SentenceTest from './SentenceTest';
import WordCard from './WordCard';
import WordListRow from './WordListRow';
import type { WordStudyProps } from './word-study-types';

const tabs: { id: Tab; label: string; icon: AppIconName }[] = [
  { id: 'today', label: '오늘', icon: 'today' },
  { id: 'words', label: '단어', icon: 'words' },
  { id: 'review', label: '복습', icon: 'review' },
  { id: 'favorites', label: '즐겨찾기', icon: 'bookmark' },
  { id: 'search', label: '검색', icon: 'search' },
];

type TestConfig = { title: string; words: Word[]; kind: 'word' | 'sentence' };
type SelectedPart = PartOfSpeech | '전체';
type CompletionFilter = 'all' | 'learned' | 'unlearned';

export default function EasyEnglishApp() {
  const [tab, setTab] = useState<Tab>('today');
  const [state, setState] = useState<StoredState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SelectedPart>('일반동사');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [query, setQuery] = useState('');
  const [reviewMode, setReviewMode] = useState<'schedule' | 'wrong'>('schedule');
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [todayStarted, setTodayStarted] = useState(false);

  useEffect(() => {
    setState(ensureTodayPlan(loadState(), words));
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

  const todayWords = useMemo(() => {
    const wordsById = new Map(words.map((word) => [word.id, word]));
    return (state.dailyPlan?.date === dayKey() ? state.dailyPlan.wordIds : []).map((wordId) => wordsById.get(wordId)).filter((word): word is Word => Boolean(word));
  }, [state.dailyPlan]);
  const completedToday = todayWords.filter((word) => completedSet.has(word.id)).length;
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

  const setCollectionCompleted = (wordIds: string[], completed: boolean) => {
    setState((current) => setWordsCompleted(current, wordIds, completed));
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
            todayWords={todayWords}
            completedToday={completedToday}
            masteredCount={masteredCount}
            completionRate={completionRate}
            completedSet={completedSet}
            started={todayStarted}
            getProps={getProps}
            onStart={() => {
              setTodayStarted(true);
              window.setTimeout(() => document.getElementById('today-word-list')?.scrollIntoView({ behavior: 'smooth' }), 50);
            }}
            onOpenWords={() => openWords('일반동사')}
            onOpenReview={() => setTab('review')}
            onOpenFavorites={() => setTab('favorites')}
            onOpenSearch={() => setTab('search')}
            onStartTest={(title, testWords) => setTestConfig({ title, words: testWords, kind: 'word' })}
            onStartSentenceTest={(title, testWords) => setTestConfig({ title, words: testWords, kind: 'sentence' })}
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
            onStartTest={(title, testWords) => setTestConfig({ title, words: testWords, kind: 'word' })}
            onStartSentenceTest={(title, testWords) => setTestConfig({ title, words: testWords, kind: 'sentence' })}
            onSetCompleted={setCollectionCompleted}
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
            onStartWrongTest={() => setTestConfig({ title: '오답 단어', words: wrongWords.filter((word) => completedSet.has(word.id)), kind: 'word' })}
          />
        )}

        {tab === 'favorites' && <SimpleCollectionPage title="즐겨찾기" description="별표로 저장한 단어만 빠르게 복습해요." emptyTitle="아직 저장한 단어가 없어요" emptyDescription="단어 옆 별표를 누르면 이곳에 모여요." words={favoriteWords} getProps={getProps} />}

        {tab === 'search' && <SearchPage query={query} onQueryChange={setQuery} results={searchResults} getProps={getProps} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl border-t border-emerald-100 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(27,67,46,.08)] backdrop-blur-xl md:bottom-6 md:rounded-b-[34px]" aria-label="메인 메뉴">
        <div className="grid h-[72px] grid-cols-5">
          {tabs.map((item) => (
            <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-extrabold active:scale-95 ${tab === item.id ? 'text-leaf' : 'text-slate-400'}`} aria-current={tab === item.id ? 'page' : undefined}>
              <span className={`flex h-7 min-w-7 items-center justify-center rounded-xl ${tab === item.id ? 'bg-mint' : ''}`}><AppIcon name={item.icon} size={17} /></span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {testConfig?.kind === 'word' && <CategoryTest title={testConfig.title} words={testConfig.words} allWords={words} onClose={() => setTestConfig(null)} onComplete={handleTestComplete} />}
      {testConfig?.kind === 'sentence' && <SentenceTest title={testConfig.title} words={testConfig.words} allWords={words} onClose={() => setTestConfig(null)} onComplete={handleTestComplete} />}
    </div>
  );
}

function TodayPage({
  state,
  dueCount,
  todayWords,
  completedToday,
  masteredCount,
  completionRate,
  completedSet,
  started,
  getProps,
  onStart,
  onOpenWords,
  onOpenReview,
  onOpenFavorites,
  onOpenSearch,
  onStartTest,
  onStartSentenceTest,
}: {
  state: StoredState;
  dueCount: number;
  todayWords: Word[];
  completedToday: number;
  masteredCount: number;
  completionRate: number;
  completedSet: Set<string>;
  started: boolean;
  getProps: (word: Word) => WordStudyProps;
  onStart: () => void;
  onOpenWords: () => void;
  onOpenReview: () => void;
  onOpenFavorites: () => void;
  onOpenSearch: () => void;
  onStartTest: (title: string, testWords: Word[]) => void;
  onStartSentenceTest: (title: string, testWords: Word[]) => void;
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
          <div><p className="flex items-center gap-1.5 text-sm font-extrabold text-white/80"><AppIcon name="today" size={16} /> 오늘의 학습</p><h2 className="mt-1 text-2xl font-black">오늘 외울 단어 {todayWords.length}개</h2></div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">약 10~15분</span>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${todayRate}%` }} /></div>
        <div className="mt-3 flex items-center justify-between text-xs font-bold text-white/80"><span>{completedToday} / {todayWords.length} 완료</span><span>복습 예정 {dueCount}개</span></div>
        <button type="button" onClick={onStart} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-base font-black text-leaf active:scale-[.99]"><AppIcon name="play" size={18} /> {started ? '오늘 학습 계속하기' : '학습 시작'}</button>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <QuickAction icon="words" title="회화 필수 단어" subtitle="540개 핵심 단어" onClick={onOpenWords} />
        <QuickAction icon="review" title="복습" subtitle={`${dueCount}개 복습 필요`} onClick={onOpenReview} />
        <QuickAction icon="bookmark" title="즐겨찾기" subtitle={`${state.favorites.length}개 저장`} onClick={onOpenFavorites} />
        <QuickAction icon="search" title="검색" subtitle="영어·한국어 검색" onClick={onOpenSearch} />
      </section>

      <section className="mt-5 grid grid-cols-4 gap-2">
        <StatBox label="전체 단어" value={words.length} />
        <StatBox label="외운 단어" value={state.completedWordIds.length} />
        <StatBox label="완벽 암기" value={masteredCount} />
        <StatBox label="학습률" value={`${completionRate}%`} />
      </section>

      {started && <section id="today-word-list" className="mt-8 scroll-mt-4">
        <SectionTitle title="오늘의 학습 순서" description="순서대로 가볍게 반복하면 기억이 더 오래가요." />
        <div className="grid grid-cols-2 gap-2">
          <LearningStep order="1" icon="check" title="체크" description="아는 단어 표시" />
          <LearningStep order="2" icon="listen" title="듣기" description="영어와 뜻 듣기" />
          <LearningStep order="3" icon="example" title="예문" description="문장으로 확인" />
          <LearningStep order="4" icon="test" title="단어 시험" description="오답은 자동 저장" />
          <LearningStep order="5" icon="test" title="문장 시험" description="빈칸에 단어 넣기" />
          <LearningStep order="6" icon="note" title="오답복습" description="틀린 단어 다시 보기" />
        </div>
        <div className="mt-4">
          <StudyHeader
            title="오늘의 단어"
            completed={completedToday}
            total={todayWords.length}
            eligibleCount={completedToday}
            onStartTest={() => onStartTest('오늘의 학습', todayWords.filter((word) => completedSet.has(word.id)))}
            onStartSentenceTest={() => onStartSentenceTest('오늘의 학습', todayWords.filter((word) => completedSet.has(word.id)))}
          />
        </div>
        <p className="mb-3 mt-4 text-sm font-semibold leading-5 text-muted">왼쪽 체크 · 듣기 · 예문 · 오답노트 순서로 학습하세요.</p>
        <WordCollection words={todayWords} getProps={getProps} layout="list" />
      </section>}
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
  onStartSentenceTest,
  onSetCompleted,
}: {
  selectedPart: SelectedPart;
  selectedCategory: string;
  filteredWords: Word[];
  completedSet: Set<string>;
  getProps: (word: Word) => WordStudyProps;
  onPartChange: (part: SelectedPart) => void;
  onCategoryChange: (category: string) => void;
  onStartTest: (title: string, words: Word[]) => void;
  onStartSentenceTest: (title: string, words: Word[]) => void;
  onSetCompleted: (wordIds: string[], completed: boolean) => void;
}) {
  const [filter, setFilter] = useState<CompletionFilter>('all');
  const completedCount = filteredWords.filter((word) => completedSet.has(word.id)).length;
  const title = selectedPart === '명사' && selectedCategory !== '전체' ? `${selectedCategory} 명사` : selectedPart;
  const eligibleWords = filteredWords.filter((word) => completedSet.has(word.id));
  const visibleWords = filteredWords.filter((word) => filter === 'all' || (filter === 'learned' ? completedSet.has(word.id) : !completedSet.has(word.id)));
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
          <StudyHeader
            title={title}
            completed={completedCount}
            total={filteredWords.length}
            eligibleCount={eligibleWords.length}
            onStartTest={() => onStartTest(title, eligibleWords)}
            onStartSentenceTest={() => onStartSentenceTest(title, eligibleWords)}
          />
          <WordbookControls
            words={filteredWords}
            completedSet={completedSet}
            filter={filter}
            onFilterChange={setFilter}
            onSetCompleted={onSetCompleted}
          />
          <WordCollection words={visibleWords} getProps={getProps} layout={layout} />
        </div>
      )}
    </div>
  );
}

function WordbookControls({
  words: collection,
  completedSet,
  filter,
  onFilterChange,
  onSetCompleted,
}: {
  words: Word[];
  completedSet: Set<string>;
  filter: CompletionFilter;
  onFilterChange: (filter: CompletionFilter) => void;
  onSetCompleted: (wordIds: string[], completed: boolean) => void;
}) {
  const ids = collection.map((word) => word.id);
  const selectedCount = collection.filter((word) => completedSet.has(word.id)).length;
  const filters: { id: CompletionFilter; label: string }[] = [
    { id: 'all', label: '전체 보기' },
    { id: 'learned', label: '외운 단어만' },
    { id: 'unlearned', label: '외우지 않은 단어만' },
  ];

  return (
    <div className="mt-4">
      <div className="flex flex-col rounded-3xl border border-emerald-100 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold text-muted">선택 상태 {selectedCount} / {collection.length}</p>
          <span className="flex items-center gap-1 text-xs font-bold text-leaf"><AppIcon name="filter" size={14} /> 빠른 필터</span>
        </div>
        <div className="order-2 mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onSetCompleted(ids, true)} disabled={!collection.length} className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-emerald-50 text-xs font-black text-leaf active:scale-[.98] disabled:opacity-50"><AppIcon name="check" size={16} /> 전체 선택</button>
          <button type="button" onClick={() => onSetCompleted(ids, false)} disabled={!selectedCount} className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 text-xs font-black text-muted active:scale-[.98] disabled:opacity-50"><AppIcon name="uncheck" size={16} /> 전체 선택 해제</button>
        </div>
        <div className="order-1 mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="단어 학습 상태 필터">
          {filters.map((item) => <button key={item.id} type="button" onClick={() => onFilterChange(item.id)} className={`min-h-9 shrink-0 rounded-xl px-3 text-xs font-extrabold active:scale-[.98] ${filter === item.id ? 'bg-leaf text-white' : 'bg-slate-50 text-muted'}`}>{item.label}</button>)}
        </div>
      </div>
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

      {currentWords.length ? <WordCollection words={currentWords} getProps={getProps} layout={currentWords.length > 10 ? 'list' : 'cards'} /> : <EmptyState icon={mode === 'schedule' ? 'review' : 'note'} title={mode === 'schedule' ? '오늘 복습할 단어가 없어요' : '오답노트가 비어 있어요'} description={mode === 'schedule' ? '단어를 외움으로 체크하면 다음 날부터 자동 복습돼요.' : '어려운 단어의 오답노트 버튼을 누르면 이곳에 저장돼요.'} />}
    </div>
  );
}

function SearchPage({ query, onQueryChange, results, getProps }: { query: string; onQueryChange: (value: string) => void; results: Word[]; getProps: (word: Word) => WordStudyProps }) {
  return (
    <div>
      <SectionTitle title="검색" description="영어, 한국어 뜻, 한글 발음으로 찾아보세요." />
      <div className="mb-5 flex min-h-14 items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 shadow-soft">
        <AppIcon name="search" size={22} className="shrink-0 text-muted" />
        <input autoFocus value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="예: airport, 공항, 에어포트" className="min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none placeholder:text-slate-400" />
      </div>
      {query ? <><p className="mb-4 text-sm text-muted"><strong className="text-ink">{results.length}개</strong>를 찾았어요.</p><WordCollection words={results} getProps={getProps} layout={results.length > 10 ? 'list' : 'cards'} /></> : <EmptyState icon="search" title="무엇을 찾고 있나요?" description="영어 단어 또는 한국어 뜻을 입력해보세요." />}
    </div>
  );
}

function SimpleCollectionPage({ title, description, emptyTitle, emptyDescription, words: collection, getProps }: { title: string; description: string; emptyTitle: string; emptyDescription: string; words: Word[]; getProps: (word: Word) => WordStudyProps }) {
  return <div><SectionTitle title={title} description={description} count={collection.length} />{collection.length ? <WordCollection words={collection} getProps={getProps} layout={collection.length > 10 ? 'list' : 'cards'} /> : <EmptyState icon="bookmark" title={emptyTitle} description={emptyDescription} />}</div>;
}

function WordCollection({ words: collection, getProps, layout }: { words: Word[]; getProps: (word: Word) => WordStudyProps; layout: 'cards' | 'list' }) {
  if (!collection.length) return <EmptyState icon="words" title="표시할 단어가 없어요" description="다른 카테고리 또는 필터를 선택해보세요." />;
  if (layout === 'cards') return <div className="space-y-4">{collection.map((word) => <WordCard key={word.id} {...getProps(word)} />)}</div>;
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{collection.map((word, index) => <WordListRow key={word.id} index={index + 1} {...getProps(word)} />)}</div>;
}

function StudyHeader({ title, completed, total, eligibleCount, onStartTest, onStartSentenceTest }: { title: string; completed: number; total: number; eligibleCount: number; onStartTest: () => void; onStartSentenceTest: () => void }) {
  const rate = Math.round((completed / Math.max(total, 1)) * 100);
  return (
    <div className="rounded-3xl bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-2xl font-black text-ink">{title}</h2><p className="mt-1 text-sm font-extrabold text-leaf">{completed} / {total} 완료</p></div>
        <button type="button" disabled={eligibleCount === 0} onClick={onStartTest} className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-2xl bg-ink px-4 text-sm font-black text-white active:scale-95 disabled:bg-slate-300"><AppIcon name="test" size={16} /> 시험 보기</button>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${rate}%` }} /></div>
      <button type="button" disabled={eligibleCount === 0} onClick={onStartSentenceTest} className="mt-3 flex min-h-12 w-full items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-mint px-4 text-base font-black text-leaf active:scale-95 disabled:opacity-50"><AppIcon name="example" size={18} /> 문장 시험</button>
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

function EmptyState({ icon, title, description }: { icon: AppIconName; title: string; description: string }) {
  return <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center shadow-soft"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-mint text-leaf"><AppIcon name={icon} size={26} /></div><h3 className="mt-4 text-lg font-black text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{description}</p></div>;
}

function QuickAction({ icon, title, subtitle, onClick }: { icon: AppIconName; title: string; subtitle: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-28 rounded-3xl bg-white p-4 text-left shadow-soft transition active:scale-[.98]"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint text-leaf"><AppIcon name={icon} size={19} /></span><span className="mt-3 block text-sm font-black text-ink">{title}</span><span className="mt-1 block text-xs text-muted">{subtitle}</span></button>;
}

function LearningStep({ order, icon, title, description }: { order: string; icon: AppIconName; title: string; description: string }) {
  return <div className="flex min-h-[74px] items-center gap-2.5 rounded-2xl bg-white p-3 shadow-sm"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mint text-xs font-black text-leaf">{order}</span><div className="min-w-0"><p className="flex items-center gap-1.5 text-xs font-black text-ink"><AppIcon name={icon} size={14} className="text-leaf" /> {title}</p><p className="mt-0.5 truncate text-[10px] font-semibold text-muted">{description}</p></div></div>;
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-emerald-100 bg-white p-3 text-center shadow-sm"><p className="text-lg font-black text-ink">{value}</p><p className="mt-1 text-[10px] font-semibold text-muted">{label}</p></div>;
}
