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
  LayoutGrid,
  FolderKanban,
  MessageSquare,
  Users,
  CalendarCheck2,
  Award,
  Trophy,
  Bell,
  Search,
} from 'lucide-react';
import {
  COURSES_DATA,
  Course,
  LessonItem,
  CourseSubject,
  PRAYERS_COLLECTION,
  ROSARY_MYSTERIES,
  RosaryMysteryGroup,
  getBooksForAgeGroup,
} from '../data/curriculumData';
import {
  AgeGroup,
  ChildMood,
  UserProfile,
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
  AvatarBadge,
  DrawingGuideArt,
  MascotCompanion,
  CircularProgressRing,
} from './ArtworkRenderer';
import { LibraryView } from './LibraryView';

interface LearnViewProps {
  userName: string;
  userAvatarId?: string;
  userFriendCode?: string;
  ageGroup: AgeGroup;
  age: number;
  streak: number;
  xp: number;
  mood?: ChildMood;
  onChangeMood?: (mood: ChildMood) => void;
  allowedSubjects: CourseSubject[];
  completedLessonIds: string[];
  completedBookIds: string[];
  onlinePeers?: UserProfile[];
  onCompleteLesson: (
    lessonId: string,
    xpEarned: number,
    subject: CourseSubject
  ) => void;
  onCompleteBook: (bookId: string, xpReward: number) => void;
  onOpenLibrary: () => void;
  onOpenChess: () => void;
  onOpenRoutines?: () => void;
  onOpenFriends?: () => void;
  onOpenParentalPanel: () => void;
}

const STREAK_WEEKDAYS = [
  { short: 'D', done: false },
  { short: 'L', done: true },
  { short: 'M', done: true },
  { short: 'M', done: true },
  { short: 'J', done: true },
  { short: 'V', done: true },
  { short: 'S', done: false },
];

const CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

export function LearnView({
  userName,
  userAvatarId = 'p9_flower_crown_boy',
  userFriendCode = 'LUMI-1024',
  ageGroup,
  streak,
  xp,
  allowedSubjects,
  completedLessonIds,
  completedBookIds,
  onlinePeers = [],
  onCompleteLesson,
  onCompleteBook,
  onOpenLibrary,
  onOpenChess,
  onOpenRoutines,
  onOpenFriends,
  onOpenParentalPanel,
}: LearnViewProps) {
  // Selector entre Dashboard Principal (Imagen 1 - Quixel), Mis Cursos (Imagen 2 - eCoursie) y Biblioteca
  const [subView, setSubView] = useState<'quixel_dashboard' | 'ecoursie_courses' | 'library'>('quixel_dashboard');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(13);
  const [courseFilterLevel, setCourseFilterLevel] = useState<'todos' | 'inicial' | 'avanzado'>('todos');

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
      <div className="rounded-[32px] border p-8 text-center space-y-4 bg-white dark:bg-[#181426] border-slate-200 dark:border-purple-900/50">
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

  const availableStageBooks = getBooksForAgeGroup(ageGroup);

  if (subView === 'library') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex p-1.5 rounded-full bg-slate-900 text-white shadow-sm">
            <button
              type="button"
              onClick={() => setSubView('quixel_dashboard')}
              className="px-4 py-2 rounded-full text-xs font-extrabold opacity-80 hover:opacity-100"
            >
              Dashboard (Quixel)
            </button>
            <button
              type="button"
              onClick={() => setSubView('ecoursie_courses')}
              className="px-4 py-2 rounded-full text-xs font-extrabold opacity-80 hover:opacity-100"
            >
              Mis Cursos (eCoursie)
            </button>
            <button
              type="button"
              onClick={() => setSubView('library')}
              className="px-4 py-2 rounded-full text-xs font-extrabold bg-[#D4FF59] text-slate-950"
            >
              Biblioteca ({availableStageBooks.length})
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

  const nextUnlockedLesson =
    activeCourse.lessons.find((l) => !completedLessonIds.includes(l.id)) ||
    activeCourse.lessons[0];

  // Barras de progreso de XP por materia para la tarjeta inclinada de Racha (Imagen 1 - Quixel)
  const subjectProgressBars = coursesForAge.slice(0, 4).map((c, idx) => {
    const done = c.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
    const pct = Math.max(
      18,
      Math.round((done / Math.max(1, c.lessons.length)) * 100) || (4 - idx) * 18
    );
    const subjectXp = done * 120 + xp;
    return {
      id: c.id,
      title: c.title,
      pct,
      xpText: `${subjectXp} XP`,
    };
  });

  // Colores pastel horizontales para la vista Mis Cursos (Imagen 2 - eCoursie)
  const ecoursiePastelThemes = [
    {
      cardBg: 'bg-[#F3F4FF] dark:bg-[#231F3D] border-[#E0E4FF] dark:border-purple-800/40',
      circleBtn: 'bg-[#6C63FF] text-white',
      accentBlob: '#6C63FF',
    },
    {
      cardBg: 'bg-[#F9F0FF] dark:bg-[#2A1E3D] border-[#F0D9FF] dark:border-purple-800/40',
      circleBtn: 'bg-[#C066FF] text-white',
      accentBlob: '#C066FF',
    },
    {
      cardBg: 'bg-[#FFF2F4] dark:bg-[#331F2E] border-[#FFE0E6] dark:border-rose-800/40',
      circleBtn: 'bg-[#F472B6] text-white',
      accentBlob: '#F472B6',
    },
    {
      cardBg: 'bg-[#EFF8FF] dark:bg-[#1C2A3E] border-[#D8EEFF] dark:border-sky-800/40',
      circleBtn: 'bg-[#38BDF8] text-slate-950',
      accentBlob: '#38BDF8',
    },
  ];

  const connectedPeersList = onlinePeers.filter((p) => p.name !== userName);

  return (
    <div className="space-y-8">
      {/* =====================================================================
          1. DASHBOARD PRINCIPAL ESTILO "QUIXEL" (IMAGEN 1)
             - Barra superior oscura redondeada (Dashboard, Cursos, Retos, Amigos) + Perfil a la derecha
             - Saludo grande "¡Buen día, [Nombre]!" + 4 tarjetas arriba (Puntos, Cursos, Certificados, Retos)
             - Tarjeta "Continuar aprendiendo" con borde negro fino neobrutalista, acento lima (#D4FF59) y violeta
             - Tarjeta flotante inclinada de Racha ("Racha de días") con círculos D L M M J V S y barras de XP
         ===================================================================== */}
      {subView === 'quixel_dashboard' ? (
        <section
          data-testid="quixel-dashboard-shell"
          className="rounded-[36px] bg-[#16161A] p-3 sm:p-4 shadow-2xl border-2 border-slate-900 space-y-3"
        >
          {/* Barra Superior Oscura Redondeada (Quixel Top Nav) */}
          <div className="px-4 py-2.5 rounded-2xl bg-[#16161A] text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl tracking-tight text-white">
                quixel<span className="text-[#D4FF59]">.</span>lumi
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                type="button"
                data-testid="quixel-nav-dashboard"
                onClick={() => setSubView('quixel_dashboard')}
                className="px-4 py-2 rounded-full bg-[#2C2C34] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#D4FF59]" />
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                data-testid="quixel-nav-courses"
                onClick={() => {
                  playRewardSound('pop');
                  setSubView('ecoursie_courses');
                }}
                className="px-4 py-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Cursos</span>
              </button>
              <button
                type="button"
                data-testid="quixel-nav-challenges"
                onClick={onOpenChess}
                className="px-4 py-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Retos</span>
              </button>
              <button
                type="button"
                data-testid="quixel-nav-friends"
                onClick={() => onOpenFriends?.()}
                className="px-4 py-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Amigos</span>
              </button>
              <button
                type="button"
                data-testid="learn-open-library-tab"
                onClick={() => {
                  playRewardSound('pop');
                  if (isYoungKid) {
                    onOpenLibrary();
                  } else {
                    setSubView('library');
                  }
                }}
                className="px-4 py-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#D4FF59]" />
                <span>Biblioteca</span>
              </button>
            </div>

            {/* Perfil del usuario a la derecha */}
            <div className="flex items-center gap-2.5">
              <AvatarBadge avatarId={userAvatarId} size="sm" />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-extrabold text-white leading-tight">
                  ¡Hola, {userName}!
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {userFriendCode}
                </div>
              </div>
            </div>
          </div>

          {/* Lienzo Interior Blanco Redondeado del Dashboard Quixel */}
          <div className="rounded-[28px] bg-white dark:bg-[#1E1B2E] text-slate-900 dark:text-white p-5 sm:p-8 space-y-7">
            {/* Fila superior: Saludo "¡Buen día, [Nombre]!" + 4 Tarjetas Pequeñas (Puntos, Cursos, Certificados, Retos) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight">
                  ¡Buen día, {userName}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>
                    Estás un {Math.max(15, courseProgressPercent)}% más cerca de completar tu meta semanal.
                  </span>
                  <Zap className="w-4 h-4 text-amber-500 fill-current" />
                </p>
              </div>

              {/* 4 Tarjetas pequeñas de resumen (Puntos, Cursos, Certificados, Retos) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  data-testid="quixel-stat-points"
                  className="px-4 py-3 rounded-2xl bg-[#FFFDF2] dark:bg-amber-950/40 border-2 border-slate-900 dark:border-amber-500/40 flex items-center gap-3 shadow-[2px_2px_0px_#0F172A]"
                >
                  <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                    ★
                  </span>
                  <div>
                    <div className="text-base sm:text-lg font-black tabular-nums leading-none">
                      {xp}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-300 font-bold mt-0.5">
                      Puntos
                    </div>
                  </div>
                </div>

                <div
                  data-testid="quixel-stat-courses"
                  className="px-4 py-3 rounded-2xl bg-[#F5F3FF] dark:bg-purple-950/40 border-2 border-slate-900 dark:border-purple-500/40 flex items-center gap-3 shadow-[2px_2px_0px_#0F172A]"
                >
                  <span className="w-8 h-8 rounded-full bg-[#7C69EF] text-white flex items-center justify-center font-black text-xs shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-base sm:text-lg font-black tabular-nums leading-none">
                      {coursesForAge.length}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-300 font-bold mt-0.5">
                      Cursos
                    </div>
                  </div>
                </div>

                <div
                  data-testid="quixel-stat-certificates"
                  className="px-4 py-3 rounded-2xl bg-[#FEFCE8] dark:bg-emerald-950/40 border-2 border-slate-900 dark:border-emerald-500/40 flex items-center gap-3 shadow-[2px_2px_0px_#0F172A]"
                >
                  <span className="w-8 h-8 rounded-full bg-[#D4FF59] text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                    <Award className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-base sm:text-lg font-black tabular-nums leading-none">
                      {completedLessonIds.length}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-300 font-bold mt-0.5">
                      Certificados
                    </div>
                  </div>
                </div>

                <div
                  data-testid="quixel-stat-challenges"
                  className="px-4 py-3 rounded-2xl bg-[#F3E8FF] dark:bg-indigo-950/40 border-2 border-slate-900 dark:border-indigo-500/40 flex items-center gap-3 shadow-[2px_2px_0px_#0F172A]"
                >
                  <span className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center font-black text-xs shrink-0">
                    <Trophy className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-base sm:text-lg font-black tabular-nums leading-none">
                      {Math.max(1, streak)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-300 font-bold mt-0.5">
                      Retos
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cuerpo Central Quixel: Izquierda ("Continuar aprendiendo" + "Recomendados para ti") | Derecha (Tarjeta Flotante Inclinada de Racha) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
              {/* Columna Izquierda (7 cols): Continuar aprendiendo + Recomendados */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-black font-display">
                      Continuar aprendiendo
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-full bg-[#D4FF59] border-2 border-slate-900 flex items-center justify-center text-slate-950">
                        <Bell className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta "Continuar aprendiendo" con borde negro fino estilo neobrutalista, acento lima (#D4FF59) y violeta */}
                  <div
                    data-testid="quixel-continue-learning-card"
                    className="rounded-[28px] bg-white dark:bg-[#26223A] border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] overflow-hidden flex flex-col sm:flex-row items-stretch"
                  >
                    {/* Bloque ilustrado verde lima a la izquierda */}
                    <div className="sm:w-36 bg-[#D4FF59] p-5 flex items-center justify-center border-b-2 sm:border-b-0 sm:border-r-2 border-slate-900 shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-[#7C69EF] text-white border-2 border-slate-900 flex items-center justify-center shadow-[3px_3px_0px_#0F172A]">
                        {getSubjectIcon(activeCourse.subject)}
                      </div>
                    </div>

                    {/* Contenido del curso activo y barra de progreso */}
                    <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#6D28D9] dark:text-[#C4B5FD]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Curso · Etapa {ageGroup} años</span>
                        </div>
                        <h3 className="text-xl font-black font-display">
                          {activeCourse.title}
                        </h3>
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-300">
                          <strong>{courseProgressPercent}%</strong> de 100% Completado ({completedInCourse}/{activeCourse.lessons.length} niveles)
                        </div>
                        <div className="w-full max-w-xs h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-300 dark:border-slate-700">
                          <div
                            className="h-full bg-[#7C69EF] rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(12, courseProgressPercent)}%` }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => startLesson(nextUnlockedLesson)}
                        className="px-5 py-3 rounded-full bg-[#16161A] hover:bg-slate-800 text-white font-extrabold text-xs whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
                      >
                        Continuar lección
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cuadrícula "Recomendados para ti" estilo Quixel */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base sm:text-lg font-black font-display">
                      Recomendados para ti
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSubView('ecoursie_courses')}
                      className="text-xs font-extrabold text-[#5B58EB] dark:text-[#D4FF59] hover:underline flex items-center gap-1"
                    >
                      <span>Ver todos en Mis Cursos (eCoursie)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {coursesForAge.slice(0, 4).map((course) => {
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
                          className={`p-4 rounded-[24px] border-2 border-slate-900 text-left transition-all flex items-center justify-between gap-3 relative overflow-hidden cursor-pointer ${
                            isSelected
                              ? 'bg-[#F8FAFC] dark:bg-[#2A2440] shadow-[4px_4px_0px_#0F172A] ring-2 ring-[#7C69EF]'
                              : 'bg-white dark:bg-[#221D35] hover:shadow-[3px_3px_0px_#0F172A]'
                          }`}
                        >
                          <div className="space-y-2 z-10 min-w-0">
                            <span className="text-[11px] font-bold text-[#6D28D9] dark:text-[#C4B5FD] flex items-center gap-1">
                              <span>♦ Curso</span>
                            </span>
                            <div className="font-black text-sm sm:text-base truncate">
                              {course.title}
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 font-bold">
                                Nivel {doneCount + 1}
                              </span>
                              <span className="text-slate-500 dark:text-slate-300 font-semibold">
                                · {course.lessons.length} lecciones
                              </span>
                            </div>
                          </div>

                          {/* Esquina verde lima característica de Quixel */}
                          <div className="w-14 h-14 rounded-2xl bg-[#D4FF59] border-2 border-slate-900 flex items-center justify-center text-slate-950 shrink-0 z-10">
                            {getSubjectIcon(course.subject)}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    data-testid="open-ecoursie-view-btn"
                    onClick={() => {
                      playRewardSound('pop');
                      setSubView('ecoursie_courses');
                    }}
                    className="w-full py-2.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 hover:border-slate-900 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Ver todos los cursos ({coursesForAge.length}) ↗</span>
                  </button>
                </div>
              </div>

              {/* Columna Derecha (5 cols): Tarjeta Flotante Inclinada de Racha ("Racha de días" - Imagen 1 Quixel) */}
              <div className="lg:col-span-5 space-y-5">
                <div
                  data-testid="quixel-tilted-streak-card"
                  className="rounded-[28px] bg-white dark:bg-[#26213A] border-2 border-slate-900 p-6 shadow-[6px_6px_0px_#0F172A] lg:-rotate-1 transition-transform hover:rotate-0 space-y-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black font-display leading-tight">
                        ¡Llevas una racha de {Math.max(1, streak)} días!
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-300 font-semibold mt-0.5">
                        Completa lecciones cada día para encender el rayo lima.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 font-display font-black text-2xl text-slate-900 dark:text-white shrink-0">
                      <Zap className="w-6 h-6 text-[#A3E635] fill-[#D4FF59] stroke-slate-900" />
                      <span>{Math.max(1, streak)}</span>
                    </div>
                  </div>

                  {/* Círculos de los días de la semana (D L M M J V S) con rayos en verde lima */}
                  <div className="grid grid-cols-7 gap-1.5 pt-1">
                    {STREAK_WEEKDAYS.map((day, idx) => (
                      <div
                        key={`${day.short}-${idx}`}
                        className={`h-10 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-black ${
                          day.done
                            ? 'bg-[#D4FF59] text-slate-950 shadow-[1px_1px_0px_#0F172A]'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {day.done ? (
                          <Zap className="w-4 h-4 fill-slate-950" />
                        ) : (
                          day.short
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Barras de progreso de XP por materia (Imagen 1 Quixel) */}
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {subjectProgressBars.map((bar) => (
                      <div
                        key={bar.id}
                        className="grid grid-cols-12 items-center gap-2 text-xs"
                      >
                        <span className="col-span-5 font-extrabold truncate">
                          {bar.title}
                        </span>
                        <div className="col-span-5 h-3 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-900 overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full bg-[#2DD4BF]"
                            style={{ width: `${bar.pct}%` }}
                          />
                        </div>
                        <span className="col-span-2 text-right font-mono font-bold text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                          {bar.xpText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tarjeta Violeta Inferior estilo Quixel (Acceso rápido a Rutinas y Cuentos) */}
                <div className="rounded-[26px] bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] text-white p-5 border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] flex items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[#D4FF59]">
                      Plan de Estudio y Lectura
                    </div>
                    <h4 className="font-black text-base font-display leading-snug">
                      Organiza tus Rutinas (+5 Gemas) y lee Cuentos
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenRoutines?.()}
                        className="px-3.5 py-1.5 rounded-full bg-white text-slate-950 font-extrabold text-xs cursor-pointer"
                      >
                        Ir a Rutinas
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          isYoungKid ? onOpenLibrary() : setSubView('library')
                        }
                        className="px-3.5 py-1.5 rounded-full bg-[#D4FF59] text-slate-950 font-extrabold text-xs cursor-pointer"
                      >
                        Abrir Biblioteca
                      </button>
                    </div>
                  </div>
                  <MascotCompanion variant="flower" size="sm" mood="excited" />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* =====================================================================
           2. SECCIÓN "MIS CURSOS" EN 3 COLUMNAS ESTILO "eCOURSIE" (IMAGEN 2)
              - Columna 1: Menú lateral izquierdo vertical (#5B58EB) con íconos limpios (Dashboard, Todos los Cursos, Mensajes, Amigos, Rutinas)
              - Columna 2: Centro con filtros suaves y tarjetas horizontales anchas en tonos pastel (lavanda, rosa suave, celeste) y botón circular ">"
              - Columna 3: Derecha con Calendario Mensual interactivo arriba y lista de "Amigos Conectados" (Online Users) abajo
           ===================================================================== */
        <section
          data-testid="ecoursie-three-column-layout"
          className="rounded-[36px] bg-[#5B58EB] p-2 sm:p-3 shadow-2xl border-2 border-[#4A47D5]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
            {/* COLUMNA 1: Menú Lateral Izquierdo Vertical en #5B58EB */}
            <aside className="lg:col-span-2 text-white p-4 sm:p-5 flex flex-col justify-between gap-6">
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <span className="font-display font-black text-xl tracking-tight">
                    ēCoursie
                  </span>
                </div>

                <nav className="space-y-1.5" aria-label="Menú lateral eCoursie">
                  <button
                    type="button"
                    onClick={() => setSubView('quixel_dashboard')}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 font-bold text-xs flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LayoutGrid className="w-4 h-4 shrink-0" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubView('ecoursie_courses')}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white text-[#5B58EB] font-extrabold text-xs flex items-center gap-2.5 shadow-sm cursor-pointer"
                  >
                    <FolderKanban className="w-4 h-4 shrink-0" />
                    <span>Todos los Cursos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenFriends?.()}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 font-bold text-xs flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Mensajes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenFriends?.()}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 font-bold text-xs flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Amigos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenRoutines?.()}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 font-bold text-xs flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <CalendarCheck2 className="w-4 h-4 shrink-0" />
                    <span>Rutinas</span>
                  </button>
                </nav>
              </div>

              <div className="pt-4 border-t border-white/15 hidden lg:block">
                <button
                  type="button"
                  onClick={onOpenParentalPanel}
                  className="w-full px-3 py-2 rounded-xl text-white/75 hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Ajustes Padres</span>
                </button>
              </div>
            </aside>

            {/* COLUMNA 2 Y 3 EN PANEL BLANCO REDONDEADO */}
            <div className="lg:col-span-10 rounded-[30px] bg-white dark:bg-[#19162B] text-slate-900 dark:text-white p-5 sm:p-7 grid grid-cols-1 xl:grid-cols-12 gap-7">
              {/* COLUMNA 2 (Centro - 8 cols): "Mis Cursos", Filtros Suaves y Tarjetas Horizontales Anchas Pastel */}
              <div className="xl:col-span-8 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-[#3F3D8F] dark:text-purple-200">
                    Mis Cursos
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-200">
                      <Search className="w-4 h-4" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubView('quixel_dashboard')}
                      className="px-3.5 py-1.5 rounded-full bg-[#5B58EB] text-white text-xs font-extrabold cursor-pointer"
                    >
                      Volver a Dashboard
                    </button>
                  </div>
                </div>

                {/* Filtros suaves arriba (Filter by: Tiempo, Nivel, Idioma, Tipo) */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-400 mr-1">Filtrar por:</span>
                  {(['todos', 'inicial', 'avanzado'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCourseFilterLevel(lvl)}
                      className={`px-3.5 py-1.5 rounded-full font-extrabold capitalize transition-all cursor-pointer ${
                        courseFilterLevel === lvl
                          ? 'bg-[#5B58EB] text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {lvl === 'todos'
                        ? 'Todos los Niveles ▾'
                        : lvl === 'inicial'
                        ? 'Tiempo: 15 min ▾'
                        : 'Tipo: Interactivo ▾'}
                    </button>
                  ))}
                </div>

                {/* Tarjetas horizontales anchas en tonos pastel (lavanda, rosa suave, celeste) con ilustración a la izquierda y botón circular ">" */}
                <div className="space-y-4">
                  {coursesForAge.map((course, idx) => {
                    const theme =
                      ecoursiePastelThemes[idx % ecoursiePastelThemes.length];
                    const doneCount = course.lessons.filter((l) =>
                      completedLessonIds.includes(l.id)
                    ).length;
                    const firstPending =
                      course.lessons.find(
                        (l) => !completedLessonIds.includes(l.id)
                      ) || course.lessons[0];

                    return (
                      <div
                        key={course.id}
                        data-testid={`ecoursie-course-card-${course.subject}`}
                        className={`rounded-[28px] border p-5 sm:p-6 transition-all flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs hover:shadow-md ${theme.cardBg}`}
                      >
                        {/* Ilustración estilo eCoursie a la izquierda */}
                        <div className="w-28 h-24 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-white flex flex-col items-center justify-center relative shrink-0 shadow-2xs">
                          <span
                            className="w-3 h-3 rounded-full absolute top-2.5 left-2.5"
                            style={{ backgroundColor: theme.accentBlob }}
                          />
                          <div
                            className="p-3 rounded-2xl text-white"
                            style={{ backgroundColor: theme.accentBlob }}
                          >
                            {getSubjectIcon(course.subject)}
                          </div>
                          <span className="text-[10px] font-mono font-bold mt-1 opacity-75">
                            {doneCount}/{course.lessons.length} niv
                          </span>
                        </div>

                        {/* Texto central del curso */}
                        <div className="flex-1 space-y-1.5 text-center sm:text-left min-w-0">
                          <h3 className="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-white">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                            {course.subtitle}
                          </p>
                          <div className="pt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Etapa <strong className="text-slate-800 dark:text-white">{ageGroup} años</strong> · Progreso:{' '}
                            <strong className="text-[#5B58EB] dark:text-[#D4FF59]">
                              {Math.round(
                                (doneCount / Math.max(1, course.lessons.length)) *
                                  100
                              )}
                              %
                            </strong>
                          </div>
                        </div>

                        {/* Botón circular ">" para entrar al curso */}
                        <button
                          type="button"
                          aria-label={`Entrar a ${course.title}`}
                          onClick={() => {
                            playRewardSound('pop');
                            setSelectedCourseId(course.id);
                            startLesson(firstPending);
                          }}
                          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 shrink-0 cursor-pointer ${theme.circleBtn}`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COLUMNA 3 (Derecha - 4 cols): Calendario Mensual Interactivo + Amigos Conectados (Online Users) */}
              <div className="xl:col-span-4 space-y-6 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-white/10 pt-5 xl:pt-0 xl:pl-6">
                {/* Perfil arriba a la derecha */}
                <div className="flex items-center justify-end gap-3">
                  <div className="text-right">
                    <div className="font-extrabold text-sm">{userName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {userFriendCode}
                    </div>
                  </div>
                  <AvatarBadge avatarId={userAvatarId} size="sm" />
                </div>

                {/* Calendario Mensual Interactivo */}
                <div
                  data-testid="ecoursie-monthly-calendar"
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-base text-[#3F3D8F] dark:text-purple-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#5B58EB]" />
                      <span>Calendario Mensual</span>
                    </h3>
                    <div className="flex items-center gap-1 text-slate-400">
                      <ChevronLeft className="w-4 h-4" />
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mié</span>
                    <span>Jue</span>
                    <span>Vie</span>
                    <span>Sáb</span>
                    <span>Dom</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {CALENDAR_DAYS.map((dayNum) => {
                      const isRangeHighlight = dayNum >= 9 && dayNum <= 13;
                      const isEndpoint =
                        dayNum === 9 ||
                        dayNum === 13 ||
                        dayNum === selectedCalendarDay;
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => setSelectedCalendarDay(dayNum)}
                          className={`h-8 rounded-full text-xs font-extrabold transition-all flex items-center justify-center cursor-pointer ${
                            isEndpoint
                              ? 'bg-[#5B58EB] text-white shadow-2xs'
                              : isRangeHighlight
                              ? 'bg-[#E8E7FF] text-[#5B58EB]'
                              : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lista de Usuarios Conectados ("Amigos Conectados" / Online Users) */}
                <div
                  data-testid="ecoursie-online-users"
                  className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-base text-[#3F3D8F] dark:text-purple-200">
                      Amigos Conectados
                    </h3>
                    <button
                      type="button"
                      onClick={() => onOpenFriends?.()}
                      className="text-xs font-bold text-slate-400 hover:text-[#5B58EB] cursor-pointer"
                    >
                      Ver todos
                    </button>
                  </div>

                  {connectedPeersList.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#F6F6FF] dark:bg-white/5 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <AvatarBadge avatarId={userAvatarId} size="sm" />
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white">
                              {userName} (Tú)
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {userFriendCode}
                            </div>
                          </div>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#5B58EB] ring-4 ring-[#5B58EB]/20" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300">
                        Comparte tu código <strong>{userFriendCode}</strong> en la pestaña Amigos para ver a tus compañeros en vivo.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {connectedPeersList.slice(0, 4).map((peer) => (
                        <button
                          key={peer.id}
                          type="button"
                          onClick={() => onOpenFriends?.()}
                          className="w-full p-2.5 rounded-2xl hover:bg-[#F5F4FF] dark:hover:bg-white/5 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <AvatarBadge avatarId={peer.avatarId} size="sm" />
                            <div className="min-w-0">
                              <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                {peer.name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate">
                                {peer.friendCode}
                              </div>
                            </div>
                          </div>
                          <span
                            title="Conectado en vivo"
                            className="w-2.5 h-2.5 rounded-full bg-[#5B58EB] shrink-0"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
          </div>
        </aside>
      </div>

      {/* BIBLIOTECA INTEGRADA EN LA PÁGINA SEGÚN LA EDAD:
          - 3 a 6 años: Cuentos infantiles en Español CON ilustraciones y dibujitos
          - 7 a 13 y 14 a 18 años: Cuentos e Historias en Inglés SIN ilustraciones ni dibujitos */}
      <section
        data-testid="integrated-library-section"
        className="pt-4 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <span
              className={`text-xs font-black ${
                isYoungKid
                  ? 'text-[#FF6B6B]'
                  : 'text-emerald-600 dark:text-[#BEF264]'
              }`}
            >
              {isYoungKid
                ? `Biblioteca Integrada · Etapa Inicial (3 a 6 años) · ${availableStageBooks.length} Cuentos Ilustrados`
                : `Biblioteca de Lectura en Inglés · (${ageGroup} años) · ${availableStageBooks.length} English Stories`}
            </span>
            <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white">
              {isYoungKid
                ? 'Cuentos Infantiles en Español con Ilustraciones y Dibujitos'
                : 'English Stories · Cuentos en Inglés (Formato Libro sin Ilustraciones)'}
            </h2>
          </div>
        </div>
        <LibraryView
          ageGroup={ageGroup}
          completedBookIds={completedBookIds}
          onCompleteBook={onCompleteBook}
        />
      </section>

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
