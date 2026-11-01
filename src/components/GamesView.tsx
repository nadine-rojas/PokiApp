import React, { useState, useEffect } from 'react';
import {
  Trophy,
  RotateCcw,
  Brain,
  Zap,
  Gamepad2,
  Car,
  UserPlus,
  Copy,
  Check,
  Send,
  ShieldAlert,
  Flag,
  Ban,
  Lock,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Gem,
  Smile,
} from 'lucide-react';
import {
  AgeGroup,
  isChatEnabledForGroup,
  moderateChatMessage,
} from '../utils/educationLogic';
import { AvatarBadge } from './ArtworkRenderer';
import { playRewardSound } from '../utils/soundEffects';
import { FriendshipRecord } from './FriendsChatView';
import {
  realtimeNetwork,
  NetworkRoomPlayer,
} from '../utils/realtimeNetwork';

interface GamesViewProps {
  userId?: string;
  userFriendCode?: string;
  userName: string;
  userAvatarId: string;
  userAge?: number;
  ageGroup: AgeGroup;
  parentalChatApproved?: boolean;
  acceptedFriendships: FriendshipRecord[];
  onEarnGameXp: (xpAmount: number, gemsEarned?: number) => void;
  onBlockOrReportFriend?: (
    friendshipId: string,
    action: 'block' | 'report'
  ) => void;
}

export type VideoGameId = 'snake' | 'racing' | 'memory' | 'quick_questions';

interface MemoryCard {
  id: string;
  pairId: string;
  label: string;
  flipped: boolean;
  matched: boolean;
}

interface RoomChatMessage {
  id: string;
  senderName: string;
  text: string;
  isEmojiOnly?: boolean;
  timestamp: string;
}

const INITIAL_MEMORY_CARDS: MemoryCard[] = [
  { id: 'c1', pairId: 'p1', label: '1/2', flipped: false, matched: false },
  { id: 'c2', pairId: 'p1', label: '50%', flipped: false, matched: false },
  { id: 'c3', pairId: 'p2', label: 'Ahorro', flipped: false, matched: false },
  { id: 'c4', pairId: 'p2', label: 'Alcancía', flipped: false, matched: false },
  { id: 'c5', pairId: 'p3', label: 'Nota Do', flipped: false, matched: false },
  { id: 'c6', pairId: 'p3', label: 'Tecla C4', flipped: false, matched: false },
  { id: 'c7', pairId: 'p4', label: 'B / V', flipped: false, matched: false },
  { id: 'c8', pairId: 'p4', label: 'Ortografía', flipped: false, matched: false },
];

const QUICK_QUESTIONS_BY_AGE: Record<
  AgeGroup,
  { question: string; options: string[]; answer: string }[]
> = {
  '3-6': [
    {
      question: '¿Cuántas sílabas tiene la palabra CA - SA?',
      options: ['2 sílabas', '5 sílabas', '1 sílaba'],
      answer: '2 sílabas',
    },
    {
      question: '¿Con qué vocal empieza la palabra OSO?',
      options: ['Vocal O', 'Vocal A', 'Vocal I'],
      answer: 'Vocal O',
    },
    {
      question: 'Si tienes 2 manzanas y te regalan 1 más, ¿cuántas tienes?',
      options: ['3 manzanas', '5 manzanas', '1 manzana'],
      answer: '3 manzanas',
    },
  ],
  '7-13': [
    {
      question: '¿Cuánto es 7 × 8?',
      options: ['56', '48', '64'],
      answer: '56',
    },
    {
      question: 'Si ahorras $15 cada mes durante 4 meses, ¿cuánto dinero reúnes?',
      options: ['$60', '$45', '$75'],
      answer: '$60',
    },
    {
      question: 'En ortografía, ¿qué palabras llevan tilde SIEMPRE?',
      options: ['Las esdrújulas', 'Todas las graves', 'Los monosílabos'],
      answer: 'Las esdrújulas',
    },
    {
      question: 'En ajedrez, ¿cuántos puntos de valor tiene la Dama?',
      options: ['9 puntos', '5 puntos', '3 puntos'],
      answer: '9 puntos',
    },
  ],
  '14-18': [
    {
      question: 'Si 3x + 9 = 24, ¿cuál es el valor de x?',
      options: ['x = 5', 'x = 7', 'x = 3'],
      answer: 'x = 5',
    },
    {
      question: 'Un producto de $200 tiene un descuento del 15%. ¿Cuál es su precio final?',
      options: ['$170', '$185', '$160'],
      answer: '$170',
    },
    {
      question: '¿Cuál es la derivada de f(x) = 4x² + 2x?',
      options: ['8x + 2', '4x + 2', '8x²'],
      answer: '8x + 2',
    },
  ],
};

const GROUP1_EMOJI_REACTIONS = ['🎉', '😄', '⭐', '👏', '❤️', '🚀'];

const SNAKE_GRID_SIZE = 12;

export function GamesView({
  userId = 'current_user',
  userFriendCode = 'LUMI-1000',
  userName,
  userAvatarId,
  ageGroup,
  parentalChatApproved = true,
  acceptedFriendships,
  onEarnGameXp,
  onBlockOrReportFriend,
}: GamesViewProps) {
  const sameGroupFriends = acceptedFriendships.filter(
    (f) => f.peerProfile.ageGroup === ageGroup && f.statusForCurrent === 'accepted'
  );

  const [activeGame, setActiveGame] = useState<VideoGameId>('snake');
  const [myRoomScore, setMyRoomScore] = useState(0);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);

  // Sala Multijugador & Invitar a un Amigo (Sincronizada entre navegadores vía WebSocket/MQTT)
  const [roomCode, setRoomCode] = useState('SALA-482');
  const [joinCodeDraft, setJoinCodeDraft] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitedFriendIds, setInvitedFriendIds] = useState<string[]>([]);
  const [remoteRoomPlayers, setRemoteRoomPlayers] = useState<
    Record<string, NetworkRoomPlayer>
  >({});

  // Chat dentro del juego / Emojis (Grupo 1)
  const [roomMessages, setRoomMessages] = useState<RoomChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatAlert, setChatAlert] = useState<string | null>(null);

  // Sincronización en tiempo real de la Sala Multijugador entre distintos navegadores/dispositivos
  useEffect(() => {
    const unsubscribe = realtimeNetwork.subscribe((netState) => {
      const activeRoom = netState.rooms[roomCode.toUpperCase()];
      if (activeRoom) {
        setRemoteRoomPlayers(activeRoom.players || {});
        if (Array.isArray(activeRoom.messages)) {
          setRoomMessages(
            activeRoom.messages.map((m) => ({
              id: m.id,
              senderName: m.senderName,
              text: m.text,
              isEmojiOnly: m.isEmojiOnly,
              timestamp: m.timestamp,
            }))
          );
        }
      }
    });
    return unsubscribe;
  }, [roomCode]);

  useEffect(() => {
    realtimeNetwork.syncMultiplayerRoom({
      roomCode,
      player: {
        id: userId,
        friendCode: userFriendCode,
        name: userName,
        avatarId: userAvatarId,
        ageGroup,
        score: myRoomScore,
        gameId: activeGame,
        updatedAt: Date.now(),
      },
    });
  }, [
    roomCode,
    userId,
    userFriendCode,
    userName,
    userAvatarId,
    ageGroup,
    myRoomScore,
    activeGame,
  ]);

  // ====================================================
  // JUEGO 1: SERPIENTES (SNAKE)
  // ====================================================
  const [snakeSpeedLevel, setSnakeSpeedLevel] = useState<1 | 2 | 3>(1);
  const [snakeRunning, setSnakeRunning] = useState(false);
  const [snakeBody, setSnakeBody] = useState<{ x: number; y: number }[]>([
    { x: 5, y: 6 },
    { x: 4, y: 6 },
    { x: 3, y: 6 },
  ]);
  const [snakeDir, setSnakeDir] = useState<{ x: number; y: number }>({
    x: 1,
    y: 0,
  });
  const [snakeFruit, setSnakeFruit] = useState<{ x: number; y: number }>({
    x: 8,
    y: 6,
  });
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeGameOver, setSnakeGameOver] = useState(false);

  const stepSnake = (customDir?: { x: number; y: number }) => {
    const dir = customDir || snakeDir;
    setSnakeBody((prev) => {
      const head = prev[0];
      const nextHead = {
        x: (head.x + dir.x + SNAKE_GRID_SIZE) % SNAKE_GRID_SIZE,
        y: (head.y + dir.y + SNAKE_GRID_SIZE) % SNAKE_GRID_SIZE,
      };

      const hitSelf = prev
        .slice(1)
        .some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);
      if (hitSelf) {
        playRewardSound('wrong');
        setSnakeRunning(false);
        setSnakeGameOver(true);
        return prev;
      }

      const ateFruit =
        nextHead.x === snakeFruit.x && nextHead.y === snakeFruit.y;
      if (ateFruit) {
        playRewardSound('correct');
        const nextPoints = snakeScore + 10;
        setSnakeScore(nextPoints);
        setMyRoomScore((s) => s + 10);

        const nextFruit = {
          x: ( nextHead.x * 3 + 5 ) % SNAKE_GRID_SIZE,
          y: ( nextHead.y * 5 + 3 ) % SNAKE_GRID_SIZE,
        };
        setSnakeFruit(nextFruit);

        if (nextPoints % 30 === 0) {
          playRewardSound('fanfare');
          onEarnGameXp(30, 5);
          setRewardNotice(
            '¡Meta alcanzada en Serpientes! Ganaste +30 XP y +5 gemas.'
          );
        }
        return [nextHead, ...prev];
      }

      return [nextHead, ...prev.slice(0, -1)];
    });
  };

  useEffect(() => {
    if (activeGame !== 'snake' || !snakeRunning || snakeGameOver) return;
    const ms = snakeSpeedLevel === 1 ? 360 : snakeSpeedLevel === 2 ? 230 : 145;
    const timer = setInterval(() => {
      stepSnake();
    }, ms);
    return () => clearInterval(timer);
  }, [activeGame, snakeRunning, snakeGameOver, snakeSpeedLevel, snakeDir, snakeFruit, snakeScore]);

  useEffect(() => {
    if (activeGame !== 'snake') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        if (snakeDir.y === 0) setSnakeDir({ x: 0, y: -1 });
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        if (snakeDir.y === 0) setSnakeDir({ x: 0, y: 1 });
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (snakeDir.x === 0) setSnakeDir({ x: -1, y: 0 });
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        if (snakeDir.x === 0) setSnakeDir({ x: 1, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeGame, snakeDir]);

  const resetSnakeGame = () => {
    playRewardSound('pop');
    setSnakeBody([
      { x: 5, y: 6 },
      { x: 4, y: 6 },
      { x: 3, y: 6 },
    ]);
    setSnakeDir({ x: 1, y: 0 });
    setSnakeFruit({ x: 8, y: 6 });
    setSnakeScore(0);
    setSnakeGameOver(false);
    setSnakeRunning(true);
  };

  // ====================================================
  // JUEGO 2: CARRERAS DE AUTOS
  // ====================================================
  const [raceLap, setRaceLap] = useState(1);
  const [raceProgress, setRaceProgress] = useState(0);
  const [raceLane, setRaceLane] = useState<0 | 1 | 2>(1);
  const [rivalProgress, setRivalProgress] = useState(0);
  const [raceFinished, setRaceFinished] = useState(false);

  const handleAccelerateRace = (turbo: boolean = false) => {
    if (raceFinished) return;
    playRewardSound('pop');
    const step = turbo ? 28 : 18;
    const rivalStep = 14;
    const nextProg = raceProgress + step;
    const nextRival = Math.min(300, rivalProgress + rivalStep);
    setRivalProgress(nextRival);

    if (nextProg >= 300) {
      setRaceProgress(300);
      setRaceLap(3);
      setRaceFinished(true);
      playRewardSound('fanfare');
      setMyRoomScore((s) => s + 40);
      onEarnGameXp(40, 5);
      setRewardNotice(
        '¡Cruzaste la meta en 1.° Lugar en Carreras! Ganaste +40 XP y +5 gemas.'
      );
    } else {
      setRaceProgress(nextProg);
      setRaceLap(Math.min(3, Math.floor(nextProg / 100) + 1));
    }
  };

  const resetRaceGame = () => {
    playRewardSound('pop');
    setRaceLap(1);
    setRaceProgress(0);
    setRivalProgress(0);
    setRaceLane(1);
    setRaceFinished(false);
  };

  // ====================================================
  // JUEGO 3: MEMORIA (PARES EDUCATIVOS)
  // ====================================================
  const [cards, setCards] = useState<MemoryCard[]>(INITIAL_MEMORY_CARDS);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const handleCardClick = (cardId: string) => {
    const clicked = cards.find((c) => c.id === cardId);
    if (
      !clicked ||
      clicked.flipped ||
      clicked.matched ||
      selectedCardIds.length >= 2
    ) {
      return;
    }

    playRewardSound('pop');
    const nextCards = cards.map((c) =>
      c.id === cardId ? { ...c, flipped: true } : c
    );
    const nextSelected = [...selectedCardIds, cardId];
    setCards(nextCards);
    setSelectedCardIds(nextSelected);

    if (nextSelected.length === 2) {
      const [firstId, secondId] = nextSelected;
      const firstCard = nextCards.find((c) => c.id === firstId);
      const secondCard = nextCards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        playRewardSound('correct');
        const updatedCards = nextCards.map((c) =>
          c.id === firstId || c.id === secondId ? { ...c, matched: true } : c
        );
        setCards(updatedCards);
        setSelectedCardIds([]);
        setMyRoomScore((s) => s + 25);
        const allMatched = updatedCards.every((c) => c.matched);
        if (allMatched) {
          playRewardSound('fanfare');
          onEarnGameXp(35, 5);
          setRewardNotice(
            '¡Completaste todo el tablero de Memoria! Ganaste +35 XP y +5 gemas.'
          );
        } else {
          onEarnGameXp(15, 2);
        }
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, flipped: false }
                : c
            )
          );
          setSelectedCardIds([]);
        }, 650);
      }
    }
  };

  const resetMemoryGame = () => {
    playRewardSound('pop');
    setCards(
      INITIAL_MEMORY_CARDS.map((c) => ({ ...c, flipped: false, matched: false }))
    );
    setSelectedCardIds([]);
  };

  // ====================================================
  // JUEGO 4: PREGUNTAS RÁPIDAS
  // ====================================================
  const [questionIdx, setQuestionIdx] = useState(0);
  const [questionFeedback, setQuestionFeedback] = useState<string | null>(null);
  const questionList = QUICK_QUESTIONS_BY_AGE[ageGroup];
  const currentQuestion = questionList[questionIdx % questionList.length];

  const handleQuickQuestionAnswer = (opt: string) => {
    if (opt === currentQuestion.answer) {
      playRewardSound('fanfare');
      setMyRoomScore((s) => s + 25);
      onEarnGameXp(25, 5);
      setQuestionFeedback('¡Correcto! Ganaste +25 XP y +5 gemas.');
      setRewardNotice('¡Respuesta rápida correcta! Sumaste +25 XP y +5 gemas.');
      setTimeout(() => {
        setQuestionIdx((i) => i + 1);
        setQuestionFeedback(null);
      }, 850);
    } else {
      playRewardSound('wrong');
      setQuestionFeedback('¡Casi! Intenta con otra opción.');
    }
  };

  // ====================================================
  // CHAT DENTRO DEL JUEGO Y REACCIONES CON EMOJIS
  // ====================================================
  const isYoungKid = ageGroup === '3-6';
  const isTeenDark = ageGroup === '14-18';
  const stageChatAllowed = isChatEnabledForGroup(ageGroup);
  const activeInvitedFriends = sameGroupFriends.filter((f) =>
    invitedFriendIds.includes(f.peerProfile.id)
  );

  const handleSendEmojiReaction = (emoji: string) => {
    playRewardSound('pop');
    const msg = {
      id: `em_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      senderId: userId,
      senderName: userName,
      text: emoji,
      isEmojiOnly: true,
      timestamp: new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setRoomMessages((prev) => [...prev, msg]);
    realtimeNetwork.syncMultiplayerRoom({
      roomCode,
      message: msg,
    });
  };

  const handleSendInGameChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageChatAllowed) return;
    if (!parentalChatApproved) {
      playRewardSound('wrong');
      setChatAlert(
        'El padre o tutor ha desactivado el chat desde el Panel de Padres con PIN.'
      );
      return;
    }

    const mod = moderateChatMessage(chatDraft);
    if (!mod.allowed) {
      playRewardSound('wrong');
      setChatAlert(mod.reason || 'Mensaje bloqueado por seguridad.');
      return;
    }

    playRewardSound('pop');
    setChatAlert(null);
    const msg = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      senderId: userId,
      senderName: userName,
      text: mod.sanitizedText,
      timestamp: new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setRoomMessages((prev) => [...prev, msg]);
    realtimeNetwork.syncMultiplayerRoom({
      roomCode,
      message: msg,
    });
    setChatDraft('');
  };

  const myRacePosition = raceProgress >= rivalProgress ? 1 : 2;

  return (
    <div className="space-y-6" data-testid="games-section-view">
      {/* Cabecera de Videojuegos con Botón "Invitar a un Amigo" y Código de Sala */}
      <section
        className={`rounded-[34px] border p-6 sm:p-8 ${
          isYoungKid
            ? 'bg-gradient-to-r from-[#FFF5F5] via-[#FEF9C3] to-[#ECFCCB] border-2 border-[#FF6B6B]/40 text-slate-900 shadow-sm'
            : isTeenDark
            ? 'bg-[#181326] border-purple-900/50 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-500">
              <Gamepad2 className="w-4 h-4" />
              Sala de Videojuegos Educativos · +5 Gemas por Partida Ganada
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display">
              Videojuegos: Serpientes, Carreras, Memoria y Preguntas Rápidas
            </h1>
            <p className="text-xs sm:text-sm opacity-80">
              Juega solo o invita a tus amigos aceptados con tu código de sala{' '}
              <strong className="font-mono">{roomCode}</strong>. Cada victoria suma{' '}
              <strong>+5 gemas</strong> para la Tienda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-2">
              <span>Sala:</span>
              <strong className="font-mono text-sm">{roomCode}</strong>
              <button
                type="button"
                onClick={() => {
                  playRewardSound('pop');
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 1800);
                }}
                aria-label="Copiar código de sala"
                className="p-1 rounded-lg bg-emerald-600 text-white"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <button
              type="button"
              data-testid="invite-friend-button"
              onClick={() => {
                playRewardSound('pop');
                setInviteModalOpen((v) => !v);
              }}
              className="px-4 py-3 rounded-2xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Invitar a un Amigo ({invitedFriendIds.length})
            </button>
          </div>
        </div>

        {/* Panel Desplegable para Invitar Amigos o Unirse con Código de Sala */}
        {inviteModalOpen && (
          <div
            data-testid="invite-friend-modal"
            className={`mt-5 p-5 rounded-3xl border-2 space-y-4 ${
              isTeenDark
                ? 'bg-[#221B35] border-purple-700/50 text-white'
                : 'bg-slate-50 border-emerald-300 text-slate-900'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-sm">
                  Invitar Amigos a la Sala {roomCode} o Unirse con Código
                </h2>
                <p className="text-xs opacity-75">
                  Varios amigos aceptados de tu misma etapa pueden entrar a la misma sala para competir en tiempo real.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={joinCodeDraft}
                  onChange={(e) => setJoinCodeDraft(e.target.value.toUpperCase())}
                  placeholder="Código (ej. SALA-999)"
                  className="h-9 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (joinCodeDraft.trim()) {
                      playRewardSound('correct');
                      setRoomCode(joinCodeDraft.trim());
                      setJoinCodeDraft('');
                    }
                  }}
                  className="h-9 px-3.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs"
                >
                  Unirse a Sala
                </button>
              </div>
            </div>

            {sameGroupFriends.length === 0 ? (
              <p className="text-xs opacity-75">
                Aún no tienes amigos aceptados en tu lista. Comparte tu código{' '}
                <strong>{roomCode}</strong> o agrega amigos en la sección Amigos.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {sameGroupFriends.map((fr) => {
                  const isInvited = invitedFriendIds.includes(fr.peerProfile.id);
                  return (
                    <div
                      key={fr.id}
                      className="p-3 rounded-2xl border border-slate-300/50 bg-white/80 text-slate-900 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AvatarBadge avatarId={fr.peerProfile.avatarId} size="sm" />
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs truncate">
                            {fr.peerProfile.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {fr.peerProfile.username}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playRewardSound('correct');
                          setInvitedFriendIds((prev) =>
                            isInvited
                              ? prev.filter((id) => id !== fr.peerProfile.id)
                              : [...prev, fr.peerProfile.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs ${
                          isInvited
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#84CC16] text-slate-950'
                        }`}
                      >
                        {isInvited ? 'En la Sala ✓' : 'Invitar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Selector de los 4 Videojuegos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/30">
          <button
            type="button"
            data-testid="game-tab-snake"
            onClick={() => {
              playRewardSound('pop');
              setActiveGame('snake');
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
              activeGame === 'snake'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isTeenDark
                ? 'bg-slate-800 text-slate-100 border-slate-700'
                : 'bg-slate-50 text-slate-900 border-slate-200'
            }`}
          >
            <Gamepad2 className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-extrabold text-sm">1. Serpientes</div>
              <div className="text-[11px] opacity-80">Come frutas · 3 velocidades</div>
            </div>
          </button>

          <button
            type="button"
            data-testid="game-tab-racing"
            onClick={() => {
              playRewardSound('pop');
              setActiveGame('racing');
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
              activeGame === 'racing'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isTeenDark
                ? 'bg-slate-800 text-slate-100 border-slate-700'
                : 'bg-slate-50 text-slate-900 border-slate-200'
            }`}
          >
            <Car className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-extrabold text-sm">2. Carreras</div>
              <div className="text-[11px] opacity-80">Pista, 3 vueltas y posiciones</div>
            </div>
          </button>

          <button
            type="button"
            data-testid="game-tab-memory"
            onClick={() => {
              playRewardSound('pop');
              setActiveGame('memory');
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
              activeGame === 'memory'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isTeenDark
                ? 'bg-slate-800 text-slate-100 border-slate-700'
                : 'bg-slate-50 text-slate-900 border-slate-200'
            }`}
          >
            <Brain className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-extrabold text-sm">3. Memoria</div>
              <div className="text-[11px] opacity-80">Parejas educativas</div>
            </div>
          </button>

          <button
            type="button"
            data-testid="game-tab-questions"
            onClick={() => {
              playRewardSound('pop');
              setActiveGame('quick_questions');
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
              activeGame === 'quick_questions'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isTeenDark
                ? 'bg-slate-800 text-slate-100 border-slate-700'
                : 'bg-slate-50 text-slate-900 border-slate-200'
            }`}
          >
            <Zap className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-extrabold text-sm">4. Preguntas Rápidas</div>
              <div className="text-[11px] opacity-80">Retos y matemáticas</div>
            </div>
          </button>
        </div>
      </section>

      {rewardNotice && (
        <div className="p-4 rounded-2xl bg-cyan-500/15 border-2 border-cyan-500/40 text-cyan-500 text-xs sm:text-sm font-extrabold flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Gem className="w-4 h-4 shrink-0" />
            {rewardNotice}
          </span>
          <button
            type="button"
            onClick={() => setRewardNotice(null)}
            className="text-xs underline"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ÁREA PRINCIPAL DEL JUEGO ACTIVO */}
        <div
          className={`lg:col-span-7 rounded-3xl border p-6 sm:p-8 ${
            isTeenDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          {/* JUEGO 1: SERPIENTES (SNAKE) */}
          {activeGame === 'snake' && (
            <div className="space-y-5" data-testid="snake-game-board">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold font-display">
                    Serpientes (Snake) · Come Frutas 🍎
                  </h2>
                  <p className="text-xs opacity-75">
                    Puntaje: <strong>{snakeScore} pts</strong> · Cada 30 pts ganas +5 gemas
                  </p>
                </div>

                {/* Selector de Nivel de Velocidad */}
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { lvl: 1, label: 'Vel 1 · Suave' },
                      { lvl: 2, label: 'Vel 2 · Rápido' },
                      { lvl: 3, label: 'Vel 3 · Turbo' },
                    ] as const
                  ).map((sp) => (
                    <button
                      key={sp.lvl}
                      type="button"
                      onClick={() => setSnakeSpeedLevel(sp.lvl)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border ${
                        snakeSpeedLevel === sp.lvl
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-slate-300/40 opacity-75'
                      }`}
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tablero Cuadrícula 12x12 de la Serpiente */}
              <div className="w-full max-w-[360px] aspect-square mx-auto rounded-3xl p-2 bg-slate-950 border-4 border-emerald-500/60 grid grid-cols-12 grid-rows-12 gap-0.5 shadow-inner">
                {Array.from({ length: SNAKE_GRID_SIZE * SNAKE_GRID_SIZE }).map(
                  (_, idx) => {
                    const x = idx % SNAKE_GRID_SIZE;
                    const y = Math.floor(idx / SNAKE_GRID_SIZE);
                    const isHead =
                      snakeBody[0].x === x && snakeBody[0].y === y;
                    const isBody = snakeBody
                      .slice(1)
                      .some((seg) => seg.x === x && seg.y === y);
                    const isFruit = snakeFruit.x === x && snakeFruit.y === y;

                    return (
                      <div
                        key={idx}
                        className={`rounded-xs flex items-center justify-center text-[11px] ${
                          isHead
                            ? 'bg-[#84CC16] text-slate-950 font-black scale-105'
                            : isBody
                            ? 'bg-emerald-500/85'
                            : isFruit
                            ? 'bg-rose-500/20 animate-bounce'
                            : 'bg-slate-900/90'
                        }`}
                      >
                        {isHead ? '👀' : isFruit ? '🍎' : ''}
                      </div>
                    );
                  }
                )}
              </div>

              {snakeGameOver && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-500 text-xs font-extrabold text-center">
                  ¡Chocaste con tu propia cola! Puntaje final: {snakeScore} pts. Pulsa Jugar de Nuevo.
                </div>
              )}

              {/* Controles en pantalla + Botón de Inicio / Paso / Reclamar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (snakeGameOver) {
                        resetSnakeGame();
                      } else {
                        setSnakeRunning((r) => !r);
                      }
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-extrabold text-xs flex items-center gap-1.5"
                  >
                    {snakeRunning ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        {snakeGameOver ? 'Jugar de Nuevo' : 'Iniciar Serpiente'}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playRewardSound('fanfare');
                      const nextPts = snakeScore + 10;
                      setSnakeScore(nextPts);
                      setMyRoomScore((s) => s + 15);
                      setSnakeBody((prev) => [
                        {
                          x: (prev[0].x + 1) % SNAKE_GRID_SIZE,
                          y: prev[0].y,
                        },
                        ...prev,
                      ]);
                      onEarnGameXp(25, 5);
                      setRewardNotice(
                        '¡Comiste fruta dorada en Serpientes! +25 XP y +5 gemas.'
                      );
                    }}
                    className="px-3.5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs flex items-center gap-1.5"
                  >
                    <Gem className="w-3.5 h-3.5" />
                    Comer Fruta (+5 Gemas)
                  </button>
                </div>

                {/* D-Pad Direccional para celular y computadora */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Mover serpiente izquierda"
                    onClick={() => {
                      const d = { x: -1, y: 0 };
                      setSnakeDir(d);
                      stepSnake(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 text-white hover:bg-emerald-600"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Mover serpiente arriba"
                    onClick={() => {
                      const d = { x: 0, y: -1 };
                      setSnakeDir(d);
                      stepSnake(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 text-white hover:bg-emerald-600"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Mover serpiente abajo"
                    onClick={() => {
                      const d = { x: 0, y: 1 };
                      setSnakeDir(d);
                      stepSnake(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 text-white hover:bg-emerald-600"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Mover serpiente derecha"
                    onClick={() => {
                      const d = { x: 1, y: 0 };
                      setSnakeDir(d);
                      stepSnake(d);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 text-white hover:bg-emerald-600"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* JUEGO 2: CARRERAS DE AUTOS */}
          {activeGame === 'racing' && (
            <div className="space-y-5" data-testid="racing-game-board">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold font-display">
                    Gran Premio de Carreras 🏎️
                  </h2>
                  <p className="text-xs opacity-75">
                    Vuelta <strong>{raceLap}/3</strong> · Posición actual:{' '}
                    <strong>{myRacePosition}.° Lugar</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetRaceGame}
                  className="px-3.5 py-2 rounded-xl border border-slate-300/40 text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reiniciar Carrera
                </button>
              </div>

              {/* Pista de 3 Carriles con Posiciones en Tiempo Real */}
              <div className="rounded-3xl bg-slate-900 border-4 border-slate-700 p-4 space-y-3 relative overflow-hidden">
                {[0, 1, 2].map((laneIdx) => {
                  const isMyLane = raceLane === laneIdx;
                  const myPercent = Math.min(92, Math.round((raceProgress / 300) * 92));
                  const rivalPercent = Math.min(
                    90,
                    Math.round((rivalProgress / 300) * 90)
                  );

                  return (
                    <div
                      key={laneIdx}
                      className="h-14 rounded-2xl bg-slate-800/90 border border-dashed border-slate-600 relative flex items-center px-3"
                    >
                      <span className="text-[10px] font-mono text-slate-400">
                        Carril {laneIdx + 1}
                      </span>

                      {isMyLane && (
                        <div
                          className="absolute transition-all duration-200 flex items-center gap-1 bg-[#84CC16] text-slate-950 px-2.5 py-1 rounded-full font-extrabold text-xs shadow-md"
                          style={{ left: `${Math.max(8, myPercent)}%` }}
                        >
                          <span>🏎️</span>
                          <span>{userName}</span>
                        </div>
                      )}

                      {laneIdx === 2 && !isMyLane && (
                        <div
                          className="absolute transition-all duration-200 flex items-center gap-1 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full font-extrabold text-xs"
                          style={{ left: `${Math.max(8, rivalPercent)}%` }}
                        >
                          <span>🚓</span>
                          <span>
                            {activeInvitedFriends[0]?.peerProfile.name ||
                              'Auto Rival'}
                          </span>
                        </div>
                      )}

                      <div className="ml-auto text-sm">🏁</div>
                    </div>
                  );
                })}
              </div>

              {/* Controles de Carril y Acelerador */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRaceLane((l) => (l > 0 ? ((l - 1) as 0 | 1 | 2) : 0))
                    }
                    className="px-3.5 py-2.5 rounded-2xl border border-slate-300/40 font-extrabold text-xs"
                  >
                    ↑ Subir Carril
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRaceLane((l) => (l < 2 ? ((l + 1) as 0 | 1 | 2) : 2))
                    }
                    className="px-3.5 py-2.5 rounded-2xl border border-slate-300/40 font-extrabold text-xs"
                  >
                    ↓ Bajar Carril
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={raceFinished}
                    onClick={() => handleAccelerateRace(false)}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-extrabold text-xs"
                  >
                    Acelerar Auto 🏎️
                  </button>
                  <button
                    type="button"
                    disabled={raceFinished}
                    onClick={() => handleAccelerateRace(true)}
                    className="px-4 py-2.5 rounded-2xl bg-[#84CC16] hover:bg-[#65A30D] disabled:bg-slate-400 text-slate-950 font-black text-xs flex items-center gap-1"
                  >
                    <Zap className="w-4 h-4" />
                    Turbo Meta (+5 Gemas)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* JUEGO 3: MEMORIA */}
          {activeGame === 'memory' && (
            <div className="space-y-6" data-testid="memory-game-board">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-display">
                    Memoria de Pares Educativos
                  </h2>
                  <p className="text-xs opacity-70">
                    Encuentra las parejas equivalentes y gana gemas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetMemoryGame}
                  className="px-3.5 py-2 rounded-xl border border-slate-300/40 text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reiniciar Tablero
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {cards.map((card) => {
                  const revealed = card.flipped || card.matched;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleCardClick(card.id)}
                      aria-label={
                        revealed
                          ? `Tarjeta ${card.label}`
                          : `Voltear tarjeta ${card.id}`
                      }
                      className={`h-24 rounded-2xl border-2 font-display font-bold text-base transition-all flex items-center justify-center p-2 ${
                        card.matched
                          ? 'bg-emerald-500/20 border-emerald-500'
                          : card.flipped
                          ? 'bg-amber-400 border-amber-500 text-slate-950'
                          : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                      }`}
                    >
                      {revealed ? card.label : '?'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* JUEGO 4: PREGUNTAS RÁPIDAS */}
          {activeGame === 'quick_questions' && (
            <div className="space-y-6" data-testid="quick-questions-board">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-500">
                  Pregunta Rápida #{questionIdx + 1}
                </span>
                <span className="text-xs font-mono opacity-75">
                  Recompensa: +25 XP y +5 Gemas
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display">
                {currentQuestion.question}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleQuickQuestionAnswer(opt)}
                    className={`p-5 rounded-2xl border text-base sm:text-lg font-extrabold transition-all active:scale-95 ${
                      isTeenDark
                        ? 'border-slate-700 bg-slate-800 hover:border-emerald-500 text-white'
                        : 'border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-500 text-slate-900'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {questionFeedback && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-sm font-bold">
                  {questionFeedback}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL LATERAL: TABLA DE POSICIONES MULTIJUGADOR EN TIEMPO REAL + CHAT DENTRO DEL JUEGO (O EMOJIS PARA GRUPO 1) */}
        <aside
          className={`lg:col-span-5 rounded-3xl border p-6 space-y-6 ${
            isTeenDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm'
          }`}
        >
          {/* 1. Posiciones y Puntajes Multijugador en Tiempo Real en la Sala */}
          <div className="space-y-3" data-testid="multiplayer-live-scoreboard">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Multijugador · Sala {roomCode}
              </h3>
              <span className="text-xs font-bold text-emerald-500">
                Posiciones en vivo
              </span>
            </div>

            {(() => {
              const liveRemotePeers = Object.values(remoteRoomPlayers).filter(
                (rp) => rp.id !== userId
              );

              const friendCompetitors = sameGroupFriends.map((fr, idx) => {
                const liveInRoom = liveRemotePeers.find(
                  (rp) =>
                    rp.id === fr.peerProfile.id ||
                    (fr.peerProfile.friendCode &&
                      rp.friendCode?.toUpperCase() ===
                        fr.peerProfile.friendCode.toUpperCase())
                );
                const isInvited =
                  invitedFriendIds.includes(fr.peerProfile.id) ||
                  Boolean(liveInRoom);
                const friendLiveScore = liveInRoom
                  ? liveInRoom.score
                  : isInvited
                  ? Math.max(
                      10,
                      Math.round(myRoomScore * 0.75) + (idx + 1) * 15
                    )
                  : 0;
                return {
                  id: fr.peerProfile.id,
                  friendshipId: fr.id as string | null,
                  name: fr.peerProfile.name,
                  avatarId: fr.peerProfile.avatarId,
                  score: friendLiveScore,
                  statusText: liveInRoom
                    ? `Conectado en vivo (${liveInRoom.friendCode})`
                    : isInvited
                    ? 'Compitiendo en tu sala'
                    : 'Amigo aceptado (invítalo arriba)',
                  isMe: false,
                };
              });

              const extraRoomCompetitors = liveRemotePeers
                .filter(
                  (rp) =>
                    !friendCompetitors.some((fc) => fc.id === rp.id)
                )
                .map((rp) => ({
                  id: rp.id,
                  friendshipId: null as string | null,
                  name: rp.name,
                  avatarId: rp.avatarId,
                  score: rp.score,
                  statusText: `En sala en vivo (${rp.friendCode})`,
                  isMe: false,
                }));

              const competitors = [
                {
                  id: userId,
                  friendshipId: null as string | null,
                  name: `${userName} (Tú)`,
                  avatarId: userAvatarId,
                  score: myRoomScore,
                  statusText: `Conectado en partida (${userFriendCode})`,
                  isMe: true,
                },
                ...friendCompetitors,
                ...extraRoomCompetitors,
              ].sort((a, b) => b.score - a.score);

              return (
                <div className="space-y-2">
                  {competitors.map((comp, rankIdx) => (
                    <div
                      key={comp.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                        comp.isMe
                          ? 'bg-emerald-500/15 border-emerald-500/40'
                          : 'border-slate-200/40 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-black shrink-0 ${
                            rankIdx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-500/20'
                          }`}
                        >
                          {rankIdx + 1}.°
                        </span>
                        <AvatarBadge avatarId={comp.avatarId} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm truncate">
                            {comp.name}
                          </div>
                          <div className="text-[10px] opacity-70 truncate">
                            {comp.statusText}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono font-extrabold text-xs sm:text-sm tabular-nums">
                          {comp.score} pts
                        </span>
                        {!comp.isMe && comp.friendshipId && onBlockOrReportFriend && (
                          <>
                            <button
                              type="button"
                              title="Reportar jugador"
                              onClick={() => {
                                onBlockOrReportFriend(comp.friendshipId!, 'report');
                                setChatAlert(
                                  `Reporte enviado sobre ${comp.name}.`
                                );
                              }}
                              className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500"
                            >
                              <Flag className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              title="Bloquear jugador"
                              onClick={() => {
                                onBlockOrReportFriend(comp.friendshipId!, 'block');
                                setChatAlert(`Bloqueaste a ${comp.name}.`);
                              }}
                              className="p-1.5 rounded-lg bg-red-500/15 text-red-500"
                            >
                              <Ban className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* 2. Chat Dentro del Juego (7-18 años) o Reacciones con Emojis (3-6 años) */}
          <div
            data-testid="in-game-chat-panel"
            className="pt-4 border-t border-slate-200/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-emerald-500" />
                {isYoungKid
                  ? 'Reacciones con Emojis en la Sala'
                  : 'Chat Dentro del Juego (Moderado)'}
              </h3>
              <span className="text-[11px] opacity-70">
                {isYoungKid ? 'Sin texto · Solo Emojis' : 'Filtro activo'}
              </span>
            </div>

            {/* Historial de reacciones o mensajes de la sala */}
            <div
              className={`p-3.5 rounded-2xl min-h-[120px] max-h-[190px] overflow-y-auto space-y-2 ${
                isTeenDark ? 'bg-slate-950' : 'bg-slate-50'
              }`}
            >
              {roomMessages.length === 0 ? (
                <p className="text-xs opacity-65 text-center py-6">
                  {isYoungKid
                    ? '¡Toca un emoji abajo para celebrar la partida con tus amigos!'
                    : 'Envía un mensaje amable o reacción a tus amigos conectados en la sala.'}
                </p>
              ) : (
                roomMessages.map((m) => (
                  <div
                    key={m.id}
                    className="text-xs flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-500/10"
                  >
                    <span>
                      <strong>{m.senderName}:</strong>{' '}
                      <span className={m.isEmojiOnly ? 'text-xl' : ''}>
                        {m.text}
                      </span>
                    </span>
                    <span className="text-[10px] opacity-60">{m.timestamp}</span>
                  </div>
                ))
              )}
            </div>

            {/* Botones rápidos de reacciones con emojis (siempre disponibles en Grupo 1 y como barra rápida) */}
            <div
              className="flex items-center justify-between gap-1.5"
              data-testid="emoji-reactions-bar"
            >
              {GROUP1_EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendEmojiReaction(emoji)}
                  aria-label={`Enviar reacción ${emoji}`}
                  className="flex-1 py-2 rounded-xl border border-slate-300/40 hover:bg-emerald-500/15 text-lg transition-transform active:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {chatAlert && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{chatAlert}</span>
              </div>
            )}

            {/* En Grupo 1 (3-6 años) NO hay campo de texto de chat; en Grupo 2 y 3 sí hay si el padre lo aprobó */}
            {!stageChatAllowed ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-center">
                Para los más pequeños solo están activas las reacciones con emojis. El chat de texto se activa al graduarse a la siguiente etapa.
              </div>
            ) : !parentalChatApproved ? (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  El padre o tutor desactivó el chat desde el Panel Parental.
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSendInGameChat}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatDraft}
                  onChange={(e) => {
                    setChatDraft(e.target.value);
                    if (chatAlert) setChatAlert(null);
                  }}
                  placeholder="Mensaje amable en la sala..."
                  className={`flex-1 h-10 px-3.5 rounded-xl border text-xs ${
                    isTeenDark
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
