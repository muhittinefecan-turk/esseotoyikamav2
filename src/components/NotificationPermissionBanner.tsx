import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { 
  getNativeNotificationPermission, 
  requestNativeNotificationPermission
} from '../utils/notifications';

interface NotificationPermissionBannerProps {
  isDarkMode: boolean;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({ isDarkMode }) => {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return localStorage.getItem('esse_notif_banner_dismissed') === 'true';
  });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showDeniedInfo, setShowDeniedInfo] = useState(false);

  useEffect(() => {
    const current = getNativeNotificationPermission();
    setPermission(current);
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestNativeNotificationPermission();
    setPermission(res);

    if (res === 'granted') {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    } else if (res === 'denied') {
      setShowDeniedInfo(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('esse_notif_banner_dismissed', 'true');
  };

  // If already granted, show only temporary success toast if just activated
  if (permission === 'granted' || permission === 'unsupported' || (dismissed && !showDeniedInfo)) {
    return (
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-60 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-2xl flex items-center gap-2 border border-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tarayıcı bildirimleri başarıyla aktif edildi!</span>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Denied guidance banner
  if (permission === 'denied' || showDeniedInfo) {
    return (
      <div className="w-full bg-zinc-900 border-b border-rose-500/30 text-zinc-200 px-4 py-2.5 shadow-lg relative z-40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-rose-400 mr-1.5">Bildirimler Engellenmiş:</span>
              <span>Randevu onay ve hazır durumlarını alabilmek için tarayıcınızın adres çubuğundaki kilit simgesinden bildirimlere izin veriniz.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-zinc-300 transition-colors"
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    );
  }

  // Default: Request permission prompt
  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black px-4 py-2.5 shadow-lg border-b border-amber-300 relative z-40">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-black text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div className="font-bold">
            <span className="font-black uppercase tracking-wider text-[10px] bg-black/20 px-1.5 py-0.5 rounded mr-1.5">
              Canlı Bildirimler
            </span>
            <span>Randevunuz onaylandığında veya sıraya alındığında anlık tarayıcı bildirimi almak için izin verin.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleRequestPermission}
            className="px-4 py-1.5 rounded-xl bg-black hover:bg-zinc-900 text-amber-400 font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Bildirimlere İzin Ver</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-black/15 text-black/80 hover:text-black transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
