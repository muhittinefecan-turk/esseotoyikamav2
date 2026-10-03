import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { 
  getNativeNotificationPermission, 
  requestNativeNotificationPermission,
  sendNativePushNotification
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

  useEffect(() => {
    setPermission(getNativeNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestNativeNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('esse_notif_banner_dismissed', 'true');
  };

  // If already granted, don't nag the user
  if (permission === 'granted' || permission === 'unsupported' || dismissed) {
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

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black px-4 py-2.5 shadow-lg border-b border-amber-300 relative z-40">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-black text-amber-400 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div className="font-bold">
            <span className="font-black uppercase tracking-wider text-[10px] bg-black/20 px-1.5 py-0.5 rounded mr-1.5">
              Canlı Bildirimler
            </span>
            <span>Randevunuz onaylandığında veya sıraya alındığında anlık tarayıcı bildirimi alın.</span>
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
            className="p-1.5 rounded-lg hover:bg-black/15 text-black/80 hover:text-black transition-colors"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
