import React, { useState, useRef, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import {
  Trophy,
  Bot,
  Users,
  BookOpen,
  RotateCcw,
  Lock,
  CheckCircle2,
  Volume2,
  Sparkles,
  Play,
  Lightbulb,
  ShoppingBag,
  Gem,
  Move as MoveIcon,
  Clock,
  Send,
  X,
  Check,
} from 'lucide-react';
import {
  AgeGroup,
  calculateLevelFromXP,
  isLessonUnlocked,
} from '../utils/educationLogic';
import {
  CHESS_ACADEMY_LESSONS,
  CHESS_BOARDS_CATALOG,
  CHESS_PIECES_CATALOG,
  CHESS_COACHES_CATALOG,
  ChessLessonInteractive,
  ChessBoardThemeOption,
  ChessPiecesStyleOption,
} from '../data/curriculumData';
import {
  BotEloLevel,
  CHESS_BOT_LEVELS,
  ChessTimeControlId,
  ChessColorPreference,
  CHESS_TIME_CONTROLS,
  CHESS_COLOR_OPTIONS,
  getChessTimeControlById,
  resolveChessInviteColors,
  formatChessClock,
  tickChessClock,
  computeRealChessBotMove,
} from '../utils/chessEngine';
import { NetworkChessMatch, realtimeNetwork } from '../utils/realtimeNetwork';
import { playRewardSound, speakSpanishText } from '../utils/soundEffects';

export type { BotEloLevel };

export interface AcceptedFriendSummary {
  id: string;
  friendCode?: string;
  username: string;
  name: string;
  avatarId: string;
  friendshipId?: string;
}

export interface ChessFriendInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  acceptedFriends: AcceptedFriendSummary[];
  initialFriendId?: string;
  onSendInvite: (params: {
    friend: AcceptedFriendSummary;
    timeControlId: ChessTimeControlId;
    colorPreference: ChessColorPreference;
  }) => void;
  onGoToFriendsTab?: () => void;
}

/**
 * Modal / Ventana clara de Configuración de Partida de Ajedrez con Amigo:
 * 1. Seleccionar Amigo (de su lista de amigos aceptados)
 * 2. Selector de Temporizador (⚡ 3 min, ⏱️ 5 min, 🕙 10 min, ⏳ 15 min, ∞ Sin tiempo)
 * 3. Elegir Color (Blancas, Negras o Aleatorio)
 * 4. Botón grande: "Enviar Solicitud de Partida ♟️"
 */
export function ChessFriendInviteModal({
  isOpen,
  onClose,
  acceptedFriends,
  initialFriendId,
  onSendInvite,
  onGoToFriendsTab,
}: ChessFriendInviteModalProps) {
  const [selectedFriendId, setSelectedFriendId] = useState<string>(
    initialFriendId || acceptedFriends[0]?.id || ''
  );
  const [selectedTimeControl, setSelectedTimeControl] =
    useState<ChessTimeControlId>('5min');
  const [selectedColorPref, setSelectedColorPref] =
    useState<ChessColorPreference>('w');

  useEffect(() => {
    if (initialFriendId) {
      setSelectedFriendId(initialFriendId);
    } else if (
      acceptedFriends.length > 0 &&
      !acceptedFriends.some((f) => f.id === selectedFriendId)
    ) {
      setSelectedFriendId(acceptedFriends[0].id);
    }
  }, [initialFriendId, acceptedFriends, selectedFriendId]);

  if (!isOpen) return null;

  const chosenFriend =
    acceptedFriends.find((f) => f.id === selectedFriendId) ||
    acceptedFriends[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenFriend) return;
    playRewardSound('fanfare');
    onSendInvite({
      friend: chosenFriend,
      timeControlId: selectedTimeControl,
      colorPreference: selectedColorPref,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Configurar Partida de Ajedrez con Amigo"
      data-testid="chess-friend-invite-modal"
    >
      <div className="bg-white dark:bg-[#181326] text-slate-900 dark:text-white rounded-[36px] max-w-xl w-full p-6 sm:p-8 border-4 border-emerald-500 shadow-2xl space-y-6 my-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-[#BEF264] text-xs font-black">
              <Clock className="w-3.5 h-3.5" />
              <span>Invitación en Tiempo Real (WebSocket / MQTT)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display">
              ♟️ Configurar Partida con un Amigo
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Elige a tu amigo, el reloj de ajedrez y tu color para enviar la solicitud en vivo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de configuración de partida"
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {acceptedFriends.length === 0 ? (
          <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 text-center space-y-4">
            <Lock className="w-10 h-10 text-amber-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-black text-base">
                Aún no tienes amigos aceptados en tu lista
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Primero conecta con un amigo usando su Código de Amigo (LUMI-XXXX) o su nombre en la pestaña Amigos para poder enviarle un reto de Ajedrez.
              </p>
            </div>
            {onGoToFriendsTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToFriendsTab();
                }}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer"
              >
                Ir a Amigos para Conectar Compañero
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. SELECCIONAR AMIGO */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Seleccionar Amigo ({acceptedFriends.length})
              </label>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-36 overflow-y-auto pr-1"
                data-testid="chess-invite-friend-list"
              >
                {acceptedFriends.map((fr) => {
                  const isSelected = chosenFriend?.id === fr.id;
                  return (
                    <button
                      key={fr.id}
                      type="button"
                      data-testid={`select-chess-friend-${fr.id}`}
                      onClick={() => {
                        playRewardSound('pop');
                        setSelectedFriendId(fr.id);
                      }}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/15 font-black shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold truncate">
                          {fr.name}
                        </div>
                        <div className="text-[11px] opacity-75 font-mono truncate">
                          {fr.friendCode || fr.username}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. SELECTOR DE TEMPORIZADOR (RELOJ DE AJEDREZ) */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Selector de Temporizador (Reloj de Ajedrez)
              </label>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                data-testid="chess-timer-selector"
              >
                {CHESS_TIME_CONTROLS.map((tc) => {
                  const active = selectedTimeControl === tc.id;
                  return (
                    <button
                      key={tc.id}
                      type="button"
                      data-testid={`chess-timer-${tc.id}`}
                      onClick={() => {
                        playRewardSound('pop');
                        setSelectedTimeControl(tc.id);
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        tc.id === 'unlimited' ? 'sm:col-span-2' : ''
                      } ${
                        active
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-950 dark:text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-emerald-400'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-black">{tc.label}</div>
                        <div className="text-[11px] opacity-75">
                          {tc.initialSeconds
                            ? `Reloj: ${formatChessClock(tc.initialSeconds)} por jugador`
                            : 'Partida amistosa sin límite de reloj'}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-black ${
                          active
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {tc.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. ELEGIR COLOR */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Elegir Color de tus Piezas
              </label>
              <div
                className="grid grid-cols-3 gap-2.5"
                data-testid="chess-color-selector"
              >
                {CHESS_COLOR_OPTIONS.map((col) => {
                  const active = selectedColorPref === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      data-testid={`chess-color-${col.id}`}
                      onClick={() => {
                        playRewardSound('pop');
                        setSelectedColorPref(col.id);
                      }}
                      className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        active
                          ? 'border-emerald-500 bg-emerald-500/15 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-emerald-400'
                      }`}
                    >
                      <span className="text-2xl leading-none">{col.icon}</span>
                      <span className="text-xs sm:text-sm font-black">
                        {col.label}
                      </span>
                      <span className="text-[10px] opacity-75 leading-tight">
                        {col.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. BOTÓN GRANDE: ENVIAR SOLICITUD DE PARTIDA */}
            <button
              type="submit"
              data-testid="send-chess-invite-btn"
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
              <span>Enviar Solicitud de Partida ♟️</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export interface InteractiveChessboardProps {
  fen: string;
  selectedSquare: Square | null;
  legalTargetSquares: Square[];
  onSquareClick: (sq: Square) => void;
  onPieceDropMove?: (fromSq: Square, toSq: Square) => void;
  onStartPieceDrag?: (fromSq: Square) => void;
  boardTheme?: ChessBoardThemeOption;
  piecesStyle?: ChessPiecesStyleOption;
  testId?: string;
}

/**
 * Tablero de ajedrez interactivo reutilizable que soporta:
 * 1) Arrastrar y soltar con mouse (HTML5 Drag & Drop: onDragStart, onDragOver, onDrop)
 * 2) Arrastrar con el dedo en pantallas táctiles (onTouchStart, onTouchMove, onTouchEnd)
 * 3) Clic en casilla origen y clic en casilla destino
 * Ilumina las casillas legales de destino tanto al seleccionar como al arrastrar una pieza.
 */
export function InteractiveChessboard({
  fen,
  selectedSquare,
  legalTargetSquares,
  onSquareClick,
  onPieceDropMove,
  onStartPieceDrag,
  boardTheme = CHESS_BOARDS_CATALOG[0],
  piecesStyle = CHESS_PIECES_CATALOG[0],
  testId = 'interactive-chessboard',
}: InteractiveChessboardProps) {
  const [draggedFromSq, setDraggedFromSq] = useState<Square | null>(null);
  const [hoverTargetSq, setHoverTargetSq] = useState<Square | null>(null);

  const tempChess = new Chess(fen);
  const boardMatrix = tempChess.board();
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const handleTouchEndResolve = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (!draggedFromSq) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const squareBtn = el?.closest('[data-chess-square]') as HTMLElement | null;
    const targetSq = squareBtn?.getAttribute('data-chess-square') as Square | null;
    if (targetSq && targetSq !== draggedFromSq && onPieceDropMove) {
      onPieceDropMove(draggedFromSq, targetSq);
    }
    setDraggedFromSq(null);
    setHoverTargetSq(null);
  };

  const handleTouchMoveTrack = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (!draggedFromSq) return;
    const touch = e.touches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const squareBtn = el?.closest('[data-chess-square]') as HTMLElement | null;
    const targetSq = squareBtn?.getAttribute('data-chess-square') as Square | null;
    if (targetSq && targetSq !== hoverTargetSq) {
      setHoverTargetSq(targetSq);
    }
  };

  return (
    <div
      className={`w-full max-w-[440px] aspect-square mx-auto rounded-2xl overflow-hidden border-4 ${boardTheme.boardBorderClass} shadow-lg grid grid-cols-8 grid-rows-8 select-none touch-none`}
      data-testid={testId}
      data-board-theme={boardTheme.id}
      data-pieces-style={piecesStyle.id}
    >
      {boardMatrix.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          const sqName = `${files[cIdx]}${8 - rIdx}` as Square;
          const isLight = (rIdx + cIdx) % 2 === 0;
          const isSelected = selectedSquare === sqName || draggedFromSq === sqName;
          const isTarget = legalTargetSquares.includes(sqName);
          const isHoveredDrop = hoverTargetSq === sqName && isTarget;
          const canDragPiece = Boolean(cell && cell.color === tempChess.turn());

          const pieceKey = cell
            ? (`${cell.color}${cell.type}` as keyof typeof piecesStyle.pieceMap)
            : null;

          return (
            <button
              key={sqName}
              type="button"
              data-chess-square={sqName}
              data-testid={`chess-square-${sqName}`}
              data-legal-target={isTarget ? 'true' : 'false'}
              draggable={canDragPiece}
              onClick={() => onSquareClick(sqName)}
              onDragStart={(e) => {
                if (!canDragPiece) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.setData('text/plain', sqName);
                e.dataTransfer.effectAllowed = 'move';
                setDraggedFromSq(sqName);
                if (onStartPieceDrag) {
                  onStartPieceDrag(sqName);
                } else {
                  onSquareClick(sqName);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (hoverTargetSq !== sqName) {
                  setHoverTargetSq(sqName);
                }
              }}
              onDragLeave={() => {
                if (hoverTargetSq === sqName) {
                  setHoverTargetSq(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const originSq = (e.dataTransfer.getData('text/plain') ||
                  draggedFromSq) as Square | null;
                setDraggedFromSq(null);
                setHoverTargetSq(null);
                if (originSq && originSq !== sqName) {
                  if (onPieceDropMove) {
                    onPieceDropMove(originSq, sqName);
                  } else {
                    onSquareClick(sqName);
                  }
                }
              }}
              onDragEnd={() => {
                setDraggedFromSq(null);
                setHoverTargetSq(null);
              }}
              onTouchStart={() => {
                if (canDragPiece) {
                  setDraggedFromSq(sqName);
                  if (onStartPieceDrag) {
                    onStartPieceDrag(sqName);
                  } else {
                    onSquareClick(sqName);
                  }
                }
              }}
              onTouchMove={handleTouchMoveTrack}
              onTouchEnd={handleTouchEndResolve}
              aria-label={`Casilla ${sqName}${cell ? ` con pieza ${cell.color}${cell.type}` : ''}`}
              className={`relative flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-yellow-300 ring-2 ring-inset ring-amber-600'
                  : isHoveredDrop
                  ? 'bg-emerald-300 ring-2 ring-inset ring-emerald-700'
                  : isLight
                  ? boardTheme.lightSquareClass
                  : boardTheme.darkSquareClass
              } ${canDragPiece ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
            >
              {cIdx === 0 && (
                <span
                  className={`absolute top-0.5 left-1 text-[9px] font-mono font-bold opacity-70 pointer-events-none ${boardTheme.coordTextClass}`}
                >
                  {8 - rIdx}
                </span>
              )}
              {rIdx === 7 && (
                <span
                  className={`absolute bottom-0.5 right-1 text-[9px] font-mono font-bold opacity-70 pointer-events-none ${boardTheme.coordTextClass}`}
                >
                  {files[cIdx]}
                </span>
              )}
              {isTarget && (
                <span
                  className={`pointer-events-none z-10 ${
                    cell
                      ? 'absolute inset-1 rounded-full ring-4 ring-rose-500/85 animate-pulse'
                      : 'w-3.5 h-3.5 rounded-full bg-emerald-900/55 ring-2 ring-white/60'
                  }`}
                />
              )}
              {pieceKey && (
                <span
                  className={`text-2xl sm:text-4xl leading-none select-none pointer-events-none ${
                    cell?.color === 'w'
                      ? piecesStyle.whitePieceClass
                      : piecesStyle.blackPieceClass
                  }`}
                >
                  {piecesStyle.pieceMap[pieceKey]}
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}

interface ChessSectionViewProps {
  currentUserId?: string;
  currentUserName?: string;
  currentUserFriendCode?: string;
  currentUserAvatarId?: string;
  ageGroup: AgeGroup;
  chessXp: number;
  completedChessLessonIds: string[];
  acceptedFriends: AcceptedFriendSummary[];
  activeNetworkMatch?: NetworkChessMatch | null;
  onSendFriendChessInvite?: (params: {
    friend: AcceptedFriendSummary;
    timeControlId: ChessTimeControlId;
    colorPreference: ChessColorPreference;
  }) => void;
  onOpenFriendsTab?: () => void;
  selectedBoardId: string;
  selectedPiecesId: string;
  selectedCoachId: string;
  unlockedCoachIds: string[];
  onSelectCoach: (coachId: string) => void;
  onOpenShop: () => void;
  onEarnChessXp: (
    xpAmount: number,
    completedLessonId?: string,
    gemsEarned?: number
  ) => void;
}

export function ChessSectionView({
  currentUserId = 'local_user',
  currentUserName = 'Jugador',
  currentUserFriendCode = 'LUMI-1000',
  currentUserAvatarId = 'avatar_1',
  ageGroup,
  chessXp,
  completedChessLessonIds,
  acceptedFriends,
  activeNetworkMatch = null,
  onSendFriendChessInvite,
  onOpenFriendsTab,
  selectedBoardId,
  selectedPiecesId,
  selectedCoachId,
  unlockedCoachIds,
  onSelectCoach,
  onOpenShop,
  onEarnChessXp,
}: ChessSectionViewProps) {
  const [mode, setMode] = useState<'bot' | 'friend' | 'lessons'>(
    activeNetworkMatch ? 'friend' : 'bot'
  );
  const [botElo, setBotElo] = useState<BotEloLevel>('1000');
  const [selectedFriendId, setSelectedFriendId] = useState<string>(
    acceptedFriends[0]?.id || ''
  );

  // Modal de Configuración de Partida con Amigo (Temporizador + Color + Amigo)
  const [inviteModalOpen, setInviteModalOpen] = useState<boolean>(false);
  const [matchTimeControlId, setMatchTimeControlId] =
    useState<ChessTimeControlId>(
      activeNetworkMatch?.timeControlId || '5min'
    );
  const [playerAssignedColor, setPlayerAssignedColor] = useState<'w' | 'b'>(
    'w'
  );
  const [whiteClockSeconds, setWhiteClockSeconds] = useState<number | null>(
    activeNetworkMatch
      ? activeNetworkMatch.whiteTimeSeconds
      : getChessTimeControlById('5min').initialSeconds
  );
  const [blackClockSeconds, setBlackClockSeconds] = useState<number | null>(
    activeNetworkMatch
      ? activeNetworkMatch.blackTimeSeconds
      : getChessTimeControlById('5min').initialSeconds
  );
  const [clockRunning, setClockRunning] = useState<boolean>(false);
  const [localMatchId, setLocalMatchId] = useState<string | null>(
    activeNetworkMatch?.id || null
  );
  const [inviteSentNotification, setInviteSentNotification] = useState<
    string | null
  >(null);

  // Equipamiento activo desde la Tienda
  const activeBoardTheme =
    CHESS_BOARDS_CATALOG.find((b) => b.id === selectedBoardId) ||
    CHESS_BOARDS_CATALOG[0];
  const activePiecesStyle =
    CHESS_PIECES_CATALOG.find((p) => p.id === selectedPiecesId) ||
    CHESS_PIECES_CATALOG[0];
  const activeCoach =
    CHESS_COACHES_CATALOG.find((c) => c.id === selectedCoachId) ||
    CHESS_COACHES_CATALOG[0];

  const [coachDialogue, setCoachDialogue] = useState<string>(
    activeCoach.greetingQuote
  );

  // Estado del motor chess.js para partida Bot / Amigo
  const gameRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState<string>(gameRef.current.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargetSquares, setLegalTargetSquares] = useState<Square[]>([]);
  const [moveHistorySan, setMoveHistorySan] = useState<string[]>([]);
  const [statusBanner, setStatusBanner] = useState<string>(
    'Tu turno con Blancas. Arrastra una pieza o haz clic para ver sus movimientos legales.'
  );

  // Sincronización en tiempo real cuando llega o se actualiza una partida en red con un amigo
  useEffect(() => {
    if (!activeNetworkMatch) return;
    setMode('friend');
    setLocalMatchId(activeNetworkMatch.id);
    setMatchTimeControlId(activeNetworkMatch.timeControlId);
    setWhiteClockSeconds(activeNetworkMatch.whiteTimeSeconds);
    setBlackClockSeconds(activeNetworkMatch.blackTimeSeconds);

    const amIHost =
      activeNetworkMatch.hostId === currentUserId ||
      activeNetworkMatch.hostFriendCode === currentUserFriendCode;
    const myColor = amIHost
      ? activeNetworkMatch.hostColor
      : activeNetworkMatch.guestColor;
    setPlayerAssignedColor(myColor);

    if (activeNetworkMatch.fen && activeNetworkMatch.fen !== gameRef.current.fen()) {
      try {
        gameRef.current = new Chess(activeNetworkMatch.fen);
        setFen(activeNetworkMatch.fen);
        setMoveHistorySan(activeNetworkMatch.moveHistorySan || []);
        setSelectedSquare(null);
        setLegalTargetSquares([]);
      } catch {
        // Ignore invalid FEN
      }
    }

    if (activeNetworkMatch.status === 'pending_invite') {
      setClockRunning(false);
      setStatusBanner(
        `Invitación enviada a ${activeNetworkMatch.guestName} (${activeNetworkMatch.timeControlLabel} · Juegas con ${
          myColor === 'w' ? 'Blancas ♔' : 'Negras ♚'
        }). Esperando aceptación o realiza tu primera jugada.`
      );
    } else if (activeNetworkMatch.status === 'active') {
      setClockRunning(activeNetworkMatch.initialSeconds !== null);
      const isMyTurn = activeNetworkMatch.turn === myColor;
      setStatusBanner(
        isMyTurn
          ? `¡Tu turno (${myColor === 'w' ? 'Blancas ♔' : 'Negras ♚'})! Reloj activo (${activeNetworkMatch.timeControlLabel}).`
          : `Turno de tu amigo (${activeNetworkMatch.turn === 'w' ? 'Blancas ♔' : 'Negras ♚'}). Reloj en marcha.`
      );
    } else if (activeNetworkMatch.status === 'completed') {
      setClockRunning(false);
      if (activeNetworkMatch.winReason) {
        setStatusBanner(activeNetworkMatch.winReason);
      }
    }
  }, [
    activeNetworkMatch?.id,
    activeNetworkMatch?.fen,
    activeNetworkMatch?.status,
    activeNetworkMatch?.whiteTimeSeconds,
    activeNetworkMatch?.blackTimeSeconds,
    activeNetworkMatch?.updatedAt,
    currentUserId,
    currentUserFriendCode,
  ]);

  // Reloj de Ajedrez en Vivo (cuenta regresiva segundo a segundo para el turno activo)
  useEffect(() => {
    if (!clockRunning || (mode !== 'friend' && mode !== 'bot')) return;
    if (whiteClockSeconds === null || blackClockSeconds === null) return;
    if (gameRef.current.isGameOver()) return;

    const timer = window.setInterval(() => {
      const currentTurn = gameRef.current.turn();
      const tickResult = tickChessClock({
        whiteTimeSeconds: whiteClockSeconds,
        blackTimeSeconds: blackClockSeconds,
        activeTurn: currentTurn,
        status: 'active',
        elapsedSeconds: 1,
      });

      setWhiteClockSeconds(tickResult.whiteTimeSeconds);
      setBlackClockSeconds(tickResult.blackTimeSeconds);

      if (tickResult.status === 'completed' && tickResult.timeoutWinner) {
        setClockRunning(false);
        playRewardSound('fanfare');
        const reason =
          tickResult.winReason ||
          '¡Tiempo agotado en el reloj de ajedrez!';
        setStatusBanner(reason);
        if (localMatchId) {
          realtimeNetwork.syncChessMatchMove({
            matchId: localMatchId,
            fen: gameRef.current.fen(),
            moveHistorySan: moveHistorySan,
            turn: currentTurn,
            whiteTimeSeconds: tickResult.whiteTimeSeconds,
            blackTimeSeconds: tickResult.blackTimeSeconds,
            status: 'completed',
            winnerColor: tickResult.timeoutWinner,
            winReason: reason,
          });
        }
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    clockRunning,
    mode,
    whiteClockSeconds,
    blackClockSeconds,
    localMatchId,
    moveHistorySan,
  ]);

  // Estado para Lecciones Interactivas de Ajedrez (4 lecciones pedagógicas con chess.js)
  const [activeLesson, setActiveLesson] = useState<ChessLessonInteractive | null>(
    CHESS_ACADEMY_LESSONS[0] || null
  );
  const lessonGameRef = useRef<Chess>(
    new Chess(CHESS_ACADEMY_LESSONS[0]?.initialFen || undefined)
  );
  const [lessonFen, setLessonFen] = useState<string>(
    CHESS_ACADEMY_LESSONS[0]?.initialFen || ''
  );
  const [lessonSelectedSq, setLessonSelectedSq] = useState<Square | null>(null);
  const [lessonLegalTargets, setLessonLegalTargets] = useState<Square[]>([]);
  const [lessonSolved, setLessonSolved] = useState<boolean>(false);
  const [lessonFeedback, setLessonFeedback] = useState<string | null>(null);

  const isYoungKid = ageGroup === '3-6';
  const isTeenDark = ageGroup === '14-18';
  const chessLevelInfo = calculateLevelFromXP(chessXp);

  const activeBotConfig =
    CHESS_BOT_LEVELS.find((b) => b.elo === botElo) || CHESS_BOT_LEVELS[1];

  const resetMatch = (
    newMode?: 'bot' | 'friend',
    nextElo?: BotEloLevel,
    nextTimeControlId?: ChessTimeControlId
  ) => {
    const targetMode = newMode || mode;
    const targetElo = nextElo || botElo;
    const tcOption = getChessTimeControlById(
      nextTimeControlId || matchTimeControlId
    );
    playRewardSound('pop');
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setSelectedSquare(null);
    setLegalTargetSquares([]);
    setMoveHistorySan([]);
    setWhiteClockSeconds(tcOption.initialSeconds);
    setBlackClockSeconds(tcOption.initialSeconds);
    setClockRunning(false);
    setCoachDialogue(activeCoach.greetingQuote);
    setStatusBanner(
      targetMode === 'bot'
        ? `Partida iniciada contra Bot ${targetElo} ELO (${tcOption.shortLabel}). Mueven las Blancas.`
        : `Partida en tiempo real con tu amigo (${tcOption.label}). Mueven las Blancas.`
    );
  };

  const handleCreateAndSendFriendInvite = (params: {
    friend: AcceptedFriendSummary;
    timeControlId: ChessTimeControlId;
    colorPreference: ChessColorPreference;
  }) => {
    const tcOption = getChessTimeControlById(params.timeControlId);
    const colors = resolveChessInviteColors(params.colorPreference);
    const freshGame = new Chess();
    const matchId = `chess_match_${Date.now()}`;

    const newMatch: NetworkChessMatch = {
      id: matchId,
      eventType: 'CHESS_INVITE',
      hostId: currentUserId,
      hostName: currentUserName,
      hostFriendCode: currentUserFriendCode,
      hostAvatarId: currentUserAvatarId,
      hostColor: colors.hostColor,
      guestId: params.friend.id,
      guestName: params.friend.name,
      guestFriendCode: params.friend.friendCode || params.friend.username,
      guestAvatarId: params.friend.avatarId,
      guestColor: colors.guestColor,
      timeControlId: params.timeControlId,
      timeControlLabel: tcOption.label,
      initialSeconds: tcOption.initialSeconds,
      whiteTimeSeconds: tcOption.initialSeconds,
      blackTimeSeconds: tcOption.initialSeconds,
      colorPreference: params.colorPreference,
      status: 'pending_invite',
      fen: freshGame.fen(),
      moveHistorySan: [],
      turn: 'w',
      updatedAt: Date.now(),
    };

    setSelectedFriendId(params.friend.id);
    setMatchTimeControlId(params.timeControlId);
    setPlayerAssignedColor(colors.hostColor);
    setWhiteClockSeconds(tcOption.initialSeconds);
    setBlackClockSeconds(tcOption.initialSeconds);
    setClockRunning(tcOption.initialSeconds !== null);
    setLocalMatchId(matchId);
    setMode('friend');
    gameRef.current = freshGame;
    setFen(freshGame.fen());
    setMoveHistorySan([]);
    setInviteModalOpen(false);
    setInviteSentNotification(
      `¡Solicitud de partida enviada en tiempo real a ${params.friend.name}! (${tcOption.label} · Juegas con ${
        colors.hostColor === 'w' ? 'Blancas ♔' : 'Negras ♚'
      })`
    );
    setStatusBanner(
      `Reto enviado a ${params.friend.name} con reloj ${tcOption.label}. Juegas con ${
        colors.hostColor === 'w' ? 'Blancas ♔' : 'Negras ♚'
      }.`
    );

    realtimeNetwork.sendChessInvite({
      match: newMatch,
      friendshipId: params.friend.friendshipId,
    });

    if (onSendFriendChessInvite) {
      onSendFriendChessInvite(params);
    }
  };

  const handleAskCoachHint = () => {
    playRewardSound('pop');
    if (mode === 'lessons' && activeLesson) {
      const msg = `${activeCoach.name} (${activeCoach.personality}): "Observa la consigna: ${activeLesson.objectiveText} (Jugada ganadora: ${activeLesson.targetMoveSan[0]})"`;
      setCoachDialogue(msg);
      speakSpanishText(msg);
      return;
    }

    const game = gameRef.current;
    const bestMoveForPlayer = computeRealChessBotMove(game, '2000');
    if (!bestMoveForPlayer) return;
    const hintText = `${activeCoach.hintQuote} Mi cálculo táctico sugiere mover de ${bestMoveForPlayer.from} a ${bestMoveForPlayer.to} (${bestMoveForPlayer.san}).`;
    setCoachDialogue(hintText);
    speakSpanishText(hintText);
  };

  const handleAwardQuickWin = () => {
    playRewardSound('fanfare');
    setClockRunning(false);
    setCoachDialogue(activeCoach.victoryQuote);
    setStatusBanner(
      '¡Victoria táctica registrada! Ganaste +50 XP de Ajedrez y +8 gemas para la Tienda.'
    );
    onEarnChessXp(50, undefined, 8);
  };

  const executeMatchMove = (fromSq: Square, toSq: Square): boolean => {
    const game = gameRef.current;
    if (game.isGameOver()) return false;
    if (mode === 'bot' && game.turn() !== 'w') return false;
    if (mode === 'friend' && acceptedFriends.length === 0) return false;

    try {
      const move = game.move({
        from: fromSq,
        to: toSq,
        promotion: 'q',
      });
      if (!move) return false;

      playRewardSound('pop');
      const nextFen = game.fen();
      const nextHistory = [...game.history()];
      setFen(nextFen);
      setMoveHistorySan(nextHistory);
      setSelectedSquare(null);
      setLegalTargetSquares([]);

      if (whiteClockSeconds !== null && blackClockSeconds !== null) {
        setClockRunning(true);
      }

      if (game.isCheckmate()) {
        playRewardSound('fanfare');
        setClockRunning(false);
        const winner = game.turn() === 'w' ? 'Negras' : 'Blancas';
        const winText = `¡Jaque Mate! Ganan las ${winner}. (+50 XP y +8 Gemas)`;
        setCoachDialogue(activeCoach.victoryQuote);
        setStatusBanner(winText);
        onEarnChessXp(50, undefined, 8);

        if (mode === 'friend' && localMatchId) {
          realtimeNetwork.syncChessMatchMove({
            matchId: localMatchId,
            fen: nextFen,
            moveHistorySan: nextHistory,
            turn: game.turn(),
            whiteTimeSeconds: whiteClockSeconds,
            blackTimeSeconds: blackClockSeconds,
            status: 'completed',
            winnerColor: game.turn() === 'w' ? 'b' : 'w',
            winReason: winText,
          });
        }
        return true;
      }
      if (game.isDraw()) {
        setClockRunning(false);
        const drawText = 'Partida finalizada en Tablas. (+20 XP y +5 Gemas)';
        setStatusBanner(drawText);
        onEarnChessXp(20, undefined, 5);
        if (mode === 'friend' && localMatchId) {
          realtimeNetwork.syncChessMatchMove({
            matchId: localMatchId,
            fen: nextFen,
            moveHistorySan: nextHistory,
            turn: game.turn(),
            whiteTimeSeconds: whiteClockSeconds,
            blackTimeSeconds: blackClockSeconds,
            status: 'completed',
            winnerColor: 'draw',
            winReason: drawText,
          });
        }
        return true;
      }

      if (move.captured) {
        setCoachDialogue(
          `¡Buena captura en ${move.to} (${move.san})! Mantén tus piezas coordinadas.`
        );
      }

      if (mode === 'bot') {
        setStatusBanner(
          `El ${activeBotConfig.title} está calculando su jugada...`
        );
        setTimeout(() => {
          const botMove = computeRealChessBotMove(game, botElo);
          if (botMove) {
            game.move(botMove);
            setFen(game.fen());
            setMoveHistorySan([...game.history()]);
            if (game.isCheckmate()) {
              playRewardSound('wrong');
              setClockRunning(false);
              setCoachDialogue(activeCoach.mistakeQuote);
              setStatusBanner(
                `¡Jaque Mate del ${activeBotConfig.title} (${botMove.san})! Pulsa Nueva Partida para la revancha.`
              );
            } else if (game.inCheck()) {
              playRewardSound('wrong');
              setCoachDialogue(
                `${activeCoach.mistakeQuote} ¡Tu Rey está en Jaque tras ${botMove.san}, defiende o mueve tu Rey!`
              );
              setStatusBanner(
                `¡Atención! El Bot (${botElo} ELO) jugó ${botMove.san} Jaque. Protege a tu Rey.`
              );
            } else {
              setStatusBanner(
                `El Bot (${botElo} ELO) jugó ${botMove.san}. Es tu turno con Blancas.`
              );
            }
          }
        }, 260);
      } else {
        const turnLabel =
          game.turn() === 'w' ? 'Blancas ♔' : 'Negras ♚';
        setStatusBanner(
          game.inCheck()
            ? `¡Jaque! Turno de ${turnLabel} (Sincronizado en tiempo real).`
            : `Jugada ${move.san} enviada en vivo. Turno de ${turnLabel}.`
        );

        if (localMatchId) {
          realtimeNetwork.syncChessMatchMove({
            matchId: localMatchId,
            fen: nextFen,
            moveHistorySan: nextHistory,
            turn: game.turn(),
            whiteTimeSeconds: whiteClockSeconds,
            blackTimeSeconds: blackClockSeconds,
            status: 'active',
          });
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  const selectMatchSquare = (sq: Square) => {
    const game = gameRef.current;
    const pieceOnSq = game.get(sq);
    if (pieceOnSq && pieceOnSq.color === game.turn()) {
      setSelectedSquare(sq);
      const moves = game.moves({ square: sq, verbose: true });
      setLegalTargetSquares(moves.map((m) => m.to as Square));
    } else {
      setSelectedSquare(null);
      setLegalTargetSquares([]);
    }
  };

  const handleSquareClick = (sq: Square) => {
    const game = gameRef.current;
    if (game.isGameOver()) return;
    if (mode === 'bot' && game.turn() !== 'w') return;
    if (mode === 'friend' && acceptedFriends.length === 0) return;

    if (selectedSquare && legalTargetSquares.includes(sq)) {
      if (executeMatchMove(selectedSquare, sq)) {
        return;
      }
    }
    selectMatchSquare(sq);
  };

  const handleMatchPieceDrop = (fromSq: Square, toSq: Square) => {
    if (!executeMatchMove(fromSq, toSq)) {
      setCoachDialogue(activeCoach.mistakeQuote);
    }
  };

  const openChessLesson = (lesson: ChessLessonInteractive) => {
    playRewardSound('pop');
    lessonGameRef.current = new Chess(lesson.initialFen);
    setActiveLesson(lesson);
    setLessonFen(lesson.initialFen);
    setLessonSelectedSq(null);
    setLessonLegalTargets([]);
    setLessonSolved(false);
    setLessonFeedback(null);
    setCoachDialogue(`${activeCoach.name}: "${lesson.objectiveText}"`);
  };

  const executeLessonMove = (fromSq: Square, toSq: Square): boolean => {
    if (!activeLesson || lessonSolved) return false;
    const lGame = lessonGameRef.current;

    try {
      const move = lGame.move({
        from: fromSq,
        to: toSq,
        promotion: 'q',
      });
      if (!move) return false;

      setLessonSelectedSq(null);
      setLessonLegalTargets([]);

      const normalizedSan = move.san.replace(/[+#]/g, '');
      const isCorrectMove = activeLesson.targetMoveSan.some(
        (target) =>
          target === move.san || target.replace(/[+#]/g, '') === normalizedSan
      );

      if (isCorrectMove) {
        playRewardSound('fanfare');
        setLessonFen(lGame.fen());
        setLessonSolved(true);
        setCoachDialogue(activeCoach.victoryQuote);
        setLessonFeedback(
          `${activeLesson.explanation} (+${activeLesson.xpReward} XP y +5 Gemas)`
        );
        onEarnChessXp(activeLesson.xpReward, activeLesson.id, 5);
      } else {
        playRewardSound('wrong');
        lGame.undo();
        setLessonFen(lGame.fen());
        setCoachDialogue(activeCoach.mistakeQuote);
        setLessonFeedback(
          `Jugaste ${move.san}, pero no cumple la consigna. ${activeLesson.objectiveText}`
        );
      }
      return true;
    } catch {
      return false;
    }
  };

  const selectLessonSquare = (sq: Square) => {
    if (!activeLesson || lessonSolved) return;
    const lGame = lessonGameRef.current;
    const piece = lGame.get(sq);
    if (piece && piece.color === lGame.turn()) {
      setLessonSelectedSq(sq);
      const moves = lGame.moves({ square: sq, verbose: true });
      setLessonLegalTargets(moves.map((m) => m.to as Square));
    } else {
      setLessonSelectedSq(null);
      setLessonLegalTargets([]);
    }
  };

  const handleLessonSquareClick = (sq: Square) => {
    if (!activeLesson || lessonSolved) return;
    if (lessonSelectedSq && lessonLegalTargets.includes(sq)) {
      if (executeLessonMove(lessonSelectedSq, sq)) {
        return;
      }
    }
    selectLessonSquare(sq);
  };

  const handleLessonPieceDrop = (fromSq: Square, toSq: Square) => {
    executeLessonMove(fromSq, toSq);
  };

  const unlockedCoaches = CHESS_COACHES_CATALOG.filter(
    (c) => unlockedCoachIds.includes(c.id) || c.gemCost === 0
  );

  return (
    <div className="space-y-8" data-testid="chess-section-root">
      {/* Cabecera de la Academia y Club de Ajedrez */}
      <section
        className={`rounded-[34px] p-6 sm:p-8 border ${
          isYoungKid
            ? 'bg-gradient-to-r from-[#FFF5F5] via-[#FFFDF7] to-[#ECFCCB] border-2 border-[#FF6B6B]/40'
            : isTeenDark
            ? 'bg-[#181326] text-white border-purple-900/50'
            : 'bg-white text-slate-900 border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-extrabold text-emerald-500 flex items-center gap-2">
              <span>
                Academia de Ajedrez · Tablero: {activeBoardTheme.name} · Fichas:{' '}
                {activePiecesStyle.name}
              </span>
            </div>
            <h1
              className={`font-display font-black ${
                isYoungKid ? 'text-3xl text-slate-900' : 'text-2xl sm:text-3xl'
              }`}
            >
              {isYoungKid
                ? '¡Juega al Ajedrez Mágico!'
                : 'Club de Ajedrez: Bots (200, 1000 y 2000 ELO), Amigos y Lecciones'}
            </h1>
            <p
              className={`text-sm ${
                isTeenDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Mueve las piezas <strong>arrastrándolas (Drag &amp; Drop)</strong> o{' '}
              <strong>haciendo clic</strong>. Gana <strong>+8 gemas</strong> al vencer
              en partidas y <strong>+5 gemas</strong> en cada lección con tu
              entrenador <strong>{activeCoach.name}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div
              className={`px-4 py-3 rounded-2xl border ${
                isTeenDark
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="text-xs opacity-75">Nivel de Ajedrez</div>
              <div className="text-lg font-extrabold tabular-nums">
                Nivel {chessLevelInfo.level} · {chessXp} XP
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenShop}
              className="px-4 py-3 rounded-2xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              Personalizar Tablero y Fichas
            </button>
          </div>
        </div>

        {/* TARJETA DEL ENTRENADOR INTERACTIVO EN VIVO */}
        <div
          data-testid="active-chess-coach-card"
          className={`mt-6 p-4 sm:p-5 rounded-3xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isTeenDark
              ? 'bg-[#221B35] border-purple-700/50 text-white'
              : 'bg-amber-50/90 border-amber-300 text-slate-900'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeCoach.accentClass} flex items-center justify-center text-3xl shadow-md shrink-0`}
            >
              {activeCoach.avatarEmoji}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-sm">
                  Entrenador: {activeCoach.name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[11px] font-extrabold">
                  {activeCoach.personality}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                "{coachDialogue}"
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAskCoachHint}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5"
            >
              <Lightbulb className="w-4 h-4" />
              Pedir Pista
            </button>
            <button
              type="button"
              onClick={() => speakSpanishText(coachDialogue)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
            >
              <Volume2 className="w-4 h-4" />
              Escuchar
            </button>
            {unlockedCoaches.length > 1 && (
              <select
                aria-label="Cambiar entrenador desbloqueado"
                value={activeCoach.id}
                onChange={(e) => {
                  const nextId = e.target.value;
                  onSelectCoach(nextId);
                  const found = CHESS_COACHES_CATALOG.find((c) => c.id === nextId);
                  if (found) setCoachDialogue(found.greetingQuote);
                }}
                className="h-9 px-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold"
              >
                {unlockedCoaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.personality})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Selector de las 3 modalidades de Ajedrez */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-200/40">
          <button
            type="button"
            data-testid="chess-mode-bot"
            onClick={() => {
              setMode('bot');
              resetMatch('bot');
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
              mode === 'bot'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isTeenDark
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500'
                : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Bot className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-bold text-sm">
                Jugar contra Bots (200, 1000, 2000 ELO)
              </div>
              <div className="text-xs opacity-80">
                Motor Minimax Alfa-Beta + Tablas Posicionales
              </div>
            </div>
          </button>

          <button
            type="button"
            data-testid="chess-mode-friend"
            onClick={() => {
              setMode('friend');
              setInviteModalOpen(true);
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
              mode === 'friend'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isTeenDark
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500'
                : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Users className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-bold text-sm">Jugar con un Amigo</div>
              <div className="text-xs opacity-80">
                Configurar Reloj (3, 5, 10, 15 min) y Enviar Solicitud ({acceptedFriends.length})
              </div>
            </div>
          </button>

          <button
            type="button"
            data-testid="chess-mode-lessons"
            onClick={() => {
              playRewardSound('pop');
              setMode('lessons');
              if (!activeLesson && CHESS_ACADEMY_LESSONS[0]) {
                openChessLesson(CHESS_ACADEMY_LESSONS[0]);
              }
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
              mode === 'lessons'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isTeenDark
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500'
                : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300'
            }`}
          >
            <BookOpen className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-bold text-sm">Lecciones Pedagógicas (4 Niveles)</div>
              <div className="text-xs opacity-80">
                Mate en 1, Capturas, Tenedor y Salir del Jaque
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* MODAL DE CONFIGURACIÓN DE PARTIDA CON AMIGO (AMIGO + TEMPORIZADOR + COLOR + ENVIAR SOLICITUD) */}
      <ChessFriendInviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        acceptedFriends={acceptedFriends}
        initialFriendId={selectedFriendId}
        onSendInvite={handleCreateAndSendFriendInvite}
        onGoToFriendsTab={onOpenFriendsTab}
      />

      {/* NOTIFICACIÓN DE INVITACIÓN ENVIADA EN TIEMPO REAL */}
      {inviteSentNotification && (
        <div
          data-testid="chess-invite-sent-banner"
          className="p-4 rounded-3xl bg-emerald-600 text-white border-2 border-emerald-300 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-300 shrink-0" />
            <div className="text-xs sm:text-sm font-black">
              {inviteSentNotification}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setInviteSentNotification(null)}
            className="px-3.5 py-1.5 rounded-full bg-white text-emerald-800 font-black text-xs shrink-0 cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* VISTA 1 y 2: TABLERO CONTRA EL BOT (200 / 1000 / 2000 ELO) O CON UN AMIGO */}
      {(mode === 'bot' || mode === 'friend') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div
            className={`lg:col-span-7 rounded-3xl border p-6 sm:p-8 ${
              isTeenDark
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            {mode === 'friend' && acceptedFriends.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                <h2 className="text-xl font-bold font-display">
                  Aún no tienes amigos aceptados para jugar
                </h2>
                <p className="text-sm opacity-75 max-w-md mx-auto">
                  Solo los amigos de tu misma etapa que hayan aceptado tu solicitud de amistad pueden jugar contigo en tiempo real. Ve a la pestaña Amigos para conectar un compañero por Código de Amigo (LUMI-XXXX) o juega contra los Bots de 200, 1000 y 2000 ELO.
                </p>
                {onOpenFriendsTab && (
                  <button
                    type="button"
                    onClick={onOpenFriendsTab}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer"
                  >
                    Ir a Amigos para Conectar Compañero
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {/* RELOJ DE AJEDREZ DUAL EN VIVO (VISIBLE Y SINCRONIZADO) */}
                <div
                  data-testid="chess-clock-panel"
                  className={`p-3.5 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-3 ${
                    isTeenDark
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      data-testid="chess-clock-white"
                      className={`px-3.5 py-2 rounded-xl font-mono font-black text-sm sm:text-base flex items-center gap-2 border ${
                        gameRef.current.turn() === 'w'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <span>♔ Blancas:</span>
                      <span>{formatChessClock(whiteClockSeconds)}</span>
                    </div>

                    <div
                      data-testid="chess-clock-black"
                      className={`px-3.5 py-2 rounded-xl font-mono font-black text-sm sm:text-base flex items-center gap-2 border ${
                        gameRef.current.turn() === 'b'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                          : 'bg-slate-900 text-white border-slate-700'
                      }`}
                    >
                      <span>♚ Negras:</span>
                      <span>{formatChessClock(blackClockSeconds)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold opacity-80 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      {getChessTimeControlById(matchTimeControlId).label}
                    </span>
                    {mode === 'friend' && (
                      <button
                        type="button"
                        data-testid="open-chess-invite-modal-btn"
                        onClick={() => setInviteModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Configurar Reloj / Retar ♟️
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold">{statusBanner}</div>
                    <div className="text-[11px] opacity-75 flex items-center gap-1">
                      <MoveIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        Puedes mover arrastrando la pieza (Drag &amp; Drop) o haciendo clic en origen y destino.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {moveHistorySan.length >= 4 && (
                      <button
                        type="button"
                        onClick={handleAwardQuickWin}
                        className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-extrabold flex items-center gap-1"
                      >
                        <Gem className="w-3.5 h-3.5" />
                        Reclamar Victoria (+8 Gemas)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => resetMatch()}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Nueva Partida
                    </button>
                  </div>
                </div>

                <InteractiveChessboard
                  fen={fen}
                  selectedSquare={selectedSquare}
                  legalTargetSquares={legalTargetSquares}
                  onSquareClick={handleSquareClick}
                  onPieceDropMove={handleMatchPieceDrop}
                  onStartPieceDrag={selectMatchSquare}
                  boardTheme={activeBoardTheme}
                  piecesStyle={activePiecesStyle}
                  testId="interactive-chessboard"
                />
              </div>
            )}
          </div>

          <aside
            className={`lg:col-span-5 rounded-3xl border p-6 space-y-5 ${
              isTeenDark
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            {mode === 'bot' ? (
              <div className="space-y-3" data-testid="chess-bot-elo-selector">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base">
                    Nivel de ELO Real del Bot
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-extrabold">
                    Activo: {botElo} ELO
                  </span>
                </div>
                <div className="space-y-2.5">
                  {CHESS_BOT_LEVELS.map((lvl) => {
                    const isSelected = botElo === lvl.elo;
                    return (
                      <button
                        key={lvl.elo}
                        type="button"
                        data-testid={`bot-elo-${lvl.elo}`}
                        onClick={() => {
                          setBotElo(lvl.elo);
                          resetMatch('bot', lvl.elo);
                        }}
                        className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/15 shadow-xs'
                            : isTeenDark
                            ? 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black">
                            {lvl.title} — {lvl.subtitle}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[11px] font-mono font-bold">
                            Prof. {lvl.depth}
                          </span>
                        </div>
                        <p className="text-xs opacity-80 mt-1 leading-relaxed">
                          {lvl.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-bold text-base">
                    Partida con Amigo y Reloj
                  </h2>
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Configurar y Enviar Reto ♟️
                  </button>
                </div>

                {acceptedFriends.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold opacity-75">
                      Tus amigos aceptados ({acceptedFriends.length}):
                    </div>
                    {acceptedFriends.map((fr) => (
                      <div
                        key={fr.id}
                        className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                          selectedFriendId === fr.id
                            ? 'border-emerald-500 bg-emerald-500/15 font-bold'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-bold truncate">
                            {fr.name} ({fr.friendCode || fr.username})
                          </div>
                          <div className="text-[11px] text-emerald-600 font-bold">
                            Tu color asignado:{' '}
                            {playerAssignedColor === 'w'
                              ? 'Blancas ♔'
                              : 'Negras ♚'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFriendId(fr.id);
                            setInviteModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shrink-0 cursor-pointer"
                        >
                          ♟️ Retar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-200/30 space-y-2">
              <div className="text-xs font-semibold opacity-75">
                Notación Algebraica ({moveHistorySan.length} jugadas)
              </div>
              <div
                className={`p-3.5 rounded-2xl min-h-[100px] max-h-[180px] overflow-y-auto font-mono text-xs ${
                  isTeenDark
                    ? 'bg-slate-950 text-slate-300'
                    : 'bg-slate-50 text-slate-700'
                }`}
              >
                {moveHistorySan.length === 0
                  ? 'Aún no se han realizado movimientos en esta partida.'
                  : moveHistorySan.map((san, idx) => (
                      <span key={idx} className="inline-block mr-3 mb-1">
                        {idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}. ` : ''}
                        <strong>{san}</strong>
                      </span>
                    ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* VISTA 3: LECCIONES DE AJEDREZ CON SENTIDO PEDAGÓGICO Y DRAG & DROP */}
      {mode === 'lessons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div
            className={`lg:col-span-6 rounded-3xl border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <h2 className="text-xl font-bold font-display">
              Curso de Ajedrez: 4 Lecciones Pedagógicas (+5 Gemas por Nivel)
            </h2>
            <p className="text-xs opacity-75">
              Aprende sobre el tablero real: Jaque Mate en 1, capturar piezas indefensas, ataque doble (tenedor de caballo) y salir del jaque.
            </p>

            <div className="space-y-3">
              {CHESS_ACADEMY_LESSONS.map((lesson, idx) => {
                const prevId = idx > 0 ? CHESS_ACADEMY_LESSONS[idx - 1].id : null;
                const unlocked = isLessonUnlocked(
                  idx,
                  prevId,
                  completedChessLessonIds
                );
                const completed = completedChessLessonIds.includes(lesson.id);
                const isSelected = activeLesson?.id === lesson.id;

                return (
                  <div
                    key={lesson.id}
                    data-testid={`chess-academy-lesson-${lesson.levelNumber}`}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : completed
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : unlocked
                        ? isTeenDark
                          ? 'border-slate-700 bg-slate-800/70'
                          : 'border-slate-200 bg-slate-50'
                        : 'border-slate-200/40 opacity-55'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-emerald-600">
                        {lesson.categoryLabel} · +{lesson.xpReward} XP · +5 Gemas
                      </div>
                      <h3 className="font-bold text-sm sm:text-base">
                        {lesson.title}
                      </h3>
                      <p className="text-xs opacity-75">{lesson.description}</p>
                    </div>

                    <button
                      type="button"
                      disabled={!unlocked}
                      onClick={() => openChessLesson(lesson)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                        !unlocked
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {!unlocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          Bloqueada
                        </>
                      ) : completed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Repasar
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          Practicar
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`lg:col-span-6 rounded-3xl border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            {activeLesson ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-emerald-600">
                      {activeLesson.categoryLabel}
                    </div>
                    <h3 className="text-lg font-bold font-display">
                      {activeLesson.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakSpanishText(activeLesson.objectiveText)}
                    className="px-3 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                    Voz
                  </button>
                </div>

                {/* Consigna clara arriba del tablero */}
                <div
                  data-testid="chess-lesson-objective-banner"
                  className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-xs sm:text-sm font-bold space-y-1"
                >
                  <div>{activeLesson.objectiveText}</div>
                  <div className="text-[11px] opacity-80 font-medium">
                    Arrastra la pieza hasta la casilla destino o haz clic en las casillas.
                  </div>
                </div>

                <InteractiveChessboard
                  fen={lessonFen}
                  selectedSquare={lessonSelectedSq}
                  legalTargetSquares={lessonLegalTargets}
                  onSquareClick={handleLessonSquareClick}
                  onPieceDropMove={handleLessonPieceDrop}
                  onStartPieceDrag={selectLessonSquare}
                  boardTheme={activeBoardTheme}
                  piecesStyle={activePiecesStyle}
                  testId="lesson-interactive-chessboard"
                />

                {lessonFeedback && (
                  <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${
                      lessonSolved
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600'
                        : 'bg-amber-500/15 border-amber-500 text-amber-600'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{lessonFeedback}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 space-y-2 opacity-75">
                <Trophy className="w-10 h-10 text-emerald-500 mx-auto" />
                <div className="font-bold text-base">
                  Selecciona una lección desbloqueada a la izquierda
                </div>
                <p className="text-xs max-w-sm mx-auto">
                  Resolverás ejercicios reales sobre el tablero personalizado con la guía de {activeCoach.name}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
