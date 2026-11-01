import React, { useState } from 'react';
import {
  Award,
  ShieldCheck,
  Palette,
  Lock,
  Unlock,
  Sparkles,
  CheckCircle2,
  Gem,
  LogOut,
  ShoppingBag,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  WALLPAPER_GALLERY,
  ALL_MEDALS_CATALOG,
  COURSES_DATA,
  SUBJECT_LABELS,
  getAvatarsForChildAge,
} from '../data/curriculumData';
import {
  UserProfile,
  CourseSubject,
  calculateLevelFromXP,
  canCustomizeWallpaper,
  getDefaultSubjectsForAgeGroup,
} from '../utils/educationLogic';
import { AvatarBadge, CircularProgressRing } from './ArtworkRenderer';
import { ShopView } from './ShopView';
import { PWAInstallButton } from './PWAInstallButton';
import { playRewardSound } from '../utils/soundEffects';

interface ProfileParentalViewProps {
  profile: UserProfile;
  allChildrenProfiles: UserProfile[];
  acceptedFriendsCount: number;
  onUpdateShopSelection: (updater: (prev: UserProfile) => UserProfile) => void;
  onOpenFullShop: () => void;
  onChangeWallpaper: (wallpaperId: string) => void;
  onToggleAllowedSubject: (subject: CourseSubject) => void;
  onToggleParentalChat: (approved: boolean) => void;
  onToggleParentalFriends: (approved: boolean) => void;
  onUpdateChildAgeByParent: (
    newAge: number,
    enteredPin: string
  ) => { success: boolean; graduatedToGroup3: boolean; error?: string };
  onSwitchChildProfile: (childProfile: UserProfile) => void;
  onAddNewChildProfile: () => void;
  onLogoutAccount: () => void;
}

export function ProfileParentalView({
  profile,
  allChildrenProfiles,
  acceptedFriendsCount,
  onUpdateShopSelection,
  onOpenFullShop,
  onChangeWallpaper,
  onToggleAllowedSubject,
  onToggleParentalChat,
  onToggleParentalFriends,
  onUpdateChildAgeByParent,
  onSwitchChildProfile,
  onAddNewChildProfile,
  onLogoutAccount,
}: ProfileParentalViewProps) {
  const [pinInput, setPinInput] = useState('');
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [parentAgeDraft, setParentAgeDraft] = useState<number>(profile.age);
  const [ageUpdateNotice, setAgeUpdateNotice] = useState<string | null>(null);

  const levelInfo = calculateLevelFromXP(profile.xp);
  const wallpaperAllowed = canCustomizeWallpaper(profile.age);
  const activeWallpaper =
    WALLPAPER_GALLERY.find((w) => w.id === profile.wallpaperId) ||
    WALLPAPER_GALLERY[0];

  const isTeenDark = profile.ageGroup === '14-18';
  const allSubjectsForGroup = getDefaultSubjectsForAgeGroup(profile.ageGroup);
  const coursesForGroup = COURSES_DATA.filter(
    (c) => c.ageGroup === profile.ageGroup
  );
  const avatarsForAge = getAvatarsForChildAge(profile.age);
  const unlockedAvatarsForChild = avatarsForAge.filter(
    (av) => av.isStarter || profile.unlockedAvatarIds.includes(av.id)
  );

  const handleUnlockParentPanel = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPin = profile.parentPin || '1234';
    if (pinInput.trim() === expectedPin) {
      playRewardSound('correct');
      setIsParentUnlocked(true);
      setParentAgeDraft(profile.age);
      setPinError(null);
    } else {
      playRewardSound('wrong');
      setPinError('PIN incorrecto. Solo el padre o tutor puede abrir este panel.');
    }
  };

  const handleApplyParentAgeChange = () => {
    const res = onUpdateChildAgeByParent(
      parentAgeDraft,
      profile.parentPin || '1234'
    );
    if (!res.success) {
      setAgeUpdateNotice(res.error || 'No se pudo actualizar la edad.');
      playRewardSound('wrong');
      return;
    }
    playRewardSound('fanfare');
    setAgeUpdateNotice(
      res.graduatedToGroup3
        ? `¡Edad actualizada a ${parentAgeDraft} años! ${profile.name} ha pasado automáticamente a la etapa juvenil avanzada.`
        : `Edad de ${profile.name} actualizada a ${parentAgeDraft} años por el padre/tutor.`
    );
  };

  return (
    <div className="space-y-8">
      {/* Cabecera del Perfil con Anillo de Nivel, Instalar App, Acceso a Tienda y Contador de Gemas */}
      <section
        className={`rounded-[34px] overflow-hidden border shadow-md ${
          isTeenDark
            ? 'bg-[#181326] border-purple-900/50'
            : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50'
        }`}
      >
        <div
          className={`p-6 sm:p-8 ${
            wallpaperAllowed
              ? activeWallpaper.headerBgClass
              : 'bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#84CC16] text-white'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5 min-w-0">
              <AvatarBadge avatarId={profile.avatarId} size="xl" />
              <div className="min-w-0">
                <div className="text-xs font-extrabold opacity-90">
                  {profile.username} · {profile.age} años · Nivel {levelInfo.level}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-display mt-0.5 truncate">
                  {profile.name}
                </h1>
                <p className="text-xs sm:text-sm font-semibold opacity-95 mt-1">
                  {profile.xp} XP · Racha de {profile.streak} días ·{' '}
                  {acceptedFriendsCount} amigos
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
              <CircularProgressRing
                percent={levelInfo.progressPercent}
                size={64}
                strokeWidth={7}
                color="#BEF264"
                trackColor="rgba(255,255,255,0.25)"
                label={`Niv ${levelInfo.level}`}
              />
              <PWAInstallButton variant="profile" />
              <button
                type="button"
                onClick={onOpenFullShop}
                className="px-4 py-2.5 rounded-2xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-black text-xs flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                Ir a la Tienda ({profile.gems} Gemas)
              </button>
              <button
                type="button"
                onClick={onLogoutAccount}
                className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cambiar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas en vivo */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x ${
            isTeenDark
              ? 'divide-purple-900/40 bg-[#181326] text-white'
              : 'divide-slate-200 dark:divide-purple-900/40 bg-white dark:bg-[#181326] text-slate-900 dark:text-slate-100'
          }`}
        >
          <div className="p-4 sm:p-5">
            <div className="text-xs opacity-70 font-bold">Experiencia</div>
            <div className="text-xl font-black tabular-nums mt-0.5">
              {profile.xp} XP
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-xs opacity-70 font-bold">Racha Diaria</div>
            <div className="text-xl font-black text-amber-500 tabular-nums mt-0.5">
              {profile.streak} días
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-xs opacity-70 font-bold flex items-center gap-1">
              <Gem className="w-3.5 h-3.5 text-cyan-500" />
              Gemas
            </div>
            <div
              className="text-xl font-black text-cyan-500 tabular-nums mt-0.5"
              data-testid="profile-gems-counter"
            >
              {profile.gems}
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-xs opacity-70 font-bold">XP Ajedrez</div>
            <div className="text-xl font-black text-emerald-500 tabular-nums mt-0.5">
              {profile.chessXp} XP
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="text-xs opacity-70 font-bold">Lecciones Completas</div>
            <div className="text-xl font-black text-sky-500 tabular-nums mt-0.5">
              {profile.completedLessonIds.length +
                profile.completedChessLessonIds.length}
            </div>
          </div>
        </div>
      </section>

      {/* SELECTOR RÁPIDO DE AVATAR EN EL PERFIL */}
      <section
        data-testid="profile-avatar-selector"
        className={`rounded-[32px] border p-6 sm:p-7 space-y-4 ${
          isTeenDark
            ? 'bg-[#181326] border-purple-900/50 text-white'
            : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold font-display">
              Mis Avatares Desbloqueados ({unlockedAvatarsForChild.length})
            </h2>
            <p className="text-xs opacity-75">
              Elige tu avatar activo con un clic o desbloquea más personajes abajo en la Tienda con gemas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {unlockedAvatarsForChild.map((av) => {
            const isSelected = profile.avatarId === av.id;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => {
                  playRewardSound('pop');
                  onUpdateShopSelection((prev) => ({
                    ...prev,
                    avatarId: av.id,
                  }));
                }}
                className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                  isSelected
                    ? 'border-[#84CC16] bg-[#84CC16]/15 shadow-xs'
                    : 'border-slate-200 dark:border-purple-900/40 hover:border-emerald-400'
                }`}
              >
                <AvatarBadge avatarId={av.id} size="md" />
                <div className="text-left">
                  <div className="font-extrabold text-xs flex items-center gap-1">
                    <span>{av.name}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] opacity-70">
                    {isSelected ? 'En uso' : 'Cambiar avatar'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* TIENDA INTEGRADA CON SUS 4 PESTAÑAS (Tableros, Fichas, Entrenadores y Avatares) */}
      <ShopView
        profile={profile}
        initialTab="avatars"
        onUpdateShopSelection={onUpdateShopSelection}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Fondos de Pantalla (7 a 18 años) y Vitrina de Medallas */}
        <div className="lg:col-span-6 space-y-6">
          {wallpaperAllowed && (
            <section
              data-testid="wallpaper-selector-section"
              className={`rounded-[32px] border p-6 sm:p-8 space-y-4 ${
                isTeenDark
                  ? 'bg-[#181326] border-purple-900/50 text-white'
                  : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
              }`}
            >
              <div>
                <h2 className="text-xl font-extrabold font-display flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-500" />
                  Fondos de Pantalla (Exclusivo 7 a 18 años)
                </h2>
                <p className="text-xs opacity-70 mt-0.5">
                  Personaliza el fondo visual y colores de tu aplicación y perfil ({activeWallpaper.name} activo).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WALLPAPER_GALLERY.map((wp) => {
                  const isCurrent = wp.id === profile.wallpaperId;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      data-testid={`wallpaper-option-${wp.id}`}
                      onClick={() => {
                        playRewardSound('pop');
                        onChangeWallpaper(wp.id);
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3.5 ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-500/15'
                          : isTeenDark
                          ? 'border-purple-900/40 bg-[#221B35]'
                          : 'border-slate-200 dark:border-purple-900/40 bg-white dark:bg-[#221B35]'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl ${wp.previewClass} border border-white/20 shrink-0`}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <span>{wp.name}</span>
                          {isCurrent && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <div className="text-xs opacity-70 line-clamp-2">
                          {wp.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section
            className={`rounded-[32px] border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-900/50 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold font-display flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Vitrina de Medallas y Trofeos ({profile.unlockedMedalIds.length}/{ALL_MEDALS_CATALOG.length})
              </h2>
              <Award className="w-5 h-5 text-amber-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_MEDALS_CATALOG.map((medal) => {
                const unlocked = profile.unlockedMedalIds.includes(medal.id);
                return (
                  <div
                    key={medal.id}
                    className={`p-3.5 rounded-2xl border-2 transition-all ${
                      unlocked
                        ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-400 shadow-xs'
                        : 'border-slate-300/30 opacity-50'
                    }`}
                  >
                    <div className="font-extrabold text-sm flex items-center justify-between">
                      <span>{medal.title}</span>
                      {unlocked ? (
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs opacity-75 mt-1">{medal.description}</p>
                    <div className="text-[11px] font-bold opacity-75 mt-1.5">
                      {unlocked ? '★ Trofeo Ganado' : medal.requirementText}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Columna Derecha: PANEL DE PADRES CON PIN */}
        <div className="lg:col-span-6 space-y-6">
          <section
            id="parental-control-panel"
            className={`rounded-[32px] border-2 p-6 space-y-5 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-700/50 text-white'
                : 'bg-white border-emerald-300 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-emerald-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Zona Exclusiva para Padres o Tutores
                </div>
                <h2 className="text-lg font-extrabold font-display mt-0.5">
                  Panel de Padres (Protegido con PIN)
                </h2>
              </div>
              {isParentUnlocked ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsParentUnlocked(false);
                    setPinInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Bloquear Panel
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 text-[11px] font-extrabold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  PIN Requerido
                </span>
              )}
            </div>

            {!isParentUnlocked ? (
              <form onSubmit={handleUnlockParentPanel} className="space-y-3">
                <p className="text-xs opacity-80 leading-relaxed">
                  La edad, el grupo, los cursos asignados y los permisos de chat solo pueden ser modificados por el padre o tutor ingresando su PIN de 4 dígitos (PIN familiar actual: <strong>{profile.parentPin || '1234'}</strong>).
                </p>

                {pinError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs font-bold">
                    {pinError}
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    aria-label="Ingresar PIN de 4 dígitos del padre"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setPinError(null);
                    }}
                    placeholder="PIN (ej. 1234)"
                    className={`flex-1 h-11 px-4 rounded-2xl border font-mono font-extrabold text-sm tracking-widest ${
                      isTeenDark
                        ? 'bg-[#120E20] border-purple-800 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    className="h-11 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Unlock className="w-4 h-4" />
                    Abrir Panel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 pt-2 border-t border-slate-200/30">
                {/* 1. GESTIÓN DE VARIOS HIJOS */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-500" />
                      1. Perfiles de Hijos ({allChildrenProfiles.length}):
                    </div>
                    <button
                      type="button"
                      onClick={onAddNewChildProfile}
                      className="px-3 py-1.5 rounded-xl bg-[#84CC16] text-slate-950 font-extrabold text-xs flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      + Agregar Hijo
                    </button>
                  </div>

                  <div className="space-y-2">
                    {allChildrenProfiles.map((child) => {
                      const isCurrent = child.id === profile.id;
                      return (
                        <div
                          key={child.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                            isCurrent
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-slate-300/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <AvatarBadge avatarId={child.avatarId} size="sm" />
                            <div className="min-w-0">
                              <div className="font-extrabold text-xs truncate">
                                {child.name} ({child.age} años)
                              </div>
                              <div className="text-[11px] opacity-70">
                                {child.xp} XP · {child.gems} gemas
                              </div>
                            </div>
                          </div>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => onSwitchChildProfile(child)}
                              className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs shrink-0"
                            >
                              Ver Hijo
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. ADMINISTRAR EDAD DEL HIJO (Paso a Grupo 3 a los 14+ años) */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="text-xs font-extrabold">
                    2. Administrar Edad de {profile.name} (Solo Padres):
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Si actualizas la edad de {profile.name} a <strong>14 años o más</strong>, pasará automáticamente a la etapa juvenil avanzada (14–18).
                  </p>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="number"
                      min={3}
                      max={18}
                      aria-label="Nueva edad del hijo"
                      value={parentAgeDraft}
                      onChange={(e) =>
                        setParentAgeDraft(
                          Math.max(3, Math.min(18, Number(e.target.value) || 3))
                        )
                      }
                      className="w-20 h-10 text-center rounded-xl border border-amber-400 bg-white text-slate-900 font-extrabold text-sm tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={handleApplyParentAgeChange}
                      className="px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs"
                    >
                      Actualizar Edad ({parentAgeDraft} años)
                    </button>
                  </div>
                  {ageUpdateNotice && (
                    <div className="text-xs font-bold text-emerald-500">
                      {ageUpdateNotice}
                    </div>
                  )}
                </div>

                {/* 3. ELECCIÓN DE CURSOS Y PROGRESO */}
                <div className="space-y-2.5">
                  <div className="text-xs font-extrabold">
                    3. Cursos habilitados para {profile.name}:
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {allSubjectsForGroup.map((subj) => {
                      const isAllowed = profile.allowedSubjects.includes(subj);
                      const courseObj = coursesForGroup.find(
                        (c) => c.subject === subj
                      );
                      const totalLessons = courseObj?.lessons.length || 1;
                      const doneLessons =
                        courseObj?.lessons.filter((l) =>
                          profile.completedLessonIds.includes(l.id)
                        ).length || 0;
                      const pct = Math.round((doneLessons / totalLessons) * 100);

                      return (
                        <label
                          key={subj}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isAllowed
                              ? 'border-emerald-500/50 bg-emerald-500/10'
                              : 'border-slate-300/30 opacity-60'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs flex items-center justify-between">
                              <span>{SUBJECT_LABELS[subj]}</span>
                              <span className="tabular-nums text-[11px] text-emerald-500">
                                {doneLessons}/{totalLessons} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-300/30 rounded-full overflow-hidden mt-1.5">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => {
                              playRewardSound('pop');
                              onToggleAllowedSubject(subj);
                            }}
                            className="w-5 h-5 accent-emerald-600 rounded shrink-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 4. CONTROLES DE AMISTADES Y CHAT */}
                <div className="space-y-2.5 pt-2 border-t border-slate-200/30">
                  <div className="text-xs font-extrabold">
                    4. Permisos de Amistades y Chat (incluye Chat dentro de Videojuegos):
                  </div>

                  {profile.ageGroup === '3-6' ? (
                    <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs font-semibold">
                      Mientras {profile.name} esté aprendiendo a leer (3 a 6 años), el chat permanece desactivado automáticamente (solo puede enviar emojis en los juegos).
                    </div>
                  ) : (
                    <label className="p-3 rounded-2xl border border-slate-300/40 flex items-center justify-between gap-3 cursor-pointer">
                      <div>
                        <div className="font-bold text-xs">
                          Aprobar Chat Moderado con Amigos y en Juegos
                        </div>
                        <div className="text-[11px] opacity-70">
                          El padre puede desactivar el chat aquí cuando quiera
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.parentalChatApproved}
                        onChange={(e) => onToggleParentalChat(e.target.checked)}
                        className="w-5 h-5 accent-emerald-600 rounded shrink-0"
                      />
                    </label>
                  )}

                  <label className="p-3 rounded-2xl border border-slate-300/40 flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <div className="font-bold text-xs">
                        Aprobar Solicitudes de Amistad
                      </div>
                      <div className="text-[11px] opacity-70">
                        Autoriza agregar amigos para jugar
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.parentalFriendsApproved}
                      onChange={(e) => onToggleParentalFriends(e.target.checked)}
                      className="w-5 h-5 accent-emerald-600 rounded shrink-0"
                    />
                  </label>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
