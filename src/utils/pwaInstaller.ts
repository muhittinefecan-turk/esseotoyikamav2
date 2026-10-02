/**
 * PWA Installer utility
 * Handles beforeinstallprompt capture, platform detection (Android, iOS, In-App Webview),
 * and triggers native install prompts or interactive fallback guides.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners: Array<(prompt: BeforeInstallPromptEvent | null) => void> = [];

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function detectDevice() {
  if (typeof window === 'undefined') return { isIOS: false, isAndroid: false, isInApp: false };

  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isInApp = /instagram|fbav|fban|tiktok|twitter|micromessenger/.test(ua);

  return { isIOS, isAndroid, isInApp };
}

// Capture early before React hydrates
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn(deferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((fn) => fn(null));
  });
}

export function subscribeToInstallPrompt(callback: (prompt: BeforeInstallPromptEvent | null) => void) {
  listeners.push(callback);
  callback(deferredPrompt);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export async function promptPwaInstall(): Promise<{ success: boolean; showGuide: boolean }> {
  if (deferredPrompt) {
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        deferredPrompt = null;
        listeners.forEach((fn) => fn(null));
        return { success: true, showGuide: false };
      }
      return { success: false, showGuide: false };
    } catch (err) {
      console.warn('Native install prompt failed:', err);
    }
  }

  // If native prompt is not available, show guide modal
  return { success: false, showGuide: true };
}
