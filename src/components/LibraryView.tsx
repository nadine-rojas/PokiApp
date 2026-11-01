import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Type,
  X,
  Languages,
  BookmarkCheck,
} from 'lucide-react';
import {
  getBooksForAgeGroup,
  StoryBook,
  StoryVocabularyItem,
} from '../data/curriculumData';
import {
  AgeGroup,
  getLibraryConfigForAgeGroup,
} from '../utils/educationLogic';
import { StorySceneArt } from './ArtworkRenderer';
import {
  playRewardSound,
  speakSpanishText,
  speakEnglishText,
} from '../utils/soundEffects';

interface LibraryViewProps {
  ageGroup: AgeGroup;
  completedBookIds: string[];
  onCompleteBook: (bookId: string, xpReward: number) => void;
}

export function LibraryView({
  ageGroup,
  completedBookIds,
  onCompleteBook,
}: LibraryViewProps) {
  const isYoungKid = ageGroup === '3-6';
  const libraryConfig = getLibraryConfigForAgeGroup(ageGroup);
  const booksForStage = getBooksForAgeGroup(ageGroup);

  const [activeBook, setActiveBook] = useState<StoryBook | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [isLargeText, setIsLargeText] = useState(isYoungKid);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVocab, setSelectedVocab] =
    useState<StoryVocabularyItem | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(
    null
  );
  const [quizCompleted, setQuizCompleted] = useState(false);

  const completedInStageCount = booksForStage.filter((b) =>
    completedBookIds.includes(b.id)
  ).length;

  const openBook = (book: StoryBook) => {
    playRewardSound('pop');
    setActiveBook(book);
    setPageIdx(0);
    setShowQuiz(false);
    setSelectedQuizAnswer(null);
    setQuizCompleted(false);
    setSelectedVocab(book.pages[0]?.vocabulary?.[0] || null);
    setIsLargeText(isYoungKid);
  };

  const handleNarrateCurrentPage = () => {
    if (!activeBook) return;
    const currentPage = activeBook.pages[pageIdx];
    setIsSpeaking(true);
    if (activeBook.language === 'en') {
      speakEnglishText(currentPage.text, () => {
        setIsSpeaking(false);
      });
    } else {
      speakSpanishText(currentPage.text, () => {
        setIsSpeaking(false);
      });
    }
  };

  const handlePronounceVocabWord = (item: StoryVocabularyItem) => {
    playRewardSound('pop');
    setSelectedVocab(item);
    speakEnglishText(item.word);
  };

  const handleFinishQuiz = (option: string) => {
    if (!activeBook) return;
    setSelectedQuizAnswer(option);
    if (option === activeBook.comprehensionQuestion.correctOption) {
      playRewardSound('fanfare');
      setQuizCompleted(true);
      onCompleteBook(activeBook.id, activeBook.xpReward);
    } else {
      playRewardSound('wrong');
    }
  };

  // Renderiza el texto en inglés resaltando palabras de vocabulario clave para tocar y traducir
  const renderInteractiveStoryText = (
    text: string,
    vocabList?: StoryVocabularyItem[]
  ) => {
    if (!vocabList || vocabList.length === 0) {
      return <span>{text}</span>;
    }

    const tokens = text.split(/(\s+)/);
    return tokens.map((token, idx) => {
      const stripped = token.replace(/[^a-zA-Z']/g, '').toLowerCase();
      const matchedVocab = vocabList.find(
        (v) => v.word.toLowerCase() === stripped
      );

      if (!matchedVocab) {
        return <React.Fragment key={idx}>{token}</React.Fragment>;
      }

      const isSelected =
        selectedVocab?.word.toLowerCase() === matchedVocab.word.toLowerCase();

      return (
        <button
          key={idx}
          type="button"
          onClick={() => handlePronounceVocabWord(matchedVocab)}
          data-testid={`vocab-word-${matchedVocab.word.toLowerCase()}`}
          title={`Significado: ${matchedVocab.translationEs}`}
          className={`inline px-1.5 py-0.5 mx-0.5 rounded-lg font-extrabold underline decoration-2 underline-offset-4 transition-all cursor-pointer ${
            isSelected
              ? 'bg-amber-400 text-slate-950 decoration-slate-950 shadow-2xs'
              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 decoration-emerald-500 hover:bg-emerald-500/25'
          }`}
        >
          {token}
        </button>
      );
    });
  };

  return (
    <div className="space-y-8" data-testid="library-view-root">
      <section className="bg-white dark:bg-[#181326] rounded-[32px] border border-slate-200 dark:border-purple-900/50 p-6 sm:p-8 shadow-sm text-slate-900 dark:text-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div
              data-testid="library-stage-badge"
              className={`text-xs font-extrabold flex items-center gap-1.5 ${
                isYoungKid
                  ? 'text-[#FF6B6B]'
                  : 'text-emerald-600 dark:text-[#BEF264]'
              }`}
            >
              {isYoungKid ? (
                <BookOpen className="w-4 h-4 shrink-0" />
              ) : (
                <Languages className="w-4 h-4 shrink-0" />
              )}
              <span>{libraryConfig.badgeText}</span>
            </div>
            <h1
              data-testid="library-stage-heading"
              className="text-2xl sm:text-3xl font-extrabold font-display"
            >
              {libraryConfig.headingText} ({booksForStage.length})
            </h1>
            <p className="text-sm opacity-80 leading-relaxed">
              {libraryConfig.subtitleText}
            </p>
          </div>
          <div
            data-testid="library-books-counter"
            className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-extrabold shrink-0 self-start sm:self-center"
          >
            {isYoungKid ? 'Cuentos ilustrados leídos:' : 'English Stories read:'}{' '}
            <span className="font-black text-emerald-600 dark:text-[#BEF264] tabular-nums">
              {completedInStageCount}/{booksForStage.length}
            </span>
          </div>
        </div>

        {/* Galería de libros adaptada por edad:
            - 3 a 6 años: Cuentos en español CON ilustraciones y dibujitos (StorySceneArt).
            - 7 a 13 y 14 a 18 años: Cuentos e Historias en Inglés SIN dibujos ni ilustraciones. */}
        <div
          data-testid="library-books-grid"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
        >
          {booksForStage.map((book, idx) => {
            const isRead = completedBookIds.includes(book.id);

            return (
              <article
                key={book.id}
                data-testid={`storybook-card-${book.id}`}
                className={`rounded-3xl border-2 p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all ${
                  isYoungKid
                    ? 'bg-amber-50/50 dark:bg-[#221B35] border-amber-300 dark:border-purple-700/60 shadow-sm'
                    : 'bg-slate-50/80 dark:bg-[#1E1730] border-slate-200/90 dark:border-purple-800/50 shadow-xs'
                }`}
              >
                <div className="space-y-4">
                  {/* SOLO los menores de 3 a 6 años tienen dibujitos/ilustraciones */}
                  {isYoungKid &&
                    book.hasIllustrations &&
                    book.pages[0]?.sceneTheme && (
                      <div data-testid="spanish-book-illustration">
                        <StorySceneArt sceneTheme={book.pages[0].sceneTheme} />
                      </div>
                    )}

                  {/* Para mayores (7 a 13 y 14 a 18): Cabecera editorial limpia SIN dibujitos */}
                  {!isYoungKid && (
                    <div
                      data-testid="english-book-text-header"
                      className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-purple-800/50"
                    >
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#BEF264] text-[11px] font-black tracking-wide uppercase">
                        English Reading · Edition #{idx + 1} · No Illustrations
                      </span>
                      <span className="text-xs font-mono font-bold opacity-70">
                        {book.pages.length} Chapters
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold opacity-75">
                      <span>
                        {book.ageBadge} · +{book.xpReward} XP
                      </span>
                      <span>{book.durationLabel}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black font-display leading-snug">
                      {book.title}
                    </h2>
                    <p className="text-xs font-semibold opacity-70">
                      {book.language === 'en'
                        ? `By ${book.author}`
                        : `Por ${book.author}`}
                    </p>
                    <p className="text-sm opacity-85 leading-relaxed pt-1">
                      {book.summary}
                    </p>

                    {/* Vista previa de vocabulario en inglés para mayores de 7 a 18 años */}
                    {!isYoungKid && book.pages[0]?.vocabulary && (
                      <div className="pt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-extrabold opacity-70 mr-1">
                          Key Vocabulary:
                        </span>
                        {book.pages[0].vocabulary.map((v) => (
                          <span
                            key={v.word}
                            className="px-2.5 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-bold"
                          >
                            {v.word} → {v.translationEs}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    data-testid={`open-book-btn-${book.id}`}
                    onClick={() => openBook(book)}
                    className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap ${
                      isYoungKid
                        ? 'bg-[#FF6B6B] hover:bg-[#FA5252] text-white text-base'
                        : 'bg-[#84CC16] hover:bg-[#65A30D] text-slate-950'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    {isYoungKid
                      ? isRead
                        ? 'Volver a Leer Cuento con Dibujitos'
                        : 'Abrir Cuento Ilustrado en Español'
                      : isRead
                      ? 'Read English Story Again (Text Only)'
                      : 'Read English Story · Leer en Inglés'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Lector de Libros Modal:
          - 3 a 6 años: Con ilustraciones grandes (StorySceneArt) y narración en español.
          - 7 a 18 años: Formato libro limpio en inglés SIN ilustraciones, con traducción al tocar palabras y audio en inglés. */}
      {activeBook && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reader-book-title"
          data-testid="book-reader-modal"
        >
          <div className="bg-white dark:bg-[#181326] text-slate-900 dark:text-slate-100 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-purple-800/60 my-auto max-h-[94vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-purple-800/50">
              <div>
                <div className="text-xs font-extrabold text-emerald-600 dark:text-[#BEF264]">
                  {activeBook.language === 'en'
                    ? 'English Story Reader · Clean Text Edition (Sin Ilustraciones)'
                    : 'Cuento Infantil Ilustrado en Español'}
                </div>
                <h2
                  id="reader-book-title"
                  className="text-xl sm:text-2xl font-extrabold font-display mt-0.5"
                >
                  {activeBook.title}
                </h2>
                <p className="text-xs opacity-70">
                  {activeBook.language === 'en'
                    ? `Chapter / Page ${pageIdx + 1} of ${activeBook.pages.length} · Tap highlighted words for Spanish translation`
                    : `Página ${pageIdx + 1} de ${activeBook.pages.length} · Con dibujitos y narración en voz alta`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsLargeText((v) => !v)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-purple-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-1.5"
                >
                  <Type className="w-4 h-4" />
                  {isLargeText ? 'Letra Grande' : 'Letra Normal'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBook(null)}
                  aria-label="Cerrar cuento"
                  data-testid="close-book-reader-btn"
                  className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center opacity-75 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!showQuiz ? (
              <div className="space-y-6">
                {/* SOLO para 3 a 6 años se muestra la ilustración/dibujito en cada página */}
                {isYoungKid &&
                  activeBook.hasIllustrations &&
                  activeBook.pages[pageIdx]?.sceneTheme && (
                    <div data-testid="reader-page-illustration">
                      <StorySceneArt
                        sceneTheme={activeBook.pages[pageIdx].sceneTheme!}
                      />
                    </div>
                  )}

                {/* Barra de capítulo y botón de narración en Español (3-6) o Inglés (7-18) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                  <div>
                    {activeBook.pages[pageIdx].chapterTitle && (
                      <div className="text-sm font-black font-display">
                        {activeBook.pages[pageIdx].chapterTitle}
                      </div>
                    )}
                    <span className="text-xs font-bold opacity-85">
                      {activeBook.pages[pageIdx].caption}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNarrateCurrentPage}
                    className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 whitespace-nowrap shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                    {activeBook.language === 'en'
                      ? isSpeaking
                        ? 'Reading in English...'
                        : 'Listen in English (Audio)'
                      : isSpeaking
                      ? 'Narrando cuento...'
                      : 'Escuchar Cuento en Voz Alta'}
                  </button>
                </div>

                {/* Cuerpo del texto del libro (formato limpio sin ilustraciones en 7-18, con palabras interactivas) */}
                <div
                  data-testid="reader-page-text"
                  className={`p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-[#120E20] border border-slate-200 dark:border-purple-900/60 leading-relaxed font-serif ${
                    isLargeText
                      ? 'text-xl sm:text-2xl'
                      : 'text-base sm:text-lg'
                  }`}
                >
                  {renderInteractiveStoryText(
                    activeBook.pages[pageIdx].text,
                    activeBook.pages[pageIdx].vocabulary
                  )}
                </div>

                {/* Glosario interactivo de vocabulario en inglés (para 7-13 y 14-18 años) */}
                {activeBook.language === 'en' &&
                  activeBook.pages[pageIdx].vocabulary && (
                    <div
                      data-testid="english-vocabulary-panel"
                      className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-[#BEF264] flex items-center gap-1.5">
                          <BookmarkCheck className="w-4 h-4" />
                          Key Vocabulary · Toca cualquier palabra para escuchar y traducir
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {activeBook.pages[pageIdx].vocabulary!.map((item) => {
                          const active =
                            selectedVocab?.word.toLowerCase() ===
                            item.word.toLowerCase();
                          return (
                            <button
                              key={item.word}
                              type="button"
                              onClick={() => handlePronounceVocabWord(item)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                                active
                                  ? 'bg-[#84CC16] text-slate-950 border-emerald-600 shadow-2xs'
                                  : 'bg-white dark:bg-[#1E1730] border-slate-200 dark:border-purple-800/60'
                              }`}
                            >
                              <Volume2 className="w-3.5 h-3.5 opacity-75" />
                              <span>{item.word}</span>
                              <span className="opacity-70">
                                ({item.translationEs})
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {selectedVocab && (
                        <div
                          data-testid="selected-vocab-translation"
                          className="p-3.5 rounded-xl bg-white dark:bg-[#181326] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-black text-sm text-emerald-600 dark:text-[#BEF264]">
                              {selectedVocab.word}
                            </span>{' '}
                            {selectedVocab.phonetic && (
                              <span className="font-mono opacity-70 mr-2">
                                {selectedVocab.phonetic}
                              </span>
                            )}
                            →{' '}
                            <strong className="underline">
                              {selectedVocab.translationEs}
                            </strong>
                            {selectedVocab.example && (
                              <p className="opacity-75 mt-1 italic">
                                Example: "{selectedVocab.example}"
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => speakEnglishText(selectedVocab.word)}
                            className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 self-start sm:self-center shrink-0"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            Pronounce
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    disabled={pageIdx === 0}
                    onClick={() => {
                      playRewardSound('pop');
                      const prevPage = Math.max(0, pageIdx - 1);
                      setPageIdx(prevPage);
                      setSelectedVocab(
                        activeBook.pages[prevPage]?.vocabulary?.[0] || null
                      );
                    }}
                    className="px-4 py-3 rounded-xl border border-slate-200 dark:border-purple-700 font-bold text-sm disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {activeBook.language === 'en'
                      ? 'Previous Page'
                      : 'Página Anterior'}
                  </button>

                  {pageIdx + 1 < activeBook.pages.length ? (
                    <button
                      type="button"
                      onClick={() => {
                        playRewardSound('pop');
                        const nextPage = pageIdx + 1;
                        setPageIdx(nextPage);
                        setSelectedVocab(
                          activeBook.pages[nextPage]?.vocabulary?.[0] || null
                        );
                      }}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-1.5"
                    >
                      {activeBook.language === 'en'
                        ? 'Next Page'
                        : 'Siguiente Página'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        playRewardSound('pop');
                        setShowQuiz(true);
                      }}
                      className="px-6 py-3 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-extrabold text-sm flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {activeBook.language === 'en'
                        ? `Reading Comprehension Quiz (+${activeBook.xpReward} XP)`
                        : `Responder Pregunta y Ganar +${activeBook.xpReward} XP`}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-2">
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-emerald-600 dark:text-[#BEF264]">
                    {activeBook.language === 'en'
                      ? 'English Reading Comprehension Challenge'
                      : 'Reto de Comprensión Lectora'}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold">
                    {activeBook.comprehensionQuestion.question}
                  </h3>
                </div>

                <div className="space-y-3">
                  {activeBook.comprehensionQuestion.options.map((opt) => {
                    const isSelected = selectedQuizAnswer === opt;
                    const isCorrect =
                      opt === activeBook.comprehensionQuestion.correctOption;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleFinishQuiz(opt)}
                        className={`w-full p-4 rounded-2xl border text-left font-bold text-base flex items-center justify-between transition-all ${
                          isSelected && isCorrect
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                            : isSelected && !isCorrect
                            ? 'bg-amber-500/20 border-amber-400 text-amber-900 dark:text-amber-200'
                            : 'bg-slate-50 dark:bg-[#120E20] border-slate-200 dark:border-purple-800/60 hover:border-emerald-400'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {quizCompleted && (
                  <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-extrabold text-base">
                        ¡Excelente lectura! Ganaste +{activeBook.xpReward} XP
                      </div>
                      <div className="text-xs opacity-80">
                        Este libro ya figura como completado en tu Biblioteca.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveBook(null)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm whitespace-nowrap shrink-0"
                    >
                      Volver a la Biblioteca
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
