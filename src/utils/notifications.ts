import { SystemNotificationEvent } from '../types';

const NOTIFICATION_EVENTS_KEY = 'esse_system_events_v2';

// Play high-fidelity audible chime using Web Audio API
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio may be restricted if user hasn't interacted yet
  }
}

export function getNativeNotificationPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNativeNotificationPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      playNotificationChime();
      try {
        new Notification('🔔 Bildirimler Aktif Edildi (Esse Detailing)', {
          body: 'Randevu durum değişiklikleriniz (Onay, Yıkamada, Tamamlandı, İptal) anlık olarak bildirilecektir.',
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Native notification display error:', err);
      }
    }
    return permission;
  } catch (err) {
    console.warn('Notification permission error:', err);
    return 'denied';
  }
}

export function sendNativePushNotification(title: string, body: string, tag?: string) {
  playNotificationChime();

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: tag || 'esse-status-update',
      });
    } catch (err) {
      console.warn('Notification failed:', err);
    }
  }
}

export function getSystemEvents(): SystemNotificationEvent[] {
  try {
    const raw = localStorage.getItem(NOTIFICATION_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logSystemEvent(event: Omit<SystemNotificationEvent, 'id' | 'timestamp'>): SystemNotificationEvent {
  const newEvent: SystemNotificationEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };

  try {
    const current = getSystemEvents();
    const updated = [newEvent, ...current].slice(0, 80);
    localStorage.setItem(NOTIFICATION_EVENTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('esse_notification_event', { detail: newEvent }));
  } catch (e) {
    console.error('Failed to log system notification event', e);
  }

  // Also trigger native push notification
  sendNativePushNotification(newEvent.title, newEvent.message, newEvent.id);

  return newEvent;
}

export function clearSystemEvents(): void {
  try {
    localStorage.removeItem(NOTIFICATION_EVENTS_KEY);
    window.dispatchEvent(new CustomEvent('esse_notification_event', { detail: null }));
  } catch (e) {
    console.error('Failed to clear events', e);
  }
}
