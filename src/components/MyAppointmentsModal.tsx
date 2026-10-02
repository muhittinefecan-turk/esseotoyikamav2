import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Trash2, MessageSquare, ExternalLink, RotateCcw, XCircle } from 'lucide-react';
import { AppointmentData, BusinessConfig } from '../types';
import { formatDuration, formatTurkishDate } from '../utils/formatters';
import { getWhatsAppUrl, getCancellationWhatsAppUrl } from '../utils/whatsapp';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';

interface MyAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: AppointmentData[];
  business: BusinessConfig;
  onDelete: (id: string) => void;
  onRebook: (appointment: AppointmentData) => void;
  isDarkMode: boolean;
}

export const MyAppointmentsModal: React.FC<MyAppointmentsModalProps> = ({
  isOpen,
  onClose,
  appointments,
  business,
  onDelete,
  onRebook,
  isDarkMode,
}) => {
  const [cancellingApt, setCancellingApt] = useState<AppointmentData | null>(null);

  if (!isOpen) return null;

  const handleSendCancellation = (apt: AppointmentData) => {
    const cancelUrl = getCancellationWhatsAppUrl(apt, business);
    window.open(cancelUrl, '_blank', 'noopener,noreferrer');
    onDelete(apt.id);
    setCancellingApt(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden glass-panel transition-all ${
          isDarkMode ? 'border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">Kayıtlı Randevularım</h3>
              <p className="text-xs text-zinc-400">
                Oluşturduğunuz randevuları görüntüleyin, iptal edin veya yeniden planlayın.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-white/10 text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 max-h-[72vh] overflow-y-auto space-y-3.5">
          {appointments.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Calendar className="w-10 h-10 text-zinc-600 mx-auto stroke-1" />
              <p className="text-sm font-bold text-zinc-400">
                Henüz kayıtlı bir randevunuz bulunmuyor.
              </p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Ana sayfadaki randevu adımlarını tamamladığınızda talepleriniz burada listelenecektir.
              </p>
            </div>
          ) : (
            appointments.map((apt) => {
              const wpUrl = getWhatsAppUrl(apt, business);
              const gCalUrl = getGoogleCalendarUrl(apt, business);

              return (
                <div
                  key={apt.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 backdrop-blur-md ${
                    isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-plate font-black text-xs text-amber-500">
                          #{apt.id}
                        </span>
                        <span className="text-xs font-bold text-zinc-100">
                          {apt.customer.carModel || 'Araç'}
                        </span>
                        <span className="text-[11px] font-mono font-black bg-white text-black px-1.5 py-0.2 rounded border border-zinc-300">
                          {apt.customer.plateNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          {formatTurkishDate(apt.date)}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-zinc-200">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {apt.time}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-amber-400 uppercase">
                        Yerinde Fiyat
                      </div>
                      <div className="text-[10px] text-zinc-400 font-medium">
                        ~{formatDuration(apt.totalDurationMinutes)}
                      </div>
                    </div>
                  </div>

                  {/* Services summary */}
                  <div className="text-xs text-zinc-400">
                    <span className="font-bold text-zinc-300">Hizmetler: </span>
                    {apt.selectedServices.map((s) => s.name).join(', ')}
                  </div>

                  {/* Customer Notes */}
                  {apt.customer.notes && (
                    <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs text-amber-300/90 whitespace-pre-wrap">
                      <span className="font-bold">Özel İstekler / Notlar: </span>
                      {apt.customer.notes}
                    </div>
                  )}

                  {/* Main Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <a
                        href={wpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>İşletmeye İlet</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          onRebook(apt);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Bu randevuyu temel alarak tekrar randevu aç"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Tekrar Randevu Aç</span>
                      </button>

                      <a
                        href={gCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl border border-white/10 text-xs transition-colors hover:bg-white/10 text-zinc-300"
                        title="Google Takvime Ekle"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                      </a>

                      <button
                        type="button"
                        onClick={() => downloadIcsFile(apt, business)}
                        className="px-2.5 py-1 rounded-xl border border-white/10 text-[11px] font-semibold transition-colors hover:bg-white/10 text-zinc-300"
                      >
                        .ics
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCancellingApt(apt)}
                      className="px-2.5 py-1 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Randevuyu İptal Et ve WhatsApp'tan Bildir"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>İptal Et</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Cancellation Confirmation Dialog */}
      {cancellingApt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-3xl border border-white/15 bg-zinc-900 p-6 space-y-4 text-zinc-100 shadow-2xl glass-panel"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg">Randevuyu İptal Et</h3>
                <p className="text-xs text-zinc-400">
                  #{cancellingApt.id} - {cancellingApt.customer.plateNumber}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              İptal talebinizi onayladığınızda işletmeye WhatsApp üzerinden otomatik iptal mesajı gönderilir ve randevu saati istasyonda tekrar müsait duruma gelir.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSendCancellation(cancellingApt)}
                className="w-full py-3 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/30"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp ile İptal Bildir & Randevuyu Sil</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onDelete(cancellingApt.id);
                  setCancellingApt(null);
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs border border-white/10 hover:bg-white/10 text-zinc-400 transition-colors"
              >
                Mesaj Göndermeden Yalnızca Cihazdan Sil
              </button>

              <button
                type="button"
                onClick={() => setCancellingApt(null)}
                className="w-full py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300"
              >
                Vazgeç
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
