import { SystemNotificationEvent } from '../types';
import { fetchNotificationsSQL, insertNotificationSQL, clearNotificationsSQL } from '../services/db';

// In-memory runtime event cache loaded and backed by Cloudflare D1
let runtimeSystemEvents: SystemNotificationEvent[] = [];
let hasLoadedFromD1 = false;

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

export async function requestNativeNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      sendNativePushNotification(
        '🔔 Bildirimler Aktif Edildi (Esse Detailing)',
        'Randevu durum değişiklikleriniz (Onay, Yıkamada, Tamamlandı, İptal) anlık olarak bildirilecektir.',
        'esse-welcome'
      );
    }
    return permission;
  } catch (err) {
    console.warn('Notification permission error:', err);
    return 'denied';
  }
}

export async function sendNativePushNotification(title: string, body: string, tag?: string) {
  playNotificationChime();

  if (typeof window === 'undefined') return;

  if ('Notification' in window && Notification.permission === 'granted') {
    let shownViaSw = false;

    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: tag || 'esse-status-update',
            renotify: true,
          } as NotificationOptions & { renotify?: boolean; badge?: string });
          shownViaSw = true;
        }
      } catch {
        // Fallback to standard window Notification
      }
    }

    if (!shownViaSw) {
      try {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          tag: tag || 'esse-status-update',
        });
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }
  }
}

/**
 * Loads notification events from Cloudflare D1 storage into memory.
 */
export async function syncSystemEventsFromD1(): Promise<SystemNotificationEvent[]> {
  try {
    const list = await fetchNotificationsSQL();
    runtimeSystemEvents = list;
    hasLoadedFromD1 = true;
    return runtimeSystemEvents;
  } catch (e) {
    console.warn('Failed to load system notifications from D1:', e);
    return runtimeSystemEvents;
  }
}

/**
 * Returns current system events from in-memory D1 state (zero localStorage).
 */
export function getSystemEvents(): SystemNotificationEvent[] {
  if (!hasLoadedFromD1 && typeof window !== 'undefined') {
    // Asynchronously kick off initial D1 sync
    syncSystemEventsFromD1().catch(() => {});
  }
  return runtimeSystemEvents;
}

/**
 * Logs a system notification directly to Cloudflare D1 table system_notifications.
 * Zero localStorage persistence.
 */
export function logSystemEvent(event: Omit<SystemNotificationEvent, 'id' | 'timestamp'>): SystemNotificationEvent {
  const newEvent: SystemNotificationEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };

  runtimeSystemEvents = [newEvent, ...runtimeSystemEvents].slice(0, 80);

  // Persist directly to Cloudflare D1
  insertNotificationSQL(newEvent).catch((err) => {
    console.warn('Failed to insert notification into D1:', err);
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('esse_notification_event', { detail: newEvent }));
  }

  // Also trigger native push notification
  sendNativePushNotification(newEvent.title, newEvent.message, newEvent.id);

  return newEvent;
}

/**
 * Clears all system notification events in Cloudflare D1.
 * Zero localStorage.
 */
export function clearSystemEvents(): void {
  runtimeSystemEvents = [];
  clearNotificationsSQL().catch((err) => {
    console.warn('Failed to clear notifications in D1:', err);
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('esse_notification_event', { detail: null }));
  }
}
