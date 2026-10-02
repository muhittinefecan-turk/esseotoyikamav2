import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  installOutcome: 'accepted' | 'dismissed' | null;
  installFeedback: string | null;
  showGuideModal: boolean;
  setShowGuideModal: (show: boolean) => void;
  clearFeedback: () => void;
  installApp: () => Promise<'accepted' | 'dismissed' | 'ios' | 'manual'>;
}

const PWAInstallContext = createContext<PWAInstallContextType | null>(null);

// Global reference so we don't lose early beforeinstallprompt event before React mounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(e: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((fn) => fn(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((fn) => fn(null));
  });
}

export const PWAInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [installOutcome, setInstallOutcome] = useState<'accepted' | 'dismissed' | null>(null);
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detect standalone mode (already installed on homescreen)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
    }

    // 2. Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // 3. Subscribe to prompt events
    const listener = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
      if (!prompt && isStandalone) {
        setIsInstalled(true);
      }
    };
    promptListeners.add(listener);

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(globalDeferredPrompt);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
      setInstallOutcome('accepted');
      setInstallFeedback('Harika! Esse Oto Yıkama uygulaması ana ekranınıza yüklendi.');
      setShowGuideModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      promptListeners.delete(listener);
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const clearFeedback = useCallback(() => {
    setInstallFeedback(null);
  }, []);

  const installApp = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'manual'> => {
    // If already installed
    if (isInstalled) {
      setInstallFeedback('Uygulama zaten cihazınızda yüklü.');
      return 'accepted';
    }

    // If native prompt is available (Android Chrome, Edge, desktop Chrome)
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;

        if (choice.outcome === 'accepted') {
          setInstallOutcome('accepted');
          setIsInstalled(true);
          setDeferredPrompt(null);
          globalDeferredPrompt = null;
          setInstallFeedback('Harika! Esse Oto Yıkama uygulaması cihazınıza yüklendi.');
          setShowGuideModal(false);
          return 'accepted';
        } else {
          // User dismissed/canceled the prompt
          setInstallOutcome('dismissed');
          setInstallFeedback('Yükleme iptal edildi. Dilediğiniz zaman tekrar yükleyebilirsiniz.');
          return 'dismissed';
        }
      } catch (err) {
        console.warn('Native PWA install error:', err);
      }
    }

    // If iOS Safari (beforeinstallprompt is not supported by WebKit)
    if (isIOS) {
      setShowGuideModal(true);
      return 'ios';
    }

    // Browser does not support prompt or prompt is currently unavailable -> show manual instructions
    setShowGuideModal(true);
    return 'manual';
  }, [deferredPrompt, isInstalled, isIOS]);

  return (
    <PWAInstallContext.Provider
      value={{
        isInstallable: !!deferredPrompt || !!globalDeferredPrompt,
        isInstalled,
        isIOS,
        installOutcome,
        installFeedback,
        showGuideModal,
        setShowGuideModal,
        clearFeedback,
        installApp,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
};

export function usePWAInstall() {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
}
