import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X, Sparkles, Check, Share2, PlusSquare, ArrowRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPwaPrompt: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showFirstVisitModal, setShowFirstVisitModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as unknown as { standalone?: boolean }).standalone;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if first visit modal was shown this session
    const hasBeenPrompted = sessionStorage.getItem('esse_pwa_initial_modal_shown');

    // Trigger first visit popup after 1.5 seconds if not installed
    const timer = setTimeout(() => {
      if (!isStandalone && !hasBeenPrompted) {
        setShowFirstVisitModal(true);
        sessionStorage.setItem('esse_pwa_initial_modal_shown', 'true');
      }
    }, 1500);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleManualOpen = () => {
      setShowFirstVisitModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('open-pwa-install', handleManualOpen);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowFirstVisitModal(false);
    });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('open-pwa-install', handleManualOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosTip(true);
      return;
    }

    if (!deferredPrompt) {
      // If browser doesn't expose prompt, show info
      setShowIosTip(true);
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      setShowFirstVisitModal(false);
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* 1. BÜYÜK UYGULAMA İNDİRME MODALI (İLK GİRİŞTE VEYA HERO BUTONUNA BASILINCA AÇILIR) */}
      <AnimatePresence>
        {showFirstVisitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`relative w-full max-w-md rounded-3xl border glass-panel p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-zinc-100 ${
                isDarkMode ? 'border-amber-500/30' : 'bg-white/95 border-amber-500/40 text-zinc-900'
              }`}
            >
              {/* Close X */}
              <button
                type="button"
                onClick={() => setShowFirstVisitModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Icon & Title */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-black flex items-center justify-center shadow-xl shadow-amber-500/30 border border-amber-300/40">
                  <Smartphone className="w-8 h-8 stroke-[2.2]" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Resmi Mobil Web Uygulaması</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Esse Oto Uygulamasını Cihazınıza Yükleyin
                </h3>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-sm">
                  Tarayıcı çubuğu olmadan tam ekran mobil deneyimi yaşayın. Ana ekrandan tek dokunuşla randevu alın ve biletlerinizi çevrimdışı dahi görüntüleyin.
                </p>
              </div>

              {/* iOS Safari Rehberi */}
              {isIOS ? (
                <div className="mt-5 p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-2.5 text-xs">
                  <div className="font-bold text-amber-400 flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    <span>iPhone / iPad Ana Ekrana Ekleme:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 text-[11px] leading-relaxed">
                    <li>Safari ekranının altındaki <strong>Paylaş [ ⎋ / 📤 ]</strong> butonuna dokunun.</li>
                    <li>Açılan menüyü kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.</li>
                    <li>Sağ üstteki <strong>"Ekle"</strong> butonuna basarak tamamlayın.</li>
                  </ol>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                  <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Hızlı & Boyutsuz Kurulum</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Tam Ekran Deneyimi</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-black glass-button flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>{isIOS ? 'Nasıl Yapılır?' : 'Uygulamayı Hemen Cihaza Yükle'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFirstVisitModal(false)}
                  className="w-full py-2.5 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Tarayıcıda Devam Et
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. SABİT SAĞ ALT KÖŞE BUTONU */}
      {!showFirstVisitModal && (isInstallable || isIOS) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 max-w-sm"
        >
          <div className={`p-3.5 rounded-2xl border shadow-2xl glass-panel transition-all flex items-center justify-between gap-3 ${
            isDarkMode ? 'border-amber-500/30 text-zinc-100' : 'bg-white/95 border-amber-500/40 text-zinc-900'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0 shadow-md font-black">
                <Smartphone className="w-4 h-4 stroke-[2.5]" />
              </div>

              <div>
                <div className="text-xs font-black flex items-center gap-1.5">
                  <span>Esse Oto Uygulaması</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-black font-extrabold uppercase">
                    Yükle
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                  Ana ekrana ekleyip uygulama gibi açın
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Yükle</span>
              </button>
            </div>
          </div>

          {/* iOS Safari Tip if toggled */}
          {showIosTip && (
            <div className="mt-2 p-3 rounded-2xl bg-zinc-950/95 border border-amber-500/40 text-zinc-100 text-xs shadow-2xl space-y-1.5">
              <div className="flex items-center justify-between font-bold text-amber-400">
                <span>iPhone'a Yükleme:</span>
                <button onClick={() => setShowIosTip(false)} className="text-zinc-400 hover:text-white">✕</button>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Safari'de alt kısımdaki <strong>Paylaş (📤)</strong> butonuna dokunun ve <strong>"Ana Ekrana Ekle"</strong>yi seçin.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
};
