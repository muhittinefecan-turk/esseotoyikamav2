import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Car, Ban } from 'lucide-react';
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

        // Check if actually booked in existing appointments
        const isBooked = existingAppointments.some((apt) => {
          if (apt.date !== selectedDate) return false;
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

      const availableCount = slots.filter((s) => s.isAvailable).length;
      const bookedCount = slots.filter((s) => s.isBooked).length;
      const isAllFull = availableCount === 0 && !isPast;

      return {
        windowLabel: hw.label,
        isPast,
        slots,
        availableCount,
        bookedCount,
        isAllFull,
      };
    });
  }, [selectedDate, currentTime, existingAppointments]);

  const totalAvailableSlots = useMemo(() => {
    return hourWindowsData.reduce((acc, hw) => acc + hw.availableCount, 0);
  }, [hourWindowsData]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6 sm:space-y-8 pb-20"
    >
      {/* Real-Time Live Status Bar */}
      <div className={`p-4 rounded-3xl border glass-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg ${
        isDarkMode ? 'border-white/15' : 'bg-emerald-50/90 border-emerald-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="text-xs font-black text-emerald-400">
              Canlı İstasyon Kapasitesi: 4 Peron / Saat
            </div>
            <div className="text-[11px] text-zinc-400">
              Her saat dilimi için 4 bağımsız araç yıkama ve kuaför peronu bulunmaktadır.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-zinc-300 font-bold bg-white/10 px-2.5 py-1 rounded-xl">
            Saat: {liveTimeString}
          </span>
          <span className="font-bold text-amber-400">
            {totalAvailableSlots} Müsait Yer
          </span>
        </div>
      </div>

      {/* Date Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs sm:text-sm font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-amber-500" />
            <span>1. Randevu Gününü Seçin (Pazar Günleri Kapalıdır)</span>
          </label>
          <span className="text-xs text-amber-400 font-bold">
            {formatTurkishDate(selectedDate)}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-10 gap-2 overflow-x-auto no-scrollbar py-1">
          {availableDates.slice(0, 14).map((d) => {
            const isSelected = selectedDate === d.dateString;
            const isSunday = d.isSunday;

            return (
              <motion.button
                key={d.dateString}
                whileHover={!isSunday ? { scale: 1.04 } : {}}
                whileTap={!isSunday ? { scale: 0.96 } : {}}
                type="button"
                disabled={isSunday}
                onClick={() => !isSunday && onSelectDate(d.dateString)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all backdrop-blur-xl ${
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

                <span className="text-lg font-black mt-1">
                  {d.dayNumber}
                </span>

                <span className={`text-[10px] ${
                  isSelected ? 'text-black/80 font-bold' : isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  {isSunday ? 'Kapalı' : d.monthName}
                </span>

                {isSunday && (
                  <span className="text-[9px] mt-1 px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Kapalı
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 4 SLOTS PER HOUR WINDOW */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <label className="text-xs sm:text-sm font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>2. Saat ve İstasyon Peronunu Seçin</span>
          </label>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Müsait (Boş)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Dolu (Rezerve)
            </span>
            <span className="flex items-center gap-1.5 text-zinc-500">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
              Geçmiş
            </span>
          </div>
        </div>

        {/* Hour Windows Grid */}
        <div className="space-y-3.5">
          {hourWindowsData.map((hw) => {
            const isWindowPast = hw.isPast;

            return (
              <motion.div
                key={hw.windowLabel}
                layout
                className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                  isWindowPast
                    ? 'opacity-40 bg-white/[0.01] border-white/5'
                    : hw.isAllFull
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : isDarkMode
                    ? 'glass-panel border-white/10 hover:border-white/20'
                    : 'bg-white border-zinc-200 shadow-xs'
                }`}
              >
                {/* Hour Window Header */}
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                      isWindowPast
                        ? 'bg-zinc-800 text-zinc-500'
                        : hw.isAllFull
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{hw.windowLabel}</span>
                    </div>

                    <span className="text-xs font-bold text-zinc-300 hidden sm:inline">
                      (4 Farklı Randevu Slotu)
                    </span>
                  </div>

                  {/* Capacity Badge */}
                  <div>
                    {isWindowPast ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-500">
                        Geçmiş Saat
                      </span>
                    ) : hw.isAllFull ? (
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        4/4 Dolu
                      </span>
                    ) : (
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {hw.availableCount} / 4 Müsait
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Distinct Slots for this Hour */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {hw.slots.map((slot) => {
                    const isSelected = selectedTime === slot.fullTimeLabel || selectedTime === `${hw.windowLabel.split(' - ')[0]} (${slot.slotName})`;
                    const isSlotDisabled = slot.isPast || slot.isBooked;

                    return (
                      <motion.button
                        key={slot.slotNumber}
                        whileHover={!isSlotDisabled ? { scale: 1.02 } : {}}
                        whileTap={!isSlotDisabled ? { scale: 0.98 } : {}}
                        type="button"
                        disabled={isSlotDisabled}
                        onClick={() => onSelectTime(slot.fullTimeLabel)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/30 font-black scale-[1.02]'
                            : isSlotDisabled
                            ? slot.isBooked
                              ? 'bg-rose-500/10 border-rose-500/25 text-rose-400/80 cursor-not-allowed'
                              : 'bg-white/[0.01] border-white/5 text-zinc-600 cursor-not-allowed line-through'
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
                          ) : slot.isBooked ? (
                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                          ) : slot.isPast ? (
                            <Clock className="w-3.5 h-3.5 text-zinc-600" />
                          ) : (
                            <Car className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>

                        {/* Status Indicator Pill */}
                        <div className="mt-2 flex items-center justify-between pt-1 border-t border-black/10 dark:border-white/10">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isSelected
                              ? 'text-black'
                              : slot.isBooked
                              ? 'text-rose-400'
                              : slot.isPast
                              ? 'text-zinc-600'
                              : 'text-emerald-400'
                          }`}>
                            {isSelected
                              ? 'Seçildi ✓'
                              : slot.isBooked
                              ? 'Dolu'
                              : slot.isPast
                              ? 'Geçmiş'
                              : 'Müsait'}
                          </span>

                          <span className={`text-[9px] ${
                            isSelected ? 'text-black/80 font-bold' : 'text-zinc-400'
                          }`}>
                            {slot.isBooked ? 'Rezerve' : slot.isAvailable ? 'Boş Yer' : ''}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {totalAvailableSlots === 0 && (
          <div className="mt-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center gap-3 text-xs backdrop-blur-md">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              Seçilen gün için tüm peronlar doludur veya mesai saati sona ermiştir. Lütfen yukarıdan bir sonraki günü seçiniz.
            </div>
          </div>
        )}
      </div>

      {/* Selected Slot Summary Badge */}
      {selectedTime && (
        <div className="p-3.5 rounded-2xl border border-amber-500/40 glass-panel-amber flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-300">
              Seçilen Randevu Zamanı: <strong className="text-amber-400">{selectedTime}</strong>
            </span>
          </div>
          <span className="text-[11px] font-bold text-amber-300">
            {formatTurkishDate(selectedDate)}
          </span>
        </div>
      )}

      {/* Navigation Buttons (Mobile Optimized) */}
      <div className="pt-4 flex items-center justify-between border-t border-white/10">
        <button
          type="button"
          onClick={onBack}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDarkMode ? 'hover:bg-white/10 text-zinc-300 border border-white/10' : 'hover:bg-zinc-100 text-zinc-600'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Geri: Hizmetler</span>
        </button>

        <button
          type="button"
          disabled={!selectedDate || !selectedTime}
          onClick={onNext}
          className={`px-6 py-3 rounded-xl sm:rounded-2xl font-black text-sm flex items-center gap-2 transition-all cursor-pointer ${
            selectedDate && selectedTime
              ? 'glass-button text-black active:scale-95'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
          }`}
        >
          <span>Araç & Not Bilgilerine Geç</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
