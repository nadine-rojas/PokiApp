import { Chess, Move, Square } from 'chess.js';

export type BotEloLevel = '200' | '1000' | '2000';

export interface BotEloMetadata {
  elo: BotEloLevel;
  numericElo: number;
  depth: string;
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
}

export const CHESS_BOT_LEVELS: BotEloMetadata[] = [
  {
    elo: '200',
    numericElo: 200,
    depth: '1-2',
    title: 'Bot 200 ELO',
    subtitle: 'Principiante Inteligente',
    description:
      'Evalúa a profundidad 1-2: captura piezas si las dejas colgadas, responde a los jaques con lógica y desarrolla piezas.',
    badgeText: '200 ELO · Profundidad 1-2',
  },
  {
    elo: '1000',
    numericElo: 1000,
    depth: '3',
    title: 'Bot 1000 ELO',
    subtitle: 'Intermedio Fuerte',
    description:
      'Minimax con Poda Alfa-Beta a profundidad 3: evalúa material, control del centro y seguridad del Rey. Castiga piezas indefensas.',
    badgeText: '1000 ELO · Alfa-Beta Depth 3',
  },
  {
    elo: '2000',
    numericElo: 2000,
    depth: '4-5',
    title: 'Bot 2000 ELO',
    subtitle: 'Gran Maestro Táctico',
    description:
      'Minimax con Alfa-Beta, ordenamiento MVV-LVA, Quiescence Search y Tablas Posicionales (PST) a profundidad 4-5.',
    badgeText: '2000 ELO · Maestro Depth 4-5 + Quiescence',
  },
];

export type ChessTimeControlId =
  | '3min'
  | '5min'
  | '10min'
  | '15min'
  | 'unlimited';

export type ChessColorPreference = 'w' | 'b' | 'random';

export interface ChessTimeControlOption {
  id: ChessTimeControlId;
  label: string;
  shortLabel: string;
  initialSeconds: number | null;
  category: string;
}

export const CHESS_TIME_CONTROLS: ChessTimeControlOption[] = [
  {
    id: '3min',
    label: '⚡ 3 min (Blitz)',
    shortLabel: '3 min',
    initialSeconds: 180,
    category: 'Blitz',
  },
  {
    id: '5min',
    label: '⏱️ 5 min (Blitz)',
    shortLabel: '5 min',
    initialSeconds: 300,
    category: 'Blitz',
  },
  {
    id: '10min',
    label: '🕙 10 min (Rápida)',
    shortLabel: '10 min',
    initialSeconds: 600,
    category: 'Rápida',
  },
  {
    id: '15min',
    label: '⏳ 15 min (Clásica)',
    shortLabel: '15 min',
    initialSeconds: 900,
    category: 'Clásica',
  },
  {
    id: 'unlimited',
    label: '∞ Sin tiempo (Amistosa)',
    shortLabel: 'Sin tiempo',
    initialSeconds: null,
    category: 'Amistosa',
  },
];

export interface ChessColorOption {
  id: ChessColorPreference;
  label: string;
  icon: string;
  description: string;
}

export const CHESS_COLOR_OPTIONS: ChessColorOption[] = [
  {
    id: 'w',
    label: 'Blancas',
    icon: '♔',
    description: 'Mueves primero con piezas blancas',
  },
  {
    id: 'b',
    label: 'Negras',
    icon: '♚',
    description: 'Tu amigo mueve primero con blancas',
  },
  {
    id: 'random',
    label: 'Aleatorio',
    icon: '🎲',
    description: 'Color sorteado automáticamente',
  },
];

export function getChessTimeControlById(
  id: ChessTimeControlId
): ChessTimeControlOption {
  return (
    CHESS_TIME_CONTROLS.find((tc) => tc.id === id) || CHESS_TIME_CONTROLS[1]
  );
}

export function resolveChessInviteColors(
  preference: ChessColorPreference,
  seed: number = Date.now()
): { hostColor: 'w' | 'b'; guestColor: 'w' | 'b' } {
  if (preference === 'w') {
    return { hostColor: 'w', guestColor: 'b' };
  }
  if (preference === 'b') {
    return { hostColor: 'b', guestColor: 'w' };
  }
  const hostIsWhite = Math.abs(Math.floor(seed)) % 2 === 0;
  return hostIsWhite
    ? { hostColor: 'w', guestColor: 'b' }
    : { hostColor: 'b', guestColor: 'w' };
}

export function formatChessClock(seconds: number | null): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return '∞ Sin tiempo';
  }
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function tickChessClock(params: {
  whiteTimeSeconds: number | null;
  blackTimeSeconds: number | null;
  activeTurn: 'w' | 'b';
  status: 'pending_invite' | 'active' | 'completed' | 'declined';
  elapsedSeconds?: number;
}): {
  whiteTimeSeconds: number | null;
  blackTimeSeconds: number | null;
  status: 'pending_invite' | 'active' | 'completed' | 'declined';
  timeoutWinner: 'w' | 'b' | null;
  winReason?: string;
} {
  const delta = Math.max(1, Math.floor(params.elapsedSeconds ?? 1));
  if (
    params.status !== 'active' ||
    params.whiteTimeSeconds === null ||
    params.blackTimeSeconds === null
  ) {
    return {
      whiteTimeSeconds: params.whiteTimeSeconds,
      blackTimeSeconds: params.blackTimeSeconds,
      status: params.status,
      timeoutWinner: null,
    };
  }

  if (params.activeTurn === 'w') {
    const nextWhite = Math.max(0, params.whiteTimeSeconds - delta);
    if (nextWhite <= 0) {
      return {
        whiteTimeSeconds: 0,
        blackTimeSeconds: params.blackTimeSeconds,
        status: 'completed',
        timeoutWinner: 'b',
        winReason: '¡Tiempo agotado para Blancas! Ganan las Negras por tiempo.',
      };
    }
    return {
      whiteTimeSeconds: nextWhite,
      blackTimeSeconds: params.blackTimeSeconds,
      status: 'active',
      timeoutWinner: null,
    };
  } else {
    const nextBlack = Math.max(0, params.blackTimeSeconds - delta);
    if (nextBlack <= 0) {
      return {
        whiteTimeSeconds: params.whiteTimeSeconds,
        blackTimeSeconds: 0,
        status: 'completed',
        timeoutWinner: 'w',
        winReason: '¡Tiempo agotado para Negras! Ganan las Blancas por tiempo.',
      };
    }
    return {
      whiteTimeSeconds: params.whiteTimeSeconds,
      blackTimeSeconds: nextBlack,
      status: 'active',
      timeoutWinner: null,
    };
  }
}

export const PIECE_MATERIAL_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (PST) desde la perspectiva de las Blancas (fila 0 = rango 8, fila 7 = rango 1)
const PAWN_PST: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_PST: number[][] = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_PST: number[][] = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_PST: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_PST: number[][] = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_MIDGAME_PST: number[][] = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

function getPieceSquareBonus(
  type: string,
  color: 'w' | 'b',
  row: number,
  col: number
): number {
  const r = color === 'w' ? row : 7 - row;
  const c = col;
  switch (type) {
    case 'p':
      return PAWN_PST[r][c];
    case 'n':
      return KNIGHT_PST[r][c];
    case 'b':
      return BISHOP_PST[r][c];
    case 'r':
      return ROOK_PST[r][c];
    case 'q':
      return QUEEN_PST[r][c];
    case 'k':
      return KING_MIDGAME_PST[r][c];
    default:
      return 0;
  }
}

/**
 * Evalúa la posición desde la perspectiva de las Blancas (+ ventaja blanca, - ventaja negra).
 */
export function evaluatePositionWithPST(game: Chess, includePST = true): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -99999 : 99999;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return 0;
  }

  const board = game.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const material = PIECE_MATERIAL_VALUES[piece.type] || 0;
      const positional = includePST
        ? getPieceSquareBonus(piece.type, piece.color, r, c)
        : 0;
      const total = material + positional;
      score += piece.color === 'w' ? total : -total;
    }
  }

  if (game.inCheck()) {
    score += game.turn() === 'w' ? -35 : 35;
  }

  return score;
}

/**
 * Ordenamiento MVV-LVA (Most Valuable Victim - Least Valuable Attacker) + Promociones + Jaques
 * para acelerar drásticamente la poda Alfa-Beta.
 */
export function orderMovesMVVLVA(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.captured) {
      scoreA +=
        10 * (PIECE_MATERIAL_VALUES[a.captured] || 100) -
        (PIECE_MATERIAL_VALUES[a.piece] || 100) / 10;
    }
    if (b.captured) {
      scoreB +=
        10 * (PIECE_MATERIAL_VALUES[b.captured] || 100) -
        (PIECE_MATERIAL_VALUES[b.piece] || 100) / 10;
    }

    if (a.promotion) scoreA += 800;
    if (b.promotion) scoreB += 800;

    if (a.san.includes('+') || a.san.includes('#')) scoreA += 150;
    if (b.san.includes('+') || b.san.includes('#')) scoreB += 150;

    return scoreB - scoreA;
  });
}

/**
 * Quiescence Search: extiende la búsqueda en nodos hoja donde existen capturas tácticas
 * para evitar el efecto horizonte (usado en el Bot 2000 ELO).
 */
function quiescenceSearch(
  game: Chess,
  alpha: number,
  beta: number,
  maximizingWhite: boolean,
  qDepth: number = 3
): number {
  const standPat = evaluatePositionWithPST(game, true);

  if (qDepth <= 0 || game.isGameOver()) {
    return standPat;
  }

  if (maximizingWhite) {
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    const captureMoves = orderMovesMVVLVA(
      game.moves({ verbose: true }).filter((m) => m.captured || m.promotion)
    );

    for (const mv of captureMoves) {
      game.move(mv);
      const score = quiescenceSearch(game, alpha, beta, false, qDepth - 1);
      game.undo();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  } else {
    if (standPat <= alpha) return alpha;
    if (beta > standPat) beta = standPat;

    const captureMoves = orderMovesMVVLVA(
      game.moves({ verbose: true }).filter((m) => m.captured || m.promotion)
    );

    for (const mv of captureMoves) {
      game.move(mv);
      const score = quiescenceSearch(game, alpha, beta, true, qDepth - 1);
      game.undo();
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
    return beta;
  }
}

function alphaBetaSearch(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizingWhite: boolean,
  useQuiescence: boolean
): number {
  if (game.isGameOver()) {
    return evaluatePositionWithPST(game, true);
  }
  if (depth === 0) {
    return useQuiescence
      ? quiescenceSearch(game, alpha, beta, maximizingWhite, 2)
      : evaluatePositionWithPST(game, true);
  }

  const orderedMoves = orderMovesMVVLVA(game.moves({ verbose: true }));

  if (maximizingWhite) {
    let maxEval = -Infinity;
    for (const mv of orderedMoves) {
      game.move(mv);
      const evalScore = alphaBetaSearch(
        game,
        depth - 1,
        alpha,
        beta,
        false,
        useQuiescence
      );
      game.undo();
      if (evalScore > maxEval) maxEval = evalScore;
      if (evalScore > alpha) alpha = evalScore;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const mv of orderedMoves) {
      game.move(mv);
      const evalScore = alphaBetaSearch(
        game,
        depth - 1,
        alpha,
        beta,
        true,
        useQuiescence
      );
      game.undo();
      if (evalScore < minEval) minEval = evalScore;
      if (evalScore < beta) beta = evalScore;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Calcula la mejor jugada según el nivel real de ELO del Bot:
 * - '200': Principiante inteligente (Profundidad 1-2: captura piezas colgadas, sale de jaques con lógica y desarrolla piezas).
 * - '1000': Intermedio fuerte (Minimax con Poda Alfa-Beta a profundidad 3, evalúa material, centro y seguridad del Rey).
 * - '2000': Maestro / Muy inteligente (Minimax con Alfa-Beta, MVV-LVA, Quiescence Search y PST completo a profundidad 4).
 */
export function computeRealChessBotMove(
  fenOrGame: string | Chess,
  elo: BotEloLevel
): Move | null {
  const game =
    typeof fenOrGame === 'string' ? new Chess(fenOrGame) : new Chess(fenOrGame.fen());
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  const isBotWhite = game.turn() === 'w';
  const orderedRootMoves = orderMovesMVVLVA(legalMoves);

  // 1. Verificar siempre si hay Jaque Mate en 1 disponible
  for (const mv of orderedRootMoves) {
    game.move(mv);
    const isMate = game.isCheckmate();
    game.undo();
    if (isMate) return mv;
  }

  // =========================================================================
  // BOT 200 ELO (Principiante inteligente — Profundidad 1-2)
  // Captura piezas colgadas si las dejas regaladas, responde a jaques y desarrolla
  // =========================================================================
  if (elo === '200') {
    let bestMove = orderedRootMoves[0];
    let bestScore = isBotWhite ? -Infinity : Infinity;

    for (const mv of orderedRootMoves) {
      game.move(mv);
      // Evalúa a profundidad 1 con respuesta de captura inmediata (1-2 plies)
      const opponentResponses = game.moves({ verbose: true });
      let worstReplyScore = evaluatePositionWithPST(game, true);

      for (const reply of opponentResponses) {
        if (reply.captured || reply.san.includes('+')) {
          game.move(reply);
          const replyScore = evaluatePositionWithPST(game, true);
          game.undo();
          if (isBotWhite) {
            worstReplyScore = Math.min(worstReplyScore, replyScore);
          } else {
            worstReplyScore = Math.max(worstReplyScore, replyScore);
          }
        }
      }
      game.undo();

      if (isBotWhite) {
        if (worstReplyScore > bestScore) {
          bestScore = worstReplyScore;
          bestMove = mv;
        }
      } else {
        if (worstReplyScore < bestScore) {
          bestScore = worstReplyScore;
          bestMove = mv;
        }
      }
    }
    return bestMove;
  }

  // =========================================================================
  // BOT 1000 ELO (Intermedio fuerte — Minimax con Alfa-Beta a Profundidad 3)
  // =========================================================================
  if (elo === '1000') {
    const targetDepth = 3;
    let bestMove = orderedRootMoves[0];
    let bestScore = isBotWhite ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    for (const mv of orderedRootMoves) {
      game.move(mv);
      const score = alphaBetaSearch(
        game,
        targetDepth - 1,
        alpha,
        beta,
        !isBotWhite,
        false
      );
      game.undo();

      if (isBotWhite) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = mv;
        }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = mv;
        }
        beta = Math.min(beta, bestScore);
      }
    }
    return bestMove;
  }

  // =========================================================================
  // BOT 2000 ELO (Maestro — Minimax + Alfa-Beta + MVV-LVA + Quiescence + PST a Profundidad 4)
  // =========================================================================
  const masterDepth = orderedRootMoves.length <= 14 ? 4 : 3;
  let bestMove = orderedRootMoves[0];
  let bestScore = isBotWhite ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const mv of orderedRootMoves) {
    game.move(mv);
    const score = alphaBetaSearch(
      game,
      masterDepth - 1,
      alpha,
      beta,
      !isBotWhite,
      true
    );
    game.undo();

    if (isBotWhite) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = mv;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = mv;
      }
      beta = Math.min(beta, bestScore);
    }
  }

  return bestMove;
}

/**
 * Verifica si una jugada de un problema del Curso de Ajedrez es legal y resuelve el ejercicio.
 */
export function verifyChessPuzzleMove(params: {
  initialFen: string;
  from: Square;
  to: Square;
  targetMoveSan: string[];
}): {
  legal: boolean;
  solved: boolean;
  san: string | null;
  newFen: string;
  isCheckmate: boolean;
} {
  const game = new Chess(params.initialFen);
  try {
    const move = game.move({
      from: params.from,
      to: params.to,
      promotion: 'q',
    });
    if (!move) {
      return {
        legal: false,
        solved: false,
        san: null,
        newFen: params.initialFen,
        isCheckmate: false,
      };
    }
    const solved =
      params.targetMoveSan.includes(move.san) ||
      (params.targetMoveSan.some((t) => t.endsWith('#')) && game.isCheckmate());
    return {
      legal: true,
      solved,
      san: move.san,
      newFen: solved ? game.fen() : params.initialFen,
      isCheckmate: game.isCheckmate(),
    };
  } catch {
    return {
      legal: false,
      solved: false,
      san: null,
      newFen: params.initialFen,
      isCheckmate: false,
    };
  }
}
