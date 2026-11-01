import React, { useState } from 'react';
import {
  CalendarCheck2,
  Clock,
  Plus,
  Gem,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { AgeGroup, RoutineItem } from '../utils/educationLogic';
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
  { title: 'Estudiar y repasar mis lecciones', time: '16:30', category: 'Estudio' },
  { title: 'Leer 15 minutos un buen libro', time: '18:00', category: 'Lectura' },
  { title: 'Practicar en el teclado de Piano', time: '17:15', category: 'Música' },
  { title: 'Momento de Oración y gratitud', time: '20:30', category: 'Oración' },
  { title: 'Hacer ejercicio físico o deporte', time: '19:00', category: 'Salud' },
  { title: 'Ordenar mi cuarto y escritorio', time: '09:00', category: 'Hogar' },
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
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('17:00');
  const [category, setCategory] = useState('Estudio');
  const [errorMsg, setErrorMsg] = useState('');
  const [rewardBanner, setRewardBanner] = useState<string | null>(null);

  const isTeenDark = ageGroup === '14-18';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) {
      setErrorMsg('Escribe el nombre de tu rutina antes de guardarla.');
      playRewardSound('wrong');
      return;
    }
    playRewardSound('pop');
    onAddRoutine(clean, time || '17:00', category);
    setTitle('');
    setErrorMsg('');
  };

  const handleMarkDone = (routine: RoutineItem) => {
    if (routine.completedToday) return;
    playRewardSound('fanfare');
    onCompleteRoutine(routine.id);
    setRewardBanner(
      `¡Completaste "${routine.title}"! Ganaste +5 gemas para la Tienda de Avatares.`
    );
  };

  const completedCount = routines.filter((r) => r.completedToday).length;

  return (
    <div className="space-y-8">
      {/* Cabecera de Mis Rutinas y Contador de Gemas */}
      <section
        className={`rounded-[34px] p-6 sm:p-8 border ${
          isTeenDark
            ? 'bg-[#181326] border-purple-900/50 text-white shadow-lg'
            : 'bg-gradient-to-br from-[#ECFCCB] via-white to-[#E0F2FE] border-2 border-emerald-300 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-extrabold text-emerald-500">
              Hábitos Diarios · +5 Gemas por Rutina Completada
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display">
              Mis Rutinas y Recompensas en Gemas
            </h1>
            <p className={`text-sm ${isTeenDark ? 'text-purple-200/80' : 'text-slate-700'}`}>
              Crea tu propio horario diario (estudiar, leer, practicar piano, orar, hacer ejercicio u ordenar tu cuarto). Cada rutina que completes hoy te otorga <strong>+5 gemas</strong> para comprar avatares nuevos en la tienda.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center gap-2.5">
              <Gem className="w-6 h-6 text-cyan-500" />
              <div>
                <div className="text-xs opacity-75 font-bold">Mis Gemas</div>
                <div className="text-xl font-black tabular-nums text-cyan-500">
                  {gems} gemas
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenAvatarShop}
              className="px-4 py-3 rounded-2xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-extrabold text-xs whitespace-nowrap transition-colors shadow-xs"
            >
              Tienda de Avatares
            </button>
          </div>
        </div>
      </section>

      {rewardBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 text-sm font-bold flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            {rewardBanner}
          </span>
          <button
            type="button"
            onClick={() => setRewardBanner(null)}
            className="text-xs underline"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Formulario para crear rutina desde cero + plantillas opcionales */}
        <div
          className={`lg:col-span-5 rounded-3xl border p-6 space-y-5 ${
            isTeenDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <h2 className="text-lg font-bold font-display">
            Crear Nueva Rutina Diaria
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <div>
              <label
                htmlFor="routine-title-input"
                className="block text-xs font-semibold mb-1.5 opacity-85"
              >
                Actividad o Hábito
              </label>
              <input
                id="routine-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Ej. Practicar piano 20 minutos"
                className={`w-full h-11 px-3.5 rounded-xl border text-sm ${
                  isTeenDark
                    ? 'bg-slate-950 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="routine-time-input"
                  className="block text-xs font-semibold mb-1.5 opacity-85"
                >
                  Horario
                </label>
                <input
                  id="routine-time-input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`w-full h-11 px-3 rounded-xl border text-sm tabular-nums ${
                    isTeenDark
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="routine-category-select"
                  className="block text-xs font-semibold mb-1.5 opacity-85"
                >
                  Categoría
                </label>
                <select
                  id="routine-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full h-11 px-3 rounded-xl border text-sm ${
                    isTeenDark
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Estudio">Estudiar</option>
                  <option value="Lectura">Leer</option>
                  <option value="Música">Practicar Piano</option>
                  <option value="Oración">Orar</option>
                  <option value="Salud">Hacer Ejercicio</option>
                  <option value="Hogar">Ordenar mi Cuarto</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar a Mis Rutinas
            </button>
          </form>

          {/* Ideas rápidas para agregar con 1 clic */}
          <div className="pt-4 border-t border-slate-200/30 space-y-2.5">
            <div className="text-xs font-semibold opacity-75">
              Ideas rápidas para agregar a tu agenda:
            </div>
            <div className="grid grid-cols-1 gap-2">
              {ROUTINE_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.title}
                  type="button"
                  onClick={() => {
                    playRewardSound('pop');
                    onAddRoutine(sug.title, sug.time, sug.category);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-colors ${
                    isTeenDark
                      ? 'border-slate-800 bg-slate-800/50 hover:border-slate-600'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-medium truncate pr-2">{sug.title}</span>
                  <span className="text-emerald-600 font-bold shrink-0">
                    + Agregar ({sug.time})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Lista de Rutinas del Usuario */}
        <div
          className={`lg:col-span-7 rounded-3xl border p-6 sm:p-8 space-y-5 ${
            isTeenDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">
              Mi Agenda de Hoy ({completedCount}/{routines.length} completadas)
            </h2>
            <span className="text-xs font-semibold text-cyan-500">
              +5 gemas por cada rutina
            </span>
          </div>

          {routines.length === 0 ? (
            <div className="text-center py-14 space-y-3 opacity-80">
              <CalendarCheck2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-bold text-base">
                Aún no has creado ninguna rutina
              </div>
              <p className="text-xs max-w-md mx-auto">
                Tu agenda empieza completamente desde cero. Usa el formulario de la izquierda o elige una idea rápida para crear tus propios hábitos diarios y ganar gemas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    routine.completedToday
                      ? 'border-emerald-500/60 bg-emerald-500/10'
                      : isTeenDark
                      ? 'border-slate-800 bg-slate-800/60'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-emerald-600 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{routine.time}</span>
                      <span>·</span>
                      <span>{routine.category}</span>
                    </div>
                    <h3
                      className={`font-bold text-base ${
                        routine.completedToday ? 'line-through opacity-75' : ''
                      }`}
                    >
                      {routine.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={routine.completedToday}
                      onClick={() => handleMarkDone(routine)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap ${
                        routine.completedToday
                          ? 'bg-emerald-600/20 text-emerald-500 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {routine.completedToday
                        ? 'Completada (+5 Gemas)'
                        : 'Marcar Completada (+5 Gemas)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRoutine(routine.id)}
                      aria-label={`Eliminar rutina ${routine.title}`}
                      className="p-2.5 rounded-xl border border-slate-200/40 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
