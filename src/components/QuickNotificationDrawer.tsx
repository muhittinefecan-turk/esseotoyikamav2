import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Send, X, Sparkles, CheckCircle2, MessageSquare, Car, Clock } from 'lucide-react';
import { AppointmentData } from '../types';
import { sendNativePushNotification, logSystemEvent } from '../utils/notifications';

interface QuickNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentData | null;
  isDarkMode: boolean;
  onNotificationSent?: (message: string) => void;
}

interface TemplateItem {
  id: string;
  category: string;
  icon: string;
  title: string;
  text: (name: string, plate: string) => string;
}

const NOTIFICATION_TEMPLATES: TemplateItem[] = [
  {
    id: 'foam',
    category: 'Yıkama',
    icon: '🫧',
    title: '🫧 Ön Yıkamaya Alındı',
    text: (name, plate) => `Sn. ${name}, ${plate} aracınız köpüklendi ve basınçlı ön yıkama işlemine başlandı.`,
  },
  {
    id: 'rim',
    category: 'Yıkama',
    icon: '🛞',
    title: '🛞 Jant & Balata Bakımı Yapılıyor',
    text: (name, plate) => `Sn. ${name}, ${plate} aracınızın jant demir tozu ve davlumbaz temizliği uygulanıyor.`,
  },
  {
    id: 'interior',
    category: 'Detay',
    icon: '🧹',
    title: '🧹 İç Detay & Vakumlama',
    text: (name, plate) => `Sn. ${name}, ${plate} aracınızın iç detaylı vakumlama ve kabin sterilizasyonu yapılıyor.`,
  },
  {
    id: 'wax',
    category: 'Cila',
    icon: '✨',
    title: '✨ Aracınız Şu An Cilalanıyor',
    text: (name, plate) => `Sn. ${name}, ${plate} aracınız şu an cilalanıyor ve mikrofiber bezlerle kurulanıyor.`,
  },
  {
    id: 'ready',
    category: 'Teslimat',
    icon: '🎉',
    title: '🎉 Aracınız Hazır, Teslim Alabilirsiniz!',
    text: (name, plate) => `Sn. ${name}, ${plate} aracınız hazır, anahtar teslim için sizi istasyonumuzda bekliyoruz!`,
  },
  {
    id: 'delay',
    category: 'Bilgi',
    icon: '⏳',
    title: '⏳ Kısa Gecikme Bilgilendirmesi',
    text: (name, plate) => `Sn. ${name}, ${plate} aracınızın işlemi peron yoğunluğu sebebiyle yaklaşık 15 dakika gecikecektir. Anlayışınız için teşekkür ederiz.`,
  },
  {
    id: 'coffee',
    category: 'İkram',
    icon: '☕',
    title: '☕ Sıcak Çay / Kahve İkramı',
    text: (name, plate) => `Sn. ${name}, aracınız özenle yıkanırken bekleme salonumuzda sıcak çay ve kahve ikramımızın tadını çıkarabilirsiniz.`,
  },
];

export const QuickNotificationDrawer: React.FC<QuickNotificationDrawerProps> = ({
  isOpen,
  onClose,
  appointment,
  isDarkMode,
  onNotificationSent,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ready');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customBody, setCustomBody] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (appointment) {
      const name = appointment.customer.fullName || 'Değerli Müşterimiz';
      const plate = appointment.customer.plateNumber || '';
      const tmpl = NOTIFICATION_TEMPLATES.find((t) => t.id === 'ready') || NOTIFICATION_TEMPLATES[0];
      setCustomTitle(tmpl.title);
      setCustomBody(tmpl.text(name, plate));
    }
  }, [appointment]);

  const handleSelectTemplate = (tmpl: TemplateItem) => {
    if (!appointment) return;
    setSelectedTemplate(tmpl.id);
    const name = appointment.customer.fullName || 'Değerli Müşterimiz';
    const plate = appointment.customer.plateNumber || '';
    setCustomTitle(tmpl.title);
    setCustomBody(tmpl.text(name, plate));
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || !customTitle.trim() || !customBody.trim()) return;

    setIsSending(true);

    try {
      // 1. Dispatch real native push message (via Service Worker / Notification API)
      await sendNativePushNotification(customTitle.trim(), customBody.trim(), appointment.id);

      // 2. Log system event so in-app watcher and client tabs pick it up immediately
      logSystemEvent({
        type: 'in_progress',
        title: customTitle.trim(),
        message: customBody.trim(),
        appointmentId: appointment.id,
        plate: appointment.customer.plateNumber,
        customerName: appointment.customer.fullName,
      });

      // 3. Trigger Service Worker controller if available
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: customTitle.trim(),
          body: customBody.trim(),
          icon: '/icon-192.png',
          tag: appointment.id,
        });
      }

      setFeedback(`"${customTitle}" bildirimi Sn. ${appointment.customer.fullName} (${appointment.customer.plateNumber}) müşterisine başarıyla iletildi.`);
      if (onNotificationSent) {
        onNotificationSent(customTitle);
      }

      setTimeout(() => {
        setFeedback(null);
        setIsSending(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.warn('Quick notification send error:', err);
      setIsSending(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/75 backdrop-blur-xs animate-fade-in" onClick={onClose}>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg h-full overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col justify-between border-l ${
          isDarkMode ? 'bg-zinc-950 border-white/10 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Top Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/25">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-black text-base">Hızlı Bildirim Yanıt Çekmecesi</h3>
                <p className="text-xs text-zinc-400">Tek tıkla müşteriye özelleştirilmiş anlık bildirim gönderin</p>
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

          {/* Customer Badge Banner */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-amber-400">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="font-black text-zinc-100">{appointment.customer.fullName}</div>
                <div className="text-[11px] text-zinc-400">{appointment.customer.carModel || 'Model Belirtilmedi'}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono font-black text-amber-400 px-2 py-0.5 rounded bg-black/40 border border-amber-500/20">
                {appointment.customer.plateNumber}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{appointment.time}</div>
            </div>
          </div>

          {/* 1-Click Template Selector */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Hazır Hızlı Yanıt Şablonları (Tek Tıkla Seç):</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {NOTIFICATION_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-white/[0.02] border-white/5 text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{tmpl.icon}</span>
                      <span className="text-xs font-black">{tmpl.title}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/30 text-zinc-400">
                      {tmpl.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customizable Form */}
          <form onSubmit={handleSendNotification} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Bildirim Başlığı</label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Bildirim Mesajı (Kişiye Özel)</label>
              <textarea
                rows={3}
                required
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
              />
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{feedback}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'İletiliyor...' : 'Tek Tıkla Canlı Bildirim Gönder'}</span>
            </button>
          </form>
        </div>

        {/* Bottom Tip */}
        <div className="pt-4 border-t border-white/10 text-[11px] text-zinc-500 text-center">
          Bu bildirim müşterinin tarayıcısına yerel Push Bildirimi olarak anında iletilecektir.
        </div>
      </motion.div>
    </div>
  );
};
