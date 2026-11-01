import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Keep a module-level reference in case beforeinstallprompt fires before React mounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true
    );
  });
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [swRegistered, setSwRegistered] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standaloneMql = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = () => {
      const standalone =
        standaloneMql.matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true;
      setIsInstalled(standalone);
    };
    checkStandalone();

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod|macintosh.*mobile/i.test(ua));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          if (reg) {
            setSwRegistered(true);
          } else {
            return navigator.serviceWorker
              .register('/sw.js', { scope: '/' })
              .then(() => setSwRegistered(true));
          }
        })
        .catch(() => undefined);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    if (standaloneMql.addEventListener) {
      standaloneMql.addEventListener('change', checkStandalone);
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (standaloneMql.removeEventListener) {
        standaloneMql.removeEventListener('change', checkStandalone);
      }
    };
  }, []);

  const triggerNativeInstall = useCallback(async (): Promise<{
    triggeredNativePrompt: boolean;
    outcome?: 'accepted' | 'dismissed';
  }> => {
    const activePrompt = deferredPrompt || globalDeferredPrompt;
    if (!activePrompt) {
      return { triggeredNativePrompt: false };
    }

    await activePrompt.prompt();
    const choiceResult = await activePrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
    return {
      triggeredNativePrompt: true,
      outcome: choiceResult.outcome,
    };
  }, [deferredPrompt]);

  return {
    deferredPrompt: deferredPrompt || globalDeferredPrompt,
    isInstallable: Boolean(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isIOS,
    swRegistered,
    triggerNativeInstall,
  };
}
