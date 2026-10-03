import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Gift, Sparkles, Check, X, RotateCcw, ShieldCheck, Ticket } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const STORAGE_KEY = 'esse_loyalty_stamps';
const MAX_STAMPS = 5;

export const LoyaltyCardModal: React.FC<LoyaltyModalProps> = ({ isOpen, onClose, isDarkMode }) => {
  const [stamps, setStamps] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? Math.min(MAX_STAMPS, parseInt(saved, 10) || 0) : 1;
    } catch {
      return 1;
    }
  });

  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);

  useEffect(() => {
    if (stamps === MAX_STAMPS && !hasCelebrated) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#FFD700'],
      });
      setHasCelebrated(true);
    }
  }, [stamps, hasCelebrated]);

  const handleAddStamp = () => {
    setStamps((prev) => {
      const next = prev < MAX_STAMPS ? prev + 1 : 1;
      localStorage.setItem(STORAGE_KEY, next.toString());
      if (next === MAX_STAMPS) {
        setHasCelebrated(false);
      }
      return next;
    });
  };

  const handleReset = () => {
    localStorage.setItem(STORAGE_KEY, '0');
    setStamps(0);
    setHasCelebrated(false);
  };

  if (!isOpen) return null;

  return typeof document !== 'undefined' ? createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-3xl border glass-panel p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-zinc-100 ${
          isDarkMode ? 'border-amber-500/35' : 'bg-white/95 border-amber-500/40 text-zinc-900'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-black flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Gift className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-3 h-3" />
            <span>Esse VIP Sadakat Kartı</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight">Dijital Yıkama Kartınız</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Her tamamlanan randevunuzda 1 damga kazanın. 5. damgada <strong>Hediye Cilalı Yıkama</strong> hakkınız açılır!
          </p>
        </div>

        {/* Physical-Style VIP Gold Card Simulation */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-amber-500/40 shadow-2xl relative overflow-hidden text-zinc-100">
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Card Top */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-xs shadow-md">
                ESSE
              </div>
              <div>
                <div className="text-xs font-black tracking-wider uppercase text-amber-400">ESSE OTO YIKAMA</div>
                <div className="text-[10px] text-zinc-400">Aydın Efeler Çevre Bulvarı</div>
              </div>
            </div>
            <div className="text-[11px] font-mono text-amber-400/80 font-bold">
              {stamps}/{MAX_STAMPS} DAMGA
            </div>
          </div>

          {/* Stamp Holes */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 py-2">
            {[1, 2, 3, 4, 5].map((index) => {
              const isStamped = index <= stamps;
              const isGift = index === 5;

              return (
                <div
                  key={index}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 border ${
                    isStamped
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-black shadow-lg shadow-amber-500/30 scale-105'
                      : isGift
                      ? 'border-dashed border-amber-500/50 bg-amber-500/5 text-amber-400'
                      : 'border-white/10 bg-white/[0.03] text-zinc-600'
                  }`}
                >
                  {isStamped ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex flex-col items-center"
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span className="text-[9px] font-black uppercase mt-0.5">ESSE</span>
                    </motion.div>
                  ) : isGift ? (
                    <div className="flex flex-col items-center">
                      <Gift className="w-5 h-5 animate-pulse text-amber-400" />
                      <span className="text-[8px] font-bold text-amber-400/90 mt-0.5">HEDİYE</span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-bold">{index}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Card Status Bottom */}
          <div className="mt-5 pt-3 border-t border-amber-500/20 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">
              {stamps >= MAX_STAMPS
                ? '🎉 Tebrikler! Hediye yıkamanız aktif.'
                : `${MAX_STAMPS - stamps} yıkama sonra hediye yıkama hakkı!`}
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {stamps >= MAX_STAMPS ? 'HEDİYE HAZIR' : 'DEVAM EDİYOR'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleAddStamp}
            className="w-full sm:flex-1 py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-black glass-button flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/25"
          >
            <Sparkles className="w-4 h-4" />
            <span>{stamps >= MAX_STAMPS ? 'Yeni Karta Başla' : 'Damga Ekle (+1)'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-3.5 rounded-2xl text-xs font-bold border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            title="Kartı Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sıfırla</span>
          </button>
        </div>

        <p className="text-[10px] text-zinc-500 text-center mt-3">
          Damgalarınız tarayıcınızın yerel hafızasında saklanır; internet bağlantısı gerektirmez.
        </p>
      </motion.div>
    </div>,
    document.body
  ) : null;
};
