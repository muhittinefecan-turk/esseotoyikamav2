import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Car, Ban, Sparkles } from 'lucide-react';
import { formatTurkishDate } from '../utils/formatters';
import { AppointmentData } from '../types';

interface Step2DateTimeProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedTime: string; // HH:mm or "HH:mm - HH:mm (X. Peron)"
  onSelectTime: (time: string) => void;
  onNext: () => void;
  onBack: () => void;
  isDarkMode: boolean;
  existingAppointments?: AppointmentData[];
}

const HOUR_WINDOWS: { label: string; startHour: number; startMinute: number }[] = [
  { label: '08:30 - 09:30', startHour: 8, startMinute: 30 },
  { label: '09:30 - 10:30', startHour: 9, startMinute: 30 },
  { label: '10:30 - 11:30', startHour: 10, startMinute: 30 },
  { label: '11:30 - 12:30', startHour: 11, startMinute: 30 },
  { label: '12:30 - 13:30', startHour: 12, startMinute: 30 },
  { label: '13:30 - 14:30', startHour: 13, startMinute: 30 },
  { label: '14:30 - 15:30', startHour: 14, startMinute: 30 },
  { label: '15:30 - 16:30', startHour: 15, startMinute: 30 },
  { label: '16:30 - 17:30', startHour: 16, startMinute: 30 },
  { label: '17:30 - 18:30', startHour: 17, startMinute: 30 },
  { label: '18:30 - 19:30', startHour: 18, startMinute: 30 },
];

export const Step2DateTime: React.FC<Step2DateTimeProps> = ({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  onNext,
  onBack,
  isDarkMode,
  existingAppointments = [],
}) => {
  // Live real-time clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const liveTimeString = currentTime.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Next 30 days starting from today (Sundays flagged as closed)
  const availableDates = useMemo(() => {
    const list = [];
    const now = currentTime;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      const monthName = d.toLocaleDateString('tr-TR', { month: 'short' });
      const dayNumber = d.getDate();
      const isSunday = d.getDay() === 0;

      list.push({
        dateString,
        dateObj: d,
        dayName,
        monthName,
        dayNumber,
        isToday: i === 0,
        isTomorrow: i === 1,
        isSunday,
      });
    }
    return list;
  }, [currentTime]);

  // Ensure selectedDate is not a Sunday (Pazar kapalı)
  useEffect(() => {
    if (selectedDate) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      if (d.getDay() === 0) {
        // Move to Monday
        d.setDate(d.getDate() + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const nextDay = String(d.getDate()).padStart(2, '0');
        onSelectDate(`${y}-${m}-${nextDay}`);
      }
    }
  }, [selectedDate, onSelectDate]);

  // Build the 4-slot structure for each time interval
  const hourWindowsData = useMemo(() => {
    if (!selectedDate) return [];

    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const isSunday = dateObj.getDay() === 0;

    if (isSunday) {
      return []; // Pazar günleri kapalı
    }

    const isToday =
      currentTime.getFullYear() === year &&
      currentTime.getMonth() === month - 1 &&
      currentTime.getDate() === day;

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    return HOUR_WINDOWS.map((hw) => {
      // Check if time window has passed today
      let isPast = false;
      if (isToday) {
        if (hw.startHour < currentHour || (hw.startHour === currentHour && hw.startMinute <= currentMinute + 15)) {
          isPast = true;
        }
      }

      // Generate 4 distinct appointment slots for this hour window
      const slots = [1, 2, 3, 4].map((slotNum) => {
        const slotName = `${slotNum}. Peron`;
        const fullTimeLabel = `${hw.label} (${slotName})`;

        // Check if actually booked in existing appointments (cancelled appointments do not block slots)
        const isBooked = existingAppointments.some((apt) => {
          if (apt.date !== selectedDate || apt.status === 'cancelled') return false;
          return (
            apt.time === fullTimeLabel ||
            (apt.time.startsWith(hw.label.split(' - ')[0]) && apt.time.includes(`${slotNum}.`)) ||
            (slotNum === 1 && apt.time === hw.label.split(' - ')[0])
          );
        });

        return {
          slotNumber: slotNum,
          slotName,
          fullTimeLabel,
          isBooked,
          isPast,
          isAvailable: !isPast && !isBooked,
        };
      });

      const availableSlots = slots.filter((s) => s.isAvailable);
      const availableCount = availableSlots.length;
      const bookedCount = slots.filter((s) => s.isBooked).length;
      const isAllFull = availableCount === 0;

      return {
        windowLabel: hw.label,
        isPast,
        slots,
        availableSlots,
        availableCount,
        bookedCount,
        isAllFull,
      };
    });
  }, [selectedDate, currentTime, existingAppointments]);

  // HIDE PAST HOURS & COMPLETELY FULL HOURS: Only show windows that are currently active/available
  const visibleHourWindows = useMemo(() => {
    return hourWindowsData.filter((hw) => !hw.isPast && hw.availableCount > 0);
  }, [hourWindowsData]);

  // Find the fastest available slot
  const firstAvailableSlot = useMemo(() => {
    for (const hw of visibleHourWindows) {
      for (const s of hw.slots) {
        if (s.isAvailable) {
          return {
            windowLabel: hw.windowLabel,
            slotName: s.slotName,
            fullTimeLabel: s.fullTimeLabel,
          };
        }
      }
    }
    return null;
  }, [visibleHourWindows]);

  const totalAvailableSlots = useMemo(() => {
    return visibleHourWindows.reduce((acc, hw) => acc + hw.availableCount, 0);
  }, [visibleHourWindows]);

  const isTodaySelected = useMemo(() => {
    if (!selectedDate) return false;
    const [year, month, day] = selectedDate.split('-').map(Number);
    return (
      currentTime.getFullYear() === year &&
      currentTime.getMonth() === month - 1 &&
      currentTime.getDate() === day
    );
  }, [selectedDate, currentTime]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-5 pb-28 sm:pb-32"
    >
      {/* Live Status Strip */}
      <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md backdrop-blur-xl ${
        isDarkMode ? 'glass-panel border-white/10' : 'bg-emerald-50/90 border-emerald-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="text-xs font-black text-emerald-400">
              Canlı Peron Kapasitesi: 4 Bağımsız Peron / Saat
            </div>
            <div className="text-[11px] text-zinc-400">
              Yıkama, kuaför ve seramik işlemleri için gerçek zamanlı peron seçimi
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-zinc-300 font-bold bg-white/10 px-2.5 py-1 rounded-xl">
            Saat: {liveTimeString}
          </span>
          <span className="font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-xl">
            {totalAvailableSlots} Müsait Yer
          </span>
        </div>
      </div>

      {/* FAST 1-CLICK ACTION: FASTEST AVAILABLE SLOT */}
      {firstAvailableSlot && (
        <div className="p-3.5 rounded-2xl glass-panel-amber border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-md shrink-0">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-400">
                En Erken Müsait Randevu: {firstAvailableSlot.fullTimeLabel}
              </div>
              <div className="text-[11px] text-zinc-300">
                Beklemeden hemen peronunuzu ayırtmak için tek tıkla seçebilirsiniz.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectTime(firstAvailableSlot.fullTimeLabel);
              onNext();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl glass-button text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/30 cursor-pointer active:scale-95 shrink-0"
          >
            <span>Hızlıca Seç & Bilgilere Geç</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      )}

      {/* 1. Date Carousel */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>1. Randevu Gününü Seçin</span>
          </label>
          <span className="text-xs text-amber-400 font-extrabold">
            {formatTurkishDate(selectedDate)}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-10 gap-2 overflow-x-auto no-scrollbar py-1">
          {availableDates.slice(0, 14).map((d) => {
            const isSelected = selectedDate === d.dateString;
            const isSunday = d.isSunday;

            return (
              <button
                key={d.dateString}
                type="button"
                disabled={isSunday}
                onClick={() => !isSunday && onSelectDate(d.dateString)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all backdrop-blur-xl ${
                  isSunday
                    ? 'opacity-35 bg-zinc-900/40 border-white/5 cursor-not-allowed text-zinc-500'
                    : isSelected
                    ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/30 font-black scale-[1.03] cursor-pointer'
                    : isDarkMode
                    ? 'glass-panel border-white/10 text-zinc-200 hover:border-white/20 hover:bg-white/[0.06] cursor-pointer'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 shadow-2xs cursor-pointer'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                  isSelected ? 'text-black' : isSunday ? 'text-rose-400' : isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                }`}>
                  {isSunday ? 'Pazar' : d.isToday ? 'Bugün' : d.isTomorrow ? 'Yarın' : d.dayName}
                </span>

                <span className="text-base font-black my-0.5">
                  {d.dayNumber}
                </span>

                <span className={`text-[9px] ${
                  isSelected ? 'text-black/80 font-bold' : isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  {isSunday ? 'Kapalı' : d.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Available Hours & Peron Grid (Past hours completely hidden!) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <label className="text-xs font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>2. Müsait Saat & İstasyon Peronu</span>
          </label>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Müsait (Boş)
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Dolu
            </span>
          </div>
        </div>

        {/* If no hours left today, auto prompt tomorrow */}
        {visibleHourWindows.length === 0 && (
          <div className="p-5 rounded-3xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-center space-y-3 backdrop-blur-xl">
            <div className="font-extrabold text-sm text-zinc-100">
              {isTodaySelected 
                ? 'Bugün için çalışma saatlerimiz tamamlanmıştır.' 
                : 'Seçilen gün için peronlar doludur veya kapalıdır.'}
            </div>
            <p className="text-xs text-zinc-300 max-w-md mx-auto">
              Yarın sabah 08:30'dan itibaren tüm istasyon peronlarımız açık ve müsaittir. Sıra beklemeden randevunuzu hemen oluşturabilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => {
                const nextOpenDay = availableDates.find((d) => !d.isSunday && !d.isToday);
                if (nextOpenDay) onSelectDate(nextOpenDay.dateString);
              }}
              className="px-6 py-2.5 rounded-xl glass-button text-black font-black text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer active:scale-95"
            >
              <span>Yarın İçin Müsait Saatleri Göster</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Visible Hour Windows Grid */}
        <div className="space-y-3">
          {visibleHourWindows.map((hw) => {
            return (
              <div
                key={hw.windowLabel}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  hw.isAllFull
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : isDarkMode
                    ? 'glass-panel border-white/10 hover:border-white/20'
                    : 'bg-white border-zinc-200 shadow-xs'
                }`}
              >
                {/* Hour Window Header */}
                <div className="flex items-center justify-between mb-2.5 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/25">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{hw.windowLabel}</span>
                    </div>

                    <span className="text-[11px] font-bold text-zinc-400 hidden sm:inline">
                      (4 Bağımsız İstasyon Peronu)
                    </span>
                  </div>

                  <div>
                    {hw.isAllFull ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        4/4 Dolu
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {hw.availableCount} / 4 Müsait
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Distinct Slots for this Hour */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {hw.availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot.fullTimeLabel || selectedTime === `${hw.windowLabel.split(' - ')[0]} (${slot.slotName})`;

                    return (
                      <button
                        key={slot.slotNumber}
                        type="button"
                        onClick={() => onSelectTime(slot.fullTimeLabel)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer active:scale-98 ${
                          isSelected
                            ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/30 font-black scale-[1.02] ring-2 ring-amber-400'
                            : isDarkMode
                            ? 'glass-pill border-white/10 hover:border-amber-400/60 hover:bg-white/[0.08] text-zinc-200'
                            : 'bg-white border-zinc-200 hover:border-amber-500 text-zinc-800 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black ${
                            isSelected ? 'text-black' : 'text-zinc-200'
                          }`}>
                            {slot.slotName}
                          </span>

                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />
                          ) : (
                            <Car className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>

                        <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-black/10 dark:border-white/10 text-[10px]">
                          <span className={`font-bold ${
                            isSelected
                              ? 'text-black'
                              : 'text-emerald-400'
                          }`}>
                            {isSelected ? 'Seçildi ✓' : 'Müsait'}
                          </span>
                          <span className={isSelected ? 'text-black/80 font-bold text-[9px]' : 'text-zinc-400 text-[9px]'}>
                            Boş Yer
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Slot Summary Card */}
      {selectedTime && (
        <div className="p-3.5 rounded-2xl border border-amber-500/50 glass-panel-amber flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-zinc-200">
              Seçilen Randevu: <strong className="text-amber-400">{formatTurkishDate(selectedDate)} · {selectedTime}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto px-4 py-2 rounded-xl glass-button text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95 cursor-pointer shrink-0"
          >
            <span>Araç & İletişim Bilgilerine Geç</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.8]" />
          </button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="pt-2 flex items-center justify-between border-t border-white/10">
        <button
          type="button"
          onClick={onBack}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDarkMode ? 'hover:bg-white/10 text-zinc-300 border border-white/10' : 'hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Geri: Hizmetler</span>
        </button>

        <button
          type="button"
          disabled={!selectedDate || !selectedTime}
          onClick={onNext}
          className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
            selectedDate && selectedTime
              ? 'glass-button text-black active:scale-95 shadow-md shadow-amber-500/30 ring-1 ring-amber-400'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
          }`}
        >
          <span>Araç & İletişim Bilgilerine Geç</span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* PORTALED FIXED VIEWPORT BOTTOM BAR */}
      {typeof document !== 'undefined' && createPortal(
        <div className={`fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 backdrop-blur-2xl border-t shadow-[0_-10px_35px_rgba(0,0,0,0.85)] transition-all ${
          isDarkMode ? 'bg-zinc-950/95 border-white/15 text-zinc-100' : 'bg-white/95 border-zinc-200 text-zinc-900'
        }`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] text-zinc-400">
                Seçilen Tarih: <strong className="text-amber-400">{formatTurkishDate(selectedDate)}</strong>
              </span>
              <span className="text-xs font-black truncate">
                {selectedTime ? selectedTime : 'Lütfen saat ve peron seçiniz'}
              </span>
            </div>

            <button
              type="button"
              disabled={!selectedDate || !selectedTime}
              onClick={onNext}
              className={`px-5 sm:px-7 py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedDate && selectedTime
                  ? 'glass-button text-black active:scale-95 shadow-lg shadow-amber-500/30 ring-1 ring-amber-400'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
              }`}
            >
              <span>İletişim Bilgilerine Geç</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
};
