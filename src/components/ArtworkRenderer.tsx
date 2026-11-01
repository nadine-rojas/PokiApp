import React from 'react';
import { AVATAR_GALLERY, AvatarOption, StoryPage } from '../data/curriculumData';

export function AvatarBadge({
  avatarId,
  size = 'md',
}: {
  avatarId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const avatar: AvatarOption =
    AVATAR_GALLERY.find((a) => a.id === avatarId) || AVATAR_GALLERY[0];

  const sizeClasses = {
    sm: 'w-9 h-9 rounded-2xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-3xl',
    xl: 'w-22 h-22 rounded-[28px]',
  }[size];

  if (avatar.imageUrl) {
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center shadow-md border-2 border-white/60 shrink-0 select-none overflow-hidden relative`}
        aria-label={`Avatar ${avatar.name}`}
      >
        <img
          src={avatar.imageUrl}
          alt={avatar.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center shadow-md border-2 border-white/50 shrink-0 select-none overflow-hidden`}
      aria-label={`Avatar ${avatar.name}`}
    >
      <svg viewBox="0 0 64 64" className="w-5/6 h-5/6" fill="none">
        {avatar.svgKind === 'mummy' && (
          <>
            {/* Momia Simpática Amigable (vendajes suaves y gran sonrisa) */}
            <circle cx="32" cy="32" r="22" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
            <path d="M12 22 Q32 16 52 22" stroke="#FDE68A" strokeWidth="5" strokeLinecap="round" />
            <path d="M11 30 Q32 25 53 30" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 42 Q32 47 52 42" stroke="#FDE68A" strokeWidth="5" strokeLinecap="round" />
            <rect x="17" y="25" width="30" height="13" rx="6.5" fill="#1E293B" />
            <circle cx="25" cy="31.5" r="4" fill="#FACC15" />
            <circle cx="39" cy="31.5" r="4" fill="#FACC15" />
            <circle cx="24" cy="30.5" r="1.5" fill="#FFFFFF" />
            <circle cx="38" cy="30.5" r="1.5" fill="#FFFFFF" />
            <path d="M26 44 Q32 49 38 44" stroke="#92400E" strokeWidth="2.8" strokeLinecap="round" />
          </>
        )}

        {/* Formas simples con ojos grandes, cejas expresivas y caritas simpáticas (Aptivo / Habitz / moimoi / Plopp) */}
        {avatar.svgKind === 'dragon' && (
          <>
            {/* Mascota Flor Coral */}
            <circle cx="32" cy="14" r="9" fill="#FFE4E6" />
            <circle cx="32" cy="50" r="9" fill="#FFE4E6" />
            <circle cx="14" cy="32" r="9" fill="#FFE4E6" />
            <circle cx="50" cy="32" r="9" fill="#FFE4E6" />
            <circle cx="19" cy="19" r="9" fill="#FECDD3" />
            <circle cx="45" cy="19" r="9" fill="#FECDD3" />
            <circle cx="19" cy="45" r="9" fill="#FECDD3" />
            <circle cx="45" cy="45" r="9" fill="#FECDD3" />
            <circle cx="32" cy="32" r="17" fill="#FFF1F2" />
            {/* Cejas expresivas */}
            <path d="M21 23 Q25 20 28 23" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 23 Q39 20 43 23" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            {/* Ojos grandes con brillo */}
            <circle cx="25" cy="30" r="5" fill="#0F172A" />
            <circle cx="39" cy="30" r="5" fill="#0F172A" />
            <circle cx="23.5" cy="28.5" r="1.8" fill="#FFFFFF" />
            <circle cx="37.5" cy="28.5" r="1.8" fill="#FFFFFF" />
            {/* Mejillas y sonrisa */}
            <ellipse cx="19" cy="35" rx="3" ry="1.8" fill="#FB7185" />
            <ellipse cx="45" cy="35" rx="3" ry="1.8" fill="#FB7185" />
            <path d="M26 37 Q32 43 38 37" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
          </>
        )}

        {avatar.svgKind === 'fox' && (
          <>
            {/* Mascota Gota / Sol con ojos grandes y cejas expresivas */}
            <path
              d="M32 10 C44 24 51 31 51 41 C51 51.5 42.5 56 32 56 C21.5 56 13 51.5 13 41 C13 31 20 24 32 10 Z"
              fill="#FEF9C3"
            />
            <path d="M21 27 Q25 24 28 27" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 27 Q39 24 43 27" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="25" cy="34" r="5.2" fill="#0F172A" />
            <circle cx="39" cy="34" r="5.2" fill="#0F172A" />
            <circle cx="23.5" cy="32.2" r="2" fill="#FFFFFF" />
            <circle cx="37.5" cy="32.2" r="2" fill="#FFFFFF" />
            <ellipse cx="19" cy="39" rx="3" ry="1.8" fill="#F97316" opacity="0.6" />
            <ellipse cx="45" cy="39" rx="3" ry="1.8" fill="#F97316" opacity="0.6" />
            <path d="M26 42 Q32 48 38 42" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
          </>
        )}

        {avatar.svgKind === 'panda' && (
          <>
            {/* Mascota Corazón / Bloque Redondeado con ojos grandes */}
            <rect x="12" y="13" width="40" height="38" rx="14" fill="#ECFCCB" />
            <path d="M20 23 Q24 19 28 22" stroke="#14532D" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M36 22 Q40 19 44 23" stroke="#14532D" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="24" cy="31" r="5.4" fill="#0F172A" />
            <circle cx="40" cy="31" r="5.4" fill="#0F172A" />
            <circle cx="22.5" cy="29.2" r="2" fill="#FFFFFF" />
            <circle cx="38.5" cy="29.2" r="2" fill="#FFFFFF" />
            <ellipse cx="18" cy="36" rx="3" ry="1.8" fill="#FB7185" />
            <ellipse cx="46" cy="36" rx="3" ry="1.8" fill="#FB7185" />
            <path d="M26 39 Q32 45 38 39" stroke="#14532D" strokeWidth="2.8" strokeLinecap="round" />
          </>
        )}

        {avatar.svgKind === 'astronaut' && (
          <>
            {/* Mascota Estrella / Círculo Cósmico */}
            <circle cx="32" cy="32" r="21" fill="#F3E8FF" />
            <path d="M20 22 Q24 18 28 21" stroke="#3B0764" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M36 21 Q40 18 44 22" stroke="#3B0764" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="25" cy="30" r="5.5" fill="#1E1B4B" />
            <circle cx="39" cy="30" r="5.5" fill="#1E1B4B" />
            <circle cx="23.5" cy="28" r="2" fill="#FFFFFF" />
            <circle cx="37.5" cy="28" r="2" fill="#FFFFFF" />
            <path d="M26 40 Q32 45 38 40" stroke="#3B0764" strokeWidth="2.8" strokeLinecap="round" />
          </>
        )}

        {avatar.svgKind === 'owl' && (
          <>
            {/* Mascota Esfera Lila & Lima (Grupo 3) */}
            <circle cx="32" cy="33" r="20" fill="#EDE9FE" />
            <path d="M19 22 L28 24" stroke="#4C1D95" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M45 22 L36 24" stroke="#4C1D95" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="24" cy="31" r="6" fill="#1E1B4B" />
            <circle cx="40" cy="31" r="6" fill="#1E1B4B" />
            <circle cx="22.5" cy="29.5" r="2.2" fill="#BEF264" />
            <circle cx="38.5" cy="29.5" r="2.2" fill="#BEF264" />
            <path d="M27 42 Q32 46 37 42" stroke="#4C1D95" strokeWidth="2.6" strokeLinecap="round" />
          </>
        )}

        {avatar.svgKind === 'robot' && (
          <>
            {/* Mascota Bloque Geométrico */}
            <rect x="13" y="15" width="38" height="36" rx="11" fill="#F7FEE7" />
            <path d="M20 23 Q24 20 28 23" stroke="#1E293B" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M36 23 Q40 20 44 23" stroke="#1E293B" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="25" cy="31" r="5" fill="#0F172A" />
            <circle cx="39" cy="31" r="5" fill="#0F172A" />
            <circle cx="23.5" cy="29.5" r="1.8" fill="#FFFFFF" />
            <circle cx="37.5" cy="29.5" r="1.8" fill="#FFFFFF" />
            <path d="M26 41 Q32 45 38 41" stroke="#1E293B" strokeWidth="2.6" strokeLinecap="round" />
          </>
        )}

        {avatar.svgKind === 'artist' && (
          <>
            {/* Mascota Corazón Expresivo */}
            <path
              d="M32 52 C32 52 12 39 12 24 C12 16 19 12 26 15 C29 16.5 32 20 32 20 C32 20 35 16.5 38 15 C45 12 52 16 52 24 C52 39 32 52 32 52 Z"
              fill="#FFE4E6"
            />
            <path d="M21 23 Q24 20 28 23" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 23 Q40 20 43 23" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="25" cy="30" r="4.8" fill="#1E293B" />
            <circle cx="39" cy="30" r="4.8" fill="#1E293B" />
            <circle cx="23.5" cy="28.5" r="1.8" fill="#FFFFFF" />
            <circle cx="37.5" cy="28.5" r="1.8" fill="#FFFFFF" />
            <path d="M27 38 Q32 43 37 38" stroke="#881337" strokeWidth="2.6" strokeLinecap="round" />
          </>
        )}

        {avatar.svgKind === 'musician' && (
          <>
            {/* Mascota Cubo Musical */}
            <rect x="13" y="14" width="38" height="38" rx="13" fill="#FEF3C7" />
            <path d="M20 23 Q25 19 28 23" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 23 Q39 19 44 23" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="25" cy="31" r="5" fill="#1E293B" />
            <circle cx="39" cy="31" r="5" fill="#1E293B" />
            <circle cx="23.5" cy="29.5" r="1.8" fill="#FFFFFF" />
            <circle cx="37.5" cy="29.5" r="1.8" fill="#FFFFFF" />
            <path d="M25 40 Q32 46 39 40" stroke="#78350F" strokeWidth="2.8" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * Mascota animada con formas simples (flor, corazón, gota, bloque o círculo)
 * con ojos grandes, cejas expresivas y carita simpática (estilo Aptivo, Habitz, moimoi y Plopp).
 */
export function MascotCompanion({
  variant = 'flower',
  size = 'lg',
  mood = 'happy',
}: {
  variant?: 'flower' | 'droplet' | 'heart' | 'cube' | 'orb';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'happy' | 'excited' | 'calm' | 'curious' | 'focused';
}) {
  const sizeClass = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  }[size];

  return (
    <div className={`${sizeClass} relative shrink-0 select-none flex items-center justify-center`}>
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md" fill="none">
        {variant === 'flower' && (
          <>
            <circle cx="60" cy="22" r="18" fill="#FF6B6B" />
            <circle cx="60" cy="98" r="18" fill="#FF6B6B" />
            <circle cx="22" cy="60" r="18" fill="#FF6B6B" />
            <circle cx="98" cy="60" r="18" fill="#FF6B6B" />
            <circle cx="33" cy="33" r="18" fill="#FF8787" />
            <circle cx="87" cy="33" r="18" fill="#FF8787" />
            <circle cx="33" cy="87" r="18" fill="#FF8787" />
            <circle cx="87" cy="87" r="18" fill="#FF8787" />
            <circle cx="60" cy="60" r="34" fill="#FFF5F5" />
          </>
        )}
        {variant === 'droplet' && (
          <path
            d="M60 12 C86 42 102 58 102 78 C102 99 84 110 60 110 C36 110 18 99 18 78 C18 58 34 42 60 12 Z"
            fill="#84CC16"
          />
        )}
        {variant === 'heart' && (
          <path
            d="M60 104 C60 104 16 78 16 44 C16 26 31 16 46 23 C54 27 60 35 60 35 C60 35 66 27 74 23 C89 16 104 26 104 44 C104 78 60 104 60 104 Z"
            fill="#FB7185"
          />
        )}
        {variant === 'cube' && (
          <rect x="20" y="20" width="80" height="80" rx="26" fill="#38BDF8" />
        )}
        {variant === 'orb' && (
          <>
            <circle cx="60" cy="60" r="44" fill="#8B5CF6" />
            <circle cx="60" cy="60" r="36" fill="#A78BFA" />
          </>
        )}

        {/* Cejas expresivas */}
        {mood === 'curious' ? (
          <>
            <path d="M38 40 Q46 33 52 39" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
            <path d="M68 42 Q74 40 82 42" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M38 42 Q45 36 52 41" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
            <path d="M68 41 Q75 36 82 42" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
          </>
        )}

        {/* Ojos grandes expresivos */}
        <circle cx="46" cy="56" r="10" fill="#FFFFFF" />
        <circle cx="74" cy="56" r="10" fill="#FFFFFF" />
        <circle cx="46" cy="56" r="6.5" fill="#0F172A" />
        <circle cx="74" cy="56" r="6.5" fill="#0F172A" />
        <circle cx="43.5" cy="53" r="2.6" fill="#FFFFFF" />
        <circle cx="71.5" cy="53" r="2.6" fill="#FFFFFF" />

        {/* Mejillas sonrojadas */}
        <ellipse cx="33" cy="66" rx="6" ry="3.5" fill="#FB7185" opacity="0.75" />
        <ellipse cx="87" cy="66" rx="6" ry="3.5" fill="#FB7185" opacity="0.75" />

        {/* Boca simpática según estado de ánimo */}
        {mood === 'excited' ? (
          <path d="M47 70 Q60 86 73 70 Z" fill="#0F172A" />
        ) : mood === 'calm' ? (
          <path d="M50 73 Q60 77 70 73" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
        ) : (
          <path d="M46 71 Q60 83 74 71" stroke="#0F172A" strokeWidth="4.5" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
}

/**
 * Anillo de progreso circular (SVG) inspirado en las referencias visuales.
 */
export function CircularProgressRing({
  percent,
  size = 76,
  strokeWidth = 8,
  color = '#84CC16',
  trackColor = 'rgba(148, 163, 184, 0.25)',
  label,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}) {
  const safePct = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-extrabold tabular-nums leading-none">
          {safePct}%
        </span>
        {label && (
          <span className="text-[9px] font-bold opacity-70 mt-0.5">{label}</span>
        )}
      </div>
    </div>
  );
}

export function StorySceneArt({ sceneTheme }: { sceneTheme: StoryPage['sceneTheme'] }) {
  const bgByTheme = sceneTheme.startsWith('space')
    ? 'bg-[#0F172A]'
    : sceneTheme.startsWith('dragon')
    ? 'bg-[#DCFCE7]'
    : 'bg-[#FEF3C7]';

  return (
    <div className={`w-full h-52 sm:h-56 rounded-3xl overflow-hidden border border-slate-200 relative ${bgByTheme} flex items-center justify-center`}>
      {sceneTheme.startsWith('dragon') && (
        <svg viewBox="0 0 400 220" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>
          </defs>
          <rect width="400" height="220" fill="url(#skyGrad)" />
          <circle cx="320" cy="48" r="24" fill="#FDE047" />
          <path d="M0 165 Q110 130 220 165 T400 155 L400 220 L0 220 Z" fill="#34D399" />
          <path d="M0 185 Q160 155 320 185 T400 180 L400 220 L0 220 Z" fill="#10B981" />
          <rect x="75" y="95" width="24" height="75" rx="6" fill="#78350F" />
          <circle cx="87" cy="78" r="42" fill="#059669" />
          <circle cx="62" cy="92" r="28" fill="#10B981" />
          <circle cx="112" cy="90" r="30" fill="#047857" />
          <ellipse cx="205" cy="155" rx="34" ry="26" fill="#10B981" />
          <circle cx="205" cy="118" r="22" fill="#34D399" />
          <circle cx="197" cy="115" r="6" fill="#FFF" stroke="#064E3B" strokeWidth="2" />
          <circle cx="213" cy="115" r="6" fill="#FFF" stroke="#064E3B" strokeWidth="2" />
          <circle cx="197" cy="115" r="2.5" fill="#064E3B" />
          <circle cx="213" cy="115" r="2.5" fill="#064E3B" />
          <path d="M175 162 L205 170 L235 162 L235 182 L205 190 L175 182 Z" fill="#FBBF24" stroke="#92400E" strokeWidth="2" />
          <text x="248" y="96" fill="#B45309" fontSize="20" fontWeight="bold">A · E · I · O · U</text>
          <circle cx="255" cy="68" r="5" fill="#F59E0B" />
          <circle cx="290" cy="112" r="4" fill="#F59E0B" />
        </svg>
      )}
      {sceneTheme.startsWith('space') && (
        <svg viewBox="0 0 400 220" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <rect width="400" height="220" fill="#0F172A" />
          <circle cx="75" cy="45" r="2" fill="#FFF" />
          <circle cx="150" cy="30" r="2.5" fill="#FDE047" />
          <circle cx="320" cy="40" r="2" fill="#FFF" />
          <circle cx="95" cy="160" r="2" fill="#38BDF8" />
          <ellipse cx="275" cy="100" rx="58" ry="16" fill="none" stroke="#FBBF24" strokeWidth="6" transform="rotate(-15 275 100)" />
          <circle cx="275" cy="100" r="30" fill="#F59E0B" />
          <g transform="translate(105, 65)">
            <path d="M25 0 Q50 25 50 65 L0 65 Q0 25 25 0 Z" fill="#F8FAFC" />
            <circle cx="25" cy="32" r="11" fill="#0284C7" stroke="#E2E8F0" strokeWidth="3" />
            <path d="M8 65 L25 90 L42 65 Z" fill="#FB923C" />
          </g>
          <text x="115" y="196" fill="#38BDF8" fontSize="17" fontWeight="bold">1 · 2 · 3 · 4 · 5 Lunas</text>
        </svg>
      )}
      {(sceneTheme === 'forest_band' || sceneTheme === 'finance_market') && (
        <svg viewBox="0 0 400 220" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <rect width="400" height="220" fill="#FEF3C7" />
          <path d="M0 165 Q200 135 400 165 L400 220 L0 220 Z" fill="#059669" />
          <circle cx="85" cy="95" r="36" fill="#F59E0B" />
          <rect x="79" y="125" width="12" height="45" fill="#78350F" />
          <circle cx="315" cy="90" r="38" fill="#EA580C" />
          <rect x="309" y="125" width="12" height="45" fill="#78350F" />
          <rect x="155" y="125" width="90" height="45" rx="6" fill="#1E293B" />
          <rect x="163" y="145" width="74" height="18" fill="#FFFFFF" />
          <text x="170" y="90" fill="#B45309" fontSize="24" fontWeight="bold">♪ ♫ ♬</text>
        </svg>
      )}
    </div>
  );
}

export function DrawingGuideArt({
  guideType,
  stepNumber,
}: {
  guideType: 'eye_structure' | 'sphere_shading' | 'perspective_cube' | 'portrait_proportions';
  stepNumber: number;
}) {
  return (
    <div className="w-full h-56 rounded-2xl bg-[#FAF6F0] border border-stone-300 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-3 left-3 text-xs font-mono text-stone-600">
        Guía Académica · Paso {stepNumber} de 4
      </div>
      <svg viewBox="0 0 320 180" className="w-full h-full max-w-[300px]">
        <line x1="20" y1="90" x2="300" y2="90" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="160" y1="15" x2="160" y2="165" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 4" />

        {guideType === 'eye_structure' && (
          <>
            <path
              d="M 55 95 C 95 42, 225 42, 265 90 C 225 138, 95 138, 55 95 Z"
              fill="none"
              stroke="#334155"
              strokeWidth="2.5"
            />
            <path
              d="M 50 78 C 95 25, 225 25, 270 76"
              fill="none"
              stroke="#475569"
              strokeWidth="1.8"
            />
            <circle cx="160" cy="88" r="36" fill="#E2E8F0" stroke="#1E293B" strokeWidth="2.5" />
            <circle cx="160" cy="88" r="15" fill="#0F172A" />
            <circle cx="148" cy="76" r="6.5" fill="#FFFFFF" stroke="#475569" strokeWidth="1" />
            {stepNumber >= 3 && (
              <>
                <line x1="160" y1="52" x2="160" y2="68" stroke="#334155" strokeWidth="1.2" />
                <line x1="160" y1="108" x2="160" y2="124" stroke="#334155" strokeWidth="1.2" />
                <line x1="124" y1="88" x2="140" y2="88" stroke="#334155" strokeWidth="1.2" />
                <line x1="180" y1="88" x2="196" y2="88" stroke="#334155" strokeWidth="1.2" />
              </>
            )}
          </>
        )}

        {guideType === 'sphere_shading' && (
          <>
            <defs>
              <radialGradient id="sphereTone" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="45%" stopColor="#CBD5E1" />
                <stop offset="80%" stopColor="#334155" />
                <stop offset="100%" stopColor="#64748B" />
              </radialGradient>
            </defs>
            <ellipse cx="185" cy="145" rx="68" ry="14" fill="#94A3B8" opacity="0.55" />
            <circle cx="160" cy="88" r="54" fill="url(#sphereTone)" stroke="#1E293B" strokeWidth="2" />
            <path d="M 118 52 Q 165 95 198 130" fill="none" stroke="#B91C1C" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="222" y="55" fontSize="10" fill="#334155">Luz directa</text>
            <text x="222" y="128" fontSize="10" fill="#334155">Luz reflejada</text>
          </>
        )}

        {(guideType === 'portrait_proportions' || guideType === 'perspective_cube') && (
          <>
            <circle cx="160" cy="75" r="46" fill="none" stroke="#334155" strokeWidth="2" />
            <path d="M 118 82 L 132 145 L 188 145 L 202 82" fill="none" stroke="#1E293B" strokeWidth="2" />
            <line x1="114" y1="75" x2="206" y2="75" stroke="#0284C7" strokeWidth="1.5" />
            <line x1="118" y1="105" x2="202" y2="105" stroke="#0284C7" strokeWidth="1.5" />
            <text x="212" y="78" fontSize="10" fill="#0284C7">Eje Cejas (1/2)</text>
            <text x="212" y="108" fontSize="10" fill="#0284C7">Base Nariz (2/3)</text>
          </>
        )}
      </svg>
    </div>
  );
}
