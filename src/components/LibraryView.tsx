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
} from 'lucide-react';
import { STORYBOOKS_DATA, StoryBook } from '../data/curriculumData';
import { AgeGroup } from '../utils/educationLogic';
import { StorySceneArt } from './ArtworkRenderer';
import { playRewardSound, speakSpanishText } from '../utils/soundEffects';

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
  const [activeBook, setActiveBook] = useState<StoryBook | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [isLargeText, setIsLargeText] = useState(ageGroup === '3-6');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const openBook = (book: StoryBook) => {
    playRewardSound('pop');
    setActiveBook(book);
    setPageIdx(0);
    setShowQuiz(false);
    setSelectedQuizAnswer(null);
    setQuizCompleted(false);
    setIsLargeText(ageGroup === '3-6' || true);
  };

  const handleNarrateCurrentPage = () => {
    if (!activeBook) return;
    const currentPage = activeBook.pages[pageIdx];
    setIsSpeaking(true);
    speakSpanishText(currentPage.text, () => {
      setIsSpeaking(false);
    });
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

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-xs font-semibold text-amber-700">
              Biblioteca Interactiva · Ilustraciones Grandes y Narración en Voz Alta
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
              Cuentos y Lecturas con Voz en Español
            </h1>
            <p className="text-sm text-slate-600">
              Abre cualquier libro para leer con letra grande, ilustraciones a todo color y escuchar la historia narrada en voz alta.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 shrink-0">
            Libros leídos: <span className="font-bold text-emerald-700 tabular-nums">{completedBookIds.length}/{STORYBOOKS_DATA.length}</span>
          </div>
        </div>

        {/* Galería de libros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {STORYBOOKS_DATA.map((book) => {
            const isRead = completedBookIds.includes(book.id);
            const isRecommended = book.recommendedAges.includes(ageGroup);

            return (
              <article
                key={book.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 transition-all ${
                  isRecommended
                    ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  <StorySceneArt sceneTheme={book.pages[0].sceneTheme} />
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500 font-medium">
                      {book.ageBadge} · +{book.xpReward} XP
                    </div>
                    <h2 className="text-xl font-bold font-display text-slate-900">
                      {book.title}
                    </h2>
                    <p className="text-xs text-slate-500">Por {book.author}</p>
                    <p className="text-sm text-slate-700 leading-relaxed pt-1">
                      {book.summary}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openBook(book)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
                  >
                    <BookOpen className="w-4 h-4" />
                    {isRead ? 'Volver a Leer y Escuchar' : 'Leer y Escuchar Cuento'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Lector de Libros Ilustrados a Pantalla Completa / Modal */}
      {activeBook && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reader-book-title"
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto max-h-[94vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 id="reader-book-title" className="text-xl sm:text-2xl font-bold font-display text-slate-900">
                  {activeBook.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Página {pageIdx + 1} de {activeBook.pages.length} · Narración en voz alta disponible
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLargeText((v) => !v)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <Type className="w-4 h-4" />
                  {isLargeText ? 'Letra Extra Grande' : 'Letra Normal'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBook(null)}
                  aria-label="Cerrar cuento"
                  className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!showQuiz ? (
              <div className="space-y-6">
                <StorySceneArt sceneTheme={activeBook.pages[pageIdx].sceneTheme} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <span className="text-xs font-semibold text-amber-900">
                    {activeBook.pages[pageIdx].caption}
                  </span>
                  <button
                    type="button"
                    onClick={handleNarrateCurrentPage}
                    className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0"
                  >
                    <Volume2 className="w-5 h-5" />
                    {isSpeaking ? 'Narrando en voz alta...' : 'Escuchar Narración en Voz Alta'}
                  </button>
                </div>

                <div
                  className={`p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 leading-relaxed font-medium ${
                    isLargeText ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
                  }`}
                >
                  {activeBook.pages[pageIdx].text}
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    disabled={pageIdx === 0}
                    onClick={() => {
                      playRewardSound('pop');
                      setPageIdx((p) => Math.max(0, p - 1));
                    }}
                    className="px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Página Anterior
                  </button>

                  {pageIdx + 1 < activeBook.pages.length ? (
                    <button
                      type="button"
                      onClick={() => {
                        playRewardSound('pop');
                        setPageIdx((p) => p + 1);
                      }}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-1.5"
                    >
                      Siguiente Página
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        playRewardSound('pop');
                        setShowQuiz(true);
                      }}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Responder Pregunta y Ganar +{activeBook.xpReward} XP
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-2">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-emerald-700">
                    Reto de Comprensión Lectora
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
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
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                            : isSelected && !isCorrect
                            ? 'bg-amber-50 border-amber-400 text-amber-950'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {quizCompleted && (
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-emerald-950 text-base">
                        ¡Excelente lectura! Ganaste +{activeBook.xpReward} XP
                      </div>
                      <div className="text-xs text-emerald-800">
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
