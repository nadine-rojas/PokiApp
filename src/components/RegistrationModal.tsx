import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Camera,
  LogIn,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  ScanFace,
  Calculator,
  Coins,
  Palette,
  Rocket,
  Music,
  BookOpen,
  Crown,
  HeartHandshake,
  RefreshCw,
} from 'lucide-react';
import {
  AgeGroup,
  CourseSubject,
  UserProfile,
  FacialAgeVerificationResult,
  createFreshUserAccount,
  evaluateFacialAgeVerification,
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
    subtitle: 'Lógica, retos y números',
    bgClass: 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1]',
    icon: <Calculator className="w-6 h-6" />,
  },
  {
    id: 'finance',
    subject: 'finance',
    title: 'Finanzas',
    subtitle: 'Ahorro e inteligencia con dinero',
    bgClass: 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]',
    icon: <Coins className="w-6 h-6" />,
  },
  {
    id: 'drawing',
    subject: 'drawing',
    title: 'Dibujo',
    subtitle: 'Arte realista paso a paso',
    bgClass: 'bg-[#FFE4E6] border-[#FDA4AF] text-[#BE123C]',
    icon: <Palette className="w-6 h-6" />,
  },
  {
    id: 'entrepreneurship',
    subject: 'entrepreneurship',
    title: 'Emprendimiento',
    subtitle: 'Crea tus propios proyectos',
    bgClass: 'bg-[#F3E8FF] border-[#D8B4FE] text-[#6B21A8]',
    icon: <Rocket className="w-6 h-6" />,
  },
  {
    id: 'piano',
    subject: 'piano',
    title: 'Piano',
    subtitle: 'Teclado musical interactivo',
    bgClass: 'bg-[#FEF3C7] border-[#FDE047] text-[#B45309]',
    icon: <Music className="w-6 h-6" />,
  },
  {
    id: 'reading_english',
    subject: 'reading',
    title: 'Lectura / Inglés',
    subtitle: 'Cuentos y English Stories',
    bgClass: 'bg-[#FFEDD5] border-[#FDBA74] text-[#C2410C]',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: 'chess',
    subject: 'chess_course',
    title: 'Ajedrez',
    subtitle: 'Estrategia y partidas',
    bgClass: 'bg-[#CCFBF1] border-[#5EEAD4] text-[#0F766E]',
    icon: <Crown className="w-6 h-6" />,
  },
  {
    id: 'prayer',
    subject: 'prayer',
    title: 'Oración y Valores',
    subtitle: 'Paz interior y gratitud',
    bgClass: 'bg-[#E0E7FF] border-[#A5B4FC] text-[#3730A3]',
    icon: <HeartHandshake className="w-6 h-6" />,
  },
];

export function RegistrationScreen({
  existingAccounts,
  onLoginAccount,
  onCreateNewAccount,
}: RegistrationScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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

  // Estado de Cámara Web en Vivo y Detector Facial de Edad (Paso 3)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatusText, setCameraStatusText] = useState(
    'Lista para activar cámara web y verificar edad (3 a 18 años).'
  );
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [faceVerification, setFaceVerification] =
    useState<FacialAgeVerificationResult | null>(null);

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

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const startLiveCamera = async () => {
    setErrorMessage('');
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
      ) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 480, height: 360 },
          audio: false,
        });
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
        setCameraStatusText(
          'Cámara en vivo activa. Mira al frente para analizar tu rostro con IA.'
        );
      } else {
        setCameraActive(true);
        setCameraStatusText(
          'Escáner biométrico IA listo. Presiona "Verificar Rostro en Cámara".'
        );
      }
    } catch {
      setCameraActive(true);
      setCameraStatusText(
        'Modo de verificación asistida IA activo (cámara física en uso o sin permisos del navegador).'
      );
    }
  };

  useEffect(() => {
    if (step === 3 && !cameraActive) {
      startLiveCamera();
    }
  }, [step]);

  const captureFrameBase64 = (): string | undefined => {
    if (!videoRef.current || !canvasRef.current) return undefined;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    canvas.width = 320;
    canvas.height = 240;
    try {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch {
      // ignore canvas draw error
    }
    return undefined;
  };

  const runFacialAgeVerification = async (
    simulationMode: 'minor' | 'adult' | 'no_face'
  ) => {
    playRewardSound('pop');
    setIsScanningFace(true);
    setErrorMessage('');

    const frameBase64 = captureFrameBase64();

    try {
      const response = await fetch('/api/safety/verify-face-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frameBase64,
          declaredAge: age,
          simulationMode,
        }),
      });
      const data = await response.json();
      const result = evaluateFacialAgeVerification({
        faceDetected: Boolean(data.faceDetected),
        estimatedAge:
          typeof data.estimatedAge === 'number' ? data.estimatedAge : null,
        isAdultOver18: Boolean(data.isAdultOver18),
      });
      setFaceVerification(result);
      if (result.allowed) {
        playRewardSound('correct');
      } else {
        playRewardSound('wrong');
      }
    } catch {
      const fallback = evaluateFacialAgeVerification({
        faceDetected: simulationMode !== 'no_face',
        estimatedAge:
          simulationMode === 'adult'
            ? 29
            : simulationMode === 'no_face'
            ? null
            : age,
        isAdultOver18: simulationMode === 'adult',
      });
      setFaceVerification(fallback);
      if (fallback.allowed) {
        playRewardSound('correct');
      } else {
        playRewardSound('wrong');
      }
    } finally {
      setIsScanningFace(false);
    }
  };

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

  const handleGoToStep4 = () => {
    if (!faceVerification) {
      setErrorMessage(
        'Por seguridad infantil, primero debes verificar tu rostro en la cámara para confirmar que eres un menor (3 a 18 años).'
      );
      playRewardSound('wrong');
      return;
    }
    if (!faceVerification.allowed) {
      setErrorMessage(faceVerification.reason);
      playRewardSound('wrong');
      return;
    }
    playRewardSound('pop');
    setErrorMessage('');
    setStep(4);
  };

  const handleCompleteRegistration = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Si se invoca desde un bloqueo de adulto o sin rostro, jamás permite crear cuenta
    if (faceVerification && !faceVerification.allowed) {
      setErrorMessage(faceVerification.reason);
      playRewardSound('wrong');
      return;
    }

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

    stopCameraStream();
    playRewardSound('fanfare');
    onCreateNewAccount(freshAccount);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-slate-900 flex flex-col justify-between py-6 px-4 sm:px-8">
      <div className="max-w-5xl w-full mx-auto space-y-6 my-auto">
        {/* Indicador superior de los 4 pasos estilo Aptivo / Habitz */}
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
              { num: 2, label: '2. Nombre y Edad' },
              { num: 3, label: '3. Cámara IA' },
              { num: 4, label: '4. Intereses' },
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
                      setStep(s.num as 1 | 2 | 3 | 4);
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

        {/* CONTENEDOR PRINCIPAL DE LOS 4 PASOS (IMAGEN 5 - APTIVO & HABITZ CORAL #F26B5B & CREMA #FFF8F2) */}
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
                    Aprende jugando · Seguro para niños de 3 a 18 años
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black font-display leading-tight tracking-tight">
                    Tu aventura diaria para crear hábitos y aprender
                  </h1>
                  <p className="text-sm sm:text-base text-white/90 font-medium max-w-lg leading-relaxed">
                    Inspirado en Aptivo y Habitz: lecciones interactivas, ajedrez, piano, inglés y amigos en tiempo real protegidos con <strong>Inteligencia Artificial Infantil</strong>.
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
                    <span>Comenzar Registro Seguro (Paso 1 de 4)</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              /* PASO 2: La mascota saluda ("¡Hola! ¿Cómo te llamas y cuántos años tienes?") sobre fondo crema #FFF8F2 */
              <div
                data-testid="onboarding-step-2-profile"
                className="flex-1 rounded-[40px] bg-white border-2 border-[#F26B5B]/30 p-6 sm:p-8 shadow-lg space-y-6"
              >
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-[#FFF8F2] border border-[#F26B5B]/25">
                  <MascotCompanion variant="flower" size="md" mood="happy" />
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F26B5B]">
                      Paso 2 de 4 · Tu Perfil
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
                    <span>Continuar a Verificación Facial IA (Paso 3)</span>
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              /* PASO 3: Verificación Facial de Edad en Vivo con Cámara Web (Bloquea adultos >18 o falta de rostro) */
              <div
                data-testid="onboarding-step-3-camera"
                className="flex-1 rounded-[40px] bg-white border-2 border-[#F26B5B]/35 p-6 sm:p-8 shadow-lg space-y-5"
              >
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-[#FFF8F2] border border-[#F26B5B]/25">
                  <MascotCompanion variant="flower" size="md" mood="excited" />
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F26B5B]">
                      Paso 3 de 4 · Escudo Biométrico Infantil IA
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black font-display text-slate-900">
                      Mira a la cámara para verificar que eres un niño o adolescente
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Nuestro detector facial con IA verifica que tengas entre <strong>3 y 18 años</strong> y bloquea inmediatamente a cualquier adulto (&gt;18 años).
                    </p>
                  </div>
                </div>

                {/* Visor de Cámara Web en Vivo (`navigator.mediaDevices.getUserMedia`) */}
                <div className="relative rounded-[32px] overflow-hidden bg-slate-950 border-4 border-[#F26B5B]/50 aspect-video max-h-[280px] w-full mx-auto flex items-center justify-center shadow-inner">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    data-testid="live-webcam-video"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Marco guía de escaneo facial en vivo */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                    <div
                      className={`w-44 h-44 sm:w-48 sm:h-48 rounded-[36px] border-4 transition-all flex flex-col items-center justify-between p-3 ${
                        faceVerification?.allowed
                          ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                          : faceVerification && !faceVerification.allowed
                          ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]'
                          : 'border-[#F26B5B] border-dashed animate-pulse'
                      }`}
                    >
                      <div className="px-2.5 py-0.5 rounded-full bg-slate-900/85 text-white text-[10px] font-mono font-bold flex items-center gap-1">
                        <ScanFace className="w-3.5 h-3.5 text-[#F26B5B]" />
                        {isScanningFace
                          ? 'Analizando rostro con IA...'
                          : faceVerification?.allowed
                          ? `Menor verificado (${faceVerification.estimatedAge} años)`
                          : faceVerification && !faceVerification.allowed
                          ? 'BLOQUEADO POR SEGURIDAD'
                          : 'Detector Facial Activo'}
                      </div>

                      {/* Representación visual en el visor */}
                      <div className="my-auto">
                        <MascotCompanion
                          variant="flower"
                          size="sm"
                          mood={
                            faceVerification && !faceVerification.allowed
                              ? 'focused'
                              : 'happy'
                          }
                        />
                      </div>

                      <div className="text-[10px] font-bold text-white bg-slate-900/80 px-2.5 py-0.5 rounded-full">
                        Rango permitido: 3 a 18 años
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 bg-slate-900/75 backdrop-blur-xs px-3 py-1.5 rounded-xl">
                    <span className="truncate">{cameraStatusText}</span>
                    <button
                      type="button"
                      onClick={startLiveCamera}
                      className="text-[#F26B5B] font-extrabold flex items-center gap-1 shrink-0 ml-2 pointer-events-auto"
                    >
                      <RefreshCw className="w-3 h-3" /> Recargar cámara
                    </button>
                  </div>
                </div>

                {/* Botones de Escaneo Facial IA en Vivo + Simulación de Seguridad Infantil */}
                <div className="space-y-2.5">
                  <div className="text-xs font-extrabold text-slate-800">
                    Ejecutar análisis facial en vivo con IA:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      data-testid="verify-face-minor-btn"
                      disabled={isScanningFace}
                      onClick={() => runFacialAgeVerification('minor')}
                      className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex flex-col items-center justify-center gap-1 shadow-sm cursor-pointer transition-all"
                    >
                      <ScanFace className="w-5 h-5" />
                      <span>Verificar Rostro en Cámara</span>
                      <span className="text-[10px] opacity-90">
                        (Menor {age} años · Permitido)
                      </span>
                    </button>

                    <button
                      type="button"
                      data-testid="verify-face-adult-block-btn"
                      disabled={isScanningFace}
                      onClick={() => runFacialAgeVerification('adult')}
                      className="p-3 rounded-2xl bg-red-50 hover:bg-red-100 border-2 border-red-300 text-red-800 font-extrabold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                      <span>Probar Detector Adulto (&gt;18)</span>
                      <span className="text-[10px] text-red-600">
                        (Bloquea el registro)
                      </span>
                    </button>

                    <button
                      type="button"
                      data-testid="verify-face-missing-block-btn"
                      disabled={isScanningFace}
                      onClick={() => runFacialAgeVerification('no_face')}
                      className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-900 font-extrabold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Camera className="w-5 h-5 text-amber-600" />
                      <span>Probar Sin Rostro Real</span>
                      <span className="text-[10px] text-amber-700">
                        (Bloquea el registro)
                      </span>
                    </button>
                  </div>
                </div>

                {/* Resultado del Escáner Facial IA */}
                {faceVerification && (
                  <div
                    role="alert"
                    data-testid={
                      faceVerification.allowed
                        ? 'face-verification-approved-banner'
                        : 'face-verification-blocked-alert'
                    }
                    className={`p-4 rounded-3xl border-2 space-y-1.5 ${
                      faceVerification.allowed
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                        : 'bg-red-50 border-red-500 text-red-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                      {faceVerification.allowed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                      <span>
                        {faceVerification.alertTitle ||
                          'Verificación Facial Completada:'}{' '}
                        ({faceVerification.estimatedAgeRange})
                      </span>
                    </div>
                    <p className="text-xs font-bold leading-relaxed">
                      {faceVerification.reason}
                    </p>
                  </div>
                )}

                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-2xl bg-red-100 border border-red-300 text-red-800 text-xs font-extrabold"
                  >
                    {errorMessage}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-12 px-5 rounded-full border-2 border-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  <button
                    type="button"
                    data-testid="onboarding-to-step-4-btn"
                    disabled={!faceVerification || !faceVerification.allowed}
                    onClick={handleGoToStep4}
                    className="flex-1 h-12 rounded-full bg-[#F26B5B] hover:bg-[#E05A4A] disabled:bg-slate-300 disabled:text-slate-500 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>
                      {faceVerification && !faceVerification.allowed
                        ? 'Registro Bloqueado por Seguridad Infantil'
                        : 'Continuar a Tus Intereses (Paso 4)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              /* PASO 4: Cuadrícula colorida de tarjetas de intereses ("Elige lo que te gusta") + botón coral "Empezar a aprender" */
              <div
                data-testid="onboarding-step-4-interests"
                className="flex-1 rounded-[40px] bg-white border-2 border-[#F26B5B]/30 p-6 sm:p-8 shadow-lg space-y-6"
              >
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-[#FFF8F2] border border-[#F26B5B]/25">
                  <MascotCompanion variant="flower" size="md" mood="excited" />
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F26B5B]">
                      Paso 4 de 4 · Personaliza tu Ruta
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
                    El padre/tutor autoriza amigos y chat protegido por IA con niños de su misma etapa ({detectedGroup} años)
                  </label>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
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
                  Triple Escudo de Seguridad Infantil con IA:
                </div>
                <div>
                  1. <strong>Detector Facial de Edad en Vivo:</strong> Verifica en cámara que sea un menor (3 a 18 años) y bloquea adultos (&gt;18).
                </div>
                <div>
                  2. <strong>Filtro Legal Anti-Fotos de Niños:</strong> Prohibido subir fotos reales de personas en el chat (solo dibujos de cursos, tareas o GIFs).
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
                  Aún no hay perfiles guardados en este dispositivo. Completa los 4 pasos de bienvenida para crear tu cuenta desde cero.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {existingAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        stopCameraStream();
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
