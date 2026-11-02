import React, { useState } from 'react';
import {
  ShoppingBag,
  Gem,
  CheckCircle2,
  Lock,
  Sparkles,
  Grid,
  Crown,
  Bot,
  UserCircle2,
  Volume2,
  ArrowLeft,
} from 'lucide-react';
import {
  CHESS_BOARDS_CATALOG,
  CHESS_PIECES_CATALOG,
  CHESS_COACHES_CATALOG,
  getAvatarsForChildAge,
  ChessBoardThemeOption,
  ChessPiecesStyleOption,
  ChessCoachOption,
  AvatarOption,
} from '../data/curriculumData';
import {
  UserProfile,
  ShopCategoryTab,
  purchaseShopItemWithGems,
} from '../utils/educationLogic';
import { AvatarBadge } from './ArtworkRenderer';
import { playRewardSound, speakSpanishText } from '../utils/soundEffects';

interface ShopViewProps {
  profile: UserProfile;
  initialTab?: ShopCategoryTab;
  onUpdateShopSelection: (updater: (prev: UserProfile) => UserProfile) => void;
  onBackToProfile?: () => void;
}

export function ShopView({
  profile,
  initialTab = 'boards',
  onUpdateShopSelection,
  onBackToProfile,
}: ShopViewProps) {
  const [activeTab, setActiveTab] = useState<ShopCategoryTab>(initialTab);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'encourage';
    text: string;
  } | null>(null);

  const isYoungKid = profile.ageGroup === '3-6';
  const isTeenDark = profile.ageGroup === '14-18';
  const ageFilteredAvatars = getAvatarsForChildAge(profile.age);

  const handleBoardAction = (board: ChessBoardThemeOption) => {
    const unlockedList = profile.unlockedBoardIds || ['board_classic_wood'];
    const isUnlocked = unlockedList.includes(board.id);

    if (isUnlocked) {
      playRewardSound('pop');
      onUpdateShopSelection((prev) => ({
        ...prev,
        selectedBoardId: board.id,
      }));
      setFeedbackBanner({
        type: 'success',
        text: `¡Activaste el tablero "${board.name}"! Ya puedes verlo en tus partidas y lecciones de Ajedrez.`,
      });
      return;
    }

    const res = purchaseShopItemWithGems(
      profile.gems,
      board.gemCost,
      false,
      board.name
    );
    if (!res.success) {
      playRewardSound('wrong');
      setFeedbackBanner({
        type: 'encourage',
        text:
          res.reason ||
          '¡Sigue jugando y completando lecciones para conseguir más gemas!',
      });
      return;
    }

    playRewardSound('fanfare');
    onUpdateShopSelection((prev) => ({
      ...prev,
      gems: res.remainingGems,
      selectedBoardId: board.id,
      unlockedBoardIds: Array.from(
        new Set([...(prev.unlockedBoardIds || ['board_classic_wood']), board.id])
      ),
    }));
    setFeedbackBanner({
      type: 'success',
      text: `¡Compraste y activaste el tablero "${board.name}" por ${board.gemCost} gemas!`,
    });
  };

  const handlePiecesAction = (pieces: ChessPiecesStyleOption) => {
    const unlockedList = profile.unlockedPiecesIds || ['pieces_classic'];
    const isUnlocked = unlockedList.includes(pieces.id);

    if (isUnlocked) {
      playRewardSound('pop');
      onUpdateShopSelection((prev) => ({
        ...prev,
        selectedPiecesId: pieces.id,
      }));
      setFeedbackBanner({
        type: 'success',
        text: `¡Activaste las fichas "${pieces.name}" para tu tablero de Ajedrez!`,
      });
      return;
    }

    const res = purchaseShopItemWithGems(
      profile.gems,
      pieces.gemCost,
      false,
      pieces.name
    );
    if (!res.success) {
      playRewardSound('wrong');
      setFeedbackBanner({
        type: 'encourage',
        text:
          res.reason ||
          '¡Sigue ganando gemas en lecciones, ajedrez y videojuegos!',
      });
      return;
    }

    playRewardSound('fanfare');
    onUpdateShopSelection((prev) => ({
      ...prev,
      gems: res.remainingGems,
      selectedPiecesId: pieces.id,
      unlockedPiecesIds: Array.from(
        new Set([...(prev.unlockedPiecesIds || ['pieces_classic']), pieces.id])
      ),
    }));
    setFeedbackBanner({
      type: 'success',
      text: `¡Compraste y activaste el estilo de fichas "${pieces.name}" por ${pieces.gemCost} gemas!`,
    });
  };

  const handleCoachAction = (coach: ChessCoachOption) => {
    const unlockedList = profile.unlockedCoachIds || ['coach_kind'];
    const isUnlocked = unlockedList.includes(coach.id);

    if (isUnlocked) {
      playRewardSound('pop');
      onUpdateShopSelection((prev) => ({
        ...prev,
        selectedCoachId: coach.id,
      }));
      setFeedbackBanner({
        type: 'success',
        text: `¡Elegiste a "${coach.name}" (${coach.personality}) como tu entrenador interactivo de Ajedrez!`,
      });
      return;
    }

    const res = purchaseShopItemWithGems(
      profile.gems,
      coach.gemCost,
      false,
      coach.name
    );
    if (!res.success) {
      playRewardSound('wrong');
      setFeedbackBanner({
        type: 'encourage',
        text:
          res.reason ||
          '¡Gana más gemas en tus cursos y partidas para desbloquear este entrenador!',
      });
      return;
    }

    playRewardSound('fanfare');
    onUpdateShopSelection((prev) => ({
      ...prev,
      gems: res.remainingGems,
      selectedCoachId: coach.id,
      unlockedCoachIds: Array.from(
        new Set([...(prev.unlockedCoachIds || ['coach_kind']), coach.id])
      ),
    }));
    setFeedbackBanner({
      type: 'success',
      text: `¡Desbloqueaste y activaste al entrenador "${coach.name}" (${coach.personality}) por ${coach.gemCost} gemas!`,
    });
  };

  const handleAvatarAction = (avatar: AvatarOption) => {
    const isUnlocked =
      profile.unlockedAvatarIds.includes(avatar.id) || avatar.gemCost === 0;

    if (isUnlocked) {
      playRewardSound('pop');
      onUpdateShopSelection((prev) => ({
        ...prev,
        avatarId: avatar.id,
        unlockedAvatarIds: Array.from(
          new Set([...prev.unlockedAvatarIds, avatar.id])
        ),
      }));
      setFeedbackBanner({
        type: 'success',
        text: `¡Activaste el avatar "${avatar.name}" en tu perfil!`,
      });
      return;
    }

    const res = purchaseShopItemWithGems(
      profile.gems,
      avatar.gemCost,
      false,
      avatar.name
    );
    if (!res.success) {
      playRewardSound('wrong');
      setFeedbackBanner({
        type: 'encourage',
        text:
          res.reason ||
          '¡Sigue sumando gemas en lecciones, ajedrez y videojuegos!',
      });
      return;
    }

    playRewardSound('fanfare');
    onUpdateShopSelection((prev) => ({
      ...prev,
      gems: res.remainingGems,
      avatarId: avatar.id,
      unlockedAvatarIds: Array.from(
        new Set([...prev.unlockedAvatarIds, avatar.id])
      ),
    }));
    setFeedbackBanner({
      type: 'success',
      text: `¡Compraste y equipaste el avatar "${avatar.name}" por ${avatar.gemCost} gemas!`,
    });
  };

  const shopTabs: {
    id: ShopCategoryTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      id: 'boards',
      label: 'Tableros de Ajedrez',
      shortLabel: 'Tableros',
      icon: <Grid className="w-4 h-4" />,
      count: CHESS_BOARDS_CATALOG.length,
    },
    {
      id: 'pieces',
      label: 'Fichas de Ajedrez',
      shortLabel: 'Fichas',
      icon: <Crown className="w-4 h-4" />,
      count: CHESS_PIECES_CATALOG.length,
    },
    {
      id: 'coaches',
      label: 'Entrenadores Interactivos',
      shortLabel: 'Entrenadores',
      icon: <Bot className="w-4 h-4" />,
      count: CHESS_COACHES_CATALOG.length,
    },
    {
      id: 'avatars',
      label: 'Avatares Nuevos',
      shortLabel: 'Avatares',
      icon: <UserCircle2 className="w-4 h-4" />,
      count: ageFilteredAvatars.length,
    },
  ];

  return (
    <div className="space-y-6" data-testid="gems-shop-view">
      {/* Cabecera de la Tienda con Saldo de Gemas y Guía de Cómo Ganarlas */}
      <section
        className={`rounded-[34px] p-6 sm:p-8 border shadow-sm ${
          isYoungKid
            ? 'bg-gradient-to-r from-[#FFF5F5] via-[#FEF9C3] to-[#ECFCCB] border-2 border-[#FF6B6B]/40 text-slate-900'
            : isTeenDark
            ? 'bg-[#181326] border-purple-900/50 text-white'
            : 'bg-gradient-to-r from-emerald-50 via-white to-cyan-50 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-cyan-500">
              <ShoppingBag className="w-4 h-4" />
              Tienda Oficial de Recompensas · 4 Colecciones
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display">
              Tienda de Gemas de {profile.name}
            </h1>
            <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
              Gana gemas al <strong>completar lecciones (+5)</strong>,{' '}
              <strong>ganar partidas de ajedrez (+8)</strong> y{' '}
              <strong>ganar en los videojuegos (+5)</strong>. Todo lo que compres se guarda en tu perfil para siempre.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-5 py-3 rounded-2xl bg-cyan-500/15 border-2 border-cyan-500/40 flex items-center gap-3">
              <Gem className="w-6 h-6 text-cyan-500 animate-pulse" />
              <div>
                <div className="text-[11px] font-bold opacity-75">Tu Saldo</div>
                <div
                  className="text-xl font-black text-cyan-500 tabular-nums"
                  data-testid="shop-gems-balance"
                >
                  {profile.gems} gemas
                </div>
              </div>
            </div>

            {onBackToProfile && (
              <button
                type="button"
                onClick={onBackToProfile}
                className={`px-4 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 border transition-colors ${
                  isTeenDark
                    ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Perfil
              </button>
            )}
          </div>
        </div>

        {/* Las 4 Pestañas de la Tienda */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-6 border-t border-slate-300/30"
          role="tablist"
          aria-label="Pestañas de la Tienda"
        >
          {shopTabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`shop-tab-${tab.id}`}
                onClick={() => {
                  playRewardSound('pop');
                  setActiveTab(tab.id);
                  setFeedbackBanner(null);
                }}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-2 ${
                  active
                    ? 'bg-[#84CC16] border-[#65A30D] text-slate-950 font-black shadow-sm scale-[1.01]'
                    : isTeenDark
                    ? 'bg-[#221B35] border-purple-900/40 text-purple-100 hover:border-purple-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-400 font-bold'
                }`}
              >
                <span className="flex items-center gap-2 text-xs sm:text-sm truncate">
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/10 font-mono shrink-0">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Mensaje animado de compra o de ánimo cuando faltan gemas */}
      {feedbackBanner && (
        <div
          role="status"
          data-testid="shop-feedback-banner"
          className={`p-4 rounded-3xl border-2 text-xs sm:text-sm font-extrabold flex items-center justify-between gap-3 transition-all animate-bounce ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
              : 'bg-amber-500/15 border-amber-500 text-amber-500'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>{feedbackBanner.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs underline shrink-0"
          >
            Entendido
          </button>
        </div>
      )}

      {/* PESTAÑA 1: TABLEROS DE AJEDREZ NUEVOS */}
      {activeTab === 'boards' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CHESS_BOARDS_CATALOG.map((board) => {
            const unlockedList = profile.unlockedBoardIds || ['board_classic_wood'];
            const isUnlocked = unlockedList.includes(board.id) || board.gemCost === 0;
            const isEquipped =
              (profile.selectedBoardId || 'board_classic_wood') === board.id;
            const canAfford = profile.gems >= board.gemCost;

            return (
              <div
                key={board.id}
                className={`rounded-3xl border-2 p-5 flex flex-col justify-between gap-4 transition-all ${
                  isEquipped
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                    : isTeenDark
                    ? 'border-purple-900/40 bg-[#181326] text-white'
                    : 'border-slate-200 bg-white text-slate-900 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Vista previa real 4x4 del tablero */}
                  <div
                    className={`w-full h-32 rounded-2xl border-4 ${board.boardBorderClass} overflow-hidden grid grid-cols-4 grid-rows-4 shadow-inner`}
                    aria-label={`Vista previa del tablero ${board.name}`}
                  >
                    {Array.from({ length: 16 }).map((_, idx) => {
                      const r = Math.floor(idx / 4);
                      const c = idx % 4;
                      const isLight = (r + c) % 2 === 0;
                      return (
                        <div
                          key={idx}
                          className={`${
                            isLight ? board.lightSquareClass : board.darkSquareClass
                          } flex items-center justify-center text-sm`}
                        >
                          {idx === 5 ? '♔' : idx === 10 ? '♛' : ''}
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-base">{board.name}</h3>
                      <span className="text-xs font-extrabold text-cyan-500 flex items-center gap-1 shrink-0">
                        <Gem className="w-3.5 h-3.5" />
                        {board.gemCost === 0 ? 'Gratis' : `${board.gemCost}`}
                      </span>
                    </div>
                    <p className="text-xs opacity-75 mt-1">{board.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {!isUnlocked && !canAfford && (
                    <div className="text-[11px] font-bold text-amber-500 text-center animate-pulse">
                      ¡Te faltan {board.gemCost - profile.gems} gemas! ¡Tú puedes!
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleBoardAction(board)}
                    className={`w-full py-2.5 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      isEquipped
                        ? 'bg-emerald-600 text-white'
                        : isUnlocked
                        ? 'bg-[#84CC16] hover:bg-[#65A30D] text-slate-950'
                        : canAfford
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
                        : 'bg-slate-300/70 text-slate-600 cursor-pointer'
                    }`}
                  >
                    {isEquipped ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Equipado
                      </>
                    ) : isUnlocked ? (
                      'Activar Tablero'
                    ) : canAfford ? (
                      <>
                        <Gem className="w-4 h-4" />
                        Comprar ({board.gemCost} gemas)
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Bloqueado ({board.gemCost} gemas)
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* PESTAÑA 2: FICHAS DE AJEDREZ NUEVAS */}
      {activeTab === 'pieces' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHESS_PIECES_CATALOG.map((pieces) => {
            const unlockedList = profile.unlockedPiecesIds || ['pieces_classic'];
            const isUnlocked = unlockedList.includes(pieces.id) || pieces.gemCost === 0;
            const isEquipped =
              (profile.selectedPiecesId || 'pieces_classic') === pieces.id;
            const canAfford = profile.gems >= pieces.gemCost;

            return (
              <div
                key={pieces.id}
                className={`rounded-3xl border-2 p-5 flex flex-col justify-between gap-4 transition-all ${
                  isEquipped
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                    : isTeenDark
                    ? 'border-purple-900/40 bg-[#181326] text-white'
                    : 'border-slate-200 bg-white text-slate-900 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Vista previa de las fichas blancas y negras */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white flex items-center justify-around text-2xl sm:text-3xl shadow-inner">
                    <span>{pieces.pieceMap.wk}</span>
                    <span>{pieces.pieceMap.wq}</span>
                    <span>{pieces.pieceMap.wn}</span>
                    <span>{pieces.pieceMap.wr}</span>
                    <span>{pieces.pieceMap.bk}</span>
                    <span>{pieces.pieceMap.bn}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-base">{pieces.name}</h3>
                      <span className="text-xs font-extrabold text-cyan-500 flex items-center gap-1 shrink-0">
                        <Gem className="w-3.5 h-3.5" />
                        {pieces.gemCost === 0 ? 'Gratis' : `${pieces.gemCost}`}
                      </span>
                    </div>
                    <p className="text-xs opacity-75 mt-1">{pieces.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {!isUnlocked && !canAfford && (
                    <div className="text-[11px] font-bold text-amber-500 text-center animate-pulse">
                      ¡Te faltan {pieces.gemCost - profile.gems} gemas! ¡Sigue jugando!
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePiecesAction(pieces)}
                    className={`w-full py-2.5 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      isEquipped
                        ? 'bg-emerald-600 text-white'
                        : isUnlocked
                        ? 'bg-[#84CC16] hover:bg-[#65A30D] text-slate-950'
                        : canAfford
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
                        : 'bg-slate-300/70 text-slate-600 cursor-pointer'
                    }`}
                  >
                    {isEquipped ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Equipado
                      </>
                    ) : isUnlocked ? (
                      'Activar Fichas'
                    ) : canAfford ? (
                      <>
                        <Gem className="w-4 h-4" />
                        Comprar ({pieces.gemCost} gemas)
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Bloqueado ({pieces.gemCost} gemas)
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* PESTAÑA 3: ENTRENADORES INTERACTIVOS NUEVOS */}
      {activeTab === 'coaches' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHESS_COACHES_CATALOG.map((coach) => {
            const unlockedList = profile.unlockedCoachIds || ['coach_kind'];
            const isUnlocked = unlockedList.includes(coach.id) || coach.gemCost === 0;
            const isEquipped =
              (profile.selectedCoachId || 'coach_kind') === coach.id;
            const canAfford = profile.gems >= coach.gemCost;

            return (
              <div
                key={coach.id}
                className={`rounded-3xl border-2 p-5 flex flex-col justify-between gap-4 transition-all ${
                  isEquipped
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                    : isTeenDark
                    ? 'border-purple-900/40 bg-[#181326] text-white'
                    : 'border-slate-200 bg-white text-slate-900 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${coach.accentClass} flex items-center justify-center text-3xl shadow-md shrink-0`}
                      >
                        {coach.avatarEmoji}
                      </div>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[11px] font-extrabold">
                          Personalidad: {coach.personality}
                        </span>
                        <h3 className="font-extrabold text-lg mt-0.5">
                          {coach.name}
                        </h3>
                        <p className="text-xs opacity-75">{coach.description}</p>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold text-cyan-500 flex items-center gap-1 shrink-0">
                      <Gem className="w-3.5 h-3.5" />
                      {coach.gemCost === 0 ? 'Gratis' : `${coach.gemCost}`}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border text-xs italic flex items-center justify-between gap-3 ${
                      isTeenDark
                        ? 'bg-[#221B35] border-purple-900/40 text-purple-100'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>"{coach.greetingQuote}"</span>
                    <button
                      type="button"
                      onClick={() => speakSpanishText(coach.greetingQuote)}
                      aria-label={`Escuchar voz de ${coach.name}`}
                      className="p-2 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-500 shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {!isUnlocked && !canAfford && (
                    <div className="text-[11px] font-bold text-amber-500 text-center animate-pulse">
                      ¡Te faltan {coach.gemCost - profile.gems} gemas para entrenar con {coach.name}!
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCoachAction(coach)}
                    className={`w-full py-2.5 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      isEquipped
                        ? 'bg-emerald-600 text-white'
                        : isUnlocked
                        ? 'bg-[#84CC16] hover:bg-[#65A30D] text-slate-950'
                        : canAfford
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
                        : 'bg-slate-300/70 text-slate-600 cursor-pointer'
                    }`}
                  >
                    {isEquipped ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Entrenador Activo
                      </>
                    ) : isUnlocked ? (
                      'Elegir Entrenador'
                    ) : canAfford ? (
                      <>
                        <Gem className="w-4 h-4" />
                        Comprar ({coach.gemCost} gemas)
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Bloqueado ({coach.gemCost} gemas)
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* PESTAÑA 4: AVATARES NUEVOS (FILTRADOS ESTRICTAMENTE POR EDAD < 9 vs >= 9 Y ORDENADOS POR PRECIO) */}
      {activeTab === 'avatars' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="text-xs font-extrabold opacity-80">
              {profile.age < 9
                ? `Colección Especial para Pequeños (${profile.age} años) · Caritas y Personajes Amigables`
                : `Colección Ilustrada para ${profile.age} años · Ordenada de menor a mayor precio`}
            </div>
            <div className="text-xs font-bold text-cyan-500">
              {ageFilteredAvatars.length} avatares disponibles para tu edad
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {ageFilteredAvatars.map((av) => {
              const isUnlocked =
                profile.unlockedAvatarIds.includes(av.id) || av.gemCost === 0;
              const isEquipped = profile.avatarId === av.id;
              const canAfford = profile.gems >= av.gemCost;

              return (
                <div
                  key={av.id}
                  data-testid={`shop-avatar-card-${av.id}`}
                  className={`p-4 rounded-3xl border-2 flex flex-col items-center text-center justify-between gap-3 transition-all ${
                    isEquipped
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                      : isTeenDark
                      ? 'border-purple-900/40 bg-[#181326] text-white'
                      : 'border-slate-200 bg-white text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2.5">
                    <AvatarBadge avatarId={av.id} size="xl" />
                    <div>
                      <div className="font-extrabold text-sm leading-tight">
                        {av.name}
                      </div>
                      <div className="text-[11px] opacity-70 mt-0.5">
                        {av.title}
                      </div>
                    </div>
                  </div>

                  <div className="w-full space-y-1.5">
                    {!isUnlocked && !canAfford && (
                      <div className="text-[10px] font-bold text-amber-500 animate-pulse">
                        Faltan {av.gemCost - profile.gems} gemas
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAvatarAction(av)}
                      className={`w-full py-2 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isEquipped
                          ? 'bg-emerald-600 text-white'
                          : isUnlocked
                          ? 'bg-[#84CC16] hover:bg-[#65A30D] text-slate-950'
                          : canAfford
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs'
                          : 'bg-slate-300/70 text-slate-600 cursor-pointer'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Equipado
                        </>
                      ) : isUnlocked ? (
                        'Activar'
                      ) : (
                        <>
                          {canAfford ? (
                            <Gem className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                          Comprar · {av.gemCost}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
