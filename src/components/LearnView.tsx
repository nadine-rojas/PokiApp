import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Calculator,
  Coins,
  Palette,
  Rocket,
  Music,
  CheckCircle2,
  Play,
  Volume2,
  Sparkles,
  Flame,
  Zap,
  ArrowRight,
  RotateCcw,
  X,
  HelpCircle,
  Lock,
  SpellCheck,
  Crown,
  HeartHandshake,
  ChevronRight,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import {
  COURSES_DATA,
  Course,
  LessonItem,
  CourseSubject,
  PRAYERS_COLLECTION,
  ROSARY_MYSTERIES,
  RosaryMysteryGroup,
} from '../data/curriculumData';
import {
  AgeGroup,
  ChildMood,
  calculateLessonReward,
  getEncouragementMessage,
  isLessonUnlocked,
} from '../utils/educationLogic';
import {
  playRewardSound,
  playPianoNote,
  PIANO_NOTES,
  speakSpanishText,
} from '../utils/soundEffects';
import {
  DrawingGuideArt,
  MascotCompanion,
  CircularProgressRing,
} from './ArtworkRenderer';
import { LibraryView } from './LibraryView';

interface LearnViewProps {
  userName: string;
  ageGroup: AgeGroup;
  age: number;
  streak: number;
  xp: number;
  mood?: ChildMood;
  onChangeMood?: (mood: ChildMood) => void;
  allowedSubjects: CourseSubject[];
  completedLessonIds: string[];
  completedBookIds: string[];
  onCompleteLesson: (lessonId: string, xpEarned: number, subject: CourseSubject) => void;
  onCompleteBook: (bookId: string, xpReward: number) => void;
  onOpenLibrary: () => void;
  onOpenChess: () => void;
  onOpenParentalPanel: () => void;
}

const MOOD_OPTIONS: {
  id: ChildMood;
  label: string;
  faceSvg: React.ReactNode;
}[] = [
  {
    id: 'happy',
    label: 'Feliz',
    faceSvg: (
      <svg viewBox="0 0 36 36" className="w-7 h-7">
        <circle cx="18" cy="18" r="16" fill="#FDE047" />
        <circle cx="13" cy="15" r="2.2" fill="#0F172A" />
        <circle cx="23" cy="15" r="2.2" fill="#0F172A" />
        <path d="M12 21 Q18 27 24 21" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'excited',
    label: 'Genial',
    faceSvg: (
      <svg viewBox="0 0 36 36" className="w-7 h-7">
        <circle cx="18" cy="18" r="16" fill="#84CC16" />
        <circle cx="13" cy="14" r="2.5" fill="#0F172A" />
        <circle cx="23" cy="14" r="2.5" fill="#0F172A" />
        <path d="M11 20 Q18 29 25 20 Z" fill="#0F172A" />
      </svg>
    ),
  },
  {
    id: 'calm',
    label: 'Tranquilo',
    faceSvg: (
      <svg viewBox="0 0 36 36" className="w-7 h-7">
        <circle cx="18" cy="18" r="16" fill="#38BDF8" />
        <path d="M10 15 Q13 13 16 15" stroke="#0F172A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M20 15 Q23 13 26 15" stroke="#0F172A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M13 22 Q18 25 23 22" stroke="#0F172A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'curious',
    label: 'Curioso',
    faceSvg: (
      <svg viewBox="0 0 36 36" className="w-7 h-7">
        <circle cx="18" cy="18" r="16" fill="#FB923C" />
        <circle cx="13" cy="15" r="2.4" fill="#0F172A" />
        <circle cx="23" cy="15" r="2.4" fill="#0F172A" />
        <circle cx="18" cy="23" r="3" fill="#0F172A" />
      </svg>
    ),
  },
  {
    id: 'focused',
    label: 'Enfocado',
    faceSvg: (
      <svg viewBox="0 0 36 36" className="w-7 h-7">
        <circle cx="18" cy="18" r="16" fill="#A855F7" />
        <circle cx="13" cy="15" r="2.2" fill="#FFFFFF" />
        <circle cx="23" cy="15" r="2.2" fill="#FFFFFF" />
        <path d="M13 22 L23 22" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const WEEK_DAYS = [
  { short: 'L', num: '12', done: true },
  { short: 'M', num: '13', done: true },
  { short: 'X', num: '14', active: true },
  { short: 'J', num: '15', done: false },
  { short: 'V', num: '16', done: false },
  { short: 'S', num: '17', done: false },
  { short: 'D', num: '18', done: false },
];

export function LearnView({
  userName,
  ageGroup,
  streak,
  xp,
  mood = 'happy',
  onChangeMood,
  allowedSubjects,
  completedLessonIds,
  completedBookIds,
  onCompleteLesson,
  onCompleteBook,
  onOpenLibrary,
  onOpenParentalPanel,
}: LearnViewProps) {
  // Para las etapas de 7-13 y 14-18, la Biblioteca de Libros vive dentro de "Aprender"
  const [subView, setSubView] = useState<'courses' | 'library'>('courses');

  const coursesForAge = COURSES_DATA.filter(
    (c) => c.ageGroup === ageGroup && allowedSubjects.includes(c.subject)
  );

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    coursesForAge[0]?.id || ''
  );

  useEffect(() => {
    const valid = coursesForAge.find((c) => c.id === selectedCourseId);
    if (!valid && coursesForAge[0]) {
      setSelectedCourseId(coursesForAge[0].id);
    }
  }, [ageGroup, coursesForAge, selectedCourseId]);

  const activeCourse: Course | undefined =
    coursesForAge.find((c) => c.id === selectedCourseId) || coursesForAge[0];

  // Estado de la Guía del Santo Rosario
  const [selectedMysteryGroupId, setSelectedMysteryGroupId] =
    useState<RosaryMysteryGroup['id']>('gozosos');
  const [mysteryIndex, setMysteryIndex] = useState(0);
  const [beadStep, setBeadStep] = useState<number>(0);

  const activeMysteryGroup =
    ROSARY_MYSTERIES.find((m) => m.id === selectedMysteryGroupId) ||
    ROSARY_MYSTERIES[0];
  const currentMystery =
    activeMysteryGroup.mysteries[mysteryIndex] || activeMysteryGroup.mysteries[0];

  // Estado del modal de lección activa
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<{
    checked: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [lessonFinished, setLessonFinished] = useState(false);

  // Estado específico para el teclado de piano interactivo
  const [playedNotes, setPlayedNotes] = useState<string[]>([]);
  const [activeKeyNote, setActiveKeyNote] = useState<string | null>(null);

  // Estado específico para el taller de dibujo realista paso a paso
  const [drawingStepIdx, setDrawingStepIdx] = useState(0);
  const [brushSize, setBrushSize] = useState<number>(3);
  const [brushTone, setBrushTone] = useState<string>('#1E293B');
  const [hasDrawnStroke, setHasDrawnStroke] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const startLesson = (lesson: LessonItem) => {
    playRewardSound('pop');
    setActiveLesson(lesson);
    setExerciseIdx(0);
    setSelectedOption(null);
    setFeedbackState(null);
    setCorrectCount(0);
    setLessonFinished(false);
    setPlayedNotes([]);
    setDrawingStepIdx(0);
    setHasDrawnStroke(false);
  };

  const currentExercise = activeLesson?.exercises[exerciseIdx];

  useEffect(() => {
    if (currentExercise?.type === 'drawing_studio' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FAF6F0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [currentExercise]);

  const clearDrawingCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FAF6F0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawnStroke(false);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    setHasDrawnStroke(true);
    ctx.strokeStyle = brushTone;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasPointerUp = () => {
    isDrawingRef.current = false;
  };

  const handlePressPianoKey = (noteObj: (typeof PIANO_NOTES)[number]) => {
    playPianoNote(noteObj.freq);
    setActiveKeyNote(noteObj.note);
    setTimeout(() => setActiveKeyNote(null), 220);

    if (currentExercise?.type === 'piano_melody' && currentExercise.targetNotes) {
      const expectedNextNote = currentExercise.targetNotes[playedNotes.length];
      if (noteObj.note === expectedNextNote) {
        const nextPlayed = [...playedNotes, noteObj.note];
        setPlayedNotes(nextPlayed);
        if (nextPlayed.length === currentExercise.targetNotes.length) {
          playRewardSound('correct');
          setCorrectCount((prev) => prev + 1);
          setFeedbackState({
            checked: true,
            isCorrect: true,
            message: getEncouragementMessage(true, ageGroup, exerciseIdx),
          });
        }
      } else {
        setFeedbackState({
          checked: false,
          isCorrect: false,
          message: `Pulsaste ${noteObj.label}. Busca la tecla iluminada (${expectedNextNote}) para continuar la melodía.`,
        });
      }
    }
  };

  const handleVerifyAnswer = () => {
    if (!currentExercise) return;

    if (currentExercise.type === 'drawing_studio') {
      playRewardSound('correct');
      setCorrectCount((prev) => prev + 1);
      setFeedbackState({
        checked: true,
        isCorrect: true,
        message: getEncouragementMessage(true, ageGroup, exerciseIdx),
      });
      return;
    }

    if (!selectedOption) return;
    const isCorrect = selectedOption === currentExercise.correctAnswer;
    playRewardSound(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
    setFeedbackState({
      checked: true,
      isCorrect,
      message: getEncouragementMessage(isCorrect, ageGroup, exerciseIdx),
    });
  };

  const handleNextExercise = () => {
    if (!activeLesson || !activeCourse) return;
    if (exerciseIdx + 1 < activeLesson.exercises.length) {
      setExerciseIdx((prev) => prev + 1);
      setSelectedOption(null);
      setFeedbackState(null);
      setPlayedNotes([]);
      setDrawingStepIdx(0);
    } else {
      playRewardSound('fanfare');
      setLessonFinished(true);
      const reward = calculateLessonReward(
        correctCount,
        activeLesson.exercises.length,
        streak,
        ageGroup
      );
      onCompleteLesson(activeLesson.id, reward.xpEarned, activeCourse.subject);
    }
  };

  const getSubjectIcon = (subject: CourseSubject) => {
    switch (subject) {
      case 'reading':
        return <BookOpen className="w-5 h-5" />;
      case 'math':
        return <Calculator className="w-5 h-5" />;
      case 'finance':
        return <Coins className="w-5 h-5" />;
      case 'drawing':
        return <Palette className="w-5 h-5" />;
      case 'entrepreneurship':
        return <Rocket className="w-5 h-5" />;
      case 'piano':
        return <Music className="w-5 h-5" />;
      case 'orthography':
        return <SpellCheck className="w-5 h-5" />;
      case 'chess_course':
        return <Crown className="w-5 h-5" />;
      case 'prayer':
        return <HeartHandshake className="w-5 h-5" />;
    }
  };

  const isYoungKid = ageGroup === '3-6';
  const isTeenDark = ageGroup === '14-18';

  const getBeadPrayerText = () => {
    if (beadStep === 0) {
      return `Misterio ${currentMystery.number}: ${currentMystery.title}. ${currentMystery.meditation} Rezamos un Padre Nuestro: ${PRAYERS_COLLECTION[0].text}`;
    }
    if (beadStep >= 1 && beadStep <= 10) {
      return `Cuenta ${beadStep} de 10 del Ave María: ${PRAYERS_COLLECTION[1].text}`;
    }
    return `Final de la decena. Rezamos el Gloria: ${PRAYERS_COLLECTION[2].text}`;
  };

  if (!activeCourse) {
    return (
      <div
        className={`rounded-[32px] border p-8 text-center space-y-4 ${
          isTeenDark
            ? 'bg-[#181426] border-purple-900/50 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <Lock className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold font-display">
          No hay cursos activos en este momento
        </h2>
        <p className="text-sm opacity-75 max-w-md mx-auto">
          El padre o tutor puede activar cursos desde el Panel de Padres con PIN en la sección Perfil.
        </p>
        <button
          type="button"
          onClick={onOpenParentalPanel}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs"
        >
          Ir al Panel de Padres
        </button>
      </div>
    );
  }

  // Si en las etapas 7-13 o 14-18 el usuario abrió la Biblioteca integrada dentro de "Aprender"
  if (!isYoungKid && subView === 'library') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex p-1.5 rounded-full bg-black/5 border border-slate-300/30">
            <button
              type="button"
              onClick={() => setSubView('courses')}
              className="px-5 py-2 rounded-full text-xs font-extrabold opacity-75 hover:opacity-100"
            >
              Mis Cursos
            </button>
            <button
              type="button"
              onClick={() => setSubView('library')}
              className="px-5 py-2 rounded-full text-xs font-extrabold bg-[#84CC16] text-slate-950 shadow-xs"
            >
              Biblioteca de Libros
            </button>
          </div>
        </div>
        <LibraryView
          ageGroup={ageGroup}
          completedBookIds={completedBookIds}
          onCompleteBook={onCompleteBook}
        />
      </div>
    );
  }

  const completedInCourse = activeCourse.lessons.filter((l) =>
    completedLessonIds.includes(l.id)
  ).length;
  const courseProgressPercent = Math.round(
    (completedInCourse / Math.max(1, activeCourse.lessons.length)) * 100
  );

  // Colores de mosaicos por curso (estilo Habitz / moimoi / Plopp / Quixel)
  const tileColorsBySubject: Record<CourseSubject, string> = {
    reading: 'from-[#FF6B6B] to-[#FF8E53] text-white',
    math: 'from-[#38BDF8] to-[#2563EB] text-white',
    orthography: 'from-[#FB923C] to-[#EA580C] text-white',
    finance: 'from-[#84CC16] to-[#10B981] text-slate-950',
    drawing: 'from-[#FB7185] to-[#E11D48] text-white',
    entrepreneurship: 'from-[#A855F7] to-[#6366F1] text-white',
    piano: 'from-[#FACC15] to-[#F59E0B] text-slate-950',
    chess_course: 'from-[#2DD4BF] to-[#0D9488] text-slate-950',
    prayer: 'from-[#60A5FA] to-[#4F46E5] text-white',
  };

  return (
    <div className="space-y-8">
      {/* Selector superior Cursos vs Biblioteca (para 7-13 y 14-18, donde Biblioteca está dentro de Aprender) */}
      {!isYoungKid && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            className={`inline-flex p-1.5 rounded-full border ${
              isTeenDark
                ? 'bg-[#1A1528] border-purple-900/50'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <button
              type="button"
              onClick={() => setSubView('courses')}
              className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all ${
                subView === 'courses'
                  ? 'bg-[#84CC16] text-slate-950 shadow-xs'
                  : 'opacity-75 hover:opacity-100'
              }`}
            >
              Mosaico de Cursos
            </button>
            <button
              type="button"
              onClick={() => {
                playRewardSound('pop');
                setSubView('library');
              }}
              className="px-5 py-2 rounded-full text-xs font-extrabold opacity-80 hover:opacity-100 flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Biblioteca de Libros ({completedBookIds.length})
            </button>
          </div>
        </div>
      )}

      {/* CABECERA VISUAL SEGÚN LA EXPERIENCIA DE EDAD (Aptivo/Plopp vs Habitz/Bosque vs Quixel/eCoursie) */}
      {isYoungKid ? (
        /* ESTILO 3 A 6 AÑOS: Aptivo y Plopp — Crema con Coral (#FF6B6B) y Verde Lima (#84CC16), Mascota Gigante y Botones Enormes */
        <section className="rounded-[36px] p-6 sm:p-8 bg-gradient-to-br from-[#FFF5F5] via-[#FFFDF7] to-[#ECFCCB] border-4 border-[#FF6B6B]/40 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <MascotCompanion variant="flower" size="xl" mood="excited" />
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FF6B6B] text-white text-xs font-black">
                  <Sparkles className="w-4 h-4" />
                  ¡Hola, {userName}!
                </div>
                <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900">
                  ¡Toca y Escucha!
                </h1>
                <p className="text-base font-bold text-slate-700 max-w-md">
                  Completa tus estrellitas de <strong>Aprender a Leer</strong> y <strong>Ajedrez</strong> para ganar tu trofeo mágico.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() =>
                  speakSpanishText(
                    `¡Hola ${userName}! Toca un cuadro grande de colores para escuchar y jugar.`
                  )
                }
                className="px-6 py-5 rounded-3xl bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-black text-lg shadow-md flex items-center gap-2.5 transition-transform active:scale-95"
              >
                <Volume2 className="w-7 h-7" />
                Escuchar Voz
              </button>
              <button
                type="button"
                onClick={onOpenLibrary}
                className="px-6 py-5 rounded-3xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-black text-lg shadow-md flex items-center gap-2.5 transition-transform active:scale-95"
              >
                <BookOpen className="w-7 h-7" />
                Cuentos
              </button>
            </div>
          </div>

          {/* Mosaicos Enormes para 3 a 6 años */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {coursesForAge.map((course) => {
              const isSelected = course.id === activeCourse.id;
              const doneCount = course.lessons.filter((l) =>
                completedLessonIds.includes(l.id)
              ).length;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    playRewardSound('pop');
                    setSelectedCourseId(course.id);
                    speakSpanishText(course.title);
                  }}
                  className={`p-6 rounded-[32px] border-4 text-left transition-all flex flex-col justify-between gap-4 shadow-md ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white border-white scale-[1.02]'
                      : 'bg-white text-slate-900 border-[#FED7AA] hover:border-[#FF6B6B]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-3.5 rounded-2xl bg-black/10">
                      {getSubjectIcon(course.subject)}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/90 text-slate-900 font-black text-sm tabular-nums">
                      ★ {doneCount}/{course.lessons.length}
                    </span>
                  </div>
                  <div className="text-xl font-black font-display leading-snug">
                    {course.title}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : isTeenDark ? (
        /* ESTILO 14 A 18 AÑOS: Quixel, eCoursie y Start Your Journey — "Buenos días, [nombre]", Lila y Morado con Acento Lima, Anillos y Calendario */
        <section className="rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-[#1F1638] via-[#151125] to-[#26184A] border border-purple-500/30 text-white shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <MascotCompanion variant="orb" size="md" mood="focused" />
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BEF264] text-slate-950 text-xs font-extrabold">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Racha Activa: {streak} días
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight">
                  Buenos días, {userName}
                </h1>
                <p className="text-xs sm:text-sm text-purple-200/80">
                  Continúa tu ruta de alto rendimiento y desbloquea el siguiente módulo.
                </p>
              </div>
            </div>

            {/* Anillos de progreso + Calendario semanal (Quixel / eCoursie) */}
            <div className="flex flex-wrap items-center gap-5 bg-[#120E20]/90 p-4 rounded-3xl border border-purple-500/20">
              <div className="flex items-center gap-3">
                <CircularProgressRing
                  percent={courseProgressPercent}
                  size={68}
                  strokeWidth={7}
                  color="#BEF264"
                  trackColor="rgba(167, 139, 250, 0.2)"
                  label="Curso"
                />
                <div>
                  <div className="text-xs text-purple-300 font-semibold">
                    Dominio Actual
                  </div>
                  <div className="text-lg font-extrabold text-[#BEF264] tabular-nums">
                    {xp} XP
                  </div>
                </div>
              </div>

              <div className="h-10 w-px bg-purple-500/20 hidden sm:block" />

              <div>
                <div className="text-[11px] font-bold text-purple-300 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#BEF264]" />
                  Calendario de Lecciones
                </div>
                <div className="flex items-center gap-1.5">
                  {WEEK_DAYS.map((d) => (
                    <div
                      key={d.short}
                      className={`w-8 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold ${
                        d.active
                          ? 'bg-[#BEF264] text-slate-950 font-black'
                          : d.done
                          ? 'bg-purple-600/40 text-white border border-purple-400/40'
                          : 'bg-white/5 text-purple-300/60'
                      }`}
                    >
                      <span>{d.short}</span>
                      <span className="tabular-nums">{d.num}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mosaico de Cursos Lila/Morado/Lima */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {coursesForAge.map((course) => {
              const isSelected = course.id === activeCourse.id;
              const doneCount = course.lessons.filter((l) =>
                completedLessonIds.includes(l.id)
              ).length;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    playRewardSound('pop');
                    setSelectedCourseId(course.id);
                  }}
                  className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-[#BEF264] text-slate-950 border-[#BEF264] shadow-md font-extrabold'
                      : 'bg-[#1D1632] text-purple-100 border-purple-800/50 hover:border-purple-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`p-2 rounded-2xl ${
                        isSelected ? 'bg-slate-950/10' : 'bg-purple-500/20 text-[#BEF264]'
                      }`}
                    >
                      {getSubjectIcon(course.subject)}
                    </span>
                    <span className="text-xs font-mono font-bold tabular-nums">
                      {doneCount}/{course.lessons.length}
                    </span>
                  </div>
                  <div className="text-sm font-extrabold leading-snug">
                    {course.title}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        /* ESTILO 7 A 13 AÑOS: Habitz, moimoi y App del Bosque — Ilustración de bosque, Mosaicos Inclinados y Selector de Estado de Ánimo con Caritas */
        <section className="rounded-[34px] p-6 sm:p-8 bg-gradient-to-br from-[#ECFCCB] via-[#E0F2FE] to-[#FEF3C7] border-2 border-emerald-300/80 shadow-md space-y-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <MascotCompanion variant="droplet" size="lg" mood={mood} />
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-emerald-800 text-xs font-extrabold shadow-2xs">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-current" />
                  Racha en el Bosque: {streak} días
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900">
                  ¡Hola, {userName}! Explora tu Aventura
                </h1>
                <p className="text-xs sm:text-sm text-slate-700 font-semibold">
                  Elige un mosaico de color y supera el Nivel 1 para abrir la siguiente misión.
                </p>
              </div>
            </div>

            {/* Selector de Estado de Ánimo con Caritas (Habitz / moimoi) */}
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-3xl border border-emerald-200 shadow-xs space-y-2">
              <div className="text-xs font-extrabold text-slate-800">
                ¿Cómo te sientes hoy?
              </div>
              <div className="flex items-center gap-2">
                {MOOD_OPTIONS.map((m) => {
                  const active = mood === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        playRewardSound('pop');
                        onChangeMood?.(m.id);
                      }}
                      title={m.label}
                      aria-label={`Estado de ánimo ${m.label}`}
                      className={`p-1.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-0.5 ${
                        active
                          ? 'border-emerald-600 bg-emerald-50 scale-110 shadow-xs'
                          : 'border-transparent hover:bg-slate-100 opacity-80'
                      }`}
                    >
                      {m.faceSvg}
                      <span className="text-[10px] font-extrabold text-slate-700">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mosaicos de Cursos con Colores Vivos e Inclinación Suave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 relative z-10">
            {coursesForAge.map((course, idx) => {
              const isSelected = course.id === activeCourse.id;
              const doneCount = course.lessons.filter((l) =>
                completedLessonIds.includes(l.id)
              ).length;
              const gradientClass = tileColorsBySubject[course.subject];
              const tiltClass = idx % 2 === 0 ? 'hover:-rotate-1' : 'hover:rotate-1';

              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    playRewardSound('pop');
                    setSelectedCourseId(course.id);
                  }}
                  className={`p-4 rounded-3xl border-2 text-left transition-all flex flex-col justify-between gap-2.5 shadow-sm ${tiltClass} ${
                    isSelected
                      ? `bg-gradient-to-br ${gradientClass} border-white ring-4 ring-emerald-500/30 scale-[1.02]`
                      : 'bg-white/95 text-slate-900 border-white hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="p-2 rounded-2xl bg-black/10">
                      {getSubjectIcon(course.subject)}
                    </span>
                    <span className="text-xs font-mono font-extrabold tabular-nums px-2 py-0.5 rounded-full bg-black/10">
                      {doneCount}/{course.lessons.length}
                    </span>
                  </div>
                  <div className="font-extrabold text-sm leading-snug">
                    {course.title}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* MAPA DE LECCIONES SECUENCIALES ESTILO DUOLINGO + ESTADÍSTICAS CON ANILLOS DE PROGRESO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        <div
          data-testid="duolingo-learning-path"
          className={`lg:col-span-8 rounded-[32px] border p-5 sm:p-8 space-y-6 ${
            isTeenDark
              ? 'bg-[#181326] border-purple-900/50 text-white'
              : 'bg-white dark:bg-[#181326] border-slate-200/90 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/40 dark:border-white/10">
            <div className="min-w-0">
              <span
                className={`text-xs font-extrabold ${
                  isTeenDark
                    ? 'text-[#BEF264]'
                    : 'text-emerald-600 dark:text-[#BEF264]'
                }`}
              >
                Ruta Gamificada Estilo Duolingo · +5 Gemas por Nivel
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5 font-display">
                {activeCourse.title}
              </h2>
              <p className="text-sm opacity-75 mt-1">{activeCourse.subtitle}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <CircularProgressRing
                percent={courseProgressPercent}
                size={64}
                strokeWidth={7}
                color={isTeenDark ? '#BEF264' : '#10B981'}
                label="Avance"
              />
            </div>
          </div>

          {/* Ruta de Nodos Secuenciales Estilo Duolingo (Nivel 1 abierto, siguientes bloqueados hasta completar el anterior) */}
          <div className="relative space-y-5">
            {activeCourse.lessons.map((lesson, idx) => {
              const prevLessonId =
                idx > 0 ? activeCourse.lessons[idx - 1].id : null;
              const isUnlocked = isLessonUnlocked(
                idx,
                prevLessonId,
                completedLessonIds
              );
              const isCompleted = completedLessonIds.includes(lesson.id);
              const isLast = idx === activeCourse.lessons.length - 1;

              return (
                <div key={lesson.id} className="relative">
                  {!isLast && (
                    <div
                      aria-hidden="true"
                      className={`hidden sm:block absolute left-11 top-20 bottom-[-22px] w-1 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                  <div
                    className={`rounded-3xl border-2 p-4 sm:p-5 transition-all ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/50'
                        : isUnlocked
                        ? isTeenDark
                          ? 'bg-[#221B35] border-purple-700/60 shadow-sm'
                          : 'bg-[#FFFDF7] dark:bg-[#221B35] border-amber-300 dark:border-purple-700/60 shadow-sm'
                        : 'opacity-60 border-slate-200/50 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className={`w-14 h-14 rounded-full border-b-4 flex items-center justify-center font-display font-black text-xl shrink-0 shadow-xs ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-700 text-white'
                              : isUnlocked
                              ? isTeenDark
                                ? 'bg-[#BEF264] border-[#84CC16] text-slate-950'
                                : 'bg-[#84CC16] border-[#4D7C0F] text-slate-950'
                              : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-7 h-7" />
                          ) : isUnlocked ? (
                            lesson.levelNumber
                          ) : (
                            <Lock className="w-6 h-6" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold opacity-75">
                            Nivel {lesson.levelNumber} · {lesson.durationMinutes} min · +{lesson.xpReward} XP · +5 Gemas
                          </div>
                          <h3
                            className={`font-extrabold mt-0.5 ${
                              isYoungKid ? 'text-xl' : 'text-lg'
                            }`}
                          >
                            {lesson.title}
                          </h3>
                          <p className="text-sm opacity-75 mt-1">
                            {isUnlocked
                              ? lesson.description
                              : `Completa el Nivel ${lesson.levelNumber - 1} para desbloquear esta lección.`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => startLesson(lesson)}
                        className={`px-5 py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap shrink-0 ${
                          isYoungKid ? 'h-14 text-base px-6' : 'h-11'
                        } ${
                          !isUnlocked
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                            : isCompleted
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/30'
                            : isTeenDark
                            ? 'bg-[#BEF264] text-slate-950 hover:opacity-95 shadow-sm'
                            : 'bg-[#84CC16] text-slate-950 hover:bg-[#65A30D] shadow-sm'
                        }`}
                      >
                        {!isUnlocked ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Bloqueada
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            {isCompleted ? 'Practicar de Nuevo' : 'Empezar Lección'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SECCIÓN ESPECIAL DENTRO DEL CURSO DE ORACIÓN: ORACIONES Y GUÍA PASO A PASO DEL SANTO ROSARIO */}
          {activeCourse.subject === 'prayer' && (
            <div className="pt-6 border-t border-slate-200/40 dark:border-white/10 space-y-6">
              <div>
                <div className="text-xs font-bold text-sky-500">
                  Guía Interactiva con Audio · Paso a Paso
                </div>
                <h3 className="text-xl font-bold font-display mt-0.5">
                  Oraciones Clásicas y Guía del Santo Rosario
                </h3>
                <p className="text-xs opacity-75 mt-1">
                  Escucha cada oración en voz alta y sigue las cuentas del Santo Rosario con sus Misterios.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRAYERS_COLLECTION.map((pr) => (
                  <div
                    key={pr.id}
                    className={`p-4 rounded-2xl border space-y-2.5 ${
                      isTeenDark
                        ? 'bg-[#221B35] border-purple-800/50'
                        : 'bg-sky-50/50 dark:bg-[#221B35] border-sky-200 dark:border-purple-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base">{pr.title}</h4>
                        <div className="text-xs opacity-70">{pr.subtitle}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakSpanishText(pr.text)}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Escuchar
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{pr.text}</p>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-[11px] font-medium">
                      <strong>Guía:</strong> {pr.simpleExplanationByAge[ageGroup]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Guía Interactiva Cuenta por Cuenta del Santo Rosario */}
              <div
                className={`p-5 rounded-3xl border space-y-4 ${
                  isTeenDark
                    ? 'bg-[#120E20] border-purple-900/50'
                    : 'bg-amber-50/50 dark:bg-[#120E20] border-amber-200 dark:border-purple-900/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-base font-display">
                      Guía Paso a Paso del Santo Rosario
                    </h4>
                    <p className="text-xs opacity-75">
                      Elige los Misterios del día y avanza cuenta por cuenta con audio.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {ROSARY_MYSTERIES.map((mGroup) => (
                      <button
                        key={mGroup.id}
                        type="button"
                        onClick={() => {
                          setSelectedMysteryGroupId(mGroup.id);
                          setMysteryIndex(0);
                          setBeadStep(0);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          selectedMysteryGroupId === mGroup.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200/60 dark:bg-white/10 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {mGroup.name.replace('Misterios ', '')} ({mGroup.daysText})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeMysteryGroup.mysteries.map((myst, idx) => (
                    <button
                      key={myst.number}
                      type="button"
                      onClick={() => {
                        setMysteryIndex(idx);
                        setBeadStep(0);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        mysteryIndex === idx
                          ? 'border-amber-500 bg-amber-400 text-slate-950'
                          : 'border-slate-300/50 opacity-75'
                      }`}
                    >
                      {myst.number}º Misterio
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-emerald-500">
                        {activeMysteryGroup.name} · Fruto: {currentMystery.fruit}
                      </div>
                      <div className="font-bold text-base">
                        {currentMystery.number}. {currentMystery.title}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakSpanishText(getBeadPrayerText())}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 self-start whitespace-nowrap"
                    >
                      <Volume2 className="w-4 h-4" />
                      Escuchar Cuenta Actual
                    </button>
                  </div>

                  <p className="text-xs opacity-85">{currentMystery.meditation}</p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-2">
                    <button
                      type="button"
                      onClick={() => setBeadStep(0)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        beadStep === 0
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-slate-400/50'
                      }`}
                    >
                      Padre Nuestro
                    </button>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBeadStep(num)}
                        aria-label={`Cuenta Ave María ${num}`}
                        className={`w-7 h-7 rounded-full text-xs font-bold border flex items-center justify-center transition-all ${
                          beadStep === num
                            ? 'bg-amber-400 text-slate-950 border-amber-600 scale-110'
                            : beadStep > num
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'border-slate-400/50 opacity-75'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setBeadStep(11)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        beadStep === 11
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-slate-400/50'
                      }`}
                    >
                      Gloria
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs leading-relaxed">
                    {getBeadPrayerText()}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={beadStep === 0}
                      onClick={() => setBeadStep((b) => Math.max(0, b - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-40 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Cuenta Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playRewardSound('pop');
                        if (beadStep < 11) {
                          setBeadStep((b) => b + 1);
                        } else if (mysteryIndex < 4) {
                          setMysteryIndex((m) => m + 1);
                          setBeadStep(0);
                        } else {
                          setBeadStep(0);
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                    >
                      {beadStep < 11 ? 'Siguiente Cuenta' : 'Siguiente Misterio'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: Racha con Llama/Rayo, Anillo de Nivel y Resumen de Etapa */}
        <aside className="lg:col-span-4 space-y-6">
          <div
            className={`rounded-[32px] border p-6 space-y-5 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-900/50 text-white'
                : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base font-display">
                Racha y Anillo de Nivel
              </h3>
              <Flame className="w-6 h-6 text-orange-500 fill-current" />
            </div>

            <div className="flex items-center gap-4 p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30">
              <CircularProgressRing
                percent={Math.min(100, Math.round(((xp % 250) / 250) * 100))}
                size={72}
                strokeWidth={8}
                color="#F59E0B"
                label={`Niv ${Math.floor(xp / 250) + 1}`}
              />
              <div>
                <div className="text-2xl font-black tabular-nums">
                  {streak} días
                </div>
                <div className="text-xs opacity-80 font-bold">
                  {xp} XP acumulados
                </div>
              </div>
            </div>

            {isYoungKid && (
              <div className="p-4 rounded-2xl bg-[#ECFCCB] dark:bg-emerald-950/60 border border-[#84CC16] text-slate-900 dark:text-emerald-100 text-xs font-bold space-y-1">
                <div>★ Meta Especial de Graduación:</div>
                <p className="font-medium">
                  Cuando completes todas las lecciones de <strong>Aprendo a Leer</strong> y de <strong>Ajedrez para Menores</strong>, pasarás automáticamente a la siguiente etapa con una fiesta y una medalla especial.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* BIBLIOTECA INTEGRADA EN LA PÁGINA PARA ETAPA 1 (3 A 6 AÑOS) */}
      {isYoungKid && (
        <section
          data-testid="integrated-library-section"
          className="pt-4 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <span className="text-xs font-black text-[#FF6B6B]">
                Biblioteca Integrada · Etapa Inicial (3 a 6 años)
              </span>
              <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white">
                Libros Interactivos Ilustrados para Practicar la Lectura
              </h2>
            </div>
          </div>
          <LibraryView
            ageGroup={ageGroup}
            completedBookIds={completedBookIds}
            onCompleteBook={onCompleteBook}
          />
        </section>
      )}

      {/* MODAL DE LECCIÓN INTERACTIVA */}
      {activeLesson && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-modal-title"
        >
          <div className="bg-white text-slate-900 rounded-[32px] max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto max-h-[94vh] overflow-y-auto">
            {!lessonFinished && currentExercise ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                      <span id="lesson-modal-title">{activeLesson.title}</span>
                      <span className="tabular-nums">
                        Ejercicio {exerciseIdx + 1} de {activeLesson.exercises.length}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#84CC16] transition-all duration-300"
                        style={{
                          width: `${Math.round(
                            ((exerciseIdx + 1) / activeLesson.exercises.length) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveLesson(null)}
                    aria-label="Salir de la lección"
                    className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className={`font-display font-extrabold text-slate-900 ${
                        isYoungKid ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                      }`}
                    >
                      {currentExercise.prompt}
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        speakSpanishText(
                          currentExercise.audioText || currentExercise.prompt
                        )
                      }
                      aria-label="Escuchar ejercicio en voz alta"
                      className="px-3.5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                      Escuchar Voz
                    </button>
                  </div>
                  {currentExercise.subtitle && (
                    <p className="text-sm text-slate-600">{currentExercise.subtitle}</p>
                  )}
                </div>

                {(currentExercise.type === 'multiple_choice' ||
                  currentExercise.type === 'syllable_builder' ||
                  currentExercise.type === 'dictation_fill') &&
                  currentExercise.options && (
                    <div className="grid grid-cols-1 gap-3">
                      {currentExercise.options.map((option) => {
                        const isChosen = selectedOption === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              playRewardSound('pop');
                              setSelectedOption(option);
                              if (isYoungKid) {
                                speakSpanishText(option);
                              }
                            }}
                            className={`w-full text-left rounded-2xl border-2 p-4 sm:p-5 font-bold transition-all flex items-center justify-between ${
                              isYoungKid ? 'text-xl min-h-[64px]' : 'text-base min-h-[54px]'
                            } ${
                              isChosen
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-800'
                            }`}
                          >
                            <span>{option}</span>
                            <span
                              className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                                isChosen
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isChosen ? '✓' : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                {currentExercise.type === 'piano_melody' &&
                  currentExercise.targetNotes && (
                    <div className="space-y-4 bg-slate-900 text-white p-5 rounded-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-medium text-slate-300">
                          Secuencia objetivo ({playedNotes.length}/
                          {currentExercise.targetNotes.length} notas):
                        </div>
                        <button
                          type="button"
                          onClick={() => setPlayedNotes([])}
                          className="text-xs text-amber-300 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar secuencia
                        </button>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {currentExercise.targetNotes.map((targetNote, idx) => {
                          const done = idx < playedNotes.length;
                          const isNext = idx === playedNotes.length;
                          const info = PIANO_NOTES.find((n) => n.note === targetNote);
                          return (
                            <span
                              key={`${targetNote}-${idx}`}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                                done
                                  ? 'bg-emerald-500 text-slate-950'
                                  : isNext
                                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {info?.label || targetNote} ({targetNote})
                            </span>
                          );
                        })}
                      </div>

                      <div
                        className="grid grid-cols-8 gap-1.5 pt-2"
                        data-testid="virtual-piano-keyboard"
                      >
                        {PIANO_NOTES.filter((n) => !n.isSharp).map((noteObj) => {
                          const nextExpected =
                            currentExercise.targetNotes?.[playedNotes.length];
                          const isTargetNext = nextExpected === noteObj.note;
                          const isPressed = activeKeyNote === noteObj.note;
                          return (
                            <button
                              key={noteObj.note}
                              type="button"
                              onClick={() => handlePressPianoKey(noteObj)}
                              className={`h-36 sm:h-40 rounded-b-xl border-2 flex flex-col items-center justify-end pb-3 font-bold transition-transform active:scale-95 ${
                                isPressed
                                  ? 'bg-emerald-300 border-emerald-500 text-slate-950'
                                  : isTargetNext
                                  ? 'bg-amber-200 border-amber-400 text-slate-950 shadow-lg'
                                  : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              <span className="text-xs text-slate-500 font-mono">
                                {noteObj.note}
                              </span>
                              <span className="text-sm sm:text-base font-extrabold mt-0.5">
                                {noteObj.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {currentExercise.type === 'drawing_studio' &&
                  currentExercise.drawingSteps && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-rose-700">
                              {currentExercise.drawingSteps[drawingStepIdx].title}
                            </span>
                            <div className="flex items-center gap-1">
                              {currentExercise.drawingSteps.map((s, idx) => (
                                <button
                                  key={s.stepNumber}
                                  type="button"
                                  onClick={() => setDrawingStepIdx(idx)}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold ${
                                    idx === drawingStepIdx
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-white border border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {s.stepNumber}
                                </button>
                              ))}
                            </div>
                          </div>

                          <DrawingGuideArt
                            guideType={
                              currentExercise.drawingSteps[drawingStepIdx].svgGuideType
                            }
                            stepNumber={
                              currentExercise.drawingSteps[drawingStepIdx].stepNumber
                            }
                          />

                          <p className="text-xs text-slate-700 leading-relaxed">
                            {currentExercise.drawingSteps[drawingStepIdx].instruction}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">
                              Tu Lienzo de Práctica
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setBrushTone('#94A3B8');
                                  setBrushSize(2);
                                }}
                                className="px-2 py-1 rounded text-[11px] font-semibold border bg-white text-slate-700 border-slate-300"
                              >
                                Lápiz 2H
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBrushTone('#1E293B');
                                  setBrushSize(4);
                                }}
                                className="px-2 py-1 rounded text-[11px] font-semibold border bg-white text-slate-700 border-slate-300"
                              >
                                Sombra 6B
                              </button>
                              <button
                                type="button"
                                onClick={clearDrawingCanvas}
                                className="px-2 py-1 rounded text-[11px] font-semibold bg-white border border-slate-300 text-slate-700"
                              >
                                Limpiar
                              </button>
                            </div>
                          </div>

                          <canvas
                            ref={canvasRef}
                            width={320}
                            height={180}
                            data-testid="realistic-drawing-canvas"
                            onPointerDown={handleCanvasPointerDown}
                            onPointerMove={handleCanvasPointerMove}
                            onPointerUp={handleCanvasPointerUp}
                            onPointerLeave={handleCanvasPointerUp}
                            className="w-full h-56 rounded-2xl border border-stone-300 cursor-crosshair touch-none"
                          />
                          <p className="text-[11px] text-slate-500">
                            {hasDrawnStroke
                              ? '¡Excelente trazo! Pulsa "Completar Taller" cuando estés listo.'
                              : 'Practica el boceto en el lienzo y pulsa "Completar Taller".'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Pista: {currentExercise.hint}</span>
                </div>

                {feedbackState && (
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                      feedbackState.isCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm">
                        {feedbackState.isCorrect
                          ? '¡Respuesta Correcta!'
                          : '¡Sigue Intentando!'}
                      </div>
                      <div className="text-xs">{feedbackState.message}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  {!feedbackState?.checked ? (
                    currentExercise.type !== 'piano_melody' && (
                      <button
                        type="button"
                        onClick={handleVerifyAnswer}
                        disabled={
                          currentExercise.type !== 'drawing_studio' && !selectedOption
                        }
                        className="px-6 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors whitespace-nowrap shrink-0"
                      >
                        {currentExercise.type === 'drawing_studio'
                          ? 'Completar Taller de Dibujo'
                          : 'Comprobar Respuesta'}
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextExercise}
                      className="px-6 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>
                        {exerciseIdx + 1 < activeLesson.exercises.length
                          ? 'Siguiente Ejercicio'
                          : 'Ver Recompensa Final'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              (() => {
                const reward = calculateLessonReward(
                  correctCount,
                  activeLesson.exercises.length,
                  streak,
                  ageGroup
                );
                return (
                  <div className="text-center py-6 space-y-6">
                    <div className="flex justify-center">
                      <MascotCompanion variant="flower" size="lg" mood="excited" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
                        {reward.headline}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
                        {reward.subtext}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <div className="text-xl font-extrabold text-emerald-800 tabular-nums">
                          +{reward.xpEarned} XP
                        </div>
                        <div className="text-xs text-emerald-700">Experiencia</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                        <div className="text-xl font-extrabold text-sky-800 tabular-nums">
                          {reward.accuracyPercent}%
                        </div>
                        <div className="text-xs text-sky-700">Precisión</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                        <div className="text-xl font-extrabold text-amber-800 tabular-nums">
                          {streak} días
                        </div>
                        <div className="text-xs text-amber-700">Racha</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveLesson(null)}
                      className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors"
                    >
                      Continuar Aprendiendo
                    </button>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
