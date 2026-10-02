import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Calendar as CalendarIcon, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ChevronLeft, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Sparkles,
  ExternalLink,
  Car,
  FileText,
  BadgeAlert,
  XCircle,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppointmentData, BusinessConfig } from '../types';
import { formatDuration, formatTurkishDate } from '../utils/formatters';
import { 
  buildWhatsAppMessage, 
  getWhatsAppUrl, 
  getCancellationWhatsAppUrl, 
  buildCancellationWhatsAppMessage 
} from '../utils/whatsapp';
import { downloadIcsFile, getGoogleCalendarUrl } from '../utils/calendar';

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
  onBack,
  onReset,
  onAppointmentSent,
  onCancelAppointment,
  isDarkMode,
}) => {
  const [copiedMain, setCopiedMain] = useState(false);
  const [sentToWp, setSentToWp] = useState(appointment.status === 'sent_via_whatsapp');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const wpMainMessage = buildWhatsAppMessage(appointment, business);
  const wpMainUrl = getWhatsAppUrl(appointment, business);
  const wpCancelUrl = getCancellationWhatsAppUrl(appointment, business);
  const wpCancelMessage = buildCancellationWhatsAppMessage(appointment, business);
  const googleCalUrl = getGoogleCalendarUrl(appointment, business);

  const handleCopy = () => {
    navigator.clipboard.writeText(wpMainMessage);
    setCopiedMain(true);
    setTimeout(() => setCopiedMain(false), 2500);
  };

  const handleWhatsAppSend = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#3B82F6', '#FFFFFF'],
    });

    setSentToWp(true);
    onAppointmentSent();
    window.open(wpMainUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmCancel = () => {
    window.open(wpCancelUrl, '_blank', 'noopener,noreferrer');
    onCancelAppointment(appointment);
    setShowCancelModal(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6 sm:space-y-8 pb-20"
    >
      {/* Top Banner */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold glass-pill text-amber-400 border border-amber-500/30 backdrop-blur-xl"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Randevu Detayları ve WhatsApp İletimi</span>
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          Randevu Detaylarınız Hazır
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Yeşil WhatsApp butonuyla randevunuzu işletmeye hemen gönderin.
        </p>
      </div>

      {/* Main Glassmorphic Ticket Card */}
      <div className={`relative max-w-2xl mx-auto rounded-3xl border overflow-hidden glass-panel transition-all shadow-[0_25px_60px_rgba(0,0,0,0.65)] ${
        isDarkMode ? 'border-white/15' : 'bg-white border-zinc-200'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 p-4 sm:p-5 text-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-amber-500 font-black flex items-center justify-center text-lg shadow-md border border-amber-400/30">
              ES
            </div>
            <div>
              <div className="font-black text-base tracking-tight leading-none">
                {business.name}
              </div>
              <div className="text-[11px] font-bold text-black/80 mt-1">
                Online Randevu Bildirimi
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-black tracking-wider text-black/75 block">
              Randevu Kodu
            </span>
            <span className="font-mono-plate font-black text-base">
              #{appointment.id}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-7 space-y-5">
          {/* Vehicle and Plate Bar */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md ${
            isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] text-zinc-400 font-semibold">Kayıtlı Araç</div>
                <div className="text-base font-extrabold text-zinc-100">
                  {appointment.customer.carModel || 'Belirtilmedi'}
                </div>
                <div className="text-xs text-zinc-400">
                  Segment: {appointment.vehicleType === 'sedan' ? 'Binek' : appointment.vehicleType === 'suv' ? 'SUV / Crossover' : 'Ticari'}
                </div>
              </div>
            </div>

            {/* Turkish Plate Badge */}
            <div className="flex items-center rounded-xl overflow-hidden border border-zinc-600 bg-white text-black shadow-md">
              <div className="bg-[#003399] text-white px-2.5 py-1.5 flex flex-col items-center justify-center font-bold text-[10px]">
                <span>🇹🇷</span>
                <span className="text-[10px] font-black">TR</span>
              </div>
              <div className="px-3.5 py-1 font-mono-plate font-black text-base tracking-widest text-zinc-950">
                {appointment.customer.plateNumber}
              </div>
            </div>
          </div>

          {/* Date & Time Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 backdrop-blur-md ${
              isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <CalendarIcon className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <div className="text-[11px] text-zinc-400 font-medium">Randevu Tarihi</div>
                <div className="text-sm font-bold">
                  {formatTurkishDate(appointment.date)}
                </div>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 backdrop-blur-md ${
              isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <div className="text-[11px] text-zinc-400 font-medium">Randevu Saati & Peron</div>
                <div className="text-sm font-bold text-amber-400">
                  {appointment.time}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Services List */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Seçilen Hizmetler ({appointment.selectedServices.length})
            </div>
            <div className={`divide-y rounded-2xl border overflow-hidden backdrop-blur-md ${
              isDarkMode ? 'divide-white/10 border-white/10 bg-white/[0.02]' : 'divide-zinc-200 border-zinc-200 bg-zinc-50'
            }`}>
              {appointment.selectedServices.map((service) => (
                <div key={service.id} className="p-3.5 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="font-bold">{service.name}</span>
                  </div>
                  <span className="text-zinc-400 text-xs font-semibold">
                    ~{formatDuration(service.durationMinutes)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Requests & Notes */}
          <div className={`p-4 rounded-2xl border space-y-1.5 backdrop-blur-md ${
            appointment.customer.notes?.trim()
              ? 'glass-panel-amber border-amber-500/30 text-zinc-100'
              : 'bg-white/[0.02] border-white/10 text-zinc-400'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <FileText className="w-4 h-4" />
              <span>Müşteri Notu ve Özel Detailing İstekleri:</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pt-0.5 font-medium">
              {appointment.customer.notes?.trim()
                ? appointment.customer.notes.trim()
                : 'Özel bir not belirtilmedi.'}
            </p>
          </div>

          {/* Customer & Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Müşteri İletişim
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>{appointment.customer.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span>{appointment.customer.phone}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                İşletme Adresi
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {business.address}, {business.district} / {business.city}
                </span>
              </div>
              <div className="text-zinc-400">
                Tel: {business.phone}
              </div>
            </div>
          </div>

          {/* Pricing Status Card */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between backdrop-blur-md ${
            isDarkMode ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <BadgeAlert className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-amber-400 block">Fiyat Durumu</span>
                <span className="text-[11px] text-zinc-300">Araç başında, boyut ve kir durumuna göre belirlenir</span>
              </div>
            </div>
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500 text-black">
              Yerinde Fiyat
            </span>
          </div>
        </div>
      </div>

      {/* Primary CTA: WhatsApp Send Button */}
      <div className="max-w-2xl mx-auto space-y-3">
        <button
          type="button"
          onClick={handleWhatsAppSend}
          className="w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition-all transform active:scale-95 cursor-pointer"
        >
          <MessageSquare className="w-6 h-6" />
          <span>Randevuyu WhatsApp'tan İşletmeye Gönder</span>
        </button>

        {sentToWp && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2 backdrop-blur-md">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Randevu talebiniz hazırlandı! WhatsApp üzerinden 'Gönder'e basmayı unutmayınız.</span>
          </div>
        )}

        {/* WhatsApp Message Preview & Copy */}
        <div className={`p-4 rounded-2xl border text-xs space-y-2 glass-panel ${
          isDarkMode ? 'border-white/10' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-400">
              WhatsApp Randevu İleti Metni (UTF-8 Güvenli):
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                copiedMain
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10'
              }`}
            >
              {copiedMain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMain ? 'Kopyalandı' : 'Metni Kopyala'}</span>
            </button>
          </div>

          <pre className={`p-3 rounded-xl overflow-x-auto text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-36 ${
            isDarkMode ? 'bg-black/50 text-zinc-300 border border-white/10' : 'bg-white text-zinc-700 border border-zinc-200'
          }`}>
            {wpMainMessage}
          </pre>
        </div>
      </div>

      {/* Calendar & Export Options */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 glass-pill transition-all cursor-pointer ${
            isDarkMode ? 'text-zinc-200 hover:bg-white/10' : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-amber-500" />
          <span>Google Takvime Ekle</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>

        <button
          type="button"
          onClick={() => downloadIcsFile(appointment, business)}
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 glass-pill transition-all cursor-pointer ${
            isDarkMode ? 'text-zinc-200 hover:bg-white/10' : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800'
          }`}
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Takvim Dosyası (.ics)</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 glass-pill transition-all cursor-pointer ${
            isDarkMode ? 'text-zinc-200 hover:bg-white/10' : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800'
          }`}
        >
          <Printer className="w-4 h-4 text-sky-400" />
          <span>Fişi Yazdır</span>
        </button>
      </div>

      {/* Cancellation and Re-booking Section */}
      <div className="max-w-2xl mx-auto pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowCancelModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <XCircle className="w-4 h-4" />
          <span>Randevuyu İptal Et & İşletmeye Bildir</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:bg-white/10 text-zinc-300 border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Bilgileri Düzenle</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-white/10 text-amber-400 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>+ Yeni Randevu Aç</span>
          </button>
        </div>
      </div>

      {/* Cancellation Modal Dialog */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-zinc-900/95 p-6 space-y-4 text-zinc-100 shadow-2xl glass-panel">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg">Randevu İptali</h3>
                <p className="text-xs text-zinc-400">
                  #{appointment.id} nolu randevunuzu iptal ediyorsunuz.
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              İptal talebinizi onayladığınızda işletmeye otomatik olarak WhatsApp üzerinden iptal bildirimi gönderilir ve ilgili randevu saati istasyonda tekrar müsait duruma getirilir.
            </p>

            <div className="p-3 rounded-xl border border-white/10 bg-black/50 text-[11px] font-mono text-zinc-300 whitespace-pre-wrap max-h-28 overflow-y-auto">
              {wpCancelMessage}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="w-full py-3 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/30"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp ile İptal Et ve İşletmeye Gönder</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-full py-2.5 rounded-xl font-bold text-xs border border-white/10 hover:bg-white/10 text-zinc-300 transition-colors"
              >
                Vazgeç, Randevumu Koru
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
