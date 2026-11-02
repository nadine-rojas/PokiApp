export type AgeGroup = '3-6' | '7-13' | '14-18';

export type FriendshipStatus = 'accepted' | 'pending_sent' | 'pending_received' | 'blocked';

export type CourseSubject =
  | 'reading'
  | 'math'
  | 'finance'
  | 'drawing'
  | 'entrepreneurship'
  | 'piano'
  | 'orthography'
  | 'chess_course'
  | 'prayer';

export type NavTabId =
  | 'learn'
  | 'library'
  | 'chess'
  | 'routines'
  | 'games'
  | 'friends'
  | 'profile'
  | 'shop';

export type ChildMood = 'happy' | 'excited' | 'calm' | 'curious' | 'focused';

export type ShopCategoryTab = 'boards' | 'pieces' | 'coaches' | 'avatars';

export interface RoutineItem {
  id: string;
  title: string;
  time: string;
  category: string;
  completedToday: boolean;
}

export interface UserProfile {
  id: string;
  friendCode: string;
  username: string;
  name: string;
  age: number;
  ageGroup: AgeGroup;
  avatarId: string;
  unlockedAvatarIds: string[];
  selectedBoardId: string;
  unlockedBoardIds: string[];
  selectedPiecesId: string;
  unlockedPiecesIds: string[];
  selectedCoachId: string;
  unlockedCoachIds: string[];
  wallpaperId: string;
  xp: number;
  chessXp: number;
  gems: number;
  streak: number;
  completedLessonIds: string[];
  completedChessLessonIds: string[];
  completedBookIds: string[];
  unlockedMedalIds: string[];
  routines: RoutineItem[];
  allowedSubjects: CourseSubject[];
  parentEmail: string;
  parentPin: string;
  parentAuthMethod?: 'email' | 'google' | 'apple';
  parentalChatApproved: boolean;
  parentalFriendsApproved: boolean;
  mood?: ChildMood;
}

export interface ModerationResult {
  allowed: boolean;
  sanitizedText: string;
  reason?: string;
  isCriticalGrooming?: boolean;
  autoBlockAndExpelSender?: boolean;
  violationCategory?: 'photo_request' | 'address_location' | 'school_info' | 'phone_contact' | 'social_media' | 'in_person_meetup' | 'profanity';
}

export interface FacialAgeVerificationResult {
  allowed: boolean;
  faceDetected: boolean;
  estimatedAge: number | null;
  estimatedAgeRange: string;
  isMinorUnder18: boolean;
  isAdultOver18: boolean;
  alertTitle?: string;
  reason: string;
}

export interface ImageSafetyScanResult {
  allowed: boolean;
  containsPersonOrFace: boolean;
  detectedCategory: 'safe_drawing' | 'safe_homework' | 'safe_gif' | 'real_person_or_child_blocked';
  reason: string;
}

export interface SafeKidsGifItem {
  id: string;
  title: string;
  tag: string;
  bgGradient: string;
  accentColor: string;
  caption: string;
}

export const ANTI_CHILD_PHOTO_LEGAL_MESSAGE =
  'Bloqueado por seguridad: Por leyes de protección infantil está prohibido subir fotos reales de niños o personas. Solo puedes compartir dibujos de tus cursos, capturas de tareas o GIFs';

export const SAFE_KIDS_GIFS: SafeKidsGifItem[] = [
  {
    id: 'gif_star_dance',
    title: 'Estrella Súper Brillante',
    tag: '¡Genial!',
    bgGradient: 'from-[#A594F9] to-[#7C69EF]',
    accentColor: '#FDE047',
    caption: '★ ¡Súper Estrella! ★',
  },
  {
    id: 'gif_heart_cheer',
    title: 'Corazón Amigable',
    tag: 'Amistad',
    bgGradient: 'from-[#FF9EBB] to-[#F43F5E]',
    accentColor: '#FFE4E6',
    caption: '♥ ¡Qué buena onda! ♥',
  },
  {
    id: 'gif_chess_crown',
    title: 'Jaque Mate Campeón',
    tag: 'Ajedrez',
    bgGradient: 'from-[#34D399] to-[#059669]',
    accentColor: '#FEF08A',
    caption: '♔ ¡Buena partida! ♔',
  },
  {
    id: 'gif_rocket_boost',
    title: 'Cohete a la Meta',
    tag: 'Éxito',
    bgGradient: 'from-[#60A5FA] to-[#4F46E5]',
    accentColor: '#BEF264',
    caption: '🚀 ¡Rumbo al Nivel 10! 🚀',
  },
  {
    id: 'gif_art_palette',
    title: 'Artista Creativo',
    tag: 'Dibujo',
    bgGradient: 'from-[#FBBF24] to-[#EA580C]',
    accentColor: '#FFFBEB',
    caption: '🎨 ¡Arte Increíble! 🎨',
  },
  {
    id: 'gif_piano_music',
    title: 'Ritmo Musical',
    tag: 'Piano',
    bgGradient: 'from-[#C084FC] to-[#9333EA]',
    accentColor: '#F5D0FE',
    caption: '♪ ¡Gran Melodía! ♫',
  },
];

export interface LessonRewardSummary {
  xpEarned: number;
  gemsEarned: number;
  accuracyPercent: number;
  streakBonusXp: number;
  passed: boolean;
  headline: string;
  subtext: string;
}

/**
 * Detector automático de grupo según la edad registrada por el padre/tutor:
 * - Grupo 1: 3 a 6 años
 * - Grupo 2: 7 a 13 años
 * - Grupo 3: 14 a 18 años
 */
export function getAgeGroup(age: number): AgeGroup {
  const clamped = Math.max(3, Math.min(18, Math.round(age)));
  if (clamped <= 6) return '3-6';
  if (clamped <= 13) return '7-13';
  return '14-18';
}

/**
 * Determina si el niño pertenece al catálogo de avatares para menores de 9 años (< 9)
 * o de 9 años en adelante (>= 9).
 */
export function getAvatarAgeTier(age: number): 'under_9' | '9_plus' {
  return age < 9 ? 'under_9' : '9_plus';
}

/**
 * La sección "Rutinas / Horario de Lecciones" (Schedule / Learning Plan) está disponible
 * en celular y computadora, y otorga +5 gemas por cada rutina o hábito completado.
 */
export function canAccessRoutines(age: number): boolean {
  return age >= 3;
}

/**
 * El chat está desactivado y oculto mientras el niño esté en el Grupo 1 (3 a 6 años, aprendiendo a leer).
 * En los juegos, el Grupo 1 solo puede enviar reacciones con emojis.
 */
export function isChatEnabledForGroup(ageGroup: AgeGroup): boolean {
  return ageGroup !== '3-6';
}

/**
 * Devuelve el avatar básico inicial gratis según la edad o el grupo de edad.
 */
export function getInitialAvatarForAgeGroup(ageGroup: AgeGroup, age?: number): string {
  const effectiveAge =
    age !== undefined ? age : ageGroup === '3-6' ? 5 : ageGroup === '7-13' ? 10 : 15;
  if (effectiveAge < 9) {
    return 'u9_bmo_console';
  }
  return 'p9_flower_crown_boy';
}

/**
 * Devuelve las materias disponibles por defecto para cada grupo de edad.
 */
export function getDefaultSubjectsForAgeGroup(ageGroup: AgeGroup): CourseSubject[] {
  if (ageGroup === '3-6') {
    return ['reading', 'chess_course', 'prayer'];
  }
  return [
    'math',
    'finance',
    'drawing',
    'entrepreneurship',
    'piano',
    'orthography',
    'chess_course',
    'prayer',
  ];
}

/**
 * Barra de navegación inferior flotante en forma de cápsula (sin mostrar nunca grupos de edad):
 * Incluye "Rutinas" (Schedule / Learning Plan) y "Juegos" tanto en celular como en computadora.
 */
export function getNavigationTabsForAgeGroup(
  ageGroup: AgeGroup,
  _age?: number
): NavTabId[] {
  if (ageGroup === '3-6') {
    return ['learn', 'library', 'routines', 'chess', 'games', 'friends', 'profile'];
  }
  return ['learn', 'routines', 'chess', 'games', 'friends', 'profile'];
}

/**
 * Genera un Código de Amigo único formato LUMI-XXXX (ej. LUMI-4829) para conectar
 * usuarios entre distintos navegadores y dispositivos en tiempo real.
 */
export function generateFriendCode(seed?: string): string {
  if (seed && seed.trim().length > 0) {
    let hash = 2166136261;
    const text = seed.trim().toLowerCase();
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const digits = 1000 + (Math.abs(hash) % 9000);
    return `LUMI-${digits}`;
  }
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `LUMI-${randomDigits}`;
}

/**
 * Normaliza un código de amigo ingresado por el usuario (ej. "4829", "lumi4829", "lumi-4829" -> "LUMI-4829").
 */
export function normalizeFriendCode(rawInput: string): string {
  const cleaned = rawInput.trim().toUpperCase().replace(/\s+/g, '');
  const digitsMatch = cleaned.match(/(\d{4})$/);
  if (digitsMatch && (cleaned.startsWith('LUMI') || /^\d{4}$/.test(cleaned))) {
    return `LUMI-${digitsMatch[1]}`;
  }
  return cleaned;
}

/**
 * Regla de la Biblioteca de Cuentos según la edad:
 * - Menores de 3 a 6 años (Aprendiendo a leer): Cuentos infantiles en español CON ilustraciones y dibujitos.
 * - Mayores (7 a 13 y 14 a 18 años): Cuentos e historias en inglés (English Stories) SIN dibujos ni ilustraciones.
 */
export function getLibraryConfigForAgeGroup(ageGroup: AgeGroup): {
  language: 'es' | 'en';
  hasIllustrations: boolean;
  badgeText: string;
  headingText: string;
  subtitleText: string;
} {
  if (ageGroup === '3-6') {
    return {
      language: 'es',
      hasIllustrations: true,
      badgeText: 'Biblioteca Infantil Ilustrada · Español con Dibujitos y Voz (3 a 6 años)',
      headingText: 'Cuentos Infantiles en Español con Ilustraciones',
      subtitleText:
        'Cuentos en español con ilustraciones y dibujitos en cada página, letra grande y narración en voz alta para aprender a leer visualmente.',
    };
  }
  return {
    language: 'en',
    hasIllustrations: false,
    badgeText:
      ageGroup === '7-13'
        ? 'English Reading Library · Cuentos en Inglés sin Ilustraciones (7 a 13 años)'
        : 'Advanced English Stories · Lectura en Inglés sin Ilustraciones (14 a 18 años)',
    headingText: 'English Stories · Cuentos e Historias en Inglés',
    subtitleText:
      'Formato libro de lectura limpio (solo texto, sin dibujitos), dividido por capítulos/páginas, con audio en inglés y traducción instantánea de vocabulario clave al tocar.',
  };
}

/**
 * Crea el perfil de un hijo registrado por su padre/tutor completamente desde cero:
 * 0 XP, nivel 1, racha 0, 0 gemas, sin medallas, sin amigos, sin rutinas, sin progreso previo
 * y con 1 artículo básico gratis de cada tipo en la tienda (tablero, fichas, entrenador y avatar).
 */
export function createFreshUserAccount(params: {
  username: string;
  name: string;
  age: number;
  avatarId?: string;
  friendCode?: string;
  parentEmail?: string;
  parentPin?: string;
  parentAuthMethod?: 'email' | 'google' | 'apple';
  parentalApproved?: boolean;
}): UserProfile {
  const safeAge = Math.max(3, Math.min(18, Math.round(params.age)));
  const ageGroup = getAgeGroup(safeAge);
  const starterAvatar =
    params.avatarId || getInitialAvatarForAgeGroup(ageGroup, safeAge);
  const cleanUsername = params.username.trim().startsWith('@')
    ? params.username.trim().toLowerCase()
    : `@${params.username.trim().toLowerCase().replace(/\s+/g, '_')}`;
  const cleanPin =
    params.parentPin && /^\d{4}$/.test(params.parentPin.trim())
      ? params.parentPin.trim()
      : '1234';
  const generatedId = `usr_${cleanUsername.replace(/[^a-z0-9]/g, '')}_${safeAge}_${Date.now().toString(36).slice(-3)}`;
  const friendCode = params.friendCode
    ? normalizeFriendCode(params.friendCode)
    : generateFriendCode(`${cleanUsername}_${params.name.trim()}_${safeAge}`);

  return {
    id: generatedId,
    friendCode,
    username: cleanUsername,
    name: params.name.trim(),
    age: safeAge,
    ageGroup,
    avatarId: starterAvatar,
    unlockedAvatarIds: [starterAvatar],
    selectedBoardId: 'board_classic_wood',
    unlockedBoardIds: ['board_classic_wood'],
    selectedPiecesId: 'pieces_classic',
    unlockedPiecesIds: ['pieces_classic'],
    selectedCoachId: 'coach_kind',
    unlockedCoachIds: ['coach_kind'],
    wallpaperId: ageGroup === '14-18' ? 'cosmic_aurora' : 'meadow_day',
    xp: 0,
    chessXp: 0,
    gems: 0,
    streak: 0,
    completedLessonIds: [],
    completedChessLessonIds: [],
    completedBookIds: [],
    unlockedMedalIds: [],
    routines: [],
    allowedSubjects: getDefaultSubjectsForAgeGroup(ageGroup),
    parentEmail: (params.parentEmail || 'tutor@familia.es').trim(),
    parentPin: cleanPin,
    parentAuthMethod: params.parentAuthMethod || 'email',
    parentalChatApproved:
      ageGroup === '3-6'
        ? false
        : params.parentalApproved !== undefined
        ? Boolean(params.parentalApproved)
        : true,
    parentalFriendsApproved:
      params.parentalApproved !== undefined ? Boolean(params.parentalApproved) : true,
    mood: 'happy',
  };
}

/**
 * Normaliza perfiles guardados en versiones previas para asegurar que tengan los campos de la tienda y su Código de Amigo.
 */
export function ensureShopDefaultsOnProfile(profile: UserProfile): UserProfile {
  const defaultBoard = profile.selectedBoardId || 'board_classic_wood';
  const defaultPieces = profile.selectedPiecesId || 'pieces_classic';
  const defaultCoach = profile.selectedCoachId || 'coach_kind';
  const friendCode =
    profile.friendCode && profile.friendCode.startsWith('LUMI-')
      ? profile.friendCode
      : generateFriendCode(`${profile.username}_${profile.name}_${profile.age}`);

  return {
    ...profile,
    friendCode,
    selectedBoardId: defaultBoard,
    unlockedBoardIds:
      Array.isArray(profile.unlockedBoardIds) && profile.unlockedBoardIds.length > 0
        ? profile.unlockedBoardIds
        : [defaultBoard],
    selectedPiecesId: defaultPieces,
    unlockedPiecesIds:
      Array.isArray(profile.unlockedPiecesIds) && profile.unlockedPiecesIds.length > 0
        ? profile.unlockedPiecesIds
        : [defaultPieces],
    selectedCoachId: defaultCoach,
    unlockedCoachIds:
      Array.isArray(profile.unlockedCoachIds) && profile.unlockedCoachIds.length > 0
        ? profile.unlockedCoachIds
        : [defaultCoach],
  };
}

/**
 * Verifica si un niño del Grupo 1 (3 a 6 años) completó ambos cursos obligatorios:
 * 1) El curso de aprender a leer (todas sus lecciones), y
 * 2) El curso de ajedrez para menores (todas sus lecciones).
 * Al completar ambos, pasa automáticamente al Grupo 2 con celebración y medalla especial.
 */
export function checkGroup1ToGroup2Graduation(
  ageGroup: AgeGroup,
  completedLessonIds: string[],
  readingCourseLessonIds: string[],
  chessCourseLessonIds: string[]
): boolean {
  if (ageGroup !== '3-6') return false;
  if (readingCourseLessonIds.length === 0 || chessCourseLessonIds.length === 0) {
    return false;
  }
  const finishedReading = readingCourseLessonIds.every((id) =>
    completedLessonIds.includes(id)
  );
  const finishedChess = chessCourseLessonIds.every((id) =>
    completedLessonIds.includes(id)
  );
  return finishedReading && finishedChess;
}

/**
 * Promueve automáticamente a un niño del Grupo 1 al Grupo 2 tras completar Lectura y Ajedrez,
 * otorgándole la medalla especial de graduación y activando el permiso de chat si corresponde.
 */
export function promoteChildFromGroup1ToGroup2(profile: UserProfile): UserProfile {
  const nextAvatar = getInitialAvatarForAgeGroup('7-13', profile.age);
  const nextUnlockedAvatars = Array.from(
    new Set([...profile.unlockedAvatarIds, nextAvatar])
  );
  const nextMedals = Array.from(
    new Set([...profile.unlockedMedalIds, 'medal-graduado-g1'])
  );

  return {
    ...profile,
    ageGroup: '7-13',
    avatarId: profile.avatarId || nextAvatar,
    unlockedAvatarIds: nextUnlockedAvatars,
    unlockedMedalIds: nextMedals,
    allowedSubjects: getDefaultSubjectsForAgeGroup('7-13'),
    parentalChatApproved: true,
  };
}

/**
 * Permite exclusivamente al padre/tutor (con su PIN de 4 dígitos) actualizar la edad del hijo.
 * Si el hijo estaba en Grupo 2 y el padre actualiza su edad a 14 años o más, pasa al Grupo 3.
 */
export function updateChildAgeByParent(
  profile: UserProfile,
  newAge: number,
  enteredPin: string
): {
  success: boolean;
  updatedProfile: UserProfile;
  graduatedToGroup3: boolean;
  error?: string;
} {
  if (enteredPin.trim() !== (profile.parentPin || '1234')) {
    return {
      success: false,
      updatedProfile: profile,
      graduatedToGroup3: false,
      error: 'PIN parental incorrecto. Solo el padre o tutor puede modificar la edad.',
    };
  }

  const clampedAge = Math.max(3, Math.min(18, Math.round(newAge)));
  const newGroup = getAgeGroup(clampedAge);
  const previousGroup = profile.ageGroup;
  const graduatedToGroup3 = previousGroup !== '14-18' && newGroup === '14-18';

  const groupChanged = previousGroup !== newGroup;
  const ageTierChanged = getAvatarAgeTier(profile.age) !== getAvatarAgeTier(clampedAge);
  const starterForNewAge = getInitialAvatarForAgeGroup(newGroup, clampedAge);
  const nextUnlockedAvatars =
    groupChanged || ageTierChanged
      ? Array.from(new Set([...profile.unlockedAvatarIds, starterForNewAge]))
      : profile.unlockedAvatarIds;

  return {
    success: true,
    graduatedToGroup3,
    updatedProfile: {
      ...profile,
      age: clampedAge,
      ageGroup: newGroup,
      avatarId:
        groupChanged || ageTierChanged ? starterForNewAge : profile.avatarId,
      unlockedAvatarIds: nextUnlockedAvatars,
      wallpaperId: newGroup === '14-18' ? 'cosmic_aurora' : profile.wallpaperId,
      allowedSubjects: groupChanged
        ? getDefaultSubjectsForAgeGroup(newGroup)
        : profile.allowedSubjects,
      parentalChatApproved:
        newGroup === '3-6' ? false : profile.parentalChatApproved,
    },
  };
}

/**
 * Determina si una lección está desbloqueada.
 * Todas las lecciones empiezan en la primera (índice 0) y las demás están bloqueadas
 * hasta completar la lección anterior.
 */
export function isLessonUnlocked(
  lessonIndex: number,
  previousLessonId: string | null,
  completedLessonIds: string[]
): boolean {
  if (lessonIndex === 0 || !previousLessonId) return true;
  return completedLessonIds.includes(previousLessonId);
}

/**
 * Verifica que dos usuarios pertenezcan estrictamente al mismo grupo de edad
 * para poder ser amigos, chatear o jugar juntos.
 */
export function areUsersInSameAgeGroup(ageGroupA: AgeGroup, ageGroupB: AgeGroup): boolean {
  return ageGroupA === ageGroupB;
}

/**
 * Otorga +5 gemas al completar una rutina diaria (disponible desde los 10 años en adelante).
 */
export function completeDailyRoutineReward(
  alreadyCompletedToday: boolean,
  currentGems: number
): { gemsEarned: number; newGemTotal: number } {
  if (alreadyCompletedToday) {
    return { gemsEarned: 0, newGemTotal: currentGems };
  }
  return {
    gemsEarned: 5,
    newGemTotal: currentGems + 5,
  };
}

/**
 * Calcula las gemas ganadas al completar actividades para que TODOS los niños
 * (incluidos los menores de 10 años) puedan ganar gemas:
 * - routine: +5 gemas
 * - lesson: +5 gemas
 * - chess_win: +8 gemas
 * - chess_lesson: +5 gemas
 * - videogame_win: +5 gemas
 */
export function calculateActivityGemReward(
  activityType: 'routine' | 'lesson' | 'chess_win' | 'chess_lesson' | 'videogame_win',
  currentGems: number
): { gemsEarned: number; newGemTotal: number } {
  const rewardTable: Record<typeof activityType, number> = {
    routine: 5,
    lesson: 5,
    chess_win: 8,
    chess_lesson: 5,
    videogame_win: 5,
  };
  const gemsEarned = rewardTable[activityType] || 5;
  return {
    gemsEarned,
    newGemTotal: Math.max(0, currentGems) + gemsEarned,
  };
}

/**
 * Compra o desbloquea cualquier artículo de la Tienda (Tableros, Fichas, Entrenadores o Avatares) con gemas.
 * Si no alcanzan las gemas, devuelve un mensaje de ánimo indicando cuántas gemas faltan y cómo ganarlas.
 */
export function purchaseShopItemWithGems(
  currentGems: number,
  cost: number,
  alreadyUnlocked: boolean,
  itemName: string = 'este artículo'
): { success: boolean; remainingGems: number; missingGems: number; reason?: string } {
  if (alreadyUnlocked) {
    return { success: true, remainingGems: currentGems, missingGems: 0 };
  }
  if (currentGems < cost) {
    const missing = cost - currentGems;
    return {
      success: false,
      remainingGems: currentGems,
      missingGems: missing,
      reason: `¡Ánimo! Te faltan ${missing} gemas para desbloquear "${itemName}" (tienes ${currentGems} de ${cost} gemas). ¡Sigue ganando gemas al completar lecciones, ganar partidas de ajedrez, triunfar en los videojuegos o cumplir tus rutinas!`,
    };
  }
  return {
    success: true,
    remainingGems: currentGems - cost,
    missingGems: 0,
  };
}

/**
 * Alias compatible para compra de avatares con gemas.
 */
export function purchaseAvatarWithGems(
  currentGems: number,
  cost: number,
  alreadyUnlocked: boolean
): { success: boolean; remainingGems: number; reason?: string } {
  const res = purchaseShopItemWithGems(currentGems, cost, alreadyUnlocked, 'este avatar');
  return {
    success: res.success,
    remainingGems: res.remainingGems,
    reason: res.reason,
  };
}

/**
 * Los menores de 13 años requieren aprobación del padre o tutor para el chat y las amistades.
 */
export function requiresParentalConsent(age: number): boolean {
  return age < 13;
}

/**
 * Los usuarios de 7 a 18 años pueden personalizar su perfil con un fondo de pantalla.
 */
export function canCustomizeWallpaper(age: number): boolean {
  return age >= 7 && age <= 18;
}

/**
 * Calcula el nivel actual del estudiante en función de sus puntos de experiencia (XP).
 * Con 0 XP empieza en Nivel 1 (0%).
 */
export function calculateLevelFromXP(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  const xpPerLevel = 250;
  const level = Math.floor(safeXp / xpPerLevel) + 1;
  const currentLevelXp = safeXp % xpPerLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / xpPerLevel) * 100));
  return {
    level,
    currentLevelXp,
    nextLevelXp: xpPerLevel,
    progressPercent,
  };
}

/**
 * Mensajes de ánimo adaptados a cada grupo de edad cuando el usuario acierta o se equivoca.
 */
export function getEncouragementMessage(
  isCorrect: boolean,
  ageGroup: AgeGroup,
  seed: number = 0
): string {
  const positiveByGroup: Record<AgeGroup, string[]> = {
    '3-6': [
      '¡Súper bien! ¡Brillas como una estrella!',
      '¡Bravo! ¡Lo lograste genial!',
      '¡Increíble! ¡Qué bien aprendes!',
    ],
    '7-13': [
      '¡Excelente respuesta! Tu aventura avanza al siguiente nivel.',
      '¡Imparable! Dominaste este reto de la misión.',
      '¡Muy bien pensado! Sumas más puntos de experiencia.',
    ],
    '14-18': [
      '¡Razonamiento impecable! Nivel de dominio avanzado.',
      '¡Exacto! Gran precisión analítica en este ejercicio.',
      '¡Criterio experto! Avanzas con paso firme en el módulo.',
    ],
  };

  const retryByGroup: Record<AgeGroup, string[]> = {
    '3-6': [
      '¡Casi! Vamos a intentarlo otra vez con calma.',
      '¡No pasa nada! Escucha la pista y prueba otra vez.',
      '¡Tú puedes! Toca otra respuesta.',
    ],
    '7-13': [
      '¡Buen intento! Revisa la pista y vuelve a probar, así se aprende.',
      '¡Casi lo tienes! Equivocarse es parte del entrenamiento.',
      '¡Ánimo! Analiza las opciones con calma para el siguiente intento.',
    ],
    '14-18': [
      'Respuesta incorrecta. Revisa el fundamento técnico e inténtalo de nuevo.',
      'Analiza el planteamiento desde otro ángulo. ¡Vuelve a intentarlo!',
      'Casi aciertas. Observa los detalles de la pista.',
    ],
  };

  const list = isCorrect ? positiveByGroup[ageGroup] : retryByGroup[ageGroup];
  const idx = Math.abs(seed) % list.length;
  return list[idx];
}

/**
 * Calcula los puntos de experiencia (XP) y gemas (+5 gemas al aprobar) al finalizar una lección.
 */
export function calculateLessonReward(
  correctCount: number,
  totalQuestions: number,
  currentStreak: number,
  ageGroup: AgeGroup
): LessonRewardSummary {
  const safeTotal = Math.max(1, totalQuestions);
  const safeCorrect = Math.max(0, Math.min(safeTotal, correctCount));
  const accuracyPercent = Math.round((safeCorrect / safeTotal) * 100);
  const basePerCorrect = ageGroup === '14-18' ? 20 : 15;
  const streakBonusXp = Math.min(30, Math.max(0, currentStreak) * 3);
  const xpEarned = safeCorrect * basePerCorrect + (accuracyPercent >= 60 ? streakBonusXp : 5);
  const passed = accuracyPercent >= 60;
  const gemsEarned = passed ? 5 : 2;

  const headline =
    accuracyPercent === 100
      ? '¡Lección Perfecta!'
      : passed
      ? '¡Lección Completada!'
      : '¡Buen Esfuerzo! Sigue Practicando';

  const subtext =
    ageGroup === '3-6'
      ? `¡Ganaste estrellas mágicas, +${gemsEarned} gemas y desbloqueaste el siguiente paso!`
      : `Obtuviste ${accuracyPercent}% de precisión, sumaste +${xpEarned} XP y ganaste +${gemsEarned} gemas.`;

  return {
    xpEarned,
    gemsEarned,
    accuracyPercent,
    streakBonusXp,
    passed,
    headline,
    subtext,
  };
}

const BANNED_WORDS = [
  'tonto',
  'tonta',
  'idiota',
  'estupido',
  'estúpido',
  'estupida',
  'estúpida',
  'bobo',
  'boba',
  'inutil',
  'inútil',
  'feo',
  'fea',
  'odio',
  'maldito',
  'maldita',
  'grosero',
  'callate',
  'cállate',
  'pelea',
  'basura',
];

/**
 * 1A) Evaluador del Detector Facial de Edad en el Registro / Inicio de Sesión (Cámara Web en vivo):
 * - Verifica que haya un rostro real frente a la cámara y que pertenezca a un niño o adolescente (3 a 18 años).
 * - Si detecta un adulto (>18 años) o no detecta un rostro real, bloquea inmediatamente el registro
 *   con una alerta de seguridad infantil.
 */
export function evaluateFacialAgeVerification(params: {
  faceDetected: boolean;
  estimatedAge: number | null;
  isAdultOver18?: boolean;
}): FacialAgeVerificationResult {
  if (!params.faceDetected || params.estimatedAge === null) {
    return {
      allowed: false,
      faceDetected: false,
      estimatedAge: null,
      estimatedAgeRange: 'Sin rostro detectado',
      isMinorUnder18: false,
      isAdultOver18: false,
      alertTitle: 'ALERTA DE SEGURIDAD INFANTIL: No se detectó un rostro real',
      reason:
        'Registro bloqueado por seguridad infantil: Debes colocarte frente a la cámara para verificar que eres un niño o adolescente real (3 a 18 años).',
    };
  }

  const roundedAge = Math.round(params.estimatedAge);
  const isAdult = Boolean(params.isAdultOver18) || roundedAge > 18;

  if (isAdult) {
    return {
      allowed: false,
      faceDetected: true,
      estimatedAge: roundedAge,
      estimatedAgeRange: `${roundedAge}+ años (Adulto >18)`,
      isMinorUnder18: false,
      isAdultOver18: true,
      alertTitle: 'ALERTA DE SEGURIDAD INFANTIL: Rostro de Adulto (>18 años) Detectado',
      reason:
        'Acceso bloqueado inmediatamente: El detector facial con IA identificó a un adulto mayor de 18 años. Por protección infantil, esta plataforma es exclusiva para niños y jóvenes de 3 a 18 años.',
    };
  }

  const safeChildAge = Math.max(3, Math.min(18, roundedAge));
  const group = getAgeGroup(safeChildAge);

  return {
    allowed: true,
    faceDetected: true,
    estimatedAge: safeChildAge,
    estimatedAgeRange: `${safeChildAge} años (Menor verificado · Etapa ${group})`,
    isMinorUnder18: true,
    isAdultOver18: false,
    reason: `Verificación facial aprobada: Rostro de menor de edad (${safeChildAge} años) verificado correctamente por el Escudo de Seguridad Infantil.`,
  };
}

/**
 * 1B) Escáner de Privacidad Anti-Fotos de Niños antes de enviar imágenes en el chat:
 * - Si identifica un rostro real o la foto de un niño/persona, bloquea la subida inmediatamente
 *   con el mensaje legal obligatorio.
 * - Solo permite dibujos de los cursos, capturas de tareas o GIFs seguros.
 */
export function evaluateChatImageSafety(params: {
  containsPersonOrFace: boolean;
  fileName?: string;
  imageKind?: 'drawing' | 'homework' | 'gif' | 'photo';
}): ImageSafetyScanResult {
  const lowerName = (params.fileName || '').toLowerCase();
  const nameLooksLikeRealPerson =
    /\b(selfie|rostro|cara|nino|niño|nina|niña|persona|retrato|foto_real|portrait|face|child|kid)\b/i.test(
      lowerName
    );

  if (
    params.containsPersonOrFace ||
    params.imageKind === 'photo' ||
    nameLooksLikeRealPerson
  ) {
    return {
      allowed: false,
      containsPersonOrFace: true,
      detectedCategory: 'real_person_or_child_blocked',
      reason: ANTI_CHILD_PHOTO_LEGAL_MESSAGE,
    };
  }

  const category =
    params.imageKind === 'gif'
      ? 'safe_gif'
      : params.imageKind === 'homework'
      ? 'safe_homework'
      : 'safe_drawing';

  return {
    allowed: true,
    containsPersonOrFace: false,
    detectedCategory: category,
    reason:
      'Imagen verificada por el Escáner de Privacidad IA: Dibujo o tarea sin rostros ni fotos reales de personas.',
  };
}

/**
 * 1C) Detector Automático de Grooming y Datos Personales en el Chat (Bloqueo y Expulsión Instantánea):
 * Analiza en tiempo real cada mensaje enviado o recibido. Si alguien pide u ofrece:
 * - Fotos personales ("mandame una foto", "mostrate", "pasa foto", "envia tu foto")
 * - Dirección de casa ("dónde vivís", "donde vives", "tu dirección", "calle", "domicilio")
 * - Escuela ("a qué escuela vas", "tu colegio")
 * - Teléfono, redes sociales o verse en persona ("encontrarnos", "vernos en persona")
 * Bloquea el mensaje inmediatamente y activa `autoBlockAndExpelSender: true` para expulsar y bloquear al usuario.
 */
export function detectGroomingOrPersonalDataInChat(rawText: string): ModerationResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      allowed: false,
      sanitizedText: '',
      reason: 'Escribe un mensaje antes de enviar.',
    };
  }

  const normalized = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 1. Petición u ofrecimiento de fotos personales / cámara ("mandame una foto", "mostrate", "pasa foto", etc.)
  const photoRequestRegex =
    /\b(mandame una foto|mandame foto|manda una foto|manda foto|pasame una foto|pasa foto|enviame una foto|envia una foto|envia foto|mostrate|muestrate|mostrar tu cara|ver tu cara|foto tuya|tu foto|mandar foto|subi una foto tuya|sacate una foto|prende la camara)\b/i;
  if (photoRequestRegex.test(normalized)) {
    return {
      allowed: false,
      sanitizedText: '[MENSAJE BLOQUEADO POR SEGURIDAD INFANTIL]',
      isCriticalGrooming: true,
      autoBlockAndExpelSender: true,
      violationCategory: 'photo_request',
      reason:
        'ALERTA DE PROTECCIÓN INFANTIL: Se detectó solicitud o envío de fotos personales. El mensaje fue bloqueado y el usuario ha sido bloqueado y expulsado automáticamente por seguridad.',
    };
  }

  // 2. Dirección de casa o ubicación ("dónde vivís", "donde vives", "tu dirección", "calle", etc.)
  const addressLocationRegex =
    /\b(donde vivis|donde vives|en donde vivis|en donde vives|cual es tu direccion|tu direccion|mi direccion es|vivo en la calle|en que calle vivis|en que calle vives|donde queda tu casa|pasa tu ubicacion|mandame tu ubicacion|calle|avenida|domicilio)\b/i;
  if (addressLocationRegex.test(normalized)) {
    return {
      allowed: false,
      sanitizedText: '[UBICACIÓN BLOQUEADA POR SEGURIDAD INFANTIL]',
      isCriticalGrooming: true,
      autoBlockAndExpelSender: true,
      violationCategory: 'address_location',
      reason:
        'ALERTA DE PROTECCIÓN INFANTIL: Está prohibido pedir o compartir dirección de casa o ubicación. El mensaje fue bloqueado y el usuario ha sido bloqueado y expulsado automáticamente.',
    };
  }

  // 3. Escuela o colegio ("a qué escuela vas", "tu colegio", "en qué colegio estudias")
  const schoolRegex =
    /\b(a que escuela vas|que escuela vas|cual es tu escuela|cual es tu colegio|a que colegio vas|en que colegio estudias|nombre de tu escuela|nombre de tu colegio|donde estudias)\b/i;
  if (schoolRegex.test(normalized)) {
    return {
      allowed: false,
      sanitizedText: '[DATO ESCOLAR BLOQUEADO POR SEGURIDAD]',
      isCriticalGrooming: true,
      autoBlockAndExpelSender: true,
      violationCategory: 'school_info',
      reason:
        'ALERTA DE PROTECCIÓN INFANTIL: No se permite pedir ni compartir el nombre de la escuela o colegio. Usuario bloqueado y expulsado automáticamente por seguridad.',
    };
  }

  // 4. Encuentros en persona ("vernos en persona", "encontrarnos", "salir solos", "nos vemos en")
  const meetupRegex =
    /\b(vernos en persona|encontrarnos en persona|juntarnos solos|salir solos|vengas a mi casa|voy a tu casa|nos vemos en el parque|sin que sepan tus papas|no le digas a tus padres)\b/i;
  if (meetupRegex.test(normalized)) {
    return {
      allowed: false,
      sanitizedText: '[MENSAJE BLOQUEADO POR SEGURIDAD INFANTIL]',
      isCriticalGrooming: true,
      autoBlockAndExpelSender: true,
      violationCategory: 'in_person_meetup',
      reason:
        'ALERTA CRÍTICA DE PROTECCIÓN INFANTIL: Se detectó un intento de encuentro o contacto privado. El mensaje fue bloqueado y el usuario fue expulsado inmediatamente.',
    };
  }

  // 5. Redes sociales externas o contacto externo (WhatsApp, Instagram, TikTok, Discord, etc.)
  const socialMediaRegex =
    /\b(whatsapp|instagram|tiktok|snapchat|telegram|pasame tu insta|agregame a discord|mi numero de cel|dame tu telefono|pasa tu numero|pasame tu numero)\b/i;
  if (socialMediaRegex.test(normalized)) {
    return {
      allowed: false,
      sanitizedText: '[CONTACTO EXTERNO BLOQUEADO]',
      isCriticalGrooming: true,
      autoBlockAndExpelSender: true,
      violationCategory: 'social_media',
      reason:
        'ALERTA DE PROTECCIÓN INFANTIL: Está prohibido pedir teléfonos o redes sociales externas. Usuario bloqueado y expulsado automáticamente por seguridad.',
    };
  }

  // 6. Correo electrónico o número telefónico directo (7+ dígitos)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailRegex.test(trimmed)) {
    return {
      allowed: false,
      sanitizedText: '[correo oculto]',
      isCriticalGrooming: true,
      autoBlockAndExpelSender: true,
      violationCategory: 'phone_contact',
      reason:
        'ALERTA DE PROTECCIÓN INFANTIL: No está permitido compartir correos electrónicos ni datos privados en el chat. Usuario bloqueado por seguridad.',
    };
  }

  const phoneDigits = trimmed.replace(/\D/g, '');
  if (phoneDigits.length >= 7) {
    return {
      allowed: false,
      sanitizedText: '[número oculto]',
      isCriticalGrooming: true,
      autoBlockAndExpelSender: true,
      violationCategory: 'phone_contact',
      reason:
        'ALERTA DE PROTECCIÓN INFANTIL: No está permitido pedir ni compartir números de teléfono. Usuario bloqueado y expulsado por seguridad.',
    };
  }

  return {
    allowed: true,
    sanitizedText: trimmed,
    isCriticalGrooming: false,
    autoBlockAndExpelSender: false,
  };
}

/**
 * Modera mensajes del chat para proteger a menores:
 * 1. Ejecuta el Guardián IA Anti-Grooming y Datos Personales (bloqueo y expulsión inmediata si pide fotos, dirección, escuela, teléfono, redes o encuentros).
 * 2. Bloquea palabras inapropiadas o insultos.
 */
export function moderateChatMessage(rawText: string): ModerationResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      allowed: false,
      sanitizedText: '',
      reason: 'Escribe un mensaje antes de enviar.',
    };
  }

  // Primero verificamos el detector crítico de Grooming y Datos Personales
  const groomingCheck = detectGroomingOrPersonalDataInChat(trimmed);
  if (!groomingCheck.allowed) {
    return groomingCheck;
  }

  const normalized = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const word of BANNED_WORDS) {
    const cleanWord = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const regex = new RegExp(`\\b${cleanWord}\\b`, 'i');
    if (regex.test(normalized)) {
      return {
        allowed: false,
        sanitizedText: trimmed.replace(regex, '***'),
        isCriticalGrooming: false,
        autoBlockAndExpelSender: false,
        violationCategory: 'profanity',
        reason:
          'Mensaje bloqueado por el filtro de seguridad: mantengamos un lenguaje amable y respetuoso.',
      };
    }
  }

  return {
    allowed: true,
    sanitizedText: trimmed,
    isCriticalGrooming: false,
    autoBlockAndExpelSender: false,
  };
}

/**
 * Verifica si dos usuarios pueden chatear:
 * - Si el niño está en el Grupo 1 (3 a 6 años), el chat está totalmente desactivado (solo emojis en juegos).
 * - Deben pertenecer al mismo grupo de edad.
 * - Deben haber aceptado la solicitud de amistad ('accepted').
 * - Si el padre/tutor desactivó el chat desde el panel parental, no puede chatear.
 */
export function canUsersChat(
  friendshipStatus: FriendshipStatus,
  userAge: number,
  parentalChatApproved: boolean,
  sameAgeGroup: boolean = true,
  userAgeGroup?: AgeGroup
): { canChat: boolean; reason?: string } {
  const effectiveGroup = userAgeGroup || getAgeGroup(userAge);
  if (effectiveGroup === '3-6') {
    return {
      canChat: false,
      reason:
        'El chat está desactivado para los más pequeños mientras aprenden a leer. ¡En los juegos pueden enviarse reacciones con emojis!',
    };
  }
  if (!sameAgeGroup) {
    return {
      canChat: false,
      reason: 'Los chats y amistades son exclusivamente entre niños de la misma etapa.',
    };
  }
  if (friendshipStatus === 'blocked') {
    return {
      canChat: false,
      reason: 'Este usuario fue bloqueado y expulsado por el sistema de seguridad infantil.',
    };
  }
  if (friendshipStatus !== 'accepted') {
    return {
      canChat: false,
      reason:
        'Solo los amigos que ya aceptaron la solicitud de amistad pueden chatear entre sí.',
    };
  }
  if (!parentalChatApproved) {
    return {
      canChat: false,
      reason:
        'El padre o tutor ha desactivado el chat desde el Panel de Padres con PIN.',
    };
  }
  return { canChat: true };
}

