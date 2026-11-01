import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  UserPlus,
  LogIn,
  Lock,
  Mail,
} from 'lucide-react';
import {
  AgeGroup,
  UserProfile,
  createFreshUserAccount,
  getAgeGroup,
  getInitialAvatarForAgeGroup,
} from '../utils/educationLogic';
import { AVATAR_GALLERY, getAvatarsForChildAge } from '../data/curriculumData';
import { AvatarBadge, MascotCompanion } from './ArtworkRenderer';
import { playRewardSound } from '../utils/soundEffects';

export type { UserProfile };

interface RegistrationScreenProps {
  existingAccounts: UserProfile[];
  onLoginAccount: (account: UserProfile) => void;
  onCreateNewAccount: (newAccount: UserProfile) => void;
}

export function RegistrationScreen({
  existingAccounts,
  onLoginAccount,
  onCreateNewAccount,
}: RegistrationScreenProps) {
  const [parentAuthMethod, setParentAuthMethod] = useState<'email' | 'google' | 'apple'>('email');
  const [parentEmail, setParentEmail] = useState('tutor@familia.es');
  const [parentPin, setParentPin] = useState('1234');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState<number>(10);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(
    getInitialAvatarForAgeGroup('7-13', 10)
  );
  const [parentalApproved, setParentalApproved] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const detectedGroup = getAgeGroup(age);
  const freeAvatarsForAge = getAvatarsForChildAge(age).filter(
    (a) => a.gemCost === 0 || a.gemCost <= 10
  ).slice(0, 3);

  useEffect(() => {
    const defaultStarter = getInitialAvatarForAgeGroup(detectedGroup, age);
    if (!freeAvatarsForAge.some((a) => a.id === selectedAvatarId)) {
      setSelectedAvatarId(defaultStarter);
    }
  }, [detectedGroup, age, freeAvatarsForAge, selectedAvatarId]);

  const groupPreview: Record<
    AgeGroup,
    {
      title: string;
      badgeColor: string;
      mascotVariant: 'flower' | 'droplet' | 'orb';
      styleDesc: string;
      coursesTiles: { label: string; bg: string }[];
    }
  > = {
    '3-6': {
      title: 'Grupo 1 asignado automáticamente (3 a 6 años)',
      badgeColor: 'bg-[#FF6B6B] text-white',
      mascotVariant: 'flower',
      styleDesc:
        'Fondo crema con coral y verde lima, mascota gigante, botones enormes e instrucciones por voz. Chat desactivado.',
      coursesTiles: [
        { label: 'Aprendo a Leer', bg: 'bg-[#FF6B6B] text-white' },
        { label: 'Ajedrez Básico', bg: 'bg-[#84CC16] text-slate-950' },
        { label: 'Oración Sencilla', bg: 'bg-[#38BDF8] text-slate-950' },
        { label: 'Cuentos con Voz', bg: 'bg-[#FACC15] text-slate-950' },
      ],
    },
    '7-13': {
      title: 'Grupo 2 asignado automáticamente (7 a 13 años)',
      badgeColor: 'bg-[#10B981] text-white',
      mascotVariant: 'droplet',
      styleDesc:
        'Aventura en el bosque con mosaicos de colores, selector de ánimo y rutinas con gemas (desde los 10 años).',
      coursesTiles: [
        { label: 'Matemáticas', bg: 'bg-sky-500 text-white' },
        { label: 'Ortografía', bg: 'bg-orange-500 text-white' },
        { label: 'Finanzas', bg: 'bg-emerald-500 text-white' },
        { label: 'Dibujo Realista', bg: 'bg-rose-500 text-white' },
        { label: 'Emprendimiento', bg: 'bg-violet-500 text-white' },
        { label: 'Piano', bg: 'bg-amber-500 text-slate-950' },
        { label: 'Ajedrez', bg: 'bg-teal-500 text-white' },
        { label: 'Oración y Rosario', bg: 'bg-indigo-500 text-white' },
      ],
    },
    '14-18': {
      title: 'Grupo 3 asignado automáticamente (14 a 18 años)',
      badgeColor: 'bg-[#7C3AED] text-white',
      mascotVariant: 'orb',
      styleDesc:
        'Panel juvenil en modo oscuro lila y morado con acento lima, anillos de progreso, calendario y rutinas con gemas.',
      coursesTiles: [
        { label: 'Mate Avanzada', bg: 'bg-[#7C3AED] text-white' },
        { label: 'Ortografía Pro', bg: 'bg-[#A855F7] text-white' },
        { label: 'Inversión', bg: 'bg-[#84CC16] text-slate-950' },
        { label: 'Anatomía y Arte', bg: 'bg-[#EC4899] text-white' },
        { label: 'Startups', bg: 'bg-[#6366F1] text-white' },
        { label: 'Piano Armonía', bg: 'bg-[#F59E0B] text-slate-950' },
        { label: 'Ajedrez Stockfish', bg: 'bg-[#14B8A6] text-slate-950' },
        { label: 'Oración y Rosario', bg: 'bg-[#38BDF8] text-slate-950' },
      ],
    },
  };

  const handleQuickAuthMethod = (method: 'email' | 'google' | 'apple') => {
    playRewardSound('pop');
    setParentAuthMethod(method);
    if (method === 'google' && !parentEmail.includes('@')) {
      setParentEmail('padre.familia@gmail.com');
    } else if (method === 'apple' && !parentEmail.includes('@')) {
      setParentEmail('padre.familia@icloud.com');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUser =
      username.trim() || cleanName.toLowerCase().replace(/\s+/g, '_');

    if (!parentEmail.trim().includes('@')) {
      setErrorMessage('El padre o tutor debe indicar un correo válido.');
      playRewardSound('wrong');
      return;
    }
    if (!/^\d{4}$/.test(parentPin.trim())) {
      setErrorMessage('El PIN del padre debe tener exactamente 4 números (ej. 1234).');
      playRewardSound('wrong');
      return;
    }
    if (!cleanName) {
      setErrorMessage('Por favor escribe el nombre de tu hijo o hija.');
      playRewardSound('wrong');
      return;
    }
    if (age < 3 || age > 18) {
      setErrorMessage('La edad del niño debe estar entre 3 y 18 años.');
      playRewardSound('wrong');
      return;
    }

    const freshAccount = createFreshUserAccount({
      username: cleanUser,
      name: cleanName,
      age,
      avatarId: selectedAvatarId,
      parentEmail: parentEmail.trim(),
      parentPin: parentPin.trim(),
      parentAuthMethod,
      parentalApproved,
    });

    playRewardSound('fanfare');
    onCreateNewAccount(freshAccount);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-slate-900 flex flex-col justify-center py-8 px-4 sm:px-8">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        {/* Cabecera con Mascota amigable preguntando "¡Hola! ¿Cómo te llamas?" */}
        <div className="bg-gradient-to-r from-[#FFF0EB] via-[#FEF9C3] to-[#ECFCCB] rounded-[32px] p-6 sm:p-8 border-2 border-[#FED7AA] shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <MascotCompanion
              variant={groupPreview[detectedGroup].mascotVariant}
              size="lg"
              mood="excited"
            />
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-xs font-extrabold text-[#EA580C] shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Registro Familiar Protegido con PIN
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-slate-900">
                ¡Hola! ¿Cómo te llamas?
              </h1>
              <p className="text-xs sm:text-sm text-slate-700 max-w-xl font-medium">
                El <strong>padre, madre o tutor</strong> crea la cuenta familiar y registra el perfil de su hijo. Cada niño empieza desde cero (0 XP, 0 gemas, sin amigos falsos) y entra automáticamente a su etapa según su edad.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Formulario Paso 1 (Padre/Tutor) + Paso 2 (Perfil del Hijo) */}
          <div className="lg:col-span-7 bg-white rounded-[32px] border-2 border-slate-200/80 p-6 sm:p-8 shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  {errorMessage}
                </div>
              )}

              {/* PASO 1: CUENTA DEL PADRE O TUTOR + PIN */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold font-display text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    1. Cuenta del Padre o Tutor
                  </h2>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Control con PIN
                  </span>
                </div>

                {/* Botones Correo, Google, Apple */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAuthMethod('email')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      parentAuthMethod === 'email'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Con Correo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAuthMethod('google')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      parentAuthMethod === 'google'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>G</span>
                    Con Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAuthMethod('apple')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      parentAuthMethod === 'apple'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span></span>
                    Con Apple
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="reg-parent-email"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Correo del Padre o Tutor
                    </label>
                    <input
                      id="reg-parent-email"
                      type="email"
                      value={parentEmail}
                      onChange={(e) => {
                        setParentEmail(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="padre@familia.es"
                      className="w-full h-11 px-3.5 rounded-2xl bg-white border border-slate-300 text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-parent-pin"
                      className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3 text-amber-600" />
                      PIN Parental (4 dígitos)
                    </label>
                    <input
                      id="reg-parent-pin"
                      type="text"
                      maxLength={4}
                      value={parentPin}
                      onChange={(e) =>
                        setParentPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      placeholder="1234"
                      className="w-full h-11 px-3 rounded-2xl bg-white border border-slate-300 text-center font-mono font-extrabold text-sm tracking-widest text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* PASO 2: PERFIL DEL HIJO (NOMBRE, DETECTOR DE EDAD Y AVATAR INICIAL) */}
              <div className="space-y-4">
                <h2 className="text-sm font-extrabold font-display text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#FF6B6B]" />
                  2. Perfil de tu Hijo o Hija (¡Hola! ¿Cómo te llamas?)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="reg-name-input"
                      className="block text-xs font-bold text-slate-800 mb-1.5"
                    >
                      Nombre del Niño o Joven
                    </label>
                    <input
                      id="reg-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Ej. Mateo"
                      className="w-full h-11 px-4 rounded-2xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-username-input"
                      className="block text-xs font-bold text-slate-800 mb-1.5"
                    >
                      Apodo (@usuario para amigos)
                    </label>
                    <input
                      id="reg-username-input"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ej. mateo_ajedrez"
                      className="w-full h-11 px-4 rounded-2xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Detector de Edad */}
                <div className="p-4 rounded-3xl bg-[#FFFBEB] border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="reg-age-range"
                      className="text-xs font-extrabold text-slate-800"
                    >
                      Edad del Hijo (solo modificable por el padre con PIN):{' '}
                      <span className="text-emerald-700 font-black text-sm tabular-nums">
                        {age} años
                      </span>
                    </label>
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${groupPreview[detectedGroup].badgeColor}`}
                    >
                      Detector: {detectedGroup} años
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="reg-age-range"
                      type="range"
                      min={3}
                      max={18}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full accent-emerald-600 h-2.5 bg-amber-200 rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      aria-label="Edad en años"
                      min={3}
                      max={18}
                      value={age}
                      onChange={(e) =>
                        setAge(Math.max(3, Math.min(18, Number(e.target.value) || 3)))
                      }
                      className="w-16 h-11 text-center rounded-2xl bg-white border border-amber-300 font-extrabold tabular-nums text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAge(5)}
                      className={`py-2 px-2.5 rounded-2xl border text-xs font-extrabold transition-all ${
                        detectedGroup === '3-6'
                          ? 'bg-[#FF6B6B] border-[#FF6B6B] text-white shadow-xs'
                          : 'bg-white border-amber-200 text-slate-600'
                      }`}
                    >
                      3 a 6 años (Ej. 5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAge(10)}
                      className={`py-2 px-2.5 rounded-2xl border text-xs font-extrabold transition-all ${
                        detectedGroup === '7-13'
                          ? 'bg-[#10B981] border-[#10B981] text-white shadow-xs'
                          : 'bg-white border-amber-200 text-slate-600'
                      }`}
                    >
                      7 a 13 años (Ej. 10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAge(16)}
                      className={`py-2 px-2.5 rounded-2xl border text-xs font-extrabold transition-all ${
                        detectedGroup === '14-18'
                          ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-xs'
                          : 'bg-white border-amber-200 text-slate-600'
                      }`}
                    >
                      14 a 18 años (Ej. 16)
                    </button>
                  </div>
                </div>

                {/* Selección de Avatar Inicial */}
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-2">
                    Elige su Avatar Inicial:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {freeAvatarsForAge.map((av) => {
                      const active = selectedAvatarId === av.id;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => {
                            playRewardSound('pop');
                            setSelectedAvatarId(av.id);
                          }}
                          className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 text-left transition-all ${
                            active
                              ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                              : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                          }`}
                        >
                          <AvatarBadge avatarId={av.id} size="sm" />
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-slate-900 truncate">
                              {av.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              Inicial
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {detectedGroup !== '3-6' && (
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={parentalApproved}
                      onChange={(e) => setParentalApproved(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    Como padre/tutor apruebo amistades y chat moderado con niños de su misma etapa
                  </label>
                )}
              </div>

              <button
                type="submit"
                data-start="true"
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#84CC16] to-[#10B981] hover:opacity-95 text-slate-950 font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                Crear Perfil del Hijo e Iniciar desde Cero (0 XP · 0 Gemas)
              </button>
            </form>
          </div>

          {/* Columna Derecha: Detector de Grupo + Mosaicos de Cursos + Perfiles de Hijos Guardados */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[32px] border-2 border-slate-200/80 p-6 shadow-md space-y-4">
              <div className="flex items-center gap-3.5">
                <AvatarBadge avatarId={selectedAvatarId} size="lg" />
                <div>
                  <span
                    className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${groupPreview[detectedGroup].badgeColor}`}
                  >
                    Detector Automático · {age} años
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 mt-1">
                    {groupPreview[detectedGroup].title}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {groupPreview[detectedGroup].styleDesc}
              </p>

              {/* Mosaicos de colores de los cursos */}
              <div>
                <div className="text-xs font-extrabold text-slate-800 mb-2">
                  Mosaico de Cursos Incluidos:
                </div>
                <div className="flex flex-wrap gap-2">
                  {groupPreview[detectedGroup].coursesTiles.map((tile) => (
                    <span
                      key={tile.label}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold shadow-2xs ${tile.bg}`}
                    >
                      {tile.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 font-semibold space-y-1">
                <div>• Inicia 100% desde cero: 0 XP, 0 gemas, sin amigos falsos.</div>
                <div>• Los grupos están aislados: el niño no puede cambiar su edad ni salir de su etapa.</div>
                {detectedGroup === '3-6' && (
                  <div>
                    • Pasa automáticamente al siguiente grupo al completar <strong>Aprendo a Leer</strong> y <strong>Ajedrez Básico</strong>.
                  </div>
                )}
              </div>
            </div>

            {/* Perfiles de Hijos Registrados en esta Cuenta Familiar */}
            <div className="bg-white rounded-[32px] border-2 border-slate-200/80 p-6 shadow-md space-y-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <LogIn className="w-4 h-4 text-emerald-600" />
                Perfiles de Hijos Guardados ({existingAccounts.length})
              </h3>
              {existingAccounts.length === 0 ? (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Aún no has registrado ningún perfil de hijo. Puedes registrar a uno o varios hijos; cada uno tendrá su propio perfil y progreso independiente.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {existingAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        playRewardSound('pop');
                        onLoginAccount(acc);
                      }}
                      className="w-full p-3.5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-slate-50/80 text-left flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarBadge avatarId={acc.avatarId} size="sm" />
                        <div className="min-w-0">
                          <div className="font-extrabold text-sm text-slate-900 truncate">
                            {acc.name} ({acc.age} años)
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {acc.xp} XP · {acc.gems} gemas · Racha {acc.streak}d
                          </div>
                        </div>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shrink-0">
                        Entrar
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
