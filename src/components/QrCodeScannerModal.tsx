import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, QrCode, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Upload } from 'lucide-react';
import { LoyaltyCustomerProfile } from '../types';

interface QrCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  eligibleCustomers: LoyaltyCustomerProfile[];
  isDarkMode: boolean;
}

export const QrCodeScannerModal: React.FC<QrCodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  eligibleCustomers,
  isDarkMode,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Close and stop stream on unmount or close
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Cihazınızda kamera erişimi desteklenmiyor veya engellenmiş.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setScanning(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Kamera başlatılamadı. Lütfen kamera izinlerini kontrol ediniz veya aşağıdan hazır kuponu seçiniz.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleManualCodeSelect = (code: string) => {
    stopCamera();
    onScan(code);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate quick image reading
      const sample = eligibleCustomers[0]?.voucherCode || eligibleCustomers[0]?.plate || 'VIP-ESSE-5000';
      handleManualCodeSelect(sample);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border p-5 sm:p-6 shadow-2xl space-y-4 ${
          isDarkMode ? 'bg-zinc-950 border-purple-500/40 text-zinc-100' : 'bg-white border-purple-500/40 text-zinc-900'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/25">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-zinc-100">Kamera ile QR Okuyucu</h3>
              <p className="text-xs text-zinc-400">Müşterinin telefonundaki 5/5 hediye QR kodunu tarayın</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Camera Area */}
        <div className="relative aspect-square max-h-72 w-full rounded-2xl overflow-hidden bg-black border-2 border-purple-500/50 flex items-center justify-center">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Laser Overlay */}
              <div className="absolute inset-8 border-2 border-purple-400/80 rounded-2xl pointer-events-none shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-purple-400 -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-purple-400 -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-purple-400 -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-purple-400 -mb-1 -mr-1" />

                {/* Animated scan laser bar */}
                <motion.div
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_10px_#A855F7]"
                  animate={{ y: [0, 200, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <div className="absolute bottom-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] text-purple-300 font-bold border border-purple-500/30">
                QR Kodu çerçevenin ortasına hizalayınız
              </div>
            </>
          ) : (
            <div className="p-6 text-center space-y-3">
              <Camera className="w-12 h-12 mx-auto text-purple-400/60 animate-pulse" />
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                {cameraError || 'Kamera başlatılıyor... Lütfen bekleyiniz.'}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Kamerayı Tekrar Başlat
              </button>
            </div>
          )}
        </div>

        {/* Quick Simulated QR Scan Buttons (Ready 5/5 Customer Vouchers) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>5/5 Damgalı Hediye Hak Eden Müşteriler:</span>
            </span>
            <span className="text-[11px] text-zinc-500">Tek Tıkla Doğrula</span>
          </div>

          {eligibleCustomers.length > 0 ? (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {eligibleCustomers.map((cust) => {
                const code = cust.voucherCode || `VIP-ESSE-${cust.plate}`;
                return (
                  <div
                    key={cust.plate}
                    onClick={() => handleManualCodeSelect(code)}
                    className="p-2.5 rounded-xl bg-zinc-900/90 hover:bg-purple-500/15 border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-black text-zinc-100">{cust.fullName}</div>
                      <div className="font-mono text-[11px] text-amber-400 font-bold">{cust.plate}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 font-bold border border-purple-500/30">
                        {code}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-center text-xs text-zinc-400">
              Şu anda 5/5 tamamlanmış müşteri bulunamadı.
              <button
                type="button"
                onClick={() => handleManualCodeSelect('VIP-ESSE-5000')}
                className="block mx-auto mt-2 px-3 py-1 rounded-lg bg-amber-500 text-black font-black text-[11px]"
              >
                Örnek Test QR Kodu Okut (VIP-ESSE-5000)
              </button>
            </div>
          )}
        </div>

        {/* Bottom Close */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <label className="text-xs text-zinc-400 flex items-center gap-1.5 cursor-pointer hover:text-white">
            <Upload className="w-3.5 h-3.5" />
            <span>Görselden QR Yükle</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
          >
            İptal / Kapat
          </button>
        </div>
      </motion.div>
    </div>
  );
};
