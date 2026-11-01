import React, { useState } from 'react';
import { Download, CheckCircle2, Smartphone, Share, X, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playRewardSound } from '../utils/soundEffects';

interface PWAInstallButtonProps {
  variant?: 'header' | 'profile';
  isDark?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  isDark = false,
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    swRegistered,
    triggerNativeInstall,
  } = usePWAInstall();
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [lastOutcomeMessage, setLastOutcomeMessage] = useState<string | null>(
    null
  );

  const handleInstallClick = async () => {
    playRewardSound('pop');
    setLastOutcomeMessage(null);

    if (isInstalled) {
      setShowInstructionsModal(true);
      return;
    }

    const res = await triggerNativeInstall();
    if (res.triggeredNativePrompt) {
      if (res.outcome === 'accepted') {
        playRewardSound('fanfare');
      } else {
        setLastOutcomeMessage(
          'Cerraste el diálogo de instalación del navegador. Puedes volver a pulsar "Instalar App" cuando quieras.'
        );
        setShowInstructionsModal(true);
      }
      return;
    }

    // Si el navegador es iOS/Safari o si está en modo vista previa / sin evento beforeinstallprompt activo,
    // muestra las instrucciones nativas reales del navegador sin simular descargas falsas.
    setShowInstructionsModal(true);
  };

  return (
    <>
      <button
        type="button"
        data-testid={
          variant === 'profile'
            ? 'profile-pwa-install-button'
            : 'pwa-install-button'
        }
        onClick={handleInstallClick}
        className={
          variant === 'profile'
            ? 'px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm transition-colors'
            : `h-10 px-3 sm:px-3.5 rounded-full font-extrabold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all border ${
                isInstalled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                  : isInstallable
                  ? 'bg-[#84CC16] hover:bg-[#65A30D] border-[#65A30D] text-slate-950 shadow-xs'
                  : isDark
                  ? 'bg-purple-500/15 hover:bg-purple-500/25 border-purple-400/40 text-purple-100'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-900'
              }`
        }
        title={
          isInstalled
            ? 'Aplicación instalada en modo nativo standalone'
            : 'Instalar LumiQuest en tu dispositivo'
        }
      >
        {isInstalled ? (
          <>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>App Instalada</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 shrink-0" />
            <span>Instalar App</span>
          </>
        )}
      </button>

      {showInstructionsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-modal-title"
          data-testid="pwa-install-instructions-modal"
        >
          <div className="bg-white dark:bg-[#181326] text-slate-900 dark:text-slate-100 rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 dark:border-purple-800/60 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#84CC16] text-slate-950 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    id="pwa-modal-title"
                    className="font-display font-black text-lg leading-snug"
                  >
                    {isInstalled
                      ? 'LumiQuest ya está instalada'
                      : 'Instalación Nativa de LumiQuest (PWA)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Estado real:{' '}
                    {isInstalled
                      ? 'Ejecutando en modo standalone'
                      : isInstallable
                      ? 'Instalador nativo disponible'
                      : isIOS
                      ? 'Safari / iOS detectado'
                      : 'Navegador web'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                aria-label="Cerrar ventana de instalación"
                className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {lastOutcomeMessage && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs font-semibold">
                {lastOutcomeMessage}
              </div>
            )}

            {isInstalled ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 space-y-2 text-xs leading-relaxed">
                <div className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Modo Standalone Activo (`display-mode: standalone`)
                </div>
                <p>
                  Tu navegador confirmó mediante{' '}
                  <code className="font-mono">
                    window.matchMedia(&apos;(display-mode: standalone)&apos;)
                  </code>{' '}
                  que LumiQuest ya se está ejecutando como aplicación instalada.
                </p>
              </div>
            ) : isIOS ? (
              <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
                <p className="font-semibold">
                  En iPhone y iPad (Safari), el sistema operativo instala las aplicaciones web desde el menú nativo de compartir:
                </p>
                <ol className="space-y-2.5 list-decimal list-inside bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                  <li>
                    Toca el botón <strong>Compartir</strong>{' '}
                    <Share className="w-4 h-4 inline mx-0.5 text-sky-500" /> en la barra de Safari.
                  </li>
                  <li>
                    Desliza hacia abajo y selecciona{' '}
                    <strong>Agregar a pantalla de inicio</strong>.
                  </li>
                  <li>
                    Pulsa <strong>Agregar</strong> arriba a la derecha para instalar LumiQuest con su ícono en tu inicio.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
                <p>
                  LumiQuest cuenta con <strong>manifest.json</strong> válido y{' '}
                  <strong>Service Worker</strong>{' '}
                  {swRegistered ? 'activo' : 'registrado'} para instalación nativa real:
                </p>
                <ol className="space-y-2.5 list-decimal list-inside bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                  <li>
                    En <strong>Chrome, Edge o Android</strong>, haz clic en el ícono de <strong>Instalar LumiQuest</strong> en la barra de direcciones (o abre el menú <strong>⋮</strong> del navegador y elige <strong>Instalar aplicación</strong>).
                  </li>
                  <li>
                    Si estás viendo la app dentro de un cuadro de vista previa (iframe), ábrela primero en una pestaña nueva del navegador para que el sistema operativo habilite el aviso nativo <code className="font-mono">beforeinstallprompt</code>.
                  </li>
                </ol>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>PWA Real · Sin descargas simuladas</span>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-black text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
