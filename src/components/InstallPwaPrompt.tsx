import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  X, 
  Sparkles, 
  Check, 
  Share2, 
  MoreVertical, 
  Laptop,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { usePWAInstall } from '../context/PWAInstallContext';

export const InstallPwaPrompt: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const { 
    isInstalled, 
    isIOS, 
    isInstallable,
    installApp, 
    installFeedback, 
    installOutcome,
    clearFeedback,
    showGuideModal,
    setShowGuideModal
  } = usePWAInstall();

  return (
    <>
      {/* 1. INSTALL FEEDBACK NOTIFICATION / TOAST (ACCEPTED OR DISMISSED) */}
      <AnimatePresence>
        {installFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%]"
          >
            <div className={`p-4 rounded-2xl border shadow-2xl glass-panel flex items-center justify-between gap-3 ${
              installOutcome === 'accepted'
                ? 'border-emerald-500/50 bg-emerald-950/90 text-emerald-100'
                : 'border-amber-500/40 bg-zinc-950/95 text-zinc-200'
            }`}>
              <div className="flex items-center gap-3">
                {installOutcome === 'accepted' ? (
                  <div className="p-2 rounded-xl bg-emerald-500 text-black">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-amber-500 text-black">
                    <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold leading-tight">
                    {installOutcome === 'accepted' ? 'Kurulum Tamamlandı' : 'Bilgilendirme'}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {installFeedback}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={clearFeedback}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. STEP-BY-STEP INSTALL GUIDE MODAL (FOR IOS OR BROWSERS WITHOUT DIRECT PROMPT) */}
      <AnimatePresence>
        {showGuideModal && !isInstalled && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`relative w-full max-w-lg rounded-3xl border glass-panel p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-zinc-100 ${
                isDarkMode ? 'border-amber-500/35' : 'bg-white/95 border-amber-500/40 text-zinc-900'
              }`}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-2.5">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-black flex items-center justify-center shadow-xl shadow-amber-500/30 border border-amber-300/40">
                  <Smartphone className="w-8 h-8 stroke-[2.2]" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Esse Oto Yıkama Uygulaması</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Ana Ekranınıza Ekleyin
                </h3>

                <p className="text-xs sm:text-sm text-zinc-300 max-w-sm leading-relaxed">
                  Web sitesini cihazınıza uygulama olarak ekleyin. Sıra beklemeden peron seçimiyle online randevu alın ve geçmiş biletlerinizi çevrimdışı dahi görüntüleyin.
                </p>
              </div>

              {/* NATIVE 1-CLICK PROMPT IF DISCOVERED */}
              {isInstallable && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={async () => {
                      await installApp();
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-black glass-button flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Uygulamayı Şimdi Yükle</span>
                  </button>
                </div>
              )}

              {/* STEP-BY-STEP INSTRUCTIONS ACCORDING TO OS */}
              <div className="mt-4 space-y-3">
                {isIOS ? (
                  /* iPhone / iPad Safari Guide */
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3 text-xs">
                    <div className="font-bold text-amber-400 flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      <span>iPhone / iPad (Safari) Kurulum Adımları:</span>
                    </div>

                    <div className="space-y-2 text-[11px] text-zinc-300">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0">1</span>
                        <span>Safari ekranının altındaki <strong>Paylaş simgesine (📤 veya ⎋)</strong> dokunun.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0">2</span>
                        <span>Menüyü yukarı kaydırıp <strong>"Ana Ekrana Ekle"</strong> (+ simgesi) seçeneğine dokunun.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0">3</span>
                        <span>Sağ üstteki <strong>"Ekle"</strong> butonuna basarak tamamlayın.</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Android (Chrome / Samsung) & Desktop */
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3 text-xs">
                    <div className="font-bold text-amber-400 flex items-center gap-2">
                      <MoreVertical className="w-4 h-4" />
                      <span>Android / Chrome Kurulum Adımları:</span>
                    </div>

                    <div className="space-y-2 text-[11px] text-zinc-300">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0">1</span>
                        <span>Sağ üst köşedeki <strong>üç nokta (⋮)</strong> menü butonuna dokunun.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0">2</span>
                        <span>Menüden <strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0">3</span>
                        <span>Gelen onay penceresinde <strong>"Yükle"</strong>ye dokunun.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                <div className="p-2 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Depolama Kaplamaz</span>
                </div>
                <div className="p-2 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Çevrimdışı Bilet Görünümü</span>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="w-full py-2.5 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer text-center"
                >
                  Kapat, Tarayıcıda Devam Et
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. FLOATING BOTTOM RIGHT BADGE */}
      {!showGuideModal && !isInstalled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
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
                    PWA
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
                onClick={async () => {
                  await installApp();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Yükle</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};
