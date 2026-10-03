import { useEffect, useState, useCallback } from 'react';
import { AppointmentData } from '../types';
import { getStoredAppointments, purgeCompletedAppointments } from '../utils/storage';

interface ActiveInAppNotification {
  id: string;
  type: '1h' | '4h';
  title: string;
  message: string;
  appointment: AppointmentData;
}

// Play a subtle high-fidelity audio chime using Web Audio API
function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    // Audio context may be restricted by browser policy
  }
}

export function useAppointmentNotificationWatcher() {
  const [activeAlert, setActiveAlert] = useState<ActiveInAppNotification | null>(null);

  // Request browser notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  const checkUpcomingAppointments = useCallback(() => {
    // 1. First automatically purge any completed appointments
    purgeCompletedAppointments();

    const appointments = getStoredAppointments();
    const now = new Date();

    for (const apt of appointments) {
      if (apt.status === 'cancelled' || apt.status === 'completed') continue;

      // Parse appointment date & time
      // format: apt.date = "YYYY-MM-DD", apt.time = "14:30 - 15:30 (1. Peron)"
      const [year, month, day] = apt.date.split('-').map(Number);
      if (!year || !month || !day) continue;

      const hourPart = apt.time.split(' - ')[0] || apt.time.split(' ')[0];
      const [startH, startM] = hourPart.split(':').map(Number);
      if (isNaN(startH) || isNaN(startM)) continue;

      const aptDateObj = new Date(year, month - 1, day, startH, startM, 0);
      const diffMs = aptDateObj.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      // Key checks
      const key1h = `esse_notif_1h_${apt.id}_${apt.date}`;
      const key4h = `esse_notif_4h_${apt.id}_${apt.date}`;

      // 1-HOUR BEFORE NOTIFICATION (0 to 60 minutes)
      if (diffMinutes > 0 && diffMinutes <= 60) {
        if (!localStorage.getItem(key1h)) {
          localStorage.setItem(key1h, 'true');
          const title = `🚨 Randevunuza 1 Saat Kaldı! (Esse Detailing)`;
          const message = `Sn. ${apt.customer.fullName}, ${apt.customer.plateNumber} aracınızın ${apt.time} randevusuna 1 saat kaldı. Lütfen peronunuza giriş yapmayı unutmayınız.`;

          // Browser Native Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(title, {
                body: message,
                icon: '/icons/icon-192x192.png',
              });
            } catch (e) {
              console.error(e);
            }
          }

          // In-App Toast & Sound
          playChime();
          setActiveAlert({
            id: `alert-1h-${apt.id}`,
            type: '1h',
            title,
            message,
            appointment: apt,
          });
          break;
        }
      }
      // 4-HOURS BEFORE NOTIFICATION (61 to 240 minutes)
      else if (diffMinutes > 60 && diffMinutes <= 240) {
        if (!localStorage.getItem(key4h)) {
          localStorage.setItem(key4h, 'true');
          const title = `⏳ Randevunuza 4 Saat Kaldı (Esse Detailing)`;
          const message = `Sn. ${apt.customer.fullName}, ${apt.time} randevunuz için peronumuz ve uzman ekibimiz hazırlanıyor.`;

          // Browser Native Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(title, {
                body: message,
                icon: '/icons/icon-192x192.png',
              });
            } catch (e) {
              console.error(e);
            }
          }

          // In-App Toast & Sound
          playChime();
          setActiveAlert({
            id: `alert-4h-${apt.id}`,
            type: '4h',
            title,
            message,
            appointment: apt,
          });
          break;
        }
      }
    }
  }, []);

  // Interval check every 25 seconds
  useEffect(() => {
    checkUpcomingAppointments();
    const interval = setInterval(checkUpcomingAppointments, 25000);
    return () => clearInterval(interval);
  }, [checkUpcomingAppointments]);

  const dismissAlert = () => setActiveAlert(null);

  return {
    activeAlert,
    dismissAlert,
  };
}
