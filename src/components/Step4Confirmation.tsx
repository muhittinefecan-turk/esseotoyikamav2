import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Download, 
  Check, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Sparkles,
  ExternalLink,
  Car,
  XCircle,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppointmentData, BusinessConfig } from '../types';
import { formatDuration, formatTurkishDate } from '../utils/formatters';
import { downloadAppointmentTicketImage } from '../utils/ticketCanvas';
import { downloadIcsFile, getGoogleCalendarUrl } from '../utils/calendar';
import { cancelAppointment } from '../utils/storage';

interface Step4ConfirmationProps {
  appointment: AppointmentData;
  business: BusinessConfig;
  onBack: () => void;
  onReset: () => void;
  onAppointmentSent: () => void;
  onCancelAppointment: (appointment: AppointmentData) => void;
  isDarkMode: boolean;
}

export const Step4Confirmation: React.FC<Step4ConfirmationProps> = ({
  appointment,
  business,
  onReset,
  onCancelAppointment,
  isDarkMode,
}) => {
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  // Trigger celebration confetti on mount
  React.useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#FFFFFF'],
      });
    } catch {
      // Ignored
    }
  }, []);

  const googleCalUrl = getGoogleCalendarUrl(appointment, business);

  const handleDownloadTicket = async () => {
    try {
      setDownloadingTicket(true);
      await downloadAppointmentTicketImage(appointment, business);
    } finally {
      setDownloadingTicket(false);
    }
  };

  const handleDirectCancel = () => {
    cancelAppointment(appointment.id, 'customer', 'Müşteri onay ekranından doğrudan iptal etti');
    setIsCancelled(true);
    setShowCancelPrompt(false);
    onCancelAppointment(appointment);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6 sm:space-y-8 pb-20 max-w-2xl mx-auto"
    >
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black glass-pill text-emerald-400 border border-emerald-500/30 backdrop-blur-xl"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Randevunuz Doğrudan Sisteme İletildi</span>
        </motion.div>
        
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          {isCancelled ? 'Randevu İptal Edildi' : 'Randevunuz Başarıyla Oluşturuldu!'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          {isCancelled 
            ? 'Randevunuz iptal edildi ve peron sistemde tekrar müsait duruma getirildi.' 
            : 'Randevunuz doğrudan istasyon panelimize düştü. WhatsApp veya başka bir işlem yapmanıza gerek yoktur.'}
        </p>
      </div>

      {/* Main Glassmorphic Ticket Card */}
      <div className={`relative rounded-3xl border overflow-hidden glass-panel transition-all shadow-[0_25px_60px_rgba(0,0,0,0.65)] ${
        isDarkMode ? 'border-white/15 bg-zinc-950/80 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Ticket Header */}
        <div className={`p-4 sm:p-5 text-black flex items-center justify-between ${
          isCancelled ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white' : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-amber-400 font-black flex items-center justify-center text-lg shadow-md border border-amber-400/30">
              ES
            </div>
            <div>
              <div className="font-black text-base tracking-tight leading-none">
                {business.name}
              </div>
              <div className="text-[11px] font-bold text-black/80 mt-1">
                {isCancelled ? 'İptal Edilen Randevu' : 'Elektronik Giriş Bileti'}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="font-mono-plate font-black text-sm px-2.5 py-1 rounded-lg bg-black text-amber-400 shadow-sm">
              #{appointment.id}
            </span>
          </div>
        </div>

        {/* Status Callout */}
        <div className="px-5 pt-4">
          <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            isCancelled 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <span className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isCancelled ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
              {isCancelled ? 'İptal Edildi' : 'Doğrudan İstasyon Sistemine Kaydedildi'}
            </span>
            <span className="text-[11px] opacity-80">
              {isCancelled ? 'İşlem Kapandı' : 'Sıraya Alındı'}
            </span>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
                Randevu Tarihi
              </span>
              <span className="text-xs sm:text-sm font-black text-zinc-100">
                {formatTurkishDate(appointment.date)}
              </span>
            </div>

            <div className="p-3 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Saat & Peron
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-400">
                {appointment.time}
              </span>
            </div>

            <div className="p-3 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Car className="w-3.5 h-3.5 text-amber-500" />
                Araç & Plaka
              </span>
              <span className="text-xs sm:text-sm font-black text-zinc-100 block truncate">
                {appointment.customer.carModel || 'Belirtilmedi'}
              </span>
              <span className="inline-block mt-1 font-mono font-black text-[11px] bg-white text-black px-1.5 py-0.2 rounded border border-zinc-300">
                {appointment.customer.plateNumber}
              </span>
            </div>

            <div className="p-3 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-amber-500" />
                Müşteri
              </span>
              <span className="text-xs sm:text-sm font-black text-zinc-100 block truncate">
                {appointment.customer.fullName}
              </span>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />
                {appointment.customer.phone}
              </span>
            </div>
          </div>

          {/* Services list */}
          <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-1.5">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Seçilen Hizmetler:
            </div>
            <div className="space-y-1">
              {appointment.selectedServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-200 font-semibold">• {s.name}</span>
                  <span className="text-zinc-400 text-[11px]">~{formatDuration(s.durationMinutes)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Address note */}
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300/90 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-zinc-200">{business.address}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Lütfen randevu saatinizden 5-10 dakika önce peron girişinde hazır bulununuz.
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation confirmation modal */}
        <AnimatePresence>
          {showCancelPrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-5 border-t border-rose-500/30 bg-rose-500/10 space-y-3"
            >
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Bu randevuyu iptal etmek istediğinize emin misiniz?</span>
              </div>
              <p className="text-xs text-zinc-300">
                Randevunuz doğrudan istasyon sisteminden kaldırılacak ve peron saati tekrar diğer müşteriler için açılacaktır.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDirectCancel}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Evet, Randevumu İptal Et
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/10 text-zinc-400 font-bold text-xs cursor-pointer"
                >
                  Vazgeç
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions Bar */}
        {!isCancelled && !showCancelPrompt && (
          <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadTicket}
                disabled={downloadingTicket}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{downloadingTicket ? 'İndiriliyor...' : 'Giriş Kartını İndir'}</span>
              </button>

              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl border border-white/15 hover:bg-white/10 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Takvim</span>
              </a>

              <button
                type="button"
                onClick={() => downloadIcsFile(appointment, business)}
                className="px-2.5 py-2 rounded-xl border border-white/15 hover:bg-white/10 text-xs font-semibold text-zinc-300"
              >
                .ics
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowCancelPrompt(true)}
              className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Randevuyu İptal Et</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onReset}
          className="px-5 py-3 rounded-2xl glass-button text-xs font-black text-black inline-flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          <span>Yeni Bir Randevu Oluştur</span>
        </button>

        <a
          href={`https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(`Merhaba, ${appointment.id} nolu randevum hakkında bilgi almak istiyorum.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-emerald-500" />
          <span>İşletmeyle WhatsApp'tan İletişime Geç</span>
        </a>
      </div>
    </motion.div>
  );
};
