import { AgeGroup, CourseSubject } from '../utils/educationLogic';

export type { CourseSubject };

export type ExerciseType =
  | 'multiple_choice'
  | 'syllable_builder'
  | 'piano_melody'
  | 'drawing_studio'
  | 'dictation_fill';

export interface LessonExercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  subtitle?: string;
  audioText?: string;
  options?: string[];
  correctAnswer?: string;
  hint: string;
  targetNotes?: string[];
  drawingSteps?: {
    stepNumber: number;
    title: string;
    instruction: string;
    svgGuideType: 'eye_structure' | 'sphere_shading' | 'perspective_cube' | 'portrait_proportions';
  }[];
}

export interface LessonItem {
  id: string;
  title: string;
  description: string;
  levelNumber: number;
  xpReward: number;
  durationMinutes: number;
  exercises: LessonExercise[];
}

export interface Course {
  id: string;
  subject: CourseSubject;
  ageGroup: AgeGroup;
  title: string;
  subtitle: string;
  accentColor: string;
  lessons: LessonItem[];
}

export interface StoryVocabularyItem {
  word: string;
  translationEs: string;
  phonetic?: string;
  example?: string;
}

export interface StoryPage {
  pageNumber: number;
  chapterTitle?: string;
  text: string;
  sceneTheme?:
    | 'dragon_meadow'
    | 'dragon_library'
    | 'dragon_stars'
    | 'space_launch'
    | 'space_planets'
    | 'forest_band'
    | 'finance_market';
  caption: string;
  vocabulary?: StoryVocabularyItem[];
}

export interface StoryBook {
  id: string;
  title: string;
  author: string;
  language: 'es' | 'en';
  hasIllustrations: boolean;
  recommendedAges: AgeGroup[];
  ageBadge: string;
  durationLabel: string;
  xpReward: number;
  coverTheme: 'dragon' | 'space' | 'forest';
  summary: string;
  pages: StoryPage[];
  comprehensionQuestion: {
    question: string;
    options: string[];
    correctOption: string;
  };
}

export interface AvatarOption {
  id: string;
  ageGroup: AgeGroup;
  ageTier: 'under_9' | '9_plus';
  name: string;
  title: string;
  bgGradient: string;
  imageUrl?: string;
  svgKind:
    | 'fox'
    | 'astronaut'
    | 'dragon'
    | 'owl'
    | 'robot'
    | 'panda'
    | 'artist'
    | 'musician'
    | 'mummy';
  gemCost: number;
  isStarter?: boolean;
}

export interface ChessBoardThemeOption {
  id: string;
  name: string;
  description: string;
  gemCost: number;
  isStarter?: boolean;
  lightSquareClass: string;
  darkSquareClass: string;
  boardBorderClass: string;
  previewLightHex: string;
  previewDarkHex: string;
  coordTextClass: string;
}

export interface ChessPiecesStyleOption {
  id: string;
  name: string;
  description: string;
  gemCost: number;
  isStarter?: boolean;
  whitePieceClass: string;
  blackPieceClass: string;
  badgeClass: string;
  pieceMap: Record<'wp' | 'wn' | 'wb' | 'wr' | 'wq' | 'wk' | 'bp' | 'bn' | 'bb' | 'br' | 'bq' | 'bk', string>;
}

export interface ChessCoachOption {
  id: string;
  name: string;
  personality: 'Amable' | 'Divertido' | 'Estricto' | 'Maestro sabio';
  description: string;
  gemCost: number;
  isStarter?: boolean;
  accentClass: string;
  avatarEmoji: string;
  greetingQuote: string;
  hintQuote: string;
  mistakeQuote: string;
  victoryQuote: string;
}

export interface WallpaperOption {
  id: string;
  name: string;
  description: string;
  previewClass: string;
  headerBgClass: string;
  pageBgClass: string;
}

export interface MedalCatalogItem {
  id: string;
  title: string;
  description: string;
  requirementText: string;
  category: 'general' | 'orthography' | 'chess' | 'prayer' | 'routines';
  iconName: 'flame' | 'book' | 'music' | 'palette' | 'coins' | 'trophy' | 'sparkles' | 'shield';
}

export interface ChessLessonInteractive {
  id: string;
  levelNumber: number;
  title: string;
  categoryLabel: string;
  description: string;
  xpReward: number;
  initialFen: string;
  objectiveText: string;
  targetMoveSan: string[];
  explanation: string;
}

export interface PrayerItem {
  id: string;
  title: string;
  subtitle: string;
  text: string;
  simpleExplanationByAge: Record<AgeGroup, string>;
}

export interface RosaryMysteryGroup {
  id: 'gozosos' | 'luminosos' | 'dolorosos' | 'gloriosos';
  name: string;
  daysText: string;
  mysteries: { number: number; title: string; fruit: string; meditation: string }[];
}

export const SUBJECT_LABELS: Record<CourseSubject, string> = {
  reading: 'Aprendo a Leer',
  math: 'Matemáticas',
  finance: 'Finanzas',
  drawing: 'Dibujo Realista',
  entrepreneurship: 'Emprendimiento',
  piano: 'Piano',
  orthography: 'Ortografía',
  chess_course: 'Ajedrez',
  prayer: 'Oración y Santo Rosario',
};

// ========================================================
// 1. CATÁLOGO DE TABLEROS DE AJEDREZ (TIENDA CON GEMAS)
// ========================================================
export const CHESS_BOARDS_CATALOG: ChessBoardThemeOption[] = [
  {
    id: 'board_classic_wood',
    name: 'Madera Clásica',
    description: 'Tablero tradicional de roble y nogal cálido · Inicial Gratis',
    gemCost: 0,
    isStarter: true,
    lightSquareClass: 'bg-[#F3E5AB]',
    darkSquareClass: 'bg-[#8B5A2B]',
    boardBorderClass: 'border-[#5C3A21] bg-[#5C3A21]',
    previewLightHex: '#F3E5AB',
    previewDarkHex: '#8B5A2B',
    coordTextClass: 'text-[#3E2723]',
  },
  {
    id: 'board_marble',
    name: 'Mármol Imperial',
    description: 'Casillas de mármol blanco y pizarra gris pulida',
    gemCost: 10,
    lightSquareClass: 'bg-[#F8FAFC]',
    darkSquareClass: 'bg-[#64748B]',
    boardBorderClass: 'border-[#334155] bg-[#334155]',
    previewLightHex: '#F8FAFC',
    previewDarkHex: '#64748B',
    coordTextClass: 'text-slate-900',
  },
  {
    id: 'board_green_forest',
    name: 'Bosque Verde',
    description: 'Inspirado en los torneos clásicos y hojas esmeralda',
    gemCost: 15,
    lightSquareClass: 'bg-[#ECFCCB]',
    darkSquareClass: 'bg-[#15803D]',
    boardBorderClass: 'border-[#14532D] bg-[#14532D]',
    previewLightHex: '#ECFCCB',
    previewDarkHex: '#15803D',
    coordTextClass: 'text-emerald-950',
  },
  {
    id: 'board_ice',
    name: 'Hielo Ártico',
    description: 'Cristales celestes y escarcha azul glaciar',
    gemCost: 20,
    lightSquareClass: 'bg-[#E0F2FE]',
    darkSquareClass: 'bg-[#0284C7]',
    boardBorderClass: 'border-[#0369A1] bg-[#0369A1]',
    previewLightHex: '#E0F2FE',
    previewDarkHex: '#0284C7',
    coordTextClass: 'text-sky-950',
  },
  {
    id: 'board_neon',
    name: 'Neón Cyber',
    description: 'Contraste futurista con energía lima y cian vibrante',
    gemCost: 25,
    lightSquareClass: 'bg-[#CCFBF1]',
    darkSquareClass: 'bg-[#0F172A]',
    boardBorderClass: 'border-[#06B6D4] bg-[#0F172A]',
    previewLightHex: '#CCFBF1',
    previewDarkHex: '#0F172A',
    coordTextClass: 'text-cyan-500',
  },
  {
    id: 'board_galaxy',
    name: 'Galaxia Estelar',
    description: 'Nebulosa violeta y polvo de estrellas profundo',
    gemCost: 30,
    lightSquareClass: 'bg-[#EDE9FE]',
    darkSquareClass: 'bg-[#581C87]',
    boardBorderClass: 'border-[#3B0764] bg-[#3B0764]',
    previewLightHex: '#EDE9FE',
    previewDarkHex: '#581C87',
    coordTextClass: 'text-purple-950',
  },
  {
    id: 'board_candy',
    name: 'Dulces y Algodón',
    description: 'Colores pastel de fresa, vainilla y caramelo',
    gemCost: 35,
    lightSquareClass: 'bg-[#FFF1F2]',
    darkSquareClass: 'bg-[#FB7185]',
    boardBorderClass: 'border-[#E11D48] bg-[#E11D48]',
    previewLightHex: '#FFF1F2',
    previewDarkHex: '#FB7185',
    coordTextClass: 'text-rose-950',
  },
  {
    id: 'board_sunset',
    name: 'Atardecer Dorado',
    description: 'Horizonte cálido en tonos ámbar, coral y terracota',
    gemCost: 40,
    lightSquareClass: 'bg-[#FEF3C7]',
    darkSquareClass: 'bg-[#EA580C]',
    boardBorderClass: 'border-[#9A3412] bg-[#9A3412]',
    previewLightHex: '#FEF3C7',
    previewDarkHex: '#EA580C',
    coordTextClass: 'text-orange-950',
  },
];

// ========================================================
// 2. CATÁLOGO DE FICHAS DE AJEDREZ (TIENDA CON GEMAS)
// ========================================================
export const CHESS_PIECES_CATALOG: ChessPiecesStyleOption[] = [
  {
    id: 'pieces_classic',
    name: 'Piezas Clásicas',
    description: 'Diseño oficial Staunton de torneo · Inicial Gratis',
    gemCost: 0,
    isStarter: true,
    whitePieceClass: 'text-white drop-shadow-[0_2px_2px_rgba(15,23,42,0.85)]',
    blackPieceClass: 'text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]',
    badgeClass: 'bg-amber-500/15 text-amber-600',
    pieceMap: {
      wp: '♙',
      wn: '♘',
      wb: '♗',
      wr: '♖',
      wq: '♕',
      wk: '♔',
      bp: '♟',
      bn: '♞',
      bb: '♝',
      br: '♜',
      bq: '♛',
      bk: '♚',
    },
  },
  {
    id: 'pieces_medieval',
    name: 'Piezas Medievales',
    description: 'Reyes dorados, escudos reales y caballeros de castillo',
    gemCost: 10,
    whitePieceClass: 'text-amber-200 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] scale-105',
    blackPieceClass: 'text-stone-900 drop-shadow-[0_1px_2px_rgba(253,224,71,0.7)] scale-105',
    badgeClass: 'bg-yellow-500/15 text-yellow-600',
    pieceMap: {
      wp: '🛡️',
      wn: '🐴',
      wb: '⚜️',
      wr: '🏰',
      wq: '👸',
      wk: '👑',
      bp: '⚔️',
      bn: '🐎',
      bb: '🔱',
      br: '🏯',
      bq: '🔮',
      bk: '♚',
    },
  },
  {
    id: 'pieces_cartoon',
    name: 'Dibujos Animados',
    description: 'Piezas súper expresivas, coloridas y divertidas',
    gemCost: 15,
    whitePieceClass: 'text-sky-200 drop-shadow-[0_2px_3px_rgba(15,23,42,0.85)] scale-110',
    blackPieceClass: 'text-rose-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] scale-110',
    badgeClass: 'bg-pink-500/15 text-pink-600',
    pieceMap: {
      wp: '⭐',
      wn: '🦄',
      wb: '🎈',
      wr: '🚀',
      wq: '🌟',
      wk: '🌞',
      bp: '⚡',
      bn: '🦖',
      bb: '🎨',
      br: '🛸',
      bq: '🌙',
      bk: '🪐',
    },
  },
  {
    id: 'pieces_animals',
    name: 'Reino Animal',
    description: 'Leones, águilas, delfines y cachorros en el tablero',
    gemCost: 20,
    whitePieceClass: 'drop-shadow-[0_2px_3px_rgba(255,255,255,0.95)]',
    blackPieceClass: 'drop-shadow-[0_2px_3px_rgba(15,23,42,0.95)] opacity-90',
    badgeClass: 'bg-emerald-500/15 text-emerald-600',
    pieceMap: {
      wp: '🐣',
      wn: '🐎',
      wb: '🦉',
      wr: '🐘',
      wq: '🦢',
      wk: '🦁',
      bp: '🐾',
      bn: '🦓',
      bb: '🦅',
      br: '🦏',
      bq: '🦚',
      bk: '🐯',
    },
  },
  {
    id: 'pieces_minimalist',
    name: 'Minimalistas Geométricas',
    description: 'Símbolos limpios de alta precisión para cálculo táctico',
    gemCost: 25,
    whitePieceClass: 'text-white font-black tracking-tighter bg-slate-900/75 px-1.5 py-0.5 rounded-lg text-sm sm:text-base',
    blackPieceClass: 'text-slate-950 font-black tracking-tighter bg-white/85 px-1.5 py-0.5 rounded-lg text-sm sm:text-base border border-slate-900',
    badgeClass: 'bg-slate-500/15 text-slate-600',
    pieceMap: {
      wp: 'P',
      wn: 'C',
      wb: 'A',
      wr: 'T',
      wq: 'D',
      wk: 'R',
      bp: 'p',
      bn: 'c',
      bb: 'a',
      br: 't',
      bq: 'd',
      bk: 'r',
    },
  },
  {
    id: 'pieces_futuristic',
    name: 'Futuristas Mecha',
    description: 'Robots, hologramas e inteligencia galáctica',
    gemCost: 35,
    whitePieceClass: 'text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)]',
    blackPieceClass: 'text-fuchsia-400 drop-shadow-[0_0_6px_rgba(232,121,249,0.9)]',
    badgeClass: 'bg-cyan-500/15 text-cyan-600',
    pieceMap: {
      wp: '🔹',
      wn: '🤖',
      wb: '🛰️',
      wr: '⚡',
      wq: '💎',
      wk: '🌐',
      bp: '🔸',
      bn: '👾',
      bb: '📡',
      br: '🔋',
      bq: '🔮',
      bk: '👑',
    },
  },
];

// ========================================================
// 3. CATÁLOGO DE ENTRENADORES INTERACTIVOS DE AJEDREZ
// ========================================================
export const CHESS_COACHES_CATALOG: ChessCoachOption[] = [
  {
    id: 'coach_kind',
    name: 'Profesora Clara',
    personality: 'Amable',
    description: 'Te acompaña con mucha paciencia, cariño y pistas claras · Inicial Gratis',
    gemCost: 0,
    isStarter: true,
    accentClass: 'from-emerald-500 to-teal-600',
    avatarEmoji: '🌸',
    greetingQuote: '¡Hola! Estoy a tu lado. Respira tranquilo y observa qué piezas puedes activar hacia el centro.',
    hintQuote: 'Pista amable: busca desarrollar tus caballos o controlar las casillas centrales e4 y d4 antes de atacar.',
    mistakeQuote: '¡No pasa nada! Cada jugada nos enseña algo nuevo. Miremos juntos qué casilla es más segura.',
    victoryQuote: '¡Bravo! ¡Qué orgullo ver cómo pensaste cada movimiento con tanta calma y brillantez!',
  },
  {
    id: 'coach_funny',
    name: 'Capitán Chispa',
    personality: 'Divertido',
    description: 'Entrenador alegre lleno de chistes, energía y entusiasmo en cada jugada',
    gemCost: 15,
    accentClass: 'from-amber-500 to-orange-500',
    avatarEmoji: '🎉',
    greetingQuote: '¡A mover esas piezas con ritmo! ¡Hoy ese tablero va a echar chispas de talento!',
    hintQuote: '¡Súper pista secreta! ¡Tu caballo quiere dar un salto acrobático en "L" hacia una casilla activa!',
    mistakeQuote: '¡Uy, casi! Esa pieza se resbaló con una cáscara de plátano. ¡Intentemos la jugada ganadora!',
    victoryQuote: '¡BOOOOM! ¡Jaque Mate digno de fuegos artificiales! ¡Choca esos cinco!',
  },
  {
    id: 'coach_strict',
    name: 'Comandante Viktor',
    personality: 'Estricto',
    description: 'Disciplina de academia de élite: exige concentración total y cálculo preciso',
    gemCost: 25,
    accentClass: 'from-blue-600 to-indigo-800',
    avatarEmoji: '🦅',
    greetingQuote: 'Atención frente al tablero. Evalúa amenazas, calcula dos jugadas por delante y no regales tiempos.',
    hintQuote: 'Directriz táctica: identifica la pieza rival indefensa o ejecuta una jugada con jaque directo.',
    mistakeQuote: 'Imprecisión detectada. Nunca muevas sin verificar antes las respuestas tácticas del oponente. Corrige.',
    victoryQuote: 'Ejecución impecable. Tu disciplina táctica ha dado el resultado esperado. Excelente trabajo.',
  },
  {
    id: 'coach_wise',
    name: 'Gran Maestro Aurelio',
    personality: 'Maestro sabio',
    description: 'Sabio legendario del ajedrez que enseña armonía profunda y visión estratégica',
    gemCost: 40,
    accentClass: 'from-purple-600 to-violet-900',
    avatarEmoji: '🧙‍♂️',
    greetingQuote: 'El tablero es como un jardín de estrategia: cuando tus piezas cooperan en armonía, la victoria florece.',
    hintQuote: 'Consejo del Maestro: escucha el silencio del tablero; la jugada más fuerte une ataque y defensa.',
    mistakeQuote: 'Un tropiezo es el maestro disfrazado. Observa toda la diagonal y descubrirás el camino verdadero.',
    victoryQuote: '¡Magistral! Has comprendido la esencia profunda del arte del ajedrez. ¡Honor a tu sabiduría!',
  },
];

// ========================================================
// 4. GALERÍA Y TIENDA DE AVATARES (IMÁGENES ADJUNTAS SEPARADAS POR EDAD < 9 vs >= 9)
// ========================================================
// NOTA IMPORTANTE DE SEGURIDAD INFANTIL:
// Para menores de 9 años (< 9) se usan exclusivamente los personajes y caritas amigables
// de las Imágenes 1 y 2 (consola, patinadora, chica de rojo, pirata, momia simpática, caritas dulces).
// Se excluyen estrictamente el zombi, el guerrero con arma y el esqueleto con espada.
export const AVATAR_GALLERY: AvatarOption[] = [
  // =========================================================================
  // AVATARES PARA MENORES DE 9 AÑOS (ageTier: 'under_9') — Ordenados por precio
  // =========================================================================
  {
    id: 'u9_bmo_console',
    ageGroup: '3-6',
    ageTier: 'under_9',
    name: 'Consola Retro',
    title: 'Amiguito de Videojuegos · Gratis Inicial',
    bgGradient: 'from-[#34D399] to-[#059669]',
    imageUrl: '/assets/aistudio/Avatar__15__6c398884.jpg',
    svgKind: 'robot',
    gemCost: 0,
    isStarter: true,
  },
  {
    id: 'u9_face_pigtails',
    ageGroup: '3-6',
    ageTier: 'under_9',
    name: 'Carita Moñitos',
    title: 'Sonrisa Dulce · Gratis',
    bgGradient: 'from-[#FBBF24] to-[#F59E0B]',
    imageUrl: '/assets/aistudio/Avatar__9__ef665de5.jpg',
    svgKind: 'dragon',
    gemCost: 0,
  },
  {
    id: 'u9_face_loku',
    ageGroup: '3-6',
    ageTier: 'under_9',
    name: 'Carita Coral',
    title: 'Pequeño Curioso · 5 Gemas',
    bgGradient: 'from-[#FB7185] to-[#E11D48]',
    imageUrl: '/assets/aistudio/Avatar__16__eb5523f7.jpg',
    svgKind: 'fox',
    gemCost: 5,
  },
  {
    id: 'u9_face_cloud',
    ageGroup: '3-6',
    ageTier: 'under_9',
    name: 'Carita Nube Azul',
    title: 'Cielo Sereno · 8 Gemas',
    bgGradient: 'from-[#38BDF8] to-[#0284C7]',
    imageUrl: '/assets/aistudio/Avatar__13__841bbff3.jpg',
    svgKind: 'panda',
    gemCost: 8,
  },
  {
    id: 'u9_mummy_friend',
    ageGroup: '3-6',
    ageTier: 'under_9',
    name: 'Momia Simpática',
    title: 'Vendajes Sonrientes · 10 Gemas',
    bgGradient: 'from-[#FDE68A] to-[#D97706]',
    svgKind: 'mummy',
    gemCost: 10,
  },
  {
    id: 'u9_skater_girl',
    ageGroup: '7-13',
    ageTier: 'under_9',
    name: 'Patinadora Veloz',
    title: 'Sobre Ruedas · 15 Gemas',
    bgGradient: 'from-[#A855F7] to-[#EC4899]',
    imageUrl: '/assets/aistudio/Avatar__5__fb02a1f5.jpg',
    svgKind: 'artist',
    gemCost: 15,
  },
  {
    id: 'u9_red_girl',
    ageGroup: '7-13',
    ageTier: 'under_9',
    name: 'Chica de Rojo',
    title: 'Aventurera Valiente · 20 Gemas',
    bgGradient: 'from-[#EF4444] to-[#B91C1C]',
    imageUrl: '/assets/aistudio/Avatar__4__5f76c794.jpg',
    svgKind: 'astronaut',
    gemCost: 20,
  },
  {
    id: 'u9_pirate_kid',
    ageGroup: '7-13',
    ageTier: 'under_9',
    name: 'Pirata de los Mares',
    title: 'Capitán del Tesoro · 25 Gemas',
    bgGradient: 'from-[#F59E0B] to-[#B45309]',
    imageUrl: '/assets/aistudio/Avatar__8__b198446e.jpg',
    svgKind: 'musician',
    gemCost: 25,
  },
  {
    id: 'u9_little_explorer',
    ageGroup: '3-6',
    ageTier: 'under_9',
    name: 'Pequeño Explorador',
    title: 'Amigo de la Prehistoria · 30 Gemas',
    bgGradient: 'from-[#84CC16] to-[#15803D]',
    imageUrl: '/assets/aistudio/Avatar__6__cb8c726f.jpg',
    svgKind: 'panda',
    gemCost: 30,
  },
  {
    id: 'u9_diver_kid',
    ageGroup: '7-13',
    ageTier: 'under_9',
    name: 'Buzo Submarino',
    title: 'Explorador del Océano · 35 Gemas',
    bgGradient: 'from-[#06B6D4] to-[#1D4ED8]',
    imageUrl: '/assets/aistudio/Avatar__14__e3b82b22.jpg',
    svgKind: 'astronaut',
    gemCost: 35,
  },

  // =========================================================================
  // AVATARES PARA 9 AÑOS EN ADELANTE (ageTier: '9_plus') — Ordenados de menor a mayor precio
  // =========================================================================
  {
    id: 'p9_flower_crown_boy',
    ageGroup: '7-13',
    ageTier: '9_plus',
    name: 'Corona de Flores',
    title: 'Sol y Margaritas · Gratis Inicial',
    bgGradient: 'from-[#FACC15] to-[#EAB308]',
    imageUrl: '/assets/aistudio/962574120377500581_2e6752b3.jpg',
    svgKind: 'fox',
    gemCost: 0,
    isStarter: true,
  },
  {
    id: 'p9_sunflower_girl',
    ageGroup: '7-13',
    ageTier: '9_plus',
    name: 'Luz de Girasol',
    title: 'Brillo de Verano · 5 Gemas',
    bgGradient: 'from-[#FDE047] to-[#F59E0B]',
    imageUrl: '/assets/aistudio/962574120377500572_80a17db0.jpg',
    svgKind: 'artist',
    gemCost: 5,
  },
  {
    id: 'p9_star_earrings_girl',
    ageGroup: '7-13',
    ageTier: '9_plus',
    name: 'Estrellas Doradas',
    title: 'Destello Estelar · 8 Gemas',
    bgGradient: 'from-[#FBBF24] to-[#D97706]',
    imageUrl: '/assets/aistudio/962574120378529951_2ea0bd47.jpg',
    svgKind: 'astronaut',
    gemCost: 8,
  },
  {
    id: 'p9_happy_sketch_boy',
    ageGroup: '7-13',
    ageTier: '9_plus',
    name: 'Sonrisa Creativa',
    title: 'Alegría en Trazo · 10 Gemas',
    bgGradient: 'from-[#FDE68A] to-[#B45309]',
    imageUrl: '/assets/aistudio/769763761349659918_6828df01.jpg',
    svgKind: 'musician',
    gemCost: 10,
  },
  {
    id: 'p9_meadow_catcher',
    ageGroup: '7-13',
    ageTier: '9_plus',
    name: 'Exploradora del Prado',
    title: 'Brisa del Bosque · 12 Gemas',
    bgGradient: 'from-[#84CC16] to-[#15803D]',
    imageUrl: '/assets/aistudio/_743__avatar______2__edbbdc64.jpg',
    svgKind: 'panda',
    gemCost: 12,
  },
  {
    id: 'p9_snow_heart_boy',
    ageGroup: '7-13',
    ageTier: '9_plus',
    name: 'Corazón de Invierno',
    title: 'Ternura Nevada · 15 Gemas',
    bgGradient: 'from-[#FDBA74] to-[#EA580C]',
    imageUrl: '/assets/aistudio/______5c70ddd5.jpg',
    svgKind: 'fox',
    gemCost: 15,
  },
  {
    id: 'p9_white_kitty_girl',
    ageGroup: '7-13',
    ageTier: '9_plus',
    name: 'Amiga del Gatito',
    title: 'Dulzura Felina · 18 Gemas',
    bgGradient: 'from-[#F9A8D4] to-[#DB2777]',
    imageUrl: '/assets/aistudio/889038782731383192_aa120931.jpg',
    svgKind: 'dragon',
    gemCost: 18,
  },
  {
    id: 'p9_bunny_jacket_boy',
    ageGroup: '7-13',
    ageTier: '9_plus',
    name: 'Conejito Estelar',
    title: 'Estilo Urbano · 20 Gemas',
    bgGradient: 'from-[#4ADE80] to-[#16A34A]',
    imageUrl: '/assets/aistudio/981784787526504361__1__c37da1fc.jpg',
    svgKind: 'panda',
    gemCost: 20,
  },
  {
    id: 'p9_night_cat_boy',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Gato de Medianoche',
    title: 'Estratega Nocturno · 22 Gemas',
    bgGradient: 'from-[#3B82F6] to-[#1D4ED8]',
    imageUrl: '/assets/aistudio/____2fe7aaf6.jpg',
    svgKind: 'owl',
    gemCost: 22,
  },
  {
    id: 'p9_red_glasses_girl',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Mirada Escarlata',
    title: 'Mente Analítica · 25 Gemas',
    bgGradient: 'from-[#EF4444] to-[#991B1B]',
    imageUrl: '/assets/aistudio/962574120377500575_d1e33504.jpg',
    svgKind: 'artist',
    gemCost: 25,
  },
  {
    id: 'p9_crimson_roses_girl',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Rosas Carmesí',
    title: 'Arte & Pasión · 28 Gemas',
    bgGradient: 'from-[#F43F5E] to-[#881337]',
    imageUrl: '/assets/aistudio/962574120377500586_ffc9d042.jpg',
    svgKind: 'artist',
    gemCost: 28,
  },
  {
    id: 'p9_retro_pixel_girl',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Pixel Gamer',
    title: 'Campeona Arcade · 30 Gemas',
    bgGradient: 'from-[#A855F7] to-[#6B21A8]',
    imageUrl: '/assets/aistudio/1056446025080905903_ec7759fb.jpg',
    svgKind: 'robot',
    gemCost: 30,
  },
  {
    id: 'p9_music_headphones_girl',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Sinfonía Urbana',
    title: 'Virtuosa Musical · 32 Gemas',
    bgGradient: 'from-[#38BDF8] to-[#0369A1]',
    imageUrl: '/assets/aistudio/476396466854472951_fd35d7b1.jpg',
    svgKind: 'musician',
    gemCost: 32,
  },
  {
    id: 'p9_autumn_breeze_boy',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Brisa de Otoño',
    title: 'Horizonte Cálido · 35 Gemas',
    bgGradient: 'from-[#FB923C] to-[#C2410C]',
    imageUrl: '/assets/aistudio/____________________35cf7082.jpg',
    svgKind: 'fox',
    gemCost: 35,
  },
  {
    id: 'p9_cyber_blue_girl',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Estrella Cian',
    title: 'Vanguardia Digital · 38 Gemas',
    bgGradient: 'from-[#06B6D4] to-[#0E7490]',
    imageUrl: '/assets/aistudio/166492517468122791_83e6d8b5.jpg',
    svgKind: 'astronaut',
    gemCost: 38,
  },
  {
    id: 'p9_vintage_cat_lady',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Atelier Clásico',
    title: 'Elegancia Ilustrada · 40 Gemas',
    bgGradient: 'from-[#F472B6] to-[#9D174D]',
    imageUrl: '/assets/aistudio/coloring_books_aesthetic_0c28faf0.jpg',
    svgKind: 'artist',
    gemCost: 40,
  },
  {
    id: 'p9_emerald_serene_girl',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Esmeralda Serena',
    title: 'Concentración Pura · 42 Gemas',
    bgGradient: 'from-[#34D399] to-[#047857]',
    imageUrl: '/assets/aistudio/Portrait_illustration__1__9e47af71.jpg',
    svgKind: 'owl',
    gemCost: 42,
  },
  {
    id: 'p9_jade_light_girl',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Luz de Jade',
    title: 'Sabiduría Creativa · 45 Gemas',
    bgGradient: 'from-[#10B981] to-[#065F46]',
    imageUrl: '/assets/aistudio/Portrait_illustration_04d72aea.jpg',
    svgKind: 'owl',
    gemCost: 45,
  },
  {
    id: 'p9_emerald_scholar_boy',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Maestro Esmeralda',
    title: 'Gran Estratega · 48 Gemas',
    bgGradient: 'from-[#6EE7B7] to-[#047857]',
    imageUrl: '/assets/aistudio/611222980699889381_6d5d71ff.jpg',
    svgKind: 'musician',
    gemCost: 48,
  },
  {
    id: 'p9_mint_legend_girl',
    ageGroup: '14-18',
    ageTier: '9_plus',
    name: 'Leyenda de Menta',
    title: 'Edición Coleccionista · 50 Gemas',
    bgGradient: 'from-[#2DD4BF] to-[#115E59]',
    imageUrl: '/assets/aistudio/Procreate_36d5fa26.jpg',
    svgKind: 'astronaut',
    gemCost: 50,
  },
];

export function getAvatarsForChildAge(age: number): AvatarOption[] {
  const tier = age < 9 ? 'under_9' : '9_plus';
  return AVATAR_GALLERY.filter((a) => a.ageTier === tier).sort(
    (a, b) => a.gemCost - b.gemCost
  );
}

export const WALLPAPER_GALLERY: WallpaperOption[] = [
  {
    id: 'meadow_day',
    name: 'Brisa Esmeralda',
    description: 'Tonos claros y naturales para máxima concentración',
    previewClass: 'bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100',
    headerBgClass: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white',
    pageBgClass: 'bg-slate-50',
  },
  {
    id: 'cosmic_aurora',
    name: 'Aurora Nocturna',
    description: 'Modo oscuro elegante para mentes analíticas',
    previewClass: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950',
    headerBgClass: 'bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white',
    pageBgClass: 'bg-slate-950',
  },
  {
    id: 'sunset_atelier',
    name: 'Estudio Creativo',
    description: 'Cálido atardecer terracota y dorado',
    previewClass: 'bg-gradient-to-br from-amber-200 via-orange-100 to-rose-200',
    headerBgClass: 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white',
    pageBgClass: 'bg-amber-50/40',
  },
  {
    id: 'ocean_symphony',
    name: 'Océano Atlántico',
    description: 'Azul sereno de alta claridad visual',
    previewClass: 'bg-gradient-to-br from-sky-200 via-cyan-100 to-blue-200',
    headerBgClass: 'bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800 text-white',
    pageBgClass: 'bg-sky-50/40',
  },
];

// ========================================================
// ORACIONES Y GUÍA PASO A PASO DEL SANTO ROSARIO
// ========================================================
export const PRAYERS_COLLECTION: PrayerItem[] = [
  {
    id: 'padre-nuestro',
    title: 'El Padre Nuestro',
    subtitle: 'La oración que Jesús nos enseñó',
    text: 'Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.',
    simpleExplanationByAge: {
      '3-6': 'Con esta oración hablamos con Papá Dios con mucho cariño, le damos las gracias por nuestro alimento y aprendemos a perdonar.',
      '7-13': 'Es la oración principal cristiana: reconocemos a Dios como Padre, pedimos que reine la paz y nos comprometemos a perdonar a los demás.',
      '14-18': 'Oración dominical enseñada en el Evangelio: sintetiza la filiación divina, la búsqueda del bien común ("nuestro pan") y la reconciliación fraterna.',
    },
  },
  {
    id: 'ave-maria',
    title: 'El Ave María',
    subtitle: 'Saludo lleno de cariño a la Virgen María',
    text: 'Dios te salve, María, llena eres de gracia, el Señor es contigo. Bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.',
    simpleExplanationByAge: {
      '3-6': 'Saludamos a la Virgen María como lo hizo el ángel Gabriel y le pedimos que nos cuide siempre como una mamá buena.',
      '7-13': 'Une el saludo del Arcángel Gabriel y de Santa Isabel en el Evangelio con nuestra petición filial a María como Madre.',
      '14-18': 'Oración mariana de raíz bíblica (Lucas 1, 28.42) que medita la Encarnación y pide la intercesión materna de María en cada momento de la vida.',
    },
  },
  {
    id: 'gloria',
    title: 'El Gloria',
    subtitle: 'Alabanza a la Santísima Trinidad',
    text: 'Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.',
    simpleExplanationByAge: {
      '3-6': 'Una oración cortita y alegre para dar gracias al Padre, al Hijo y al Espíritu Santo.',
      '7-13': 'Se reza al finalizar cada decena del Santo Rosario para alabar a la Santísima Trinidad.',
      '14-18': 'Doxología menor de la tradición cristiana que glorifica al Padre, al Hijo y al Espíritu Santo en la eternidad.',
    },
  },
  {
    id: 'credo',
    title: 'El Credo de los Apóstoles',
    subtitle: 'Resumen de las verdades de la fe',
    text: 'Creo en Dios, Padre Todopoderoso, Creador del cielo y de la tierra. Creo en Jesucristo, su único Hijo, nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso. Desde allí ha de venir a juzgar a vivos y muertos. Creo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén.',
    simpleExplanationByAge: {
      '3-6': 'Con el Credo decimos con alegría que creemos en Dios Creador, en Jesús nuestro amigo y salvador, y en el Espíritu Santo.',
      '7-13': 'Conocido como el Símbolo de los Apóstoles, abre el rezo del Santo Rosario recordando los pilares de nuestra fe.',
      '14-18': 'Profesión de fe trinitaria e histórica de la Iglesia primitiva que estructura la teología de la creación, redención y santificación.',
    },
  },
];

export const ROSARY_MYSTERIES: RosaryMysteryGroup[] = [
  {
    id: 'gozosos',
    name: 'Misterios Gozosos',
    daysText: 'Lunes y Sábado',
    mysteries: [
      { number: 1, title: 'La Anunciación del Ángel a María', fruit: 'La humildad', meditation: 'El ángel Gabriel anuncia a María que será la Madre del Salvador, y ella responde con fe: "Hágase en mí según tu palabra".' },
      { number: 2, title: 'La Visitación de María a su prima Santa Isabel', fruit: 'El amor al prójimo', meditation: 'María viaja con alegría para ayudar a su prima Isabel, llevando la presencia de Jesús.' },
      { number: 3, title: 'El Nacimiento del Niño Jesús en Belén', fruit: 'El desprendimiento y la paz', meditation: 'Jesús nace en la sencillez del pesebre de Belén trayendo luz y esperanza al mundo.' },
      { number: 4, title: 'La Presentación de Jesús en el Templo', fruit: 'La obediencia y pureza', meditation: 'María y José presentan al Niño Jesús en el Templo y el anciano Simeón lo reconoce como Luz de las naciones.' },
      { number: 5, title: 'El Niño Jesús hallado en el Templo', fruit: 'La búsqueda de Dios', meditation: 'Tras tres días de búsqueda, encuentran a Jesús de doce años dialogando con los maestros de la Ley.' },
    ],
  },
  {
    id: 'luminosos',
    name: 'Misterios Luminosos',
    daysText: 'Jueves',
    mysteries: [
      { number: 1, title: 'El Bautismo de Jesús en el Jordán', fruit: 'La fidelidad a las promesas del bautismo', meditation: 'Se abren los cielos y la voz del Padre proclama: "Este es mi Hijo muy amado".' },
      { number: 2, title: 'Las Bodas de Caná', fruit: 'La confianza en María y en Jesús', meditation: 'María dice a los sirvientes: "Hagan todo lo que Él les diga", y Jesús realiza su primer signo.' },
      { number: 3, title: 'El Anuncio del Reino de Dios', fruit: 'La conversión del corazón', meditation: 'Jesús recorre los pueblos enseñando las Bienaventuranzas, sanando y perdonando.' },
      { number: 4, title: 'La Transfiguración del Señor', fruit: 'El deseo de santidad', meditation: 'En el monte Tabor, el rostro de Jesús resplandece como el sol ante Pedro, Santiago y Juan.' },
      { number: 5, title: 'La Institución de la Eucaristía', fruit: 'La gratitud y adoración', meditation: 'En la Última Cena, Jesús nos entrega el pan y el vino como signo de su amor para siempre.' },
    ],
  },
  {
    id: 'dolorosos',
    name: 'Misterios Dolorosos',
    daysText: 'Martes y Viernes',
    mysteries: [
      { number: 1, title: 'La Oración de Jesús en el Huerto', fruit: 'La fortaleza en la prueba', meditation: 'Jesús ora con confianza al Padre en el Huerto de los Olivos aceptando su misión por amor.' },
      { number: 2, title: 'La Flagelación del Señor', fruit: 'La paciencia', meditation: 'Jesús soporta el sufrimiento con mansedumbre y entrega.' },
      { number: 3, title: 'La Coronación de Espinas', fruit: 'La humildad de corazón', meditation: 'El Rey de la paz enseña que su Reino se construye con verdad y servicio.' },
      { number: 4, title: 'Jesús con la Cruz a cuestas', fruit: 'La solidaridad con quien sufre', meditation: 'El Cirineo y las mujeres piadosas acompañan a Jesús en el camino hacia el Calvario.' },
      { number: 5, title: 'La Crucifixión y Muerte de Jesús', fruit: 'El perdón y la entrega', meditation: 'Desde la Cruz, Jesús perdona a todos y nos confía a María como Madre.' },
    ],
  },
  {
    id: 'gloriosos',
    name: 'Misterios Gloriosos',
    daysText: 'Miércoles y Domingo',
    mysteries: [
      { number: 1, title: 'La Resurrección del Señor', fruit: 'La fe y la alegría', meditation: 'Al tercer día, Jesús vence a la muerte y llena de paz a sus discípulos.' },
      { number: 2, title: 'La Ascensión del Señor al Cielo', fruit: 'La esperanza cristiana', meditation: 'Jesús sube al Cielo prometiendo: "Yo estaré con ustedes todos los días".' },
      { number: 3, title: 'La Venida del Espíritu Santo en Pentecostés', fruit: 'Los dones del Espíritu Santo', meditation: 'El Espíritu Santo llena de sabiduría y valentía a María y a los Apóstoles.' },
      { number: 4, title: 'La Asunción de María al Cielo', fruit: 'La paz del alma', meditation: 'Al terminar su vida en la tierra, la Virgen María es llevada en cuerpo y alma al Cielo.' },
      { number: 5, title: 'La Coronación de María como Reina del Cielo', fruit: 'La confianza filial en María', meditation: 'María brilla como Madre de misericordia que intercede por todos sus hijos.' },
    ],
  },
];

// ========================================================
// LECCIONES PROGRESIVAS DE LA SECCIÓN AJEDREZ (CON TABLERO)
// ========================================================
export const CHESS_ACADEMY_LESSONS: ChessLessonInteractive[] = [
  {
    id: 'chess-l1-pieces',
    levelNumber: 1,
    title: 'Nivel 1: El Movimiento de la Torre y la Dama',
    categoryLabel: 'Movimiento de las Piezas',
    description: 'Aprende cómo se desplaza la Torre en líneas rectas (filas y columnas) para capturar o dominar el tablero.',
    xpReward: 40,
    initialFen: '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1',
    objectiveText: 'Mueve la Torre blanca desde e2 hasta e8 (toca e2 y luego e8) para dar jaque en la columna abierta.',
    targetMoveSan: ['Re8+'],
    explanation: '¡Excelente! La Torre se mueve en línea recta vertical u horizontal tantas casillas libres como quiera.',
  },
  {
    id: 'chess-l2-knight',
    levelNumber: 2,
    title: 'Nivel 2: El Salto en "L" del Caballo y Reglas',
    categoryLabel: 'Reglas y Piezas Especiales',
    description: 'El Caballo es la única pieza que puede saltar sobre otras piezas moviéndose en forma de letra L.',
    xpReward: 45,
    initialFen: 'r1bqkbnr/pppppppp/2n5/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 1 2',
    objectiveText: 'Desarrolla tu Caballo blanco desde g1 hasta la casilla activa f3 (toca g1 y luego f3).',
    targetMoveSan: ['Nf3', 'Nc3'],
    explanation: '¡Muy bien! Desarrollar los caballos hacia el centro (f3 o c3) en las primeras jugadas controla casillas clave.',
  },
  {
    id: 'chess-l3-mate1',
    levelNumber: 3,
    title: 'Nivel 3: Jaque y Jaque Mate del Pasillo',
    categoryLabel: 'Jaque y Jaque Mate',
    description: 'Diferencia entre amenazar al Rey (Jaque) y encerrarlo sin escapatoria (Jaque Mate).',
    xpReward: 55,
    initialFen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
    objectiveText: 'Lleva tu Torre blanca de d1 hasta d8 para dar Jaque Mate en la última fila.',
    targetMoveSan: ['Rd8#'],
    explanation: '¡Jaque Mate! El Rey negro no puede escapar porque sus propios peones en f7, g7 y h7 le bloquean la salida.',
  },
  {
    id: 'chess-l4-openings',
    levelNumber: 4,
    title: 'Nivel 4: Principios de Apertura — Control del Centro',
    categoryLabel: 'Aperturas Clásicas',
    description: 'Domina las 4 casillas centrales (e4, d4, e5, d5) y abre paso a tus alfiles y dama.',
    xpReward: 60,
    initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    objectiveText: 'Realiza la jugada clásica de apertura avanzando el peón del Rey dos pasos: de e2 a e4.',
    targetMoveSan: ['e4', 'd4'],
    explanation: '¡Gran apertura! Avanzar el peón central (e4 o d4) controla el centro y libera el alfil y la dama.',
  },
  {
    id: 'chess-l5-tactics',
    levelNumber: 5,
    title: 'Nivel 5: Táctica y Estrategia — Ataque Doble con Dama',
    categoryLabel: 'Tácticas y Estrategia',
    description: 'Busca jugadas que ataquen dos objetivos al mismo tiempo (el Rey y una pieza indefensa).',
    xpReward: 75,
    initialFen: 'r3k3/ppp2ppp/8/8/8/8/PPP2PPP/3QK1NR w Kq - 0 1',
    objectiveText: 'Mueve la Dama blanca de d1 a d7 (o e2) dando jaque al Rey negro.',
    targetMoveSan: ['Qd7+', 'Qe2+'],
    explanation: '¡Dominio táctico! Los ataques con jaque obligan al rival a defender su Rey mientras ganas la iniciativa.',
  },
];

// ========================================================
// CURSOS COMPLETOS SEPARADOS POR CADA GRUPO DE EDAD
// ========================================================
export const COURSES_DATA: Course[] = [
  // ==========================================
  // GRUPO 1: 3 a 6 años (Aprender a leer, Ajedrez básico, Oración sencilla)
  // ==========================================
  {
    id: 'read-3-6-letters',
    subject: 'reading',
    ageGroup: '3-6',
    title: 'Aprendo a Leer: Letras y Sonidos',
    subtitle: 'Vocales, sílabas mágicas y mis primeras palabras con voz',
    accentColor: '#F59E0B',
    lessons: [
      {
        id: 'l-36-vowels',
        title: 'Nivel 1: Las Vocales Cantarinas',
        description: 'Escucha con el altavoz y descubre con qué letra empiezan las palabras.',
        levelNumber: 1,
        xpReward: 40,
        durationMinutes: 3,
        exercises: [
          {
            id: 'ex-36-1',
            type: 'multiple_choice',
            prompt: '¿Con qué vocal empieza ABEJA?',
            subtitle: 'Toca el botón de voz para escuchar.',
            audioText: 'Abeja. Empieza con la letra A.',
            options: ['A — Abeja', 'E — Estrella', 'O — Oso'],
            correctAnswer: 'A — Abeja',
            hint: 'Escucha el primer sonido: ¡Aaa-beja!',
          },
          {
            id: 'ex-36-2',
            type: 'multiple_choice',
            prompt: '¿Qué fruta empieza con la letra U?',
            subtitle: 'Son dulces y moradas.',
            audioText: 'Uvas. Empieza con la vocal U.',
            options: ['Uvas', 'Isla', 'Avión'],
            correctAnswer: 'Uvas',
            hint: 'Empieza con el sonido Uuu como Uvas.',
          },
        ],
      },
      {
        id: 'l-36-syllables',
        title: 'Nivel 2: Sílabas con M, P y S',
        description: 'Une sílabas divertidas para formar palabras.',
        levelNumber: 2,
        xpReward: 45,
        durationMinutes: 4,
        exercises: [
          {
            id: 'ex-36-3',
            type: 'syllable_builder',
            prompt: 'Si juntamos SA + PO, ¿qué animal leemos?',
            subtitle: 'Salta en el charco.',
            audioText: 'Sa, po. ¡El sapo salta alto!',
            options: ['SAPO', 'SOPA', 'PASO'],
            correctAnswer: 'SAPO',
            hint: 'Empieza con SA y termina con PO: SAPO.',
          },
        ],
      },
      {
        id: 'l-36-sentences',
        title: 'Nivel 3: Mis Primeras Frases',
        description: 'Lee y escucha frases cortas llenas de alegría.',
        levelNumber: 3,
        xpReward: 50,
        durationMinutes: 4,
        exercises: [
          {
            id: 'ex-36-4',
            type: 'multiple_choice',
            prompt: 'Escucha y lee: "EL SOL BRILLA"',
            subtitle: '¿Quién brilla en el cielo durante el día?',
            audioText: 'El sol brilla en el cielo azul.',
            options: ['El Sol', 'La Cuchara', 'El Zapato'],
            correctAnswer: 'El Sol',
            hint: 'Es amarillo y nos da luz.',
          },
        ],
      },
    ],
  },
  {
    id: 'chess-3-6-basic',
    subject: 'chess_course',
    ageGroup: '3-6',
    title: 'Ajedrez Básico para Pequeños',
    subtitle: 'Conoce al Rey, la Torre y el Caballito saltarín con sonidos',
    accentColor: '#10B981',
    lessons: [
      {
        id: 'l-chess36-1',
        title: 'Nivel 1: El Caballito Saltarín',
        description: 'Descubre qué pieza del ajedrez puede saltar sobre las demás.',
        levelNumber: 1,
        xpReward: 40,
        durationMinutes: 3,
        exercises: [
          {
            id: 'ex-c36-1',
            type: 'multiple_choice',
            prompt: '¿Qué pieza tiene forma de animalito y salta por encima de otras piezas?',
            audioText: 'El Caballo salta en forma de letra L por el tablero.',
            options: ['El Caballo ♞', 'El Peón ♟', 'La Torre ♜'],
            correctAnswer: 'El Caballo ♞',
            hint: 'Relincha y salta muy alto: ¡el Caballo!',
          },
        ],
      },
      {
        id: 'l-chess36-2',
        title: 'Nivel 2: Cuidando al Rey',
        description: 'La pieza más importante que lleva una corona en su cabeza.',
        levelNumber: 2,
        xpReward: 45,
        durationMinutes: 3,
        exercises: [
          {
            id: 'ex-c36-2',
            type: 'multiple_choice',
            prompt: '¿Qué pieza lleva una cruz en su corona y debemos proteger siempre?',
            audioText: 'El Rey es la pieza más importante del equipo.',
            options: ['El Rey ♚', 'La Torre ♜', 'El Peón ♟'],
            correctAnswer: 'El Rey ♚',
            hint: 'Es el Rey del castillo.',
          },
        ],
      },
    ],
  },
  {
    id: 'prayer-3-6-basic',
    subject: 'prayer',
    ageGroup: '3-6',
    title: 'Curso de Oración Sencillo',
    subtitle: 'Hablar con Dios, el Padre Nuestro, el Ave María y el Rosario con voz',
    accentColor: '#0EA5E9',
    lessons: [
      {
        id: 'l-pray36-1',
        title: 'Nivel 1: La Señal de la Cruz y el Padre Nuestro',
        description: 'Aprende con audio la oración que Jesús nos enseñó.',
        levelNumber: 1,
        xpReward: 40,
        durationMinutes: 3,
        exercises: [
          {
            id: 'ex-pr36-1',
            type: 'multiple_choice',
            prompt: '¿Cómo empieza la oración que Jesús nos enseñó?',
            audioText: 'Padre nuestro, que estás en el cielo, santificado sea tu Nombre.',
            options: ['Padre nuestro, que estás en el cielo', 'Había una vez un barco', 'Uno, dos y tres'],
            correctAnswer: 'Padre nuestro, que estás en el cielo',
            hint: 'Hablamos con amor a nuestro Padre del cielo.',
          },
        ],
      },
      {
        id: 'l-pray36-2',
        title: 'Nivel 2: El Ave María y las Cuentas del Rosario',
        description: 'Saluda con cariño a la Virgen María paso a paso.',
        levelNumber: 2,
        xpReward: 45,
        durationMinutes: 3,
        exercises: [
          {
            id: 'ex-pr36-2',
            type: 'multiple_choice',
            prompt: 'En el Santo Rosario, ¿qué oración rezamos en cada grupo de 10 cuentas pequeñas?',
            audioText: 'En cada cuenta pequeña rezamos el Ave María: Dios te salve, María, llena eres de gracia.',
            options: ['El Ave María', 'La tabla de sumar', 'El abecedario'],
            correctAnswer: 'El Ave María',
            hint: 'Saludamos a la Virgen María en cada cuenta.',
          },
        ],
      },
    ],
  },

  // ==========================================
  // GRUPO 2: 7 a 13 años (8 Cursos: Mate, Finanzas, Dibujo, Emprendimiento, Piano, Ortografía, Ajedrez, Oración)
  // ==========================================
  {
    id: 'math-7-13',
    subject: 'math',
    ageGroup: '7-13',
    title: 'Matemáticas en Acción',
    subtitle: 'Fracciones, geometría visual y retos de lógica mental',
    accentColor: '#0284C7',
    lessons: [
      {
        id: 'l-math-713-1',
        title: 'Nivel 1: Fracciones en la Pizzería',
        description: 'Suma y compara fracciones de forma visual.',
        levelNumber: 1,
        xpReward: 50,
        durationMinutes: 5,
        exercises: [
          {
            id: 'ex-m713-1',
            type: 'multiple_choice',
            prompt: 'Una pizza se divide en 8 rebanadas iguales. Si comes 3 rebanadas y tu amiga come 2, ¿qué fracción comieron en total?',
            options: ['5/8 de la pizza', '3/8 de la pizza', '5/16 de la pizza'],
            correctAnswer: '5/8 de la pizza',
            hint: 'Suma los numeradores: 3 + 2 = 5 octavos.',
          },
          {
            id: 'ex-m713-2',
            type: 'multiple_choice',
            prompt: 'Si tienes 24 monedas y ahorras un tercio (1/3) en tu alcancía, ¿cuántas monedas guardaste?',
            options: ['8 monedas', '6 monedas', '12 monedas'],
            correctAnswer: '8 monedas',
            hint: 'Divide 24 entre 3.',
          },
        ],
      },
      {
        id: 'l-math-713-2',
        title: 'Nivel 2: Geometría y Áreas',
        description: 'Calcula el área y perímetro de parques y figuras.',
        levelNumber: 2,
        xpReward: 55,
        durationMinutes: 5,
        exercises: [
          {
            id: 'ex-m713-3',
            type: 'multiple_choice',
            prompt: 'Un huerto rectangular mide 6 m de largo y 4 m de ancho. ¿Cuál es su área?',
            options: ['24 metros cuadrados', '20 metros cuadrados', '10 metros cuadrados'],
            correctAnswer: '24 metros cuadrados',
            hint: 'Multiplica base × altura (6 × 4).',
          },
        ],
      },
    ],
  },
  {
    id: 'orthography-7-13',
    subject: 'orthography',
    ageGroup: '7-13',
    title: 'Ortografía y Acentuación',
    subtitle: 'Uso de b/v, c/s/z, g/j, h, acentos, puntuación y dictados interactivos',
    accentColor: '#EA580C',
    lessons: [
      {
        id: 'l-ortho-713-1',
        title: 'Nivel 1: Reglas de la B/V y la H Muda',
        description: 'Completa palabras y corrige errores frecuentes con B, V y H.',
        levelNumber: 1,
        xpReward: 50,
        durationMinutes: 5,
        exercises: [
          {
            id: 'ex-or713-1',
            type: 'dictation_fill',
            prompt: 'Dictado interactivo: Escucha la oración y elige la escritura correcta de la palabra con B o V: "Ayer nosotros caminá_amos por el bosque".',
            audioText: 'Ayer nosotros caminábamos por el bosque. Recuerda que las terminaciones en aba, ábamos siempre se escriben con B y tilde en la sílaba esdrújula.',
            options: ['caminábamos (con B y tilde)', 'caminávamos (con V)', 'caminabamos (sin tilde)'],
            correctAnswer: 'caminábamos (con B y tilde)',
            hint: 'Todos los verbos en pasado terminados en -aba, -abas, -ábamos se escriben con B.',
          },
          {
            id: 'ex-or713-2',
            type: 'multiple_choice',
            prompt: '¿Cuál de estas palabras está escrita con la ortografía CORRECTA del uso de la H?',
            options: [
              'Hielo, huella y almohada',
              'Ielo, uella y almoada',
              'Havía una vez un hueso',
            ],
            correctAnswer: 'Hielo, huella y almohada',
            hint: 'Las palabras que empiezan por los diptongos hia-, hie-, hue-, hui- siempre llevan H inicial.',
          },
        ],
      },
      {
        id: 'l-ortho-713-2',
        title: 'Nivel 2: Uso de G/J, C/S/Z y Acentos',
        description: 'Domina las palabras agudas, graves, esdrújulas y los signos de puntuación.',
        levelNumber: 2,
        xpReward: 55,
        durationMinutes: 5,
        exercises: [
          {
            id: 'ex-or713-3',
            type: 'multiple_choice',
            prompt: '¿Por qué las palabras "música", "brújula" y "pájaro" llevan tilde siempre?',
            options: [
              'Porque son palabras esdrújulas y todas las esdrújulas llevan tilde',
              'Porque terminan en consonante distinta de n o s',
              'Porque empiezan con consonante',
            ],
            correctAnswer: 'Porque son palabras esdrújulas y todas las esdrújulas llevan tilde',
            hint: 'Tienen la sílaba tónica en el antepenúltimo lugar (esdrújulas).',
          },
          {
            id: 'ex-or713-4',
            type: 'multiple_choice',
            prompt: 'Corrige la oración eligiendo la opción con G/J y C/S/Z correctas:',
            options: [
              'El viajero protegió a los peces con mucha paciencia.',
              'El viagero protejió a los peses con mucha pasiencia.',
              'El viajero protegió a los pezes con mucha paciensia.',
            ],
            correctAnswer: 'El viajero protegió a los peces con mucha paciencia.',
            hint: 'Las palabras terminadas en -aje (viaje/viajero) van con J; el plural de pez (terminado en Z) cambia a C (peces).',
          },
        ],
      },
    ],
  },
  {
    id: 'finance-7-13',
    subject: 'finance',
    ageGroup: '7-13',
    title: 'Finanzas Inteligentes',
    subtitle: 'Ahorrar con metas, gastar con inteligencia y entender el dinero',
    accentColor: '#059669',
    lessons: [
      {
        id: 'l-fin-713-1',
        title: 'Nivel 1: Necesidades vs. Deseos',
        description: 'Toma decisiones inteligentes antes de gastar tus ahorros.',
        levelNumber: 1,
        xpReward: 50,
        durationMinutes: 5,
        exercises: [
          {
            id: 'ex-f713-1',
            type: 'multiple_choice',
            prompt: '¿Cuál de estos gastos es una NECESIDAD básica y no un simple deseo?',
            options: [
              'Útiles escolares y alimentación saludable',
              'Un tercer par de auriculares con luces LED',
              'Accesorios decorativos para un videojuego',
            ],
            correctAnswer: 'Útiles escolares y alimentación saludable',
            hint: 'Las necesidades son indispensables para vivir, estudiar y estar sanos.',
          },
        ],
      },
      {
        id: 'l-fin-713-2',
        title: 'Nivel 2: La Regla de las 3 Alcancías',
        description: 'Divide tu dinero en Ahorrar, Gastar y Compartir.',
        levelNumber: 2,
        xpReward: 55,
        durationMinutes: 5,
        exercises: [
          {
            id: 'ex-f713-2',
            type: 'multiple_choice',
            prompt: 'Recibes $20 semanales y quieres una bicicleta de $100. Si ahorras $10 por semana, ¿en cuántas semanas la compras?',
            options: ['En 10 semanas', 'En 5 semanas', 'En 20 semanas'],
            correctAnswer: 'En 10 semanas',
            hint: 'Divide $100 entre $10 por semana.',
          },
        ],
      },
    ],
  },
  {
    id: 'drawing-7-13',
    subject: 'drawing',
    ageGroup: '7-13',
    title: 'Dibujo Realista Paso a Paso',
    subtitle: 'Proporciones, volumen con luz y sombra, y estudio interactivo',
    accentColor: '#E11D48',
    lessons: [
      {
        id: 'l-draw-713-1',
        title: 'Nivel 1: Cómo Dibujar un Ojo Realista',
        description: 'Aprende la estructura geométrica, el iris y el brillo de vida.',
        levelNumber: 1,
        xpReward: 60,
        durationMinutes: 7,
        exercises: [
          {
            id: 'ex-d713-1',
            type: 'drawing_studio',
            prompt: 'Taller Paso a Paso: Estructura y Sombreado del Ojo Realista',
            subtitle: 'Sigue las 4 etapas en la guía anatómica y practica tus trazos en el lienzo interactivo.',
            hint: 'Empieza siempre con líneas suaves antes de oscurecer la pupila.',
            drawingSteps: [
              {
                stepNumber: 1,
                title: '1. Eje Horizontal y Forma de Almendra',
                instruction: 'Traza una línea guía horizontal suave y dibuja un círculo central para el iris.',
                svgGuideType: 'eye_structure',
              },
              {
                stepNumber: 2,
                title: '2. Párpado Superior, Pupila y Brillo',
                instruction: 'Reserva un pequeño círculo blanco para el reflejo de luz antes de sombrear la pupila.',
                svgGuideType: 'eye_structure',
              },
              {
                stepNumber: 3,
                title: '3. Textura Radial del Iris y Sombra Superior',
                instruction: 'Añade una sombra suave debajo del párpado superior para dar volumen esférico.',
                svgGuideType: 'sphere_shading',
              },
              {
                stepNumber: 4,
                title: '4. Pestañas en Curva Natural',
                instruction: 'Dibuja las pestañas curvadas saliendo del borde exterior del párpado.',
                svgGuideType: 'eye_structure',
              },
            ],
          },
        ],
      },
      {
        id: 'l-draw-713-2',
        title: 'Nivel 2: Luz, Sombra y Esfera 3D',
        description: 'Comprende dónde colocar el brillo y la sombra proyectada.',
        levelNumber: 2,
        xpReward: 60,
        durationMinutes: 6,
        exercises: [
          {
            id: 'ex-d713-2',
            type: 'multiple_choice',
            prompt: '¿Qué hace que un círculo plano parezca una esfera tridimensional en papel?',
            options: [
              'El degradado suave entre la zona de luz directa, el medio tono y la sombra',
              'Calcar únicamente el borde exterior con marcador grueso',
              'Dejar toda la hoja del mismo tono sin contraste',
            ],
            correctAnswer: 'El degradado suave entre la zona de luz directa, el medio tono y la sombra',
            hint: 'El volumen nace de la transición gradual entre luz y sombra.',
          },
        ],
      },
    ],
  },
  {
    id: 'entrepreneur-7-13',
    subject: 'entrepreneurship',
    ageGroup: '7-13',
    title: 'Emprendimiento Joven',
    subtitle: 'Cómo crear tu primer proyecto, calcular ganancias y ayudar a tu comunidad',
    accentColor: '#7C3AED',
    lessons: [
      {
        id: 'l-ent-713-1',
        title: 'Nivel 1: De una Idea a una Empresa',
        description: 'Descubre cómo resolver un problema real y calcular tu ganancia.',
        levelNumber: 1,
        xpReward: 55,
        durationMinutes: 5,
        exercises: [
          {
            id: 'ex-e713-1',
            type: 'multiple_choice',
            prompt: 'Hacer una pulsera artesanal te cuesta $3 en materiales (Costo) y la vendes a $8 (Precio). ¿Cuál es tu ganancia?',
            options: ['$5 de ganancia', '$8 de ganancia', '$11 de ganancia'],
            correctAnswer: '$5 de ganancia',
            hint: 'Ganancia = Precio de venta ($8) menos Costo ($3).',
          },
        ],
      },
    ],
  },
  {
    id: 'piano-7-13',
    subject: 'piano',
    ageGroup: '7-13',
    title: 'Piano Interactivo',
    subtitle: 'Toca melodías reales en el teclado virtual y aprende notas musicales',
    accentColor: '#D97706',
    lessons: [
      {
        id: 'l-piano-713-1',
        title: 'Nivel 1: Melodía "Himno a la Alegría"',
        description: 'Toca las teclas iluminadas en el teclado virtual de la app.',
        levelNumber: 1,
        xpReward: 60,
        durationMinutes: 6,
        exercises: [
          {
            id: 'ex-p713-1',
            type: 'piano_melody',
            prompt: 'Toca en el teclado virtual la frase inicial del "Himno a la Alegría": Mi - Mi - Fa - Sol',
            subtitle: 'Pulsa las teclas iluminadas en orden para escuchar la melodía real.',
            targetNotes: ['E4', 'E4', 'F4', 'G4'],
            hint: 'Sigue la guía dorada sobre las teclas Mi (E4), Fa (F4) y Sol (G4).',
          },
        ],
      },
    ],
  },
  {
    id: 'chess-course-7-13',
    subject: 'chess_course',
    ageGroup: '7-13',
    title: 'Ajedrez Táctico y Estrategia',
    subtitle: 'Valor de las piezas, aperturas, jaque mate y tácticas ganadoras',
    accentColor: '#0D9488',
    lessons: [
      {
        id: 'l-chess-713-1',
        title: 'Nivel 1: Valor de las Piezas y Control del Centro',
        description: 'Aprende cuántos puntos vale cada pieza para hacer buenos intercambios.',
        levelNumber: 1,
        xpReward: 55,
        durationMinutes: 5,
        exercises: [
          {
            id: 'ex-ch713-1',
            type: 'multiple_choice',
            prompt: 'En ajedrez, si un Peón vale 1 punto y un Caballo o Alfil vale 3 puntos, ¿cuántos puntos vale la Dama (Reina)?',
            options: ['9 puntos', '5 puntos (eso vale la Torre)', '2 puntos'],
            correctAnswer: '9 puntos',
            hint: 'La Dama combina el movimiento de la Torre (5) y el Alfil (3), valiendo 9 puntos.',
          },
        ],
      },
      {
        id: 'l-chess-713-2',
        title: 'Nivel 2: El Ataque Doble (Tenedor) y la Clavada',
        description: 'Domina las dos tácticas más efectivas para ganar material.',
        levelNumber: 2,
        xpReward: 60,
        durationMinutes: 5,
        exercises: [
          {
            id: 'ex-ch713-2',
            type: 'multiple_choice',
            prompt: '¿Qué es una "clavada" en ajedrez?',
            options: [
              'Cuando una pieza atacada no puede moverse sin dejar descubierta a otra pieza más valiosa (como el Rey o la Dama) detrás de ella',
              'Mover dos piezas en el mismo turno',
              'Avanzar todos los peones al mismo tiempo',
            ],
            correctAnswer: 'Cuando una pieza atacada no puede moverse sin dejar descubierta a otra pieza más valiosa (como el Rey o la Dama) detrás de ella',
            hint: 'Los alfiles, torres y damas crean clavadas a lo largo de diagonales, filas o columnas.',
          },
        ],
      },
    ],
  },
  {
    id: 'prayer-7-13',
    subject: 'prayer',
    ageGroup: '7-13',
    title: 'Curso de Oración y Santo Rosario',
    subtitle: 'Padre Nuestro, Ave María, Gloria, Credo y guía de los Misterios del Rosario',
    accentColor: '#0284C7',
    lessons: [
      {
        id: 'l-pray-713-1',
        title: 'Nivel 1: Las Oraciones Fundamentales',
        description: 'Comprende el significado del Padre Nuestro, el Ave María y el Gloria.',
        levelNumber: 1,
        xpReward: 50,
        durationMinutes: 5,
        exercises: [
          {
            id: 'ex-pr713-1',
            type: 'multiple_choice',
            prompt: 'Completa esta petición del Padre Nuestro: "Perdona nuestras ofensas, como también nosotros..."',
            audioText: 'Perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden.',
            options: [
              '...perdonamos a los que nos ofenden',
              '...pedimos que nadie se equivoque',
              '...olvidamos todo sin hablar',
            ],
            correctAnswer: '...perdonamos a los que nos ofenden',
            hint: 'Jesús nos enseña a ofrecer el mismo perdón que pedimos a Dios.',
          },
        ],
      },
      {
        id: 'l-pray-713-2',
        title: 'Nivel 2: Cómo Rezar el Santo Rosario y sus Misterios',
        description: 'Descubre la estructura de cada decena y los 4 grupos de Misterios.',
        levelNumber: 2,
        xpReward: 55,
        durationMinutes: 6,
        exercises: [
          {
            id: 'ex-pr713-2',
            type: 'multiple_choice',
            prompt: '¿Qué rezamos en cada una de las 5 decenas del Santo Rosario después de anunciar el Misterio?',
            options: [
              '1 Padre Nuestro, 10 Avemarías y 1 Gloria',
              '10 Padres Nuestros y 1 Ave María',
              'Solamente el Credo 5 veces',
            ],
            correctAnswer: '1 Padre Nuestro, 10 Avemarías y 1 Gloria',
            hint: 'La cuenta grande es para el Padre Nuestro y las 10 cuentas pequeñas para las Avemarías, cerrando con el Gloria.',
          },
        ],
      },
    ],
  },

  // ==========================================
  // GRUPO 3: 14 a 18 años (8 Cursos Avanzados)
  // ==========================================
  {
    id: 'math-14-18',
    subject: 'math',
    ageGroup: '14-18',
    title: 'Matemáticas Avanzadas y Modelado',
    subtitle: 'Álgebra lineal, funciones cuadráticas, probabilidad condicional y cálculo',
    accentColor: '#38BDF8',
    lessons: [
      {
        id: 'l-math-1418-1',
        title: 'Nivel 1: Sistemas Lineales y Punto de Equilibrio',
        description: 'Resuelve funciones aplicadas a economía e ingeniería.',
        levelNumber: 1,
        xpReward: 70,
        durationMinutes: 7,
        exercises: [
          {
            id: 'ex-m1418-1',
            type: 'multiple_choice',
            prompt: 'Si la utilidad neta de un proyecto es U(x) = 15x - 300, ¿en qué valor de x se alcanza el punto de equilibrio (U(x) = 0)?',
            options: ['x = 20 unidades', 'x = 15 unidades', 'x = 30 unidades'],
            correctAnswer: 'x = 20 unidades',
            hint: '15x = 300 -> x = 300 / 15 = 20.',
          },
        ],
      },
      {
        id: 'l-math-1418-2',
        title: 'Nivel 2: Optimización Cuadrática y Derivadas',
        description: 'Determina máximos y tasas de variación instantánea.',
        levelNumber: 2,
        xpReward: 75,
        durationMinutes: 7,
        exercises: [
          {
            id: 'ex-m1418-2',
            type: 'multiple_choice',
            prompt: '¿En qué abscisa (x) alcanza su valor máximo la parábola f(x) = -x² + 8x - 7?',
            options: ['En x = 4', 'En x = 8', 'En x = -4'],
            correctAnswer: 'En x = 4',
            hint: 'El vértice se halla en x = -b / (2a) = -8 / (2 × -1) = 4.',
          },
        ],
      },
    ],
  },
  {
    id: 'orthography-14-18',
    subject: 'orthography',
    ageGroup: '14-18',
    title: 'Ortografía y Redacción Avanzada',
    subtitle: 'Tilde diacrítica, hiatos acentuales, homófonos (b/v, g/j, h, c/s/z) y puntuación',
    accentColor: '#FB923C',
    lessons: [
      {
        id: 'l-ortho-1418-1',
        title: 'Nivel 1: Tilde Diacrítica y Hiatos Acentuales',
        description: 'Distingue monosílabos homófonos (tú/tu, él/el, sí/si, más/mas, aún/aun).',
        levelNumber: 1,
        xpReward: 70,
        durationMinutes: 6,
        exercises: [
          {
            id: 'ex-or1418-1',
            type: 'multiple_choice',
            prompt: 'Elige la oración donde la tilde diacrítica y el uso de "aún / aun" están aplicados con rigor académico:',
            options: [
              'Aún no han llegado los resultados, aun cuando él insistió en que sí estarían listos.',
              'Aun no han llegado los resultados, aún cuando el insistió en que si estarían listos.',
              'Aún no han llegado los resultados, aún cuando él insistió en que si estarían listos.',
            ],
            correctAnswer: 'Aún no han llegado los resultados, aun cuando él insistió en que sí estarían listos.',
            hint: '"Aún" lleva tilde cuando equivale a "todavía", y "aun" no lleva tilde cuando equivale a "incluso / aunque".',
          },
        ],
      },
      {
        id: 'l-ortho-1418-2',
        title: 'Nivel 2: Parónimos, Homófonos (B/V, H, C/S/Z) y Puntuación',
        description: 'Domina la diferencia entre "haber / a ver", "echo / hecho", "absorber / absolver".',
        levelNumber: 2,
        xpReward: 75,
        durationMinutes: 6,
        exercises: [
          {
            id: 'ex-or1418-2',
            type: 'dictation_fill',
            prompt: 'Dictado avanzado: Selecciona la redacción ortográficamente impecable:',
            audioText: 'Vamos a ver si de hecho ha podido haber algún error en la revisión del proyecto.',
            options: [
              'Vamos a ver si, de hecho, ha podido haber algún error en la revisión.',
              'Vamos haber si, de echo, a podido a ver algún error en la revición.',
              'Vamos a ver si, de echo, ha podido haber algún error en la revisión.',
            ],
            correctAnswer: 'Vamos a ver si, de hecho, ha podido haber algún error en la revisión.',
            hint: '"A ver" es preposición + infinitivo; "de hecho" proviene del verbo hacer (con H); "haber" es el infinitivo auxiliar.',
          },
        ],
      },
    ],
  },
  {
    id: 'finance-14-18',
    subject: 'finance',
    ageGroup: '14-18',
    title: 'Finanzas Personales e Inversión',
    subtitle: 'Interés compuesto, inflación, regla 50/30/20 y fondos indexados',
    accentColor: '#34D399',
    lessons: [
      {
        id: 'l-fin-1418-1',
        title: 'Nivel 1: Interés Compuesto vs. Inflación Real',
        description: 'Calcula el rendimiento real de tus inversiones a largo plazo.',
        levelNumber: 1,
        xpReward: 75,
        durationMinutes: 7,
        exercises: [
          {
            id: 'ex-f1418-1',
            type: 'multiple_choice',
            prompt: 'Si inviertes $1,000 al 10% anual con capitalización compuesta, ¿cuánto tendrás al finalizar el segundo año?',
            options: ['$1,210', '$1,200', '$1,110'],
            correctAnswer: '$1,210',
            hint: 'Año 1: $1,100. Año 2: $1,100 × 1.10 = $1,210.',
          },
        ],
      },
    ],
  },
  {
    id: 'drawing-14-18',
    subject: 'drawing',
    ageGroup: '14-18',
    title: 'Dibujo Realista: Anatomía y Chiaroscuro',
    subtitle: 'Proporciones del canon clásico, valores tonales y perspectiva oblicua',
    accentColor: '#FB7185',
    lessons: [
      {
        id: 'l-draw-1418-1',
        title: 'Nivel 1: Estudio de Volumen, Penumbra y Luz Reflejada',
        description: 'Domina las 5 zonas tonales del claroscuro académico.',
        levelNumber: 1,
        xpReward: 80,
        durationMinutes: 8,
        exercises: [
          {
            id: 'ex-d1418-1',
            type: 'drawing_studio',
            prompt: 'Estudio Académico: Claroscuro y Proporción Anatómica',
            subtitle: 'Practica el bloqueo de planos geométricos y la transición de medios tonos en el lienzo.',
            hint: 'Observa la luz reflejada en el borde inferior de la sombra propia.',
            drawingSteps: [
              {
                stepNumber: 1,
                title: '1. Construcción de Planos (Método Loomis)',
                instruction: 'Empieza con una esfera craneal y corta los planos laterales antes de situar la línea de las cejas.',
                svgGuideType: 'portrait_proportions',
              },
              {
                stepNumber: 2,
                title: '2. Línea del Terminador (Frontera Luz / Sombra)',
                instruction: 'Define con precisión el terminador donde la luz directa deja de incidir sobre el volumen.',
                svgGuideType: 'sphere_shading',
              },
              {
                stepNumber: 3,
                title: '3. Medios Tonos y Luz Reflejada',
                instruction: 'Construye el degradado con achurado cruzado respetando la luz reflejada.',
                svgGuideType: 'eye_structure',
              },
              {
                stepNumber: 4,
                title: '4. Sombra Proyectada y Oclusión',
                instruction: 'Aplica el grafito 6B únicamente en las zonas de oclusión.',
                svgGuideType: 'perspective_cube',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'entrepreneur-14-18',
    subject: 'entrepreneurship',
    ageGroup: '14-18',
    title: 'Emprendimiento, Startups y Estrategia',
    subtitle: 'Lean Canvas, validación de MVP, Unit Economics (CAC vs LTV) y liderazgo',
    accentColor: '#A78BFA',
    lessons: [
      {
        id: 'l-ent-1418-1',
        title: 'Nivel 1: Unit Economics — CAC vs. LTV',
        description: 'Evalúa si el modelo de negocio de una startup es sostenible y escalable.',
        levelNumber: 1,
        xpReward: 75,
        durationMinutes: 7,
        exercises: [
          {
            id: 'ex-e1418-1',
            type: 'multiple_choice',
            prompt: 'Si el Costo de Adquisición de Cliente (CAC) es $25 y el Valor de Vida del Cliente (LTV) es $100, ¿qué indica el ratio LTV:CAC de 4:1?',
            options: [
              'Que el modelo es rentable y escalable: cada cliente genera 4 veces lo que cuesta adquirirlo',
              'Que la empresa pierde $75 por cliente',
              'Que el costo de marketing supera los ingresos',
            ],
            correctAnswer: 'Que el modelo es rentable y escalable: cada cliente genera 4 veces lo que cuesta adquirirlo',
            hint: 'Un ratio LTV:CAC >= 3:1 es señal de buena salud financiera en una startup.',
          },
        ],
      },
    ],
  },
  {
    id: 'piano-14-18',
    subject: 'piano',
    ageGroup: '14-18',
    title: 'Piano: Armonía e Interpretación',
    subtitle: 'Intervalos, acordes triada, progresiones armónicas y lectura en teclado',
    accentColor: '#FBBF24',
    lessons: [
      {
        id: 'l-piano-1418-1',
        title: 'Nivel 1: Arpegio de Do Mayor y Octava Superior',
        description: 'Interpreta el arpegio completo de la triada mayor (Do - Mi - Sol - Do+).',
        levelNumber: 1,
        xpReward: 80,
        durationMinutes: 7,
        exercises: [
          {
            id: 'ex-p1418-1',
            type: 'piano_melody',
            prompt: 'Interpreta en el teclado el Arpegio Mayor Ascendente y Descendente: Do - Mi - Sol - Do+ - Sol',
            subtitle: 'Toca la primera, tercera, quinta y octava justa del acorde de Do Mayor.',
            targetNotes: ['C4', 'E4', 'G4', 'C5', 'G4'],
            hint: 'Pulsa C4 (Do), E4 (Mi), G4 (Sol), C5 (Do agudo) y regresa a G4 (Sol).',
          },
        ],
      },
    ],
  },
  {
    id: 'chess-course-14-18',
    subject: 'chess_course',
    ageGroup: '14-18',
    title: 'Ajedrez Estratégico y Aperturas',
    subtitle: 'Teoría de aperturas, estructuras de peones, sacrificios tácticos y finales',
    accentColor: '#2DD4BF',
    lessons: [
      {
        id: 'l-chess-1418-1',
        title: 'Nivel 1: Apertura Italiana, Ruy López y Defensa Siciliana',
        description: 'Comprende las ideas estratégicas detrás de las aperturas de élite.',
        levelNumber: 1,
        xpReward: 75,
        durationMinutes: 6,
        exercises: [
          {
            id: 'ex-ch1418-1',
            type: 'multiple_choice',
            prompt: 'En la Apertura Italiana (1.e4 e5 2.Cf3 Cc6 3.Ac4), ¿por qué el alfil blanco se coloca en c4?',
            options: [
              'Porque apunta directamente al punto más vulnerable del campo negro al inicio: el peón f7 (defendido solo por el Rey)',
              'Porque busca cambiar el alfil por un peón lateral en a6',
              'Para bloquear la salida de su propio peón d2',
            ],
            correctAnswer: 'Porque apunta directamente al punto más vulnerable del campo negro al inicio: el peón f7 (defendido solo por el Rey)',
            hint: 'La diagonal a2-g8 presiona directamente sobre f7.',
          },
        ],
      },
    ],
  },
  {
    id: 'prayer-14-18',
    subject: 'prayer',
    ageGroup: '14-18',
    title: 'Oración, Reflexión y Santo Rosario',
    subtitle: 'Sentido teológico de las oraciones clásicas y contemplación de los Misterios',
    accentColor: '#60A5FA',
    lessons: [
      {
        id: 'l-pray-1418-1',
        title: 'Nivel 1: Estructura Bíblica y Contemplativa del Santo Rosario',
        description: 'Conoce las raíces evangélicas de los Misterios Gozosos, Luminosos, Dolorosos y Gloriosos.',
        levelNumber: 1,
        xpReward: 70,
        durationMinutes: 6,
        exercises: [
          {
            id: 'ex-pr1418-1',
            type: 'multiple_choice',
            prompt: '¿Qué etapa de la vida de Cristo se medita específicamente en los cinco Misterios Luminosos del Santo Rosario?',
            options: [
              'Su vida pública: desde el Bautismo en el Jordán hasta la institución de la Eucaristía',
              'Exclusivamente su infancia en Nazaret',
              'Los hechos posteriores a Pentecostés',
            ],
            correctAnswer: 'Su vida pública: desde el Bautismo en el Jordán hasta la institución de la Eucaristía',
            hint: 'Fueron incorporados para contemplar los momentos clave de la vida pública del Señor.',
          },
        ],
      },
    ],
  },
];

export const STORYBOOKS_DATA: StoryBook[] = [
  // ========================================================
  // ETAPA 3 A 6 AÑOS (ESPECIAL 4 A 6 AÑOS - APRENDIENDO A LEER)
  // Cuentos infantiles en ESPAÑOL CON ILUSTRACIONES Y DIBUJITOS en cada página
  // ========================================================
  {
    id: 'book-dragon',
    title: 'El Dragón que Aprendió a Leer',
    author: 'Elena Montes',
    language: 'es',
    hasIllustrations: true,
    recommendedAges: ['3-6'],
    ageBadge: '3 a 6 años · Español con Dibujitos',
    durationLabel: '3 min · Ilustrado + Voz en Español',
    xpReward: 40,
    coverTheme: 'dragon',
    summary: 'Chispita no lanzaba fuego por la boca: ¡lanzaba letras doradas cada vez que abría un cuento ilustrado!',
    pages: [
      {
        pageNumber: 1,
        sceneTheme: 'dragon_meadow',
        caption: 'Ilustración 1: Chispita en el valle de los robles gigantes',
        text: 'En un valle verde vivía Chispita, un pequeño dragón esmeralda con gafas redondas. Mientras otros dragones practicaban rugidos fuertes, Chispita prefería escuchar el canto de los pájaros.',
      },
      {
        pageNumber: 2,
        sceneTheme: 'dragon_library',
        caption: 'Ilustración 2: El libro dorado bajo el gran árbol',
        text: 'Un día encontró un libro brillante debajo de un roble. Al juntar las letras M y A, leyó en voz alta: "¡MA-GIA!". De pronto, pequeñas estrellas de luz salieron flotando de las páginas.',
      },
      {
        pageNumber: 3,
        sceneTheme: 'dragon_stars',
        caption: 'Ilustración 3: Todos los amigos leyendo juntos al atardecer',
        text: 'Chispita invitó a todos los animalitos del bosque a leer con él. Descubrieron que cada palabra nueva abría un mundo de aventuras maravillosas.',
      },
    ],
    comprehensionQuestion: {
      question: '¿Qué salía de las páginas cuando Chispita leía en voz alta?',
      options: ['Estrellas de luz mágica', 'Nubes de lluvia fría', 'Piedras pesadas'],
      correctOption: 'Estrellas de luz mágica',
    },
  },
  {
    id: 'book-space',
    title: 'Valeria y el Planeta de los Números',
    author: 'Dr. Mateo Solís',
    language: 'es',
    hasIllustrations: true,
    recommendedAges: ['3-6'],
    ageBadge: '3 a 6 años · Español con Dibujitos',
    durationLabel: '4 min · Ilustrado + Voz en Español',
    xpReward: 45,
    coverTheme: 'space',
    summary: 'Acompaña a la pequeña astronauta Valeria a contar las lunas de colores y leer carteles estelares.',
    pages: [
      {
        pageNumber: 1,
        sceneTheme: 'space_launch',
        caption: 'Ilustración 1: El despegue del cohete Solar-7',
        text: 'Tres, dos, uno... ¡Despegue! Valeria ajustó su casco espacial y miró por la ventana redonda cómo la Tierra brillaba como una canica azul en el espacio.',
      },
      {
        pageNumber: 2,
        sceneTheme: 'space_planets',
        caption: 'Ilustración 2: Los anillos musicales de Saturno',
        text: 'Al llegar cerca de Saturno, Valeria contó cinco lunas plateadas que giraban en armonía. Cada luna emitía una nota musical como un piano gigante en el cosmos.',
      },
    ],
    comprehensionQuestion: {
      question: '¿Cuántas lunas plateadas contó Valeria cerca de Saturno?',
      options: ['Cinco lunas plateadas', 'Veinte soles rojos', 'Una sola nube'],
      correctOption: 'Cinco lunas plateadas',
    },
  },
  {
    id: 'book-vowels-kitten',
    title: 'Milo y las Cinco Vocales Cantarinas',
    author: 'Sofía Alarcón',
    language: 'es',
    hasIllustrations: true,
    recommendedAges: ['3-6'],
    ageBadge: '4 a 6 años · Español con Dibujitos',
    durationLabel: '3 min · Ilustrado + Voz en Español',
    xpReward: 40,
    coverTheme: 'forest',
    summary: 'El gatito Milo descubre cómo suenan la A, E, I, O, U siguiendo las huellas de colores en el jardín.',
    pages: [
      {
        pageNumber: 1,
        sceneTheme: 'forest_band',
        caption: 'Ilustración 1: Milo encuentra la campana de la letra A y la E',
        text: 'Milo caminaba por el jardín cuando vio una Abeja amarilla que cantaba "¡A-A-A!" y un Elefante pequeño que tocaba la trompeta diciendo "¡E-E-E!".',
      },
      {
        pageNumber: 2,
        sceneTheme: 'dragon_meadow',
        caption: 'Ilustración 2: La Isla de la I, el Oso de la O y las Uvas de la U',
        text: 'Junto al río saludó a una Iguana sonriente con la I, abrazó a un Oso bondadoso con la O y compartió dulces Uvas moradas con la U. ¡Ya sabía leer las cinco vocales!',
      },
    ],
    comprehensionQuestion: {
      question: '¿Qué fruta morada compartió Milo al aprender la vocal U?',
      options: ['Uvas moradas', 'Manzanas verdes', 'Limones amarillos'],
      correctOption: 'Uvas moradas',
    },
  },
  {
    id: 'book-syllable-forest',
    title: 'El Tren de las Sílabas Brillantes',
    author: 'Lucas Ribera',
    language: 'es',
    hasIllustrations: true,
    recommendedAges: ['3-6'],
    ageBadge: '4 a 6 años · Español con Dibujitos',
    durationLabel: '4 min · Ilustrado + Voz en Español',
    xpReward: 45,
    coverTheme: 'dragon',
    summary: 'Un trencito de madera une vagones con MA, PA, SO y LU para formar las primeras palabras completas.',
    pages: [
      {
        pageNumber: 1,
        sceneTheme: 'dragon_library',
        caption: 'Ilustración 1: La estación de madera de las sílabas',
        text: 'Cada mañana, el trencito de colores enganchaba dos vagones con letras grandes. Cuando unió el vagón CA con el vagón SA, sonó la campana y apareció la palabra CASA.',
      },
      {
        pageNumber: 2,
        sceneTheme: 'dragon_stars',
        caption: 'Ilustración 2: El puente iluminado de la LUNA',
        text: 'Por la noche, el maquinista juntó el vagón LU con el vagón NA. Al instante, la LUNA llena iluminó todo el bosque para que los niños leyeran felices antes de dormir.',
      },
    ],
    comprehensionQuestion: {
      question: '¿Qué palabra se formó cuando el trencito unió los vagones LU y NA?',
      options: ['LUNA', 'MESA', 'PATO'],
      correctOption: 'LUNA',
    },
  },

  // ========================================================
  // ETAPAS MAYORES: 7 A 13 AÑOS Y 14 A 18 AÑOS
  // Cuentos e Historias en INGLÉS (English Stories) SIN DIBUJOS NI ILUSTRACIONES
  // Formato libro limpio de solo texto con capítulos/páginas y vocabulario traducible al tocar
  // ========================================================
  {
    id: 'en-book-clockwork-tower',
    title: 'The Mystery of Clockwork Tower',
    author: 'Arthur Pendelton',
    language: 'en',
    hasIllustrations: false,
    recommendedAges: ['7-13', '14-18'],
    ageBadge: '7 a 18 años · English Story (Sin Ilustraciones)',
    durationLabel: '5 min · Clean Text Reader + English Audio',
    xpReward: 60,
    coverTheme: 'space',
    summary: 'Clean text English chapter story: Leo and Maya investigate an ancient brass clock tower whose gears only turn when spoken to in riddles.',
    pages: [
      {
        pageNumber: 1,
        chapterTitle: 'Chapter 1: The Silent Gears of Oakhaven',
        caption: 'Reading Practice · Tap any highlighted word below to see its Spanish meaning',
        text: 'For fifty years, the great brass clock at the center of Oakhaven stood completely silent. Twelve-year-old Leo climbed the spiral staircase carrying a leather notebook and a small brass lantern. Dust covered the massive gears, yet a faint whisper echoed through the chamber whenever the wind blew from the north.',
        vocabulary: [
          {
            word: 'staircase',
            translationEs: 'escalera',
            phonetic: '/ˈsteər.keɪs/',
            example: 'Leo climbed the spiral staircase carefully.',
          },
          {
            word: 'lantern',
            translationEs: 'linterna / farol',
            phonetic: '/ˈlæn.tərn/',
            example: 'He held a small brass lantern in the dark.',
          },
          {
            word: 'gears',
            translationEs: 'engranajes',
            phonetic: '/ɡɪərz/',
            example: 'The massive gears of the clock began to move.',
          },
          {
            word: 'whisper',
            translationEs: 'susurro',
            phonetic: '/ˈwɪs.pər/',
            example: 'A faint whisper echoed through the room.',
          },
        ],
      },
      {
        pageNumber: 2,
        chapterTitle: 'Chapter 2: The Inscription on the Pendulum',
        caption: 'Reading Practice · Clean Text Edition (No Illustrations)',
        text: 'Behind the pendulum, Maya discovered a silver plate engraved with four English words: "Knowledge unlocks every hour." When she read the sentence aloud with clear pronunciation, the pendulum swung forward and a chime rang across the entire valley, reminding the townspeople that curiosity never sleeps.',
        vocabulary: [
          {
            word: 'pendulum',
            translationEs: 'péndulo',
            phonetic: '/ˈpen.dʒə.ləm/',
            example: 'The heavy pendulum swung from left to right.',
          },
          {
            word: 'engraved',
            translationEs: 'grabado / tallado',
            phonetic: '/ɪnˈɡreɪvd/',
            example: 'The silver plate was engraved with a message.',
          },
          {
            word: 'knowledge',
            translationEs: 'conocimiento',
            phonetic: '/ˈnɒl.ɪdʒ/',
            example: 'Knowledge unlocks every hour.',
          },
          {
            word: 'curiosity',
            translationEs: 'curiosidad',
            phonetic: '/ˌkjʊə.riˈɒs.ə.ti/',
            example: 'Curiosity helped them solve the mystery.',
          },
        ],
      },
    ],
    comprehensionQuestion: {
      question: 'What was engraved on the silver plate behind the pendulum?',
      options: [
        '"Knowledge unlocks every hour."',
        '"Gold is hidden under the floor."',
        '"Never climb the tower at night."',
      ],
      correctOption: '"Knowledge unlocks every hour."',
    },
  },
  {
    id: 'en-book-northern-stars',
    title: 'Journey Across the Northern Stars',
    author: 'Clara Vance',
    language: 'en',
    hasIllustrations: false,
    recommendedAges: ['7-13', '14-18'],
    ageBadge: '7 a 18 años · English Story (Sin Ilustraciones)',
    durationLabel: '6 min · Clean Text Reader + English Audio',
    xpReward: 65,
    coverTheme: 'dragon',
    summary: 'Clean text English chapter story: A young navigator uses constellations and mathematics to guide a research vessel through the Arctic night.',
    pages: [
      {
        pageNumber: 1,
        chapterTitle: 'Chapter 1: Beneath the Aurora',
        caption: 'English Reading Comprehension · Text-Only Format',
        text: 'The research vessel Polaris glided quietly between floating sheets of silver ice. On the bridge, Elena adjusted her brass compass and looked up at the clear winter sky. Without modern satellites during the magnetic storm, she relied on ancient constellations to calculate their exact latitude.',
        vocabulary: [
          {
            word: 'vessel',
            translationEs: 'embarcación / navío',
            phonetic: '/ˈves.əl/',
            example: 'The research vessel sailed through the cold sea.',
          },
          {
            word: 'compass',
            translationEs: 'brújula',
            phonetic: '/ˈkʌm.pəs/',
            example: 'Elena checked her compass before turning north.',
          },
          {
            word: 'constellations',
            translationEs: 'constelaciones',
            phonetic: '/ˌkɒn.stəˈleɪ.ʃənz/',
            example: 'Ancient constellations guided sailors for centuries.',
          },
          {
            word: 'relied',
            translationEs: 'confió / dependió',
            phonetic: '/rɪˈlaɪd/',
            example: 'She relied on mathematics and the stars.',
          },
        ],
      },
      {
        pageNumber: 2,
        chapterTitle: 'Chapter 2: The Harbor of Lights',
        caption: 'English Reading Comprehension · Text-Only Format',
        text: 'By measuring the angle of the North Star above the horizon, Elena steered the crew safely toward the sheltered harbor before dawn. The captain praised her perseverance and calm judgment under pressure.',
        vocabulary: [
          {
            word: 'horizon',
            translationEs: 'horizonte',
            phonetic: '/həˈraɪ.zən/',
            example: 'The star shone brightly above the horizon.',
          },
          {
            word: 'harbor',
            translationEs: 'puerto',
            phonetic: '/ˈhɑː.bər/',
            example: 'The ship arrived at the sheltered harbor.',
          },
          {
            word: 'perseverance',
            translationEs: 'perseverancia / constancia',
            phonetic: '/ˌpɜː.sɪˈvɪə.rəns/',
            example: 'Her perseverance saved the expedition.',
          },
          {
            word: 'judgment',
            translationEs: 'juicio / criterio',
            phonetic: '/ˈdʒʌdʒ.mənt/',
            example: 'Good judgment is essential in difficult moments.',
          },
        ],
      },
    ],
    comprehensionQuestion: {
      question: 'How did Elena guide the research vessel during the magnetic storm?',
      options: [
        'By measuring the angle of the North Star and reading constellations',
        'By following a flock of seabirds in the fog',
        'By waiting three weeks until summer arrived',
      ],
      correctOption: 'By measuring the angle of the North Star and reading constellations',
    },
  },
  {
    id: 'en-book-harbor-inventors',
    title: 'The Young Inventors of Harbor Street',
    author: 'Marcus Sterling',
    language: 'en',
    hasIllustrations: false,
    recommendedAges: ['7-13', '14-18'],
    ageBadge: '7 a 18 años · English Story (Sin Ilustraciones)',
    durationLabel: '6 min · Clean Text Reader + English Audio',
    xpReward: 65,
    coverTheme: 'forest',
    summary: 'Clean text English chapter story: Three friends turn a small garage workshop into a clean-energy enterprise that powers their neighborhood library.',
    pages: [
      {
        pageNumber: 1,
        chapterTitle: 'Chapter 1: A Blueprint on the Chalkboard',
        caption: 'English Reading Comprehension · Text-Only Format',
        text: 'Every afternoon after school, Samuel, Nora, and Tariq met in a brick workshop on Harbor Street. They sketched a detailed blueprint for a wind turbine made from recycled aluminum bicycles. Although their budget was tiny, they kept careful financial records of every bolt and copper wire.',
        vocabulary: [
          {
            word: 'workshop',
            translationEs: 'taller',
            phonetic: '/ˈwɜːk.ʃɒp/',
            example: 'They built the prototype inside the workshop.',
          },
          {
            word: 'blueprint',
            translationEs: 'plano / diseño técnico',
            phonetic: '/ˈbluː.prɪnt/',
            example: 'Nora drew a precise blueprint on the board.',
          },
          {
            word: 'budget',
            translationEs: 'presupuesto',
            phonetic: '/ˈbʌdʒ.ɪt/',
            example: 'They managed their small budget wisely.',
          },
          {
            word: 'recycled',
            translationEs: 'reciclado',
            phonetic: '/ˌriːˈsaɪ.kəld/',
            example: 'They used recycled aluminum parts.',
          },
        ],
      },
      {
        pageNumber: 2,
        chapterTitle: 'Chapter 2: Powering the Community',
        caption: 'English Reading Comprehension · Text-Only Format',
        text: 'When the coastal breeze spun the blades for the first time, the reading lamps inside the neighborhood library glowed with steady light. Local shopkeepers were so impressed by their enterprise that they funded three more turbines for the town square.',
        vocabulary: [
          {
            word: 'breeze',
            translationEs: 'brisa',
            phonetic: '/briːz/',
            example: 'A strong coastal breeze turned the turbine.',
          },
          {
            word: 'steady',
            translationEs: 'constante / estable',
            phonetic: '/ˈsted.i/',
            example: 'The lamps produced a steady warm light.',
          },
          {
            word: 'enterprise',
            translationEs: 'emprendimiento / iniciativa',
            phonetic: '/ˈen.tə.praɪz/',
            example: 'Their student enterprise inspired the whole town.',
          },
          {
            word: 'funded',
            translationEs: 'financiaron / patrocinaron',
            phonetic: '/ˈfʌn.dɪd/',
            example: 'Neighbors funded three additional turbines.',
          },
        ],
      },
    ],
    comprehensionQuestion: {
      question: 'What did the young inventors build using recycled aluminum parts?',
      options: [
        'A wind turbine that powered the neighborhood library',
        'A submarine for deep ocean exploration',
        'A steam locomotive for the city railway',
      ],
      correctOption: 'A wind turbine that powered the neighborhood library',
    },
  },
  {
    id: 'en-book-ravenwood-algorithm',
    title: 'The Secret Algorithm of Ravenwood',
    author: 'Dr. Hannah Brooks',
    language: 'en',
    hasIllustrations: false,
    recommendedAges: ['7-13', '14-18'],
    ageBadge: '10 a 18 años · English Story (Sin Ilustraciones)',
    durationLabel: '7 min · Clean Text Reader + English Audio',
    xpReward: 70,
    coverTheme: 'space',
    summary: 'Clean text English chapter story: A student chess champion discovers a notebook of logical patterns that connects music, cryptography, and strategy.',
    pages: [
      {
        pageNumber: 1,
        chapterTitle: 'Chapter 1: Patterns on the Chessboard',
        caption: 'English Reading Comprehension · Text-Only Format',
        text: 'During the regional chess tournament at Ravenwood Academy, sixteen-year-old Daniel noticed an unusual sequence of moves in his opponent’s opening strategy. Each knight jump mirrored the rhythm of a classical piano sonata, creating a strong defensive fortress across the center squares.',
        vocabulary: [
          {
            word: 'tournament',
            translationEs: 'torneo',
            phonetic: '/ˈtʊə.nə.mənt/',
            example: 'Daniel competed in the regional chess tournament.',
          },
          {
            word: 'sequence',
            translationEs: 'secuencia',
            phonetic: '/ˈsiː.kwəns/',
            example: 'He analyzed the sequence of moves carefully.',
          },
          {
            word: 'rhythm',
            translationEs: 'ritmo',
            phonetic: '/ˈrɪð.əm/',
            example: 'The moves followed the rhythm of a sonata.',
          },
          {
            word: 'fortress',
            translationEs: 'fortaleza',
            phonetic: '/ˈfɔː.trəs/',
            example: 'The pawns formed an unbreakable fortress.',
          },
        ],
      },
      {
        pageNumber: 2,
        chapterTitle: 'Chapter 2: Thinking Three Moves Ahead',
        caption: 'English Reading Comprehension · Text-Only Format',
        text: 'Instead of rushing into a reckless attack, Daniel remained patient and calculated three moves ahead. By sacrificing a bishop to open the seventh rank, he achieved checkmate and learned that discipline is stronger than haste.',
        vocabulary: [
          {
            word: 'reckless',
            translationEs: 'imprudente / precipitado',
            phonetic: '/ˈrek.ləs/',
            example: 'He avoided making a reckless move.',
          },
          {
            word: 'calculated',
            translationEs: 'calculó',
            phonetic: '/ˈkæl.kjə.leɪ.tɪd/',
            example: 'Daniel calculated three moves ahead.',
          },
          {
            word: 'achieved',
            translationEs: 'logró / alcanzó',
            phonetic: '/əˈtʃiːvd/',
            example: 'He achieved victory through patience.',
          },
          {
            word: 'haste',
            translationEs: 'prisa / apresuramiento',
            phonetic: '/heɪst/',
            example: 'Discipline is always stronger than haste.',
          },
        ],
      },
    ],
    comprehensionQuestion: {
      question: 'What lesson did Daniel learn during the chess tournament at Ravenwood Academy?',
      options: [
        'That patience and discipline are stronger than haste',
        'That attacking without a plan always wins quickly',
        'That knights should never leave the back rank',
      ],
      correctOption: 'That patience and discipline are stronger than haste',
    },
  },
];

/**
 * Devuelve los libros correspondientes a la edad del usuario:
 * - 3 a 6 años: Cuentos infantiles en español CON ilustraciones y dibujitos (nunca 0).
 * - 7 a 13 y 14 a 18 años: Cuentos e historias en inglés SIN ilustraciones ni dibujitos (nunca 0).
 */
export function getBooksForAgeGroup(ageGroup: AgeGroup): StoryBook[] {
  if (ageGroup === '3-6') {
    return STORYBOOKS_DATA.filter(
      (b) => b.language === 'es' && b.hasIllustrations
    );
  }
  return STORYBOOKS_DATA.filter(
    (b) => b.language === 'en' && !b.hasIllustrations
  );
}

export const ALL_MEDALS_CATALOG: MedalCatalogItem[] = [
  {
    id: 'medal-first-lesson',
    title: 'Primer Paso Brillante',
    description: 'Completa tu primera lección en la plataforma.',
    requirementText: 'Completar 1 lección',
    category: 'general',
    iconName: 'flame',
  },
  {
    id: 'medal-reader',
    title: 'Explorador de Cuentos',
    description: 'Lee y responde un libro completo en la Biblioteca.',
    requirementText: 'Completar 1 libro ilustrado',
    category: 'general',
    iconName: 'book',
  },
  {
    id: 'medal-orthography',
    title: 'Pluma Impecable',
    description: 'Supera una lección del curso de Ortografía sin faltas.',
    requirementText: 'Completar lección de Ortografía',
    category: 'orthography',
    iconName: 'sparkles',
  },
  {
    id: 'medal-chess-tactician',
    title: 'Estratega del Tablero',
    description: 'Completa una lección de Ajedrez o vence al Bot.',
    requirementText: 'Ganar partida o lección de Ajedrez',
    category: 'chess',
    iconName: 'trophy',
  },
  {
    id: 'medal-prayer-peace',
    title: 'Corazón en Paz',
    description: 'Completa una lección del Curso de Oración o guía del Rosario.',
    requirementText: 'Completar lección de Oración / Rosario',
    category: 'prayer',
    iconName: 'shield',
  },
  {
    id: 'medal-routines-gems',
    title: 'Constancia de Diamante',
    description: 'Completa una rutina diaria y gana tus primeras 5 gemas.',
    requirementText: 'Completar 1 rutina diaria',
    category: 'routines',
    iconName: 'coins',
  },
  {
    id: 'medal-graduado-g1',
    title: 'Graduado de Lectura y Ajedrez',
    description: 'Completaste el curso de Aprender a Leer y Ajedrez Básico para pasar a la nueva etapa.',
    requirementText: 'Completar Lectura + Ajedrez Inicial',
    category: 'general',
    iconName: 'trophy',
  },
];

