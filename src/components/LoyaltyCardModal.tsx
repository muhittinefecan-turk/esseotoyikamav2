import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Gift, Sparkles, Check, ShieldCheck, Car } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getCustomerStampsMap, getStoredAppointments, getSavedCustomerProfile, getOrCreateVoucherForPlate } from '../utils/storage';
import { QrCode, Copy, CheckCircle } from 'lucide-react';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const MAX_STAMPS = 5;

export const LoyaltyCardModal: React.FC<LoyaltyModalProps> = ({ isOpen, onClose, isDarkMode }) => {
  const [stamps, setStamps] = useState<number>(0);
  const [activePlate, setActivePlate] = useState<string>(() => {
    const saved = getSavedCustomerProfile();
    return saved?.plateNumber ? saved.plateNumber.toUpperCase().trim() : 'PLAKANIZ';
  });
  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [copiedVoucher, setCopiedVoucher] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedCustomerProfile();
      const apts = getStoredAppointments();
      const stampsMap = getCustomerStampsMap();

      let detectedPlate = '';
      if (saved?.plateNumber) {
        detectedPlate = saved.plateNumber.toUpperCase().trim();
      } else if (apts.length > 0 && apts[0].customer?.plateNumber) {
        detectedPlate = apts[0].customer.plateNumber.toUpperCase().trim();
      }

      if (detectedPlate) {
        setActivePlate(detectedPlate);
        const count = stampsMap[detectedPlate] !== undefined ? stampsMap[detectedPlate] : 0;
        setStamps(count);
        if (count >= MAX_STAMPS) {
          setVoucherCode(getOrCreateVoucherForPlate(detectedPlate));
        }
      } else {
        setActivePlate('PLAKANIZ');
        setStamps(0);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (stamps >= MAX_STAMPS && !hasCelebrated) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#FFD700'],
      });
      setHasCelebrated(true);
    }
  }, [stamps, hasCelebrated]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border glass-panel p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-zinc-100 ${
          isDarkMode ? 'border-amber-500/35 bg-zinc-950/95' : 'bg-white/95 border-amber-500/40 text-zinc-900'
        }`}
      >
        {/* Prominent Sticky/Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95"
          title="Kapat"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
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

        {/* Physical-Style VIP Gold Card */}
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

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-zinc-800 border border-white/15 font-mono font-black text-amber-400 text-xs flex items-center gap-1">
                <Car className="w-3 h-3" />
                {activePlate}
              </span>
              <div className="text-[11px] font-mono text-amber-400/80 font-bold">
                {stamps}/{MAX_STAMPS} DAMGA
              </div>
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
                      <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">
                        ESSE
                      </span>
                    </motion.div>
                  ) : isGift ? (
                    <div className="flex flex-col items-center">
                      <Gift className="w-5 h-5 text-amber-400 animate-pulse" />
                      <span className="text-[8px] font-bold uppercase tracking-tighter text-amber-400 mt-0.5">
                        HEDİYE
                      </span>
                    </div>
                  ) : (
                    <span className="font-mono text-xs font-bold text-zinc-600">
                      {index}
                    </span>
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

        {/* 5/5 QR Code VIP Hediye Kuponu (Feature 6) */}
        {stamps >= MAX_STAMPS && (
          <div className="mt-4 p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border-2 border-amber-400/50 space-y-3 text-center shadow-xl">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-sm">
              <Gift className="w-5 h-5 animate-bounce" />
              <span>5/5 VIP HEDİYE ÇEKİNİZ HAZIR!</span>
            </div>

            <p className="text-xs text-zinc-300">
              İstasyona geldiğinizde bu QR kodu veya onay kodunu kasadaki personele göstererek <strong>Ücretsiz Cilalı Yıkama</strong> hakkınızı hemen kullanabilirsiniz.
            </p>

            {/* QR Code Presentation Box */}
            <div className="p-4 rounded-2xl bg-white text-black inline-block mx-auto shadow-2xl border-4 border-amber-400">
              <div className="w-36 h-36 flex flex-col items-center justify-center relative">
                {/* SVG QR Code Simulation with Center Logo */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Outer corner finders */}
                  <rect x="5" y="5" width="25" height="25" fill="black" />
                  <rect x="9" y="9" width="17" height="17" fill="white" />
                  <rect x="13" y="13" width="9" height="9" fill="black" />

                  <rect x="70" y="5" width="25" height="25" fill="black" />
                  <rect x="74" y="9" width="17" height="17" fill="white" />
                  <rect x="78" y="13" width="9" height="9" fill="black" />

                  <rect x="5" y="70" width="25" height="25" fill="black" />
                  <rect x="9" y="74" width="17" height="17" fill="white" />
                  <rect x="13" y="78" width="9" height="9" fill="black" />

                  {/* Data blocks */}
                  <rect x="35" y="10" width="8" height="8" fill="black" />
                  <rect x="48" y="15" width="8" height="8" fill="black" />
                  <rect x="10" y="35" width="8" height="8" fill="black" />
                  <rect x="22" y="45" width="8" height="8" fill="black" />
                  <rect x="35" y="35" width="12" height="12" fill="black" />
                  <rect x="55" y="40" width="8" height="8" fill="black" />
                  <rect x="70" y="35" width="8" height="8" fill="black" />
                  <rect x="85" y="45" width="8" height="8" fill="black" />
                  <rect x="35" y="60" width="8" height="8" fill="black" />
                  <rect x="50" y="65" width="15" height="8" fill="black" />
                  <rect x="70" y="70" width="8" height="8" fill="black" />
                  <rect x="80" y="80" width="12" height="12" fill="black" />

                  {/* Center badge */}
                  <circle cx="50" cy="50" r="14" fill="#F59E0B" />
                  <text x="50" y="54" fontSize="8" fontWeight="bold" textAnchor="middle" fill="black">ESSE</text>
                </svg>
              </div>
            </div>

            {/* Voucher Code Box */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="font-mono font-black text-sm px-3 py-1.5 rounded-xl bg-black text-amber-400 border border-amber-500/40">
                {voucherCode || 'VIP-ESSE-5000'}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(voucherCode || 'VIP-ESSE-5000');
                  setCopiedVoucher(true);
                  setTimeout(() => setCopiedVoucher(false), 2500);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-black text-xs flex items-center gap-1 shadow-sm cursor-pointer"
              >
                {copiedVoucher ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedVoucher ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
              </button>
            </div>
          </div>
        )}

        {/* SECURITY NOTE: Müşteri kendisi damga ekleyemez! Yalnızca işletme yetkilisi ekler */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-400">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Yalnızca İstasyon Yetkilisi Tarafından İşlenir</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Damgalarınız, Esse Oto Yıkama istasyonumuzda tamamlanan her yıkama işlemi sonrasında yetkili personel tarafından sisteme kaydedilir ve kartınıza otomatik yansır.
          </p>
        </div>

        {/* Bottom Explicit Close Button */}
        <div className="mt-5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-black text-xs transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2 border border-white/15"
          >
            <X className="w-4 h-4" />
            <span>Pencereyi Kapat</span>
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  ) : null;
};
