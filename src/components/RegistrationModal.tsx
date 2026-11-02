import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Calculator,
  Coins,
  Palette,
  Rocket,
  Music,
  BookOpen,
  Crown,
  HeartHandshake,
} from 'lucide-react';
import {
  AgeGroup,
  CourseSubject,
  UserProfile,
  createFreshUserAccount,
  getAgeGroup,
  getInitialAvatarForAgeGroup,
} from '../utils/educationLogic';
import { getAvatarsForChildAge } from '../data/curriculumData';
import { AvatarBadge, MascotCompanion } from './ArtworkRenderer';
import { playRewardSound } from '../utils/soundEffects';

export type { UserProfile };

interface RegistrationScreenProps {
  existingAccounts: UserProfile[];
  onLoginAccount: (account: UserProfile) => void;
  onCreateNewAccount: (newAccount: UserProfile) => void;
}

const INTEREST_CARDS: {
  id: string;
  subject: CourseSubject;
  title: string;
  subtitle: string;
  bgClass: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'math',
    subject: 'math',
    title: 'Matemáticas',
    subtitle: '100 lecciones · Lógica y números',
    bgClass: 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1]',
    icon: <Calculator className="w-6 h-6" />,
  },
  {
    id: 'finance',
    subject: 'finance',
    title: 'Finanzas',
    subtitle: '100 lecciones · Ahorro inteligente',
    bgClass: 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]',
    icon: <Coins className="w-6 h-6" />,
  },
  {
    id: 'drawing',
    subject: 'drawing',
    title: 'Dibujo',
    subtitle: '100 lecciones · Arte paso a paso',
    bgClass: 'bg-[#FFE4E6] border-[#FDA4AF] text-[#BE123C]',
    icon: <Palette className="w-6 h-6" />,
  },
  {
    id: 'entrepreneurship',
    subject: 'entrepreneurship',
    title: 'Emprendimiento',
    subtitle: '100 lecciones · Crea proyectos',
    bgClass: 'bg-[#F3E8FF] border-[#D8B4FE] text-[#6B21A8]',
    icon: <Rocket className="w-6 h-6" />,
  },
  {
    id: 'piano',
    subject: 'piano',
    title: 'Piano',
    subtitle: '100 lecciones · Teclado interactivo',
    bgClass: 'bg-[#FEF3C7] border-[#FDE047] text-[#B45309]',
    icon: <Music className="w-6 h-6" />,
  },
  {
    id: 'reading_english',
    subject: 'reading',
    title: 'Lectura / Inglés',
    subtitle: '100 lecciones · Cuentos y English',
    bgClass: 'bg-[#FFEDD5] border-[#FDBA74] text-[#C2410C]',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: 'chess',
    subject: 'chess_course',
    title: 'Ajedrez',
    subtitle: '100 lecciones · Táctica y partidas',
    bgClass: 'bg-[#CCFBF1] border-[#5EEAD4] text-[#0F766E]',
    icon: <Crown className="w-6 h-6" />,
  },
  {
    id: 'prayer',
    subject: 'prayer',
    title: 'Oración y Valores',
    subtitle: '100 lecciones · Paz interior',
    bgClass: 'bg-[#E0E7FF] border-[#A5B4FC] text-[#3730A3]',
    icon: <HeartHandshake className="w-6 h-6" />,
  },
];

export function RegistrationScreen({
  existingAccounts,
  onLoginAccount,
  onCreateNewAccount,
}: RegistrationScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parentAuthMethod, setParentAuthMethod] = useState<
    'email' | 'google' | 'apple'
  >('email');
  const [parentEmail, setParentEmail] = useState('tutor@familia.es');
  const [parentPin, setParentPin] = useState('1234');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState<number>(10);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(
    getInitialAvatarForAgeGroup('7-13', 10)
  );
  const [parentalApproved, setParentalApproved] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'math',
    'finance',
    'drawing',
    'piano',
    'reading_english',
  ]);
  const [errorMessage, setErrorMessage] = useState('');

  const detectedGroup: AgeGroup = getAgeGroup(age);
  const freeAvatarsForAge = getAvatarsForChildAge(age)
    .filter((a) => a.gemCost === 0 || a.gemCost <= 10)
    .slice(0, 4);

  useEffect(() => {
    const defaultStarter = getInitialAvatarForAgeGroup(detectedGroup, age);
    if (!freeAvatarsForAge.some((a) => a.id === selectedAvatarId)) {
      setSelectedAvatarId(defaultStarter);
    }
  }, [detectedGroup, age, freeAvatarsForAge, selectedAvatarId]);

  const toggleInterest = (id: string) => {
    playRewardSound('pop');
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGoToStep2 = () => {
    playRewardSound('pop');
    setErrorMessage('');
    setStep(2);
  };

  const handleGoToStep3 = () => {
    const cleanName = name.trim();
    if (!parentEmail.trim().includes('@')) {
      setErrorMessage('El padre o tutor debe indicar un correo válido.');
      playRewardSound('wrong');
      return;
    }
    if (!/^\d{4}$/.test(parentPin.trim())) {
      setErrorMessage('El PIN parental debe tener 4 números (ej. 1234).');
      playRewardSound('wrong');
      return;
    }
    if (!cleanName) {
      setErrorMessage('¡Hola! Escribe cómo te llamas para continuar.');
      playRewardSound('wrong');
      return;
    }
    if (age < 3 || age > 18) {
      setErrorMessage('La edad debe estar entre 3 y 18 años.');
      playRewardSound('wrong');
      return;
    }
    playRewardSound('pop');
    setErrorMessage('');
    setStep(3);
  };

  const handleCompleteRegistration = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanName = name.trim() || 'Explorador';
    const cleanUser =
      username.trim() || cleanName.toLowerCase().replace(/\s+/g, '_');

    const freshAccount = createFreshUserAccount({
      username: cleanUser,
      name: cleanName,
      age,
      avatarId: selectedAvatarId,
      parentEmail: parentEmail.trim() || 'tutor@familia.es',
      parentPin: parentPin.trim() || '1234',
      parentAuthMethod,
      parentalApproved,
    });

    playRewardSound('fanfare');
    onCreateNewAccount(freshAccount);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-slate-900 flex flex-col justify-between py-6 px-4 sm:px-8">
      <div className="max-w-5xl w-full mx-auto space-y-6 my-auto">
        {/* Indicador superior de pasos estilo Aptivo / Habitz (Sin Cámara Facial) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur-xs px-5 py-3.5 rounded-full border-2 border-[#F26B5B]/25 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-[#F26B5B] text-white font-black text-sm flex items-center justify-center shadow-2xs">
              ✿
            </span>
            <span className="font-display font-black text-lg text-[#F26B5B] tracking-tight">
              LumiQuest · Aptivo Kids
            </span>
          </div>

          <div className="flex items-center gap-2" aria-label="Pasos de registro">
            {[
              { num: 1, label: '1. Bienvenida' },
              { num: 2, label: '2. Nombre, Edad y Avatar' },
              { num: 3, label: '3. Tus Intereses' },
            ].map((s) => {
              const active = step === s.num;
              const done = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  data-testid={`onboarding-step-pill-${s.num}`}
                  onClick={() => {
                    if (s.num <= 2 || (s.num === 3 && name.trim())) {
                      setStep(s.num as 1 | 2 | 3);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                    active
                      ? 'bg-[#F26B5B] text-white shadow-xs scale-105'
                      : done
                      ? 'bg-[#FFE4DE] text-[#D94E3E]'
                      : 'bg-[#FFF8F2] text-slate-500 border border-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL ESTILO APTIVO & HABITZ CORAL #F26B5B & CREMA #FFF8F2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Columna Izquierda Principal (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            {step === 1 && (
              /* PASO 1: Pantalla de bienvenida en color coral (#F26B5B) con mascota flor animada y figuras Habitz */
              <div
                data-testid="onboarding-step-1-welcome"
                className="flex-1 rounded-[40px] bg-gradient-to-br from-[#F26B5B] via-[#F47B6A] to-[#E45747] text-white p-7 sm:p-10 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[520px]"
              >
                <div className="space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-extrabold">
                    <Sparkles className="w-4 h-4" />
                    Aprende jugando · Cursos de 100 lecciones para 3 a 18 años
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black font-display leading-tight tracking-tight">
                    Tu aventura diaria para crear hábitos y aprender
                  </h1>
                  <p className="text-sm sm:text-base text-white/90 font-medium max-w-lg leading-relaxed">
                    Inspirado en Aptivo y Habitz: rutas de <strong>100 lecciones por materia</strong>, ajedrez con reloj, piano, inglés y chat privado protegido con IA.
                  </p>
                </div>

                {/* Mascota Flor Roja/Coral + Personajes Geométricos con Ojos Grandes (Habitz / Aptivo) */}
                <div className="my-6 flex flex-col items-center justify-center gap-5 relative z-10">
                  <div className="p-5 rounded-full bg-[#FFF8F2] shadow-2xl border-4 border-white/60">
                    <MascotCompanion variant="flower" size="xl" mood="excited" />
                  </div>

                  {/* Familia de figuritas geométricas Habitz con ojitos grandes */}
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <div className="w-14 h-14 rounded-2xl bg-[#60A5FA] border-2 border-white/80 flex items-center justify-center shadow-md -rotate-6">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-slate-950 border border-white" />
                        <span className="w-3 h-3 rounded-full bg-slate-950 border border-white" />
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-[#FBBF24] border-2 border-white/80 flex items-center justify-center shadow-md rotate-3">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-slate-950 border border-white" />
                        <span className="w-3 h-3 rounded-full bg-slate-950 border border-white" />
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-[#34D399] border-2 border-white/80 flex items-center justify-center shadow-md -rotate-3">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-slate-950 border border-white" />
                        <span className="w-3 h-3 rounded-full bg-slate-950 border border-white" />
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-[#F472B6] border-2 border-white/80 flex items-center justify-center shadow-md rotate-6">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-slate-950 border border-white" />
                        <span className="w-3 h-3 rounded-full bg-slate-950 border border-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  <button
                    type="button"
                    data-testid="onboarding-start-btn"
                    onClick={handleGoToStep2}
                    className="w-full h-14 rounded-full bg-[#FFF8F2] hover:bg-white text-[#F26B5B] font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
                  >
                    <span>Comenzar Registro Rápido</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              /* PASO 2: Nombre, Edad y Avatar Inicial (Sin pedir cámara web) */
              <div
                data-testid="onboarding-step-2-profile"
                className="flex-1 rounded-[40px] bg-white border-2 border-[#F26B5B]/30 p-6 sm:p-8 shadow-lg space-y-6"
              >
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-[#FFF8F2] border border-[#F26B5B]/25">
                  <MascotCompanion variant="flower" size="md" mood="happy" />
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F26B5B]">
                      Paso 2 de 3 · Tu Perfil
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900">
                      ¡Hola! ¿Cómo te llamas y cuántos años tienes?
                    </h2>
                  </div>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-extrabold"
                  >
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="reg-name-input"
                      className="block text-xs font-extrabold text-slate-800 mb-1.5"
                    >
                      ¿Cómo te llamas? (Nombre)
                    </label>
                    <input
                      id="reg-name-input"
                      data-testid="reg-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Ej. Mateo"
                      className="w-full h-12 px-4 rounded-2xl bg-[#FFF8F2] border-2 border-[#F26B5B]/30 text-sm font-extrabold text-slate-900 focus:outline-none focus:border-[#F26B5B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-username-input"
                      className="block text-xs font-extrabold text-slate-800 mb-1.5"
                    >
                      Tu apodo (@usuario)
                    </label>
                    <input
                      id="reg-username-input"
                      data-testid="reg-username-input"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ej. mateo_pro"
                      className="w-full h-12 px-4 rounded-2xl bg-[#FFF8F2] border-2 border-[#F26B5B]/30 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#F26B5B]"
                    />
                  </div>
                </div>

                {/* Selector de Edad con asignación automática de grupo */}
                <div className="p-5 rounded-3xl bg-[#FFF8F2] border-2 border-[#F26B5B]/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="reg-age-range"
                      className="text-xs font-extrabold text-slate-800"
                    >
                      ¿Cuántos años tienes?{' '}
                      <span className="text-[#F26B5B] font-black text-base tabular-nums">
                        {age} años
                      </span>
                    </label>
                    <span className="px-3 py-1 rounded-full bg-[#F26B5B] text-white text-xs font-extrabold">
                      Etapa {detectedGroup} años
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
                      className="w-full accent-[#F26B5B] h-2.5 bg-[#FFE4DE] rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      aria-label="Edad en años"
                      min={3}
                      max={18}
                      value={age}
                      onChange={(e) =>
                        setAge(
                          Math.max(3, Math.min(18, Number(e.target.value) || 3))
                        )
                      }
                      className="w-16 h-11 text-center rounded-2xl bg-white border-2 border-[#F26B5B]/30 font-black tabular-nums text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAge(5)}
                      className={`py-2 px-2.5 rounded-2xl border text-xs font-extrabold transition-all ${
                        detectedGroup === '3-6'
                          ? 'bg-[#F26B5B] border-[#F26B5B] text-white'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      3 a 6 años (Ej. 5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAge(10)}
                      className={`py-2 px-2.5 rounded-2xl border text-xs font-extrabold transition-all ${
                        detectedGroup === '7-13'
                          ? 'bg-[#F26B5B] border-[#F26B5B] text-white'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      7 a 13 años (Ej. 10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAge(16)}
                      className={`py-2 px-2.5 rounded-2xl border text-xs font-extrabold transition-all ${
                        detectedGroup === '14-18'
                          ? 'bg-[#F26B5B] border-[#F26B5B] text-white'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      14 a 18 años (Ej. 16)
                    </button>
                  </div>
                </div>

                {/* Cuenta del Padre/Tutor + PIN */}
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#F26B5B]" />
                      Autorización del Padre o Tutor (PIN Parental)
                    </span>
                    <div className="flex gap-1.5">
                      {(['email', 'google', 'apple'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setParentAuthMethod(m)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            parentAuthMethod === m
                              ? 'bg-[#F26B5B] text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {m === 'email' ? (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Correo
                            </span>
                          ) : m === 'google' ? (
                            'Google'
                          ) : (
                            'Apple'
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="reg-parent-email"
                        className="block text-[11px] font-bold text-slate-600 mb-1"
                      >
                        Correo del Padre / Tutor
                      </label>
                      <input
                        id="reg-parent-email"
                        type="email"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-parent-pin"
                        className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3 text-[#F26B5B]" /> PIN (4 dígitos)
                      </label>
                      <input
                        id="reg-parent-pin"
                        type="text"
                        maxLength={4}
                        value={parentPin}
                        onChange={(e) =>
                          setParentPin(
                            e.target.value.replace(/\D/g, '').slice(0, 4)
                          )
                        }
                        className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-center font-mono font-black text-xs tracking-widest"
                      />
                    </div>
                  </div>
                </div>

                {/* Selección de Avatar Inicial */}
                <div>
                  <div className="text-xs font-extrabold text-slate-800 mb-2">
                    Elige tu Avatar Inicial Gratis:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                          className={`p-2.5 rounded-2xl border-2 flex items-center gap-2 text-left transition-all ${
                            active
                              ? 'border-[#F26B5B] bg-[#FFF8F2] shadow-xs'
                              : 'border-slate-200 bg-white hover:border-[#F26B5B]/50'
                          }`}
                        >
                          <AvatarBadge avatarId={av.id} size="sm" />
                          <span className="font-extrabold text-[11px] text-slate-900 truncate">
                            {av.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 px-5 rounded-full border-2 border-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  <button
                    type="button"
                    data-testid="onboarding-to-step-3-btn"
                    onClick={handleGoToStep3}
                    className="flex-1 h-12 rounded-full bg-[#F26B5B] hover:bg-[#E05A4A] text-white font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuar a Tus Intereses</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              /* PASO 3: Cuadrícula colorida de tarjetas de intereses ("Elige lo que te gusta") + botón coral "Empezar a aprender" */
              <div
                data-testid="onboarding-step-3-interests"
                className="flex-1 rounded-[40px] bg-white border-2 border-[#F26B5B]/30 p-6 sm:p-8 shadow-lg space-y-6"
              >
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-[#FFF8F2] border border-[#F26B5B]/25">
                  <MascotCompanion variant="flower" size="md" mood="excited" />
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F26B5B]">
                      Paso 3 de 3 · Personaliza tu Ruta
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900">
                      Elige lo que te gusta
                    </h2>
                    <p className="text-xs text-slate-600">
                      Selecciona tus temas favoritos para armar tu plan de aprendizaje gamificado.
                    </p>
                  </div>
                </div>

                {/* Cuadrícula colorida de tarjetas de intereses */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INTEREST_CARDS.map((card) => {
                    const selected = selectedInterests.includes(card.id);
                    return (
                      <button
                        key={card.id}
                        type="button"
                        data-testid={`interest-card-${card.id}`}
                        onClick={() => toggleInterest(card.id)}
                        className={`p-4 rounded-3xl border-2 text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                          selected
                            ? `${card.bgClass} ring-4 ring-[#F26B5B]/25 scale-[1.02] shadow-sm`
                            : 'bg-[#FFF8F2] border-slate-200 text-slate-700 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="p-2 rounded-2xl bg-white/80 shadow-2xs">
                            {card.icon}
                          </span>
                          {selected && (
                            <CheckCircle2 className="w-5 h-5 text-[#F26B5B]" />
                          )}
                        </div>
                        <div>
                          <div className="font-black text-sm leading-snug">
                            {card.title}
                          </div>
                          <div className="text-[11px] opacity-80 font-semibold mt-0.5">
                            {card.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {detectedGroup !== '3-6' && (
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parentalApproved}
                      onChange={(e) => setParentalApproved(e.target.checked)}
                      className="w-4 h-4 accent-[#F26B5B] rounded"
                    />
                    El padre/tutor autoriza amigos y chat privado protegido por IA con niños de su misma etapa ({detectedGroup} años)
                  </label>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-13 px-5 rounded-full border-2 border-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  <button
                    type="button"
                    data-start="true"
                    data-testid="onboarding-finish-btn"
                    onClick={() => handleCompleteRegistration()}
                    className="flex-1 h-14 rounded-full bg-[#F26B5B] hover:bg-[#E05A4A] text-white font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Empezar a aprender</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha (5 cols): Resumen de Seguridad Infantil IA + Perfiles de Hijos Guardados */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tarjeta visual estilo Aptivo / Habitz con vista previa del niño */}
            <div className="bg-white rounded-[36px] border-2 border-[#F26B5B]/25 p-6 shadow-md space-y-4">
              <div className="flex items-center gap-3.5">
                <AvatarBadge avatarId={selectedAvatarId} size="lg" />
                <div>
                  <span className="inline-block text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-[#FFE4DE] text-[#D94E3E]">
                    Etapa Asignada · {detectedGroup} años
                  </span>
                  <h3 className="font-black text-lg text-slate-900 mt-1">
                    {name.trim() ? `${name.trim()} (${age} años)` : `Explorador (${age} años)`}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Inicia 100% desde cero: 0 XP · 0 Gemas · Nivel 1
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#FFF8F2] border border-[#F26B5B]/20 space-y-2 text-xs text-slate-700 font-semibold">
                <div className="font-black text-[#F26B5B] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Protección Infantil Activa en el Chat:
                </div>
                <div>
                  1. <strong>Registro Directo y sin Cámara:</strong> Ingresa rápidamente con tu nombre, edad y avatar favorito sin permisos de cámara web.
                </div>
                <div>
                  2. <strong>Filtro Legal Anti-Fotos de Niños en Chat:</strong> Prohibido subir fotos reales de personas en el chat (solo dibujos de cursos, tareas o GIFs).
                </div>
                <div>
                  3. <strong>Bloqueo y Expulsión Anti-Grooming:</strong> Si alguien pide fotos personales o dirección, se bloquea el mensaje y se expulsa al usuario al instante.
                </div>
              </div>
            </div>

            {/* Perfiles de Hijos Guardados para Iniciar Sesión con 1 Clic */}
            <div className="bg-white rounded-[36px] border-2 border-[#F26B5B]/25 p-6 shadow-md space-y-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <LogIn className="w-4 h-4 text-[#F26B5B]" />
                Perfiles de Hijos Guardados ({existingAccounts.length})
              </h3>
              {existingAccounts.length === 0 ? (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Aún no hay perfiles guardados en este dispositivo. Completa el registro directo para crear tu cuenta desde cero.
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
                      className="w-full p-3.5 rounded-2xl border-2 border-slate-200 hover:border-[#F26B5B] bg-[#FFF8F2] text-left flex items-center justify-between gap-3 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarBadge avatarId={acc.avatarId} size="sm" />
                        <div className="min-w-0">
                          <div className="font-extrabold text-sm text-slate-900 truncate">
                            {acc.name} ({acc.age} años)
                          </div>
                          <div className="text-xs text-slate-500 truncate font-mono">
                            {acc.friendCode} · {acc.xp} XP · {acc.gems} gemas
                          </div>
                        </div>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full bg-[#F26B5B] text-white font-extrabold text-xs shrink-0">
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
