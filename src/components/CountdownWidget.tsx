import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Bell, BellRing, Calendar, ArrowRight, X, Sparkles, Check } from 'lucide-react';
import { AppointmentData } from '../types';
import { formatTurkishDate } from '../utils/formatters';

interface CountdownProps {
  appointment: AppointmentData | null;
  isDarkMode: boolean;
  onViewAppointment: () => void;
}

export const CountdownWidget: React.FC<CountdownProps> = ({
  appointment,
  isDarkMode,
  onViewAppointment,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  } | null>(null);

  const [notificationState, setNotificationState] = useState<'default' | 'granted' | 'denied'>('default');
  const [showDismiss, setShowDismiss] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationState(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!appointment) {
      setTimeLeft(null);
      return;
    }

    const calculate = () => {
      try {
        const [year, month, day] = appointment.date.split('-').map(Number);
        // Cleanly extract start hour and minute from "14:30 - 15:30 (1. Peron)" or "14:30"
        const timePart = appointment.time.split(' - ')[0].trim().split(' ')[0];
        const [hourStr, minuteStr] = timePart.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
          setTimeLeft(null);
          return;
        }

        const target = new Date(year, month - 1, day, hour, minute, 0);
        const now = new Date();
        const diff = target.getTime() - now.getTime();

        if (isNaN(diff) || diff <= 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        if (isNaN(days) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
          setTimeLeft(null);
          return;
        }

        setTimeLeft({ days, hours, minutes, seconds, isPast: false });
      } catch {
        setTimeLeft(null);
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [appointment]);

  const handleRequestNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setNotificationState(perm);
      if (perm === 'granted') {
        new Notification('Esse Oto Yıkama', {
          body: `Randevu saatiniz yaklaştığında size bu cihazdan hatırlatma iletilecektir: ${appointment?.date} ${appointment?.time}`,
          icon: '/icon-192.png',
        });
      }
    } catch (err) {
      console.warn('Notification error:', err);
    }
  };

  if (!appointment || !timeLeft || timeLeft.isPast || showDismiss) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-4">
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 sm:p-5 rounded-3xl border glass-panel shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden ${
          isDarkMode ? 'border-amber-500/40 bg-zinc-950/80 text-zinc-100' : 'bg-white border-amber-500/40 text-zinc-900'
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-2xl pointer-events-none" />

        {/* Left: Info */}
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Yaklaşan Randevunuz
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Onaylı
              </span>
            </div>
            <div className="text-sm font-extrabold mt-0.5">
              {formatTurkishDate(appointment.date)} • Saat {appointment.time}
            </div>
            <div className="text-[11px] text-zinc-400">
              Araç: {appointment.customer.plateNumber || 'Plaka'} ({appointment.customer.carModel || 'Model'})
            </div>
          </div>
        </div>

        {/* Middle: Live Counter Blocks */}
        <div className="flex items-center gap-2">
          {[
            { val: timeLeft.days, label: 'GÜN' },
            { val: timeLeft.hours, label: 'SAAT' },
            { val: timeLeft.minutes, label: 'DAKİKA' },
            { val: timeLeft.seconds, label: 'SANİYE' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-2 sm:p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-center min-w-[50px] sm:min-w-[56px]"
            >
              <div className="text-base sm:text-lg font-black font-mono text-amber-400 leading-tight">
                {String(item.val).padStart(2, '0')}
              </div>
              <div className="text-[8px] font-bold text-zinc-400 tracking-wider">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {notificationState !== 'granted' && (
            <button
              type="button"
              onClick={handleRequestNotification}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-bold border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Cihaz bildirimi kur"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Hatırlat</span>
            </button>
          )}

          <button
            type="button"
            onClick={onViewAppointment}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/25 cursor-pointer"
          >
            <span>Bileti Gör</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
