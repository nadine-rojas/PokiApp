import React, { useState, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';
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
} from '../data/curriculumData';
import { playRewardSound, speakSpanishText } from '../utils/soundEffects';

export type BotDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface AcceptedFriendSummary {
  id: string;
  username: string;
  name: string;
  avatarId: string;
}

interface ChessSectionViewProps {
  ageGroup: AgeGroup;
  chessXp: number;
  completedChessLessonIds: string[];
  acceptedFriends: AcceptedFriendSummary[];
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

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

function evaluateBoardPosition(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -99999 : 99999;
  }
  if (game.isDraw()) return 0;

  const board = game.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const base = PIECE_VALUES[piece.type] || 0;
      const centerBonus =
        (r >= 2 && r <= 5 && c >= 2 && c <= 5 ? 18 : 0) +
        (r >= 3 && r <= 4 && c >= 3 && c <= 4 ? 22 : 0);
      const advancementBonus =
        piece.type === 'p' ? (piece.color === 'w' ? (6 - r) * 8 : (r - 1) * 8) : 0;
      const total = base + centerBonus + advancementBonus;
      score += piece.color === 'w' ? total : -total;
    }
  }
  return score;
}

function computeBestStockfishBotMove(game: Chess, difficulty: BotDifficulty): Move | null {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  if (difficulty === 'beginner') {
    const captures = legalMoves.filter((m) => m.captured);
    if (captures.length > 0 && Math.random() < 0.4) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  const depthByDifficulty: Record<BotDifficulty, number> = {
    beginner: 1,
    intermediate: 1,
    advanced: 2,
    expert: 3,
  };
  const maxDepth = depthByDifficulty[difficulty];

  function minimax(
    position: Chess,
    depth: number,
    alpha: number,
    beta: number,
    maximizingPlayer: boolean
  ): number {
    if (depth === 0 || position.isGameOver()) {
      return evaluateBoardPosition(position);
    }
    const moves = position.moves({ verbose: true });
    if (maximizingPlayer) {
      let maxEval = -Infinity;
      for (const mv of moves) {
        position.move(mv);
        const evaluation = minimax(position, depth - 1, alpha, beta, false);
        position.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const mv of moves) {
        position.move(mv);
        const evaluation = minimax(position, depth - 1, alpha, beta, true);
        position.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  let bestMove = legalMoves[0];
  let bestScore = Infinity;

  for (const mv of legalMoves) {
    game.move(mv);
    const score = minimax(game, maxDepth - 1, -Infinity, Infinity, true);
    game.undo();
    const jitter = difficulty === 'intermediate' ? (Math.random() - 0.5) * 35 : 0;
    if (score + jitter < bestScore) {
      bestScore = score + jitter;
      bestMove = mv;
    }
  }

  return bestMove;
}

export function ChessSectionView({
  ageGroup,
  chessXp,
  completedChessLessonIds,
  acceptedFriends,
  selectedBoardId,
  selectedPiecesId,
  selectedCoachId,
  unlockedCoachIds,
  onSelectCoach,
  onOpenShop,
  onEarnChessXp,
}: ChessSectionViewProps) {
  const [mode, setMode] = useState<'bot' | 'friend' | 'lessons'>('bot');
  const [difficulty, setDifficulty] = useState<BotDifficulty>('beginner');
  const [selectedFriendId, setSelectedFriendId] = useState<string>(
    acceptedFriends[0]?.id || ''
  );

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
    'Tu turno con Blancas. Toca una pieza para ver sus movimientos legales.'
  );

  // Estado para Lecciones Interactivas de Ajedrez
  const [activeLesson, setActiveLesson] = useState<ChessLessonInteractive | null>(null);
  const lessonGameRef = useRef<Chess>(new Chess());
  const [lessonFen, setLessonFen] = useState<string>('');
  const [lessonSelectedSq, setLessonSelectedSq] = useState<Square | null>(null);
  const [lessonLegalTargets, setLessonLegalTargets] = useState<Square[]>([]);
  const [lessonSolved, setLessonSolved] = useState<boolean>(false);
  const [lessonFeedback, setLessonFeedback] = useState<string | null>(null);

  const isYoungKid = ageGroup === '3-6';
  const isTeenDark = ageGroup === '14-18';
  const chessLevelInfo = calculateLevelFromXP(chessXp);

  const resetMatch = (newMode?: 'bot' | 'friend') => {
    const targetMode = newMode || mode;
    playRewardSound('pop');
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setSelectedSquare(null);
    setLegalTargetSquares([]);
    setMoveHistorySan([]);
    setCoachDialogue(activeCoach.greetingQuote);
    setStatusBanner(
      targetMode === 'bot'
        ? 'Partida iniciada contra el Bot Stockfish. Mueven las Blancas.'
        : 'Partida en tiempo real con tu amigo iniciada. Mueven las Blancas.'
    );
  };

  const handleAskCoachHint = () => {
    playRewardSound('pop');
    if (mode === 'lessons' && activeLesson) {
      const msg = `${activeCoach.name} (${activeCoach.personality}): "Observa el objetivo: ${activeLesson.objectiveText} (Jugada clave: ${activeLesson.targetMoveSan[0]})"`;
      setCoachDialogue(msg);
      speakSpanishText(msg);
      return;
    }

    const game = gameRef.current;
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return;
    const captureMove = moves.find((m) => m.captured);
    const centerMove = moves.find((m) =>
      ['e4', 'd4', 'f3', 'c3', 'e5', 'd5'].includes(m.to)
    );
    const suggested = captureMove || centerMove || moves[0];
    const hintText = `${activeCoach.hintQuote} Te sugiero considerar mover de ${suggested.from} a ${suggested.to} (${suggested.san}).`;
    setCoachDialogue(hintText);
    speakSpanishText(hintText);
  };

  const handleAwardQuickWin = () => {
    playRewardSound('fanfare');
    setCoachDialogue(activeCoach.victoryQuote);
    setStatusBanner(
      '¡Victoria táctica registrada! Ganaste +50 XP de Ajedrez y +8 gemas para la Tienda.'
    );
    onEarnChessXp(50, undefined, 8);
  };

  const handleSquareClick = (sq: Square) => {
    const game = gameRef.current;
    if (game.isGameOver()) return;

    if (mode === 'bot' && game.turn() !== 'w') return;
    if (mode === 'friend' && acceptedFriends.length === 0) return;

    if (selectedSquare && legalTargetSquares.includes(sq)) {
      try {
        const move = game.move({
          from: selectedSquare,
          to: sq,
          promotion: 'q',
        });
        if (move) {
          playRewardSound('pop');
          setFen(game.fen());
          setMoveHistorySan([...game.history()]);
          setSelectedSquare(null);
          setLegalTargetSquares([]);

          if (game.isCheckmate()) {
            playRewardSound('fanfare');
            const winner = game.turn() === 'w' ? 'Negras' : 'Blancas';
            setCoachDialogue(activeCoach.victoryQuote);
            setStatusBanner(
              `¡Jaque Mate! Ganan las ${winner}. (+50 XP y +8 Gemas)`
            );
            onEarnChessXp(50, undefined, 8);
            return;
          }
          if (game.isDraw()) {
            setStatusBanner('Partida finalizada en Tablas. (+20 XP y +5 Gemas)');
            onEarnChessXp(20, undefined, 5);
            return;
          }

          if (move.captured) {
            setCoachDialogue(
              `¡Buena captura en ${move.to}! Mantén tus piezas protegidas.`
            );
          }

          if (mode === 'bot') {
            setStatusBanner('El Bot Stockfish está calculando su jugada...');
            setTimeout(() => {
              const botMove = computeBestStockfishBotMove(game, difficulty);
              if (botMove) {
                game.move(botMove);
                setFen(game.fen());
                setMoveHistorySan([...game.history()]);
                if (game.isCheckmate()) {
                  playRewardSound('wrong');
                  setCoachDialogue(activeCoach.mistakeQuote);
                  setStatusBanner(
                    '¡Jaque Mate del Bot! Pulsa Nueva Partida para la revancha.'
                  );
                } else if (game.inCheck()) {
                  playRewardSound('wrong');
                  setCoachDialogue(
                    `${activeCoach.mistakeQuote} ¡Tu Rey está en Jaque, defiende o mueve tu Rey!`
                  );
                  setStatusBanner('¡Atención! Tu Rey está en Jaque. Protégelo.');
                } else {
                  setStatusBanner(
                    `El Bot jugó ${botMove.san}. Es tu turno con Blancas.`
                  );
                }
              }
            }, 420);
          } else {
            const turnLabel =
              game.turn() === 'w' ? 'Blancas (Tú)' : 'Negras (Tu Amigo)';
            setStatusBanner(
              game.inCheck()
                ? `¡Jaque! Turno de ${turnLabel}.`
                : `Jugada ${move.san} registrada en tiempo real. Turno de ${turnLabel}.`
            );
          }
          return;
        }
      } catch {
        // Ignore invalid move
      }
    }

    const pieceOnSq = game.get(sq);
    if (pieceOnSq && pieceOnSq.color === game.turn()) {
      playRewardSound('pop');
      setSelectedSquare(sq);
      const moves = game.moves({ square: sq, verbose: true });
      setLegalTargetSquares(moves.map((m) => m.to as Square));
    } else {
      if (selectedSquare) {
        setCoachDialogue(activeCoach.mistakeQuote);
      }
      setSelectedSquare(null);
      setLegalTargetSquares([]);
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
    setCoachDialogue(
      `${activeCoach.name}: "${lesson.objectiveText}"`
    );
  };

  const handleLessonSquareClick = (sq: Square) => {
    if (!activeLesson || lessonSolved) return;
    const lGame = lessonGameRef.current;

    if (lessonSelectedSq && lessonLegalTargets.includes(sq)) {
      try {
        const move = lGame.move({
          from: lessonSelectedSq,
          to: sq,
          promotion: 'q',
        });
        if (move) {
          setLessonSelectedSq(null);
          setLessonLegalTargets([]);
          if (activeLesson.targetMoveSan.includes(move.san)) {
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
              `Jugaste ${move.san}. ${activeCoach.mistakeQuote} Busca: ${activeLesson.objectiveText}`
            );
          }
          return;
        }
      } catch {
        // invalid
      }
    }

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

  const renderInteractiveBoard = (
    currentFen: string,
    activeSq: Square | null,
    targets: Square[],
    onSqClick: (sq: Square) => void
  ) => {
    const tempChess = new Chess(currentFen);
    const boardMatrix = tempChess.board();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    return (
      <div
        className={`w-full max-w-[440px] aspect-square mx-auto rounded-2xl overflow-hidden border-4 ${activeBoardTheme.boardBorderClass} shadow-lg grid grid-cols-8 grid-rows-8 select-none`}
        data-testid="interactive-chessboard"
        data-board-theme={activeBoardTheme.id}
        data-pieces-style={activePiecesStyle.id}
      >
        {boardMatrix.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const sqName = `${files[cIdx]}${8 - rIdx}` as Square;
            const isLight = (rIdx + cIdx) % 2 === 0;
            const isSelected = activeSq === sqName;
            const isTarget = targets.includes(sqName);
            const pieceKey = cell
              ? (`${cell.color}${cell.type}` as keyof typeof activePiecesStyle.pieceMap)
              : null;

            return (
              <button
                key={sqName}
                type="button"
                onClick={() => onSqClick(sqName)}
                aria-label={`Casilla ${sqName}${cell ? ` con pieza ${cell.color}${cell.type}` : ''}`}
                className={`relative flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-yellow-300 ring-2 ring-inset ring-amber-600'
                    : isLight
                    ? activeBoardTheme.lightSquareClass
                    : activeBoardTheme.darkSquareClass
                }`}
              >
                {cIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[9px] font-mono font-bold opacity-70 ${activeBoardTheme.coordTextClass}`}
                  >
                    {8 - rIdx}
                  </span>
                )}
                {rIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[9px] font-mono font-bold opacity-70 ${activeBoardTheme.coordTextClass}`}
                  >
                    {files[cIdx]}
                  </span>
                )}
                {isTarget && (
                  <span
                    className={`w-3.5 h-3.5 rounded-full ${
                      cell ? 'ring-4 ring-rose-500/80' : 'bg-emerald-900/45'
                    }`}
                  />
                )}
                {pieceKey && (
                  <span
                    className={`text-2xl sm:text-4xl leading-none select-none ${
                      cell?.color === 'w'
                        ? activePiecesStyle.whitePieceClass
                        : activePiecesStyle.blackPieceClass
                    }`}
                  >
                    {activePiecesStyle.pieceMap[pieceKey]}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    );
  };

  const unlockedCoaches = CHESS_COACHES_CATALOG.filter(
    (c) => unlockedCoachIds.includes(c.id) || c.gemCost === 0
  );

  return (
    <div className="space-y-8">
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
              <span>Academia de Ajedrez · Tablero: {activeBoardTheme.name} · Fichas: {activePiecesStyle.name}</span>
            </div>
            <h1
              className={`font-display font-black ${
                isYoungKid ? 'text-3xl text-slate-900' : 'text-2xl sm:text-3xl'
              }`}
            >
              {isYoungKid
                ? '¡Juega al Ajedrez Mágico!'
                : 'Club de Ajedrez: Bot, Amigos y Lecciones'}
            </h1>
            <p
              className={`text-sm ${
                isTeenDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Gana <strong>+8 gemas</strong> al vencer en partidas y <strong>+5 gemas</strong> en cada lección. Tu entrenador interactivo <strong>{activeCoach.name}</strong> te acompaña en cada jugada.
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
            onClick={() => {
              setMode('bot');
              setActiveLesson(null);
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
              <div className="font-bold text-sm">Jugar contra Bot Stockfish</div>
              <div className="text-xs opacity-80">
                Principiante, Intermedio, Avanzado, Experto
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('friend');
              setActiveLesson(null);
              resetMatch('friend');
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
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
                Solo amigos aceptados de tu etapa ({acceptedFriends.length})
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              playRewardSound('pop');
              setMode('lessons');
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
              mode === 'lessons'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isTeenDark
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500'
                : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300'
            }`}
          >
            <BookOpen className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-bold text-sm">Lecciones de Ajedrez</div>
              <div className="text-xs opacity-80">
                Progreso: {completedChessLessonIds.length}/{CHESS_ACADEMY_LESSONS.length} niveles
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* VISTA 1 y 2: TABLERO CONTRA EL BOT O CON UN AMIGO */}
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
              <div className="text-center py-12 space-y-3">
                <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                <h2 className="text-xl font-bold font-display">
                  Aún no tienes amigos aceptados para jugar
                </h2>
                <p className="text-sm opacity-75 max-w-md mx-auto">
                  Solo los amigos de tu misma etapa que hayan aceptado tu solicitud de amistad pueden jugar contigo en tiempo real. Ve a la pestaña Amigos para agregar un compañero o juega contra el Bot Stockfish.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-bold">{statusBanner}</div>
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

                {renderInteractiveBoard(
                  fen,
                  selectedSquare,
                  legalTargetSquares,
                  handleSquareClick
                )}
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
              <div className="space-y-3">
                <h2 className="font-bold text-base">
                  Nivel de Dificultad del Bot Stockfish
                </h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    [
                      { id: 'beginner', label: 'Principiante', desc: 'Ideal para aprender' },
                      { id: 'intermediate', label: 'Intermedio', desc: 'Táctica básica' },
                      { id: 'advanced', label: 'Avanzado', desc: 'Cálculo posicional' },
                      { id: 'expert', label: 'Experto', desc: 'Máxima profundidad' },
                    ] as const
                  ).map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        setDifficulty(lvl.id);
                        resetMatch('bot');
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        difficulty === lvl.id
                          ? 'border-emerald-500 bg-emerald-500/15 font-bold'
                          : isTeenDark
                          ? 'border-slate-800 bg-slate-800/60'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="text-sm font-bold">{lvl.label}</div>
                      <div className="text-xs opacity-70">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="font-bold text-base">
                  Amigo Conectado en la Partida
                </h2>
                {acceptedFriends.length > 0 && (
                  <div className="space-y-2">
                    {acceptedFriends.map((fr) => (
                      <button
                        key={fr.id}
                        type="button"
                        onClick={() => {
                          setSelectedFriendId(fr.id);
                          resetMatch('friend');
                        }}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between ${
                          selectedFriendId === fr.id
                            ? 'border-emerald-500 bg-emerald-500/15 font-bold'
                            : 'border-slate-200'
                        }`}
                      >
                        <span>
                          {fr.name} ({fr.username})
                        </span>
                        <span className="text-xs text-emerald-600 font-bold">
                          Amistad Aceptada
                        </span>
                      </button>
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
                  isTeenDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-700'
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

      {/* VISTA 3: LECCIONES DE AJEDREZ PROGRESIVAS */}
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
              Ruta de Lecciones de Ajedrez (+5 Gemas por Nivel)
            </h2>
            <p className="text-xs opacity-75">
              Todas las lecciones empiezan en el Nivel 1; completa cada lección en el tablero con ayuda de {activeCoach.name} para desbloquear la siguiente.
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

                return (
                  <div
                    key={lesson.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      completed
                        ? 'border-emerald-500/60 bg-emerald-500/10'
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

                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs sm:text-sm font-medium">
                  <strong>Objetivo en el tablero:</strong> {activeLesson.objectiveText}
                </div>

                {renderInteractiveBoard(
                  lessonFen,
                  lessonSelectedSq,
                  lessonLegalTargets,
                  handleLessonSquareClick
                )}

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
