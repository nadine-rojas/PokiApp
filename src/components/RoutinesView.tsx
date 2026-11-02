import React, { useState } from 'react';
import {
  CalendarCheck2,
  Clock,
  Plus,
  Gem,
  CheckCircle2,
  Trash2,
  Sparkles,
  Bell,
  Search,
  Flag,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import { AgeGroup, RoutineItem } from '../utils/educationLogic';
import { CircularProgressRing } from './ArtworkRenderer';
import { playRewardSound } from '../utils/soundEffects';

interface RoutinesViewProps {
  ageGroup: AgeGroup;
  gems: number;
  routines: RoutineItem[];
  onAddRoutine: (title: string, time: string, category: string) => void;
  onCompleteRoutine: (routineId: string) => void;
  onDeleteRoutine: (routineId: string) => void;
  onOpenAvatarShop: () => void;
}

const ROUTINE_SUGGESTIONS = [
  { title: 'Estudiar y repasar mis lecciones', time: '10:30 AM', category: 'Estudio' },
  { title: 'Leer 15 minutos un buen libro', time: '04:30 PM', category: 'Lectura' },
  { title: 'Practicar en el teclado de Piano', time: '05:15 PM', category: 'Música' },
  { title: 'Momento de Oración y gratitud', time: '08:30 PM', category: 'Oración' },
  { title: 'Hacer ejercicio físico o deporte', time: '06:00 PM', category: 'Salud' },
  { title: 'Ordenar mi cuarto y escritorio', time: '09:00 AM', category: 'Hogar' },
];

const SCHEDULE_DAYS_ROW_1 = [
  { dayLabel: 'Lun', num: 14 },
  { dayLabel: 'Mar', num: 15 },
  { dayLabel: 'Mié', num: 17 },
  { dayLabel: 'Jue', num: 18 },
  { dayLabel: 'Vie', num: 19 },
  { dayLabel: 'Sáb', num: 20 },
  { dayLabel: 'Dom', num: 21 },
];

const SCHEDULE_DAYS_ROW_2 = [
  { dayLabel: 'Lun', num: 22 },
  { dayLabel: 'Mar', num: 23 },
  { dayLabel: 'Mié', num: 24 },
  { dayLabel: 'Jue', num: 25 },
  { dayLabel: 'Vie', num: 26 },
  { dayLabel: 'Sáb', num: 27 },
  { dayLabel: 'Dom', num: 28 },
];

const STUDY_DAY_BARS = [
  { label: 'Dom', num: 16, heightPct: 48, active: false },
  { label: 'Lun', num: 17, heightPct: 36, active: false },
  { label: 'Mar', num: 18, heightPct: 58, active: false },
  { label: 'Mié', num: 19, heightPct: 82, active: false },
  { label: 'Jue', num: 20, heightPct: 68, active: false },
  { label: 'Sáb', num: 22, heightPct: 92, active: true },
];

export function RoutinesView({
  ageGroup,
  gems,
  routines,
  onAddRoutine,
  onCompleteRoutine,
  onDeleteRoutine,
  onOpenAvatarShop,
}: RoutinesViewProps) {
  const [planTab, setPlanTab] = useState<'today' | 'learning_plan' | 'weekly_plan'>('today');
  const [selectedDateNum, setSelectedDateNum] = useState<number>(18);
  const [weeklyGoalInput, setWeeklyGoalInput] = useState('Completar 5 lecciones y mis hábitos diarios');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('10:30');
  const [category, setCategory] = useState('Estudio');
  const [errorMsg, setErrorMsg] = useState('');
  const [rewardBanner, setRewardBanner] = useState<string | null>(null);

  const isTeenDark = ageGroup === '14-18';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) {
      setErrorMsg('Escribe el nombre de tu rutina o lección antes de guardarla.');
      playRewardSound('wrong');
      return;
    }
    playRewardSound('pop');
    onAddRoutine(clean, time || '10:30 AM', category);
    setTitle('');
    setErrorMsg('');
  };

  const handleMarkDone = (routine: RoutineItem) => {
    if (routine.completedToday) return;
    playRewardSound('fanfare');
    onCompleteRoutine(routine.id);
    setRewardBanner(
      `¡Completaste "${routine.title}"! Ganaste +5 gemas para la Tienda.`
    );
  };

  const completedCount = routines.filter((r) => r.completedToday).length;
  const weeklyProgressPercent =
    routines.length > 0
      ? Math.max(20, Math.round((completedCount / routines.length) * 100))
      : 60;

  const pastelCardStyles = [
    'bg-[#EDE9FE] dark:bg-[#272142] border-[#DDD6FE] dark:border-purple-800/50 text-slate-900 dark:text-white',
    'bg-[#E0F2F1] dark:bg-[#1B3332] border-[#B2DFDB] dark:border-teal-800/50 text-slate-900 dark:text-white',
    'bg-[#FCE7F3] dark:bg-[#361F31] border-[#FBCFE8] dark:border-pink-800/50 text-slate-900 dark:text-white',
    'bg-[#E0E7FF] dark:bg-[#1F2747] border-[#C7D2FE] dark:border-indigo-800/50 text-slate-900 dark:text-white',
  ];

  return (
    <div className="space-y-8" data-testid="lesson-schedule-routines-view">
      {rewardBanner && (
        <div
          role="status"
          className="p-4 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-sm font-extrabold flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 shrink-0" />
            {rewardBanner}
          </span>
          <button
            type="button"
            onClick={() => setRewardBanner(null)}
            className="text-xs underline font-bold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* DISEÑO EN 3 PANELES PASTEL REDONDEADOS ESTILO IMAGEN 4 ("Start Your Journey" | "Lesson schedule" | "All Tasks & Create") */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL 1 (Izquierda - 4 cols): "Start Your Journey" / "Comienza tu Viaje" con Píldoras y Tarjeta Destacada con Hora 10:30 AM */}
        <section className="lg:col-span-4 rounded-[38px] bg-white dark:bg-[#19162B] border-2 border-slate-100 dark:border-purple-900/40 p-6 shadow-md space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-black font-display leading-tight text-slate-900 dark:text-white">
              Comienza tu
              <br />
              Viaje Diario
            </h1>
            <span className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/10 border border-slate-200/70 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-200 shrink-0">
              <Search className="w-4 h-4" />
            </span>
          </div>

          {/* Píldoras superiores: Hoy | Plan de aprendizaje | Plan semanal */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'today', label: 'Hoy' },
              { id: 'learning_plan', label: 'Plan de aprendizaje' },
              { id: 'weekly_plan', label: 'Plan semanal' },
            ].map((t) => {
              const active = planTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPlanTab(t.id as typeof planTab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#7C69EF] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Meta semanal redondeada */}
          <div className="p-2.5 rounded-full bg-[#F8F7FF] dark:bg-white/5 border border-[#E5E0FF] dark:border-purple-800/40 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-[#DDD6FE] text-[#6D28D9] flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={weeklyGoalInput}
              onChange={(e) => setWeeklyGoalInput(e.target.value)}
              aria-label="Define tu meta semanal"
              className="flex-1 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none truncate"
            />
          </div>

          {/* Tarjeta Pastel Grande Destacada con Hora (10:30 AM) y Botón Circular Violeta ↗ (Imagen 4) */}
          <div className="rounded-[30px] bg-[#EDE9FE] dark:bg-[#282046] p-5 space-y-4 border border-[#DDD6FE] dark:border-purple-700/50 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center shadow-2xs">
                <CalendarCheck2 className="w-4 h-4 text-[#7C69EF]" />
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/70 text-[11px] font-black text-[#6D28D9] dark:text-[#C4B5FD]">
                +5 Gemas por Rutina
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-500 dark:text-purple-200">
                Hábito y Estudio Diario
              </div>
              <h2 className="text-lg font-black font-display text-slate-900 dark:text-white leading-snug">
                {routines[0]?.title || 'Construye hábitos que conectan con tus metas'}
              </h2>
            </div>

            <div className="flex items-end justify-between pt-2">
              <div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-purple-200">
                  Hora programada
                </div>
                <div className="text-base font-black font-display text-slate-900 dark:text-white tabular-nums">
                  {routines[0]?.time || '10:30 AM'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (routines[0] && !routines[0].completedToday) {
                    handleMarkDone(routines[0]);
                  } else {
                    onAddRoutine(
                      'Sesión de Estudio Enfocada',
                      '10:30 AM',
                      'Estudio'
                    );
                    playRewardSound('pop');
                  }
                }}
                aria-label="Iniciar o agregar rutina principal"
                className="w-10 h-10 rounded-full bg-[#7C69EF] hover:bg-[#6854E6] text-white flex items-center justify-center shadow-md cursor-pointer"
              >
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dos tarjetas inferiores pastel (Lavanda y Rosa) estilo Imagen 4 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[26px] bg-[#D8D0FF] dark:bg-indigo-950/60 p-4 space-y-3 text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-white/80 text-slate-900 flex items-center justify-center text-xs font-black">
                  1
                </span>
                <div>
                  <div className="text-xs font-black">Bloque 1</div>
                  <div className="text-[10px] opacity-70">10:30 AM</div>
                </div>
              </div>
              <div className="text-xs font-bold leading-snug">
                Repaso de Cursos y Lectura
              </div>
            </div>

            <div className="rounded-[26px] bg-[#FFE4EE] dark:bg-rose-950/60 p-4 space-y-3 text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-white/80 text-slate-900 flex items-center justify-center text-xs font-black">
                  2
                </span>
                <div>
                  <div className="text-xs font-black">Bloque 2</div>
                  <div className="text-[10px] opacity-70">05:00 PM</div>
                </div>
              </div>
              <div className="text-xs font-bold leading-snug">
                Práctica de Piano y Ajedrez
              </div>
            </div>
          </div>
        </section>

        {/* PANEL 2 (Centro - 4 cols): "Lesson schedule" / "Horario de lecciones", Selector Circular de Días, "Weekly Progress" (60%) y "Study Day" Bar Chart */}
        <section
          data-testid="lesson-schedule-center-card"
          className="lg:col-span-4 rounded-[38px] bg-white dark:bg-[#19162B] border-2 border-slate-100 dark:border-purple-900/40 p-6 shadow-md space-y-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#7C69EF]">
              Agenda Semanal
            </span>
            <h2 className="text-base font-black font-display text-slate-900 dark:text-white">
              Horario de lecciones
            </h2>
            <span className="w-9 h-9 rounded-full bg-slate-50 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-200">
              <Bell className="w-4 h-4" />
            </span>
          </div>

          {/* Factor Frequency / Selector Circular de Días de la Semana (Mon-Sun / Lun-Dom) */}
          <div className="p-4 rounded-[28px] bg-[#FAF9FF] dark:bg-white/5 border border-[#ECE8FF] dark:border-purple-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                Frecuencia Semanal
              </span>
              <span className="text-[11px] font-bold text-[#7C69EF]">
                Octubre · Activo
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
              {SCHEDULE_DAYS_ROW_1.map((d) => (
                <span key={d.dayLabel}>{d.dayLabel}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {SCHEDULE_DAYS_ROW_1.map((d) => {
                const active = selectedDateNum === d.num;
                return (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => {
                      playRewardSound('pop');
                      setSelectedDateNum(d.num);
                    }}
                    className={`h-9 rounded-full text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                      active
                        ? 'bg-[#7C69EF] text-white shadow-sm scale-105'
                        : 'bg-[#EDE9FE]/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-[#DDD6FE]'
                    }`}
                  >
                    {d.num}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {SCHEDULE_DAYS_ROW_2.map((d) => {
                const active = selectedDateNum === d.num;
                return (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => {
                      playRewardSound('pop');
                      setSelectedDateNum(d.num);
                    }}
                    className={`h-9 rounded-full text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                      active
                        ? 'bg-[#7C69EF] text-white shadow-sm scale-105'
                        : 'bg-slate-100/80 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-[#EDE9FE]'
                    }`}
                  >
                    {d.num}
                  </button>
                );
              })}
            </div>

            {/* Tarjeta de "Weekly Progress / Progreso Semanal" con Porcentaje Circular (60%) */}
            <div
              data-testid="weekly-progress-ring-card"
              className="mt-2 p-4 rounded-[24px] bg-[#D5CCFF] dark:bg-[#31275E] text-slate-900 dark:text-white flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-black">
                  Progreso Semanal (Weekly Progress)
                </div>
                <div className="text-[11px] font-semibold opacity-75 mt-0.5">
                  3 días restantes · Racha activa
                </div>
              </div>
              <CircularProgressRing
                percent={weeklyProgressPercent}
                size={56}
                strokeWidth={6}
                color="#7C69EF"
                trackColor="rgba(255,255,255,0.65)"
              />
            </div>
          </div>

          {/* Gráfico de Barras Verticales de Días de Estudio ("Study Day 6" - Sun a Sat) */}
          <div
            data-testid="study-day-bar-chart"
            className="p-5 rounded-[28px] bg-[#FAF9FF] dark:bg-white/5 border border-[#ECE8FF] dark:border-purple-800/30 space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-[#7C69EF] text-white flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Día de Estudio (Study Day 6)
                </h3>
                <div className="text-[11px] text-slate-400 font-semibold">
                  Actividad semanal por día
                </div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2.5 items-end h-36 pt-4 px-1">
              {STUDY_DAY_BARS.map((bar) => (
                <div
                  key={bar.label}
                  className="flex flex-col items-center justify-end h-full gap-1.5"
                >
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      bar.active
                        ? 'bg-slate-900 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200/60'
                    }`}
                  >
                    {bar.label}
                  </span>
                  <div
                    className={`w-full rounded-2xl transition-all ${
                      bar.active
                        ? 'bg-[#7C69EF] shadow-md'
                        : 'bg-[#EDE9FE] dark:bg-white/10'
                    }`}
                    style={{ height: `${bar.heightPct}%` }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                    {bar.num}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PANEL 3 (Derecha - 4 cols): Anillo "Todas las Tareas", Contador de Gemas, Formulario para Crear Rutina y Lista de Hábitos */}
        <section className="lg:col-span-4 rounded-[38px] bg-white dark:bg-[#19162B] border-2 border-slate-100 dark:border-purple-900/40 p-6 shadow-md space-y-5">
          {/* Cabecera con Anillo de Tareas y Contador de Gemas */}
          <div className="p-4 rounded-[28px] bg-[#F8F7FF] dark:bg-white/5 border border-[#E5E0FF] dark:border-purple-800/30 flex items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#7C69EF]">
                <Gem className="w-4 h-4 text-cyan-500" />
                <span>{gems} Gemas Acumuladas</span>
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Mis Tareas ({completedCount}/{routines.length})
              </h3>
              <button
                type="button"
                onClick={onOpenAvatarShop}
                className="text-[11px] font-extrabold text-[#7C69EF] hover:underline cursor-pointer"
              >
                Canjear gemas en la Tienda →
              </button>
            </div>

            <CircularProgressRing
              percent={weeklyProgressPercent}
              size={64}
              strokeWidth={7}
              color="#7C69EF"
              label="Tareas"
            />
          </div>

          {/* Formulario rápido para agregar rutina con hora */}
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="text-xs font-black text-slate-800 dark:text-white">
              Agregar Nuevo Hábito o Lección al Horario:
            </div>
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <input
              id="routine-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Ej. Practicar piano 20 minutos"
              className={`w-full h-11 px-3.5 rounded-2xl border text-xs font-bold ${
                isTeenDark
                  ? 'bg-slate-950 border-slate-700 text-white'
                  : 'bg-[#FAF9FF] border-[#DDD6FE] text-slate-900'
              }`}
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                id="routine-time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label="Horario de la rutina"
                className={`w-full h-10 px-3 rounded-2xl border text-xs font-bold tabular-nums ${
                  isTeenDark
                    ? 'bg-slate-950 border-slate-700 text-white'
                    : 'bg-[#FAF9FF] border-[#DDD6FE] text-slate-900'
                }`}
              />
              <select
                id="routine-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Categoría de la rutina"
                className={`w-full h-10 px-3 rounded-2xl border text-xs font-bold ${
                  isTeenDark
                    ? 'bg-slate-950 border-slate-700 text-white'
                    : 'bg-[#FAF9FF] border-[#DDD6FE] text-slate-900'
                }`}
              >
                <option value="Estudio">Estudiar</option>
                <option value="Lectura">Leer</option>
                <option value="Música">Practicar Piano</option>
                <option value="Oración">Orar</option>
                <option value="Salud">Ejercicio</option>
                <option value="Hogar">Ordenar</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-2xl bg-[#7C69EF] hover:bg-[#6854E6] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar a Mi Horario (+5 Gemas)</span>
            </button>
          </form>

          {/* Lista de Rutinas del Usuario o Sugerencias Pastel */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
            <div className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
              {routines.length > 0
                ? 'Tus Hábitos Programados Hoy:'
                : 'Ideas rápidas en 1 clic (+5 Gemas):'}
            </div>

            {routines.length > 0 ? (
              <div className="space-y-2.5">
                {routines.map((routine, idx) => {
                  const styleClass =
                    pastelCardStyles[idx % pastelCardStyles.length];
                  return (
                    <div
                      key={routine.id}
                      className={`p-3.5 rounded-3xl border flex items-center justify-between gap-3 ${styleClass}`}
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-extrabold text-[#6D28D9] dark:text-[#C4B5FD] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{routine.time}</span>
                          <span>·</span>
                          <span>{routine.category}</span>
                        </div>
                        <div
                          className={`font-black text-xs sm:text-sm truncate mt-0.5 ${
                            routine.completedToday ? 'line-through opacity-70' : ''
                          }`}
                        >
                          {routine.title}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={routine.completedToday}
                          onClick={() => handleMarkDone(routine)}
                          className={`px-3 py-2 rounded-full font-extrabold text-[11px] flex items-center gap-1 cursor-pointer ${
                            routine.completedToday
                              ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300'
                              : 'bg-[#7C69EF] text-white shadow-xs'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {routine.completedToday ? 'Hecha' : '+5 Gemas'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRoutine(routine.id)}
                          aria-label={`Eliminar rutina ${routine.title}`}
                          className="p-1.5 rounded-full text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {ROUTINE_SUGGESTIONS.slice(0, 4).map((sug, idx) => (
                  <button
                    key={sug.title}
                    type="button"
                    onClick={() => {
                      playRewardSound('pop');
                      onAddRoutine(sug.title, sug.time, sug.category);
                    }}
                    className={`p-3 rounded-2xl border text-left text-xs flex items-center justify-between transition-transform hover:scale-[1.01] cursor-pointer ${
                      pastelCardStyles[idx % pastelCardStyles.length]
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-black truncate">{sug.title}</div>
                      <div className="text-[10px] opacity-75 font-bold">
                        {sug.time} · {sug.category}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-white/90 text-[#6D28D9] font-black text-[11px] shrink-0">
                      + Agregar
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
