import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, RotateCcw, XCircle, CheckCircle, ExternalLink, AlertTriangle, Car, Search, RefreshCw } from 'lucide-react';
import { AppointmentData, BusinessConfig } from '../types';
import { formatDuration, formatTurkishDate } from '../utils/formatters';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { fetchAppointmentsSQL, cancelAppointmentSQL } from '../services/db';

interface MyAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessConfig;
  onRebook: (appointment: AppointmentData) => void;
  isDarkMode: boolean;
  appointments?: AppointmentData[];
  onDelete?: (id: string) => void;
}

export const MyAppointmentsModal: React.FC<MyAppointmentsModalProps> = ({
  isOpen,
  onClose,
  business,
  onRebook,
  isDarkMode,
}) => {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);
  const [searchPlate, setSearchPlate] = useState('');

  const loadAppointments = async () => {
    setLoading(true);
    try {
      // Exclusively fetch from Cloudflare D1 Storage
      const sqlApts = await fetchAppointmentsSQL();
      setAppointments(sqlApts || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAppointments();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSync = () => {
      loadAppointments();
    };
    window.addEventListener('esse_data_updated', handleSync);
    return () => {
      window.removeEventListener('esse_data_updated', handleSync);
    };
  }, []);

  if (!isOpen) return null;

  const handleConfirmCancel = async (apt: AppointmentData) => {
    setCancellingId(null);
    try {
      // 1. Cancel exclusively in Cloudflare D1
      await cancelAppointmentSQL(apt.id, 'customer', 'Müşteri paneli üzerinden iptal edildi');

      // 3. Immediately update local state
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === apt.id
            ? { ...a, status: 'cancelled', cancelledBy: 'customer', cancelledAt: new Date().toISOString() }
            : a
        )
      );

      setCancelFeedback(`Randevunuz (#${apt.id}) başarıyla iptal edildi. Peron diğer müşteriler için açıldı.`);
      setTimeout(() => setCancelFeedback(null), 5000);
    } catch (err: any) {
      console.error('İptal hatası:', err);
      setCancelFeedback(`Randevu iptal edilirken bir sorun oluştu: ${err.message || 'Lütfen tekrar deneyiniz'}`);
      setTimeout(() => setCancelFeedback(null), 5000);
    }
  };

  // Filter appointments: by active status and optional plate search
  const filteredAppointments = appointments.filter((apt) => {
    const q = searchPlate.trim().toUpperCase();
    if (!q) return apt.status !== 'cancelled' && apt.status !== 'completed';
    // If user searched for plate, show matching appointments (even if cancelled so they see status)
    const plateMatch = (apt.customer?.plateNumber || '').toUpperCase().includes(q);
    const phoneMatch = (apt.customer?.phone || '').includes(q);
    return plateMatch || phoneMatch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden glass-panel transition-all ${
          isDarkMode ? 'border-white/15 text-zinc-100 bg-[#0d0d10]' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">Randevularım & Randevu Sorgulama</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Kayıtlı randevularınızı plakayla sorgulayın veya doğrudan iptal edin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadAppointments}
              disabled={loading}
              title="Yenile"
              className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plate Search Bar */}
        <div className="px-4 py-3 border-b border-white/10 bg-black/30">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
              placeholder="Plaka veya telefon ile sorgula (örn: 09 DB 482 veya 0532...)"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono uppercase text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
            {searchPlate && (
              <button
                type="button"
                onClick={() => setSearchPlate('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Feedback alert */}
        <AnimatePresence>
          {cancelFeedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-400 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{cancelFeedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appointments List */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-3.5">
          {filteredAppointments.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Calendar className="w-12 h-12 text-zinc-600 mx-auto stroke-1" />
              <p className="text-sm font-black text-zinc-300">
                {searchPlate ? `"${searchPlate}" için randevu bulunamadı.` : 'Aktif bir randevunuz bulunmuyor.'}
              </p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Ana sayfadan oluşturduğunuz randevular Cloudflare D1 veri tabanında anlık olarak listelenir.
              </p>
            </div>
          ) : (
            filteredAppointments.map((apt) => {
              const gCalUrl = getGoogleCalendarUrl(apt, business);
              const isBeingCancelled = cancellingId === apt.id;
              const isCancelled = apt.status === 'cancelled';

              return (
                <div
                  key={apt.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 backdrop-blur-md ${
                    isCancelled
                      ? 'bg-rose-500/5 border-rose-500/20 opacity-75'
                      : isDarkMode
                      ? 'bg-white/[0.03] border-white/10'
                      : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs text-amber-500">
                          #{apt.id}
                        </span>
                        <span className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-zinc-400" />
                          {apt.customer?.carModel || 'Araç'}
                        </span>
                        <span className="text-[11px] font-mono font-black bg-white text-black px-2 py-0.5 rounded border border-zinc-300 shadow-xs">
                          {apt.customer?.plateNumber || 'Plaka Yok'}
                        </span>

                        {isCancelled && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            ✕ İptal Edildi
                          </span>
                        )}
                        {apt.status === 'confirmed' && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ Onaylandı
                          </span>
                        )}
                        {apt.status === 'in_progress' && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            🫧 Yıkamada
                          </span>
                        )}
                        {apt.status === 'pending' && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            ⏳ Sıraya Alındı
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
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
                        Süre
                      </div>
                      <div className="text-[10px] text-zinc-400 font-medium">
                        ~{formatDuration(apt.totalDurationMinutes)}
                      </div>
                    </div>
                  </div>

                  {/* Services summary */}
                  <div className="text-xs text-zinc-400">
                    <span className="font-bold text-zinc-300">Müşteri: </span>
                    {apt.customer?.fullName} ({apt.customer?.phone})
                  </div>

                  {/* Services summary */}
                  {apt.selectedServices && apt.selectedServices.length > 0 && (
                    <div className="text-xs text-zinc-400">
                      <span className="font-bold text-zinc-300">Hizmetler: </span>
                      {apt.selectedServices.map((s) => s.name).join(', ')}
                    </div>
                  )}

                  {/* Cancellation Reason if cancelled */}
                  {isCancelled && apt.cancellationReason && (
                    <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs text-rose-300">
                      <span className="font-bold">İptal Sebebi: </span>
                      {apt.cancellationReason}
                    </div>
                  )}

                  {/* Cancellation Confirmation Bar */}
                  {isBeingCancelled ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 space-y-2.5 text-xs text-zinc-200"
                    >
                      <div className="flex items-center gap-2 text-rose-400 font-black">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Randevunuzu iptal etmek istediğinize emin misiniz?</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Bu işlem randevunuzu iptal eder, peronu diğer müşteriler için açar ve işletmeye anlık bildirim iletir.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleConfirmCancel(apt)}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
                        >
                          Evet, Randevuyu İptal Et
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancellingId(null)}
                          className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/10 text-zinc-400 font-bold text-xs cursor-pointer"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    !isCancelled && (
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onRebook(apt);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Yeniden Planla</span>
                          </button>

                          <a
                            href={gCalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl border border-white/10 text-xs transition-colors hover:bg-white/10 text-zinc-300 flex items-center gap-1"
                            title="Google Takvime Ekle"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[10px] hidden sm:inline">Takvime Ekle</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => downloadIcsFile(apt, business)}
                            className="px-2 py-1.5 rounded-xl border border-white/10 text-[11px] font-semibold transition-colors hover:bg-white/10 text-zinc-300"
                          >
                            .ics
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCancellingId(apt.id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Randevuyu İptal Et</span>
                        </button>
                      </div>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
