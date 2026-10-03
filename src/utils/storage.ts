import { AppointmentData, BusinessConfig, CustomerFormData, LoyaltyCustomerProfile, StampHistoryItem } from '../types';
import { DEFAULT_BUSINESS_CONFIG } from '../data/businessConfig';
import { logSystemEvent } from './notifications';

const APPOINTMENTS_KEY = 'esse_local_appointments_v3';
const LOYALTY_PROFILES_KEY = 'esse_loyalty_profiles_v2';
const CUSTOMER_PROFILE_KEY = 'esse_saved_customer_profile_v1';
const BLOCKED_SLOTS_KEY = 'esse_blocked_slots_v1';

// Notify all app components that data has updated
function dispatchDataSync() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('esse_data_updated'));
  }
}

// ----------------------------------------------------
// APPOINTMENTS REPOSITORY
// ----------------------------------------------------

export function getAllStoredAppointments(): AppointmentData[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load appointments from localStorage', e);
    return [];
  }
}

// Active appointments only (for active customer and active admin lists)
export function getActiveAppointments(): AppointmentData[] {
  return getAllStoredAppointments().filter(
    (a) => a.status !== 'cancelled' && a.status !== 'completed'
  );
}

// Backwards compatibility alias
export function getStoredAppointments(): AppointmentData[] {
  return getAllStoredAppointments();
}

// Cancelled appointments only, sorted newest first
export function getCancelledAppointments(): AppointmentData[] {
  return getAllStoredAppointments()
    .filter((a) => a.status === 'cancelled')
    .sort((a, b) => {
      const timeA = new Date(a.cancelledAt || a.createdAt).getTime();
      const timeB = new Date(b.cancelledAt || b.createdAt).getTime();
      return timeB - timeA;
    });
}

// Completed appointments
export function getCompletedAppointments(): AppointmentData[] {
  return getAllStoredAppointments()
    .filter((a) => a.status === 'completed')
    .sort((a, b) => new Date(b.stampedAt || b.createdAt).getTime() - new Date(a.stampedAt || a.createdAt).getTime());
}

export function saveAppointmentToStorage(appointment: AppointmentData): void {
  try {
    const current = getAllStoredAppointments();
    const updated = [appointment, ...current.filter((a) => a.id !== appointment.id)];
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated.slice(0, 150)));

    // Log creation event & notify
    logSystemEvent({
      type: 'created',
      title: '✨ Yeni Randevu Oluşturuldu',
      message: `Sn. ${appointment.customer.fullName} (${appointment.customer.plateNumber}), ${appointment.date} saat ${appointment.time} randevusu doğrudan sisteme iletildi.`,
      appointmentId: appointment.id,
      plate: appointment.customer.plateNumber,
      customerName: appointment.customer.fullName,
    });

    dispatchDataSync();
  } catch (e) {
    console.error('Failed to save appointment to localStorage', e);
  }
}

export function approveAppointment(id: string): AppointmentData | null {
  try {
    const current = getAllStoredAppointments();
    const apt = current.find((a) => a.id === id);
    if (!apt) return null;

    // If already confirmed, move to in_progress (Yıkamaya Alındı)
    const newStatus: AppointmentData['status'] = apt.status === 'confirmed' ? 'in_progress' : 'confirmed';
    
    const updated = current.map((a) => {
      if (a.id === id) {
        return { ...a, status: newStatus };
      }
      return a;
    });

    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));

    if (newStatus === 'confirmed') {
      logSystemEvent({
        type: 'approved',
        title: '✅ Randevunuz Onaylandı (Esse Detailing)',
        message: `Sn. ${apt.customer.fullName}, ${apt.customer.plateNumber} aracınızın randevusu işletme tarafından onaylandı ve sıraya alındı.`,
        appointmentId: apt.id,
        plate: apt.customer.plateNumber,
        customerName: apt.customer.fullName,
      });
    } else {
      logSystemEvent({
        type: 'in_progress',
        title: '🫧 Aracınız Yıkamaya Alındı (Esse Detailing)',
        message: `Sn. ${apt.customer.fullName}, ${apt.customer.plateNumber} aracınızın perondaki yıkama ve bakım işlemleri başlatıldı.`,
        appointmentId: apt.id,
        plate: apt.customer.plateNumber,
        customerName: apt.customer.fullName,
      });
    }

    dispatchDataSync();
    return { ...apt, status: newStatus };
  } catch (e) {
    console.error('Failed to approve appointment', e);
    return null;
  }
}

export function completeAndAwardStamp(id: string): { apt: AppointmentData; currentStamps: number; giftUnlocked: boolean } | null {
  try {
    const current = getAllStoredAppointments();
    const apt = current.find((a) => a.id === id);
    if (!apt) return null;

    const plate = apt.customer.plateNumber.toUpperCase().trim();
    
    // Check if this appointment was already stamped to prevent duplicate stamps
    let currentStamps = 0;
    let giftUnlocked = false;

    if (!apt.stampedAt) {
      const stampResult = addStampToCustomer(plate, apt);
      currentStamps = stampResult.stamps;
      giftUnlocked = stampResult.giftUnlocked;
    } else {
      currentStamps = getCustomerStampsCount(plate);
    }

    // Mark as completed
    const stampedAt = new Date().toISOString();
    const updated = current.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status: 'completed' as const,
          stampedAt,
        };
      }
      return a;
    });

    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));

    logSystemEvent({
      type: 'completed',
      title: '🎉 Randevunuz Tamamlandı!',
      message: `Sn. ${apt.customer.fullName}, ${apt.customer.plateNumber} aracınızın işlemleri tamamlandı. Dijital kartınıza 1 damga eklendi (Toplam: ${currentStamps}/5).`,
      appointmentId: apt.id,
      plate: apt.customer.plateNumber,
      customerName: apt.customer.fullName,
    });

    dispatchDataSync();
    return {
      apt: { ...apt, status: 'completed', stampedAt },
      currentStamps,
      giftUnlocked,
    };
  } catch (e) {
    console.error('Failed to complete appointment and award stamp', e);
    return null;
  }
}

export function cancelAppointment(
  id: string,
  cancelledBy: 'customer' | 'admin',
  reason?: string
): AppointmentData | null {
  try {
    const current = getAllStoredAppointments();
    const apt = current.find((a) => a.id === id);
    if (!apt) return null;

    const cancelledAt = new Date().toISOString();
    const cancellationReason = reason || (cancelledBy === 'customer' 
      ? 'Müşteri tarafından iptal edildi' 
      : 'İşletme tarafından iptal edildi');

    // Move to cancelled state with metadata
    const updated = current.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status: 'cancelled' as const,
          cancelledBy,
          cancelledAt,
          cancellationReason,
        };
      }
      return a;
    });

    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));

    if (cancelledBy === 'customer') {
      logSystemEvent({
        type: 'cancelled_by_customer',
        title: '⚠️ Müşteri Randevuyu İptal Etti',
        message: `${apt.customer.fullName} (${apt.customer.plateNumber}) nolu randevu müşteri tarafından iptal edildi. Peron tekrar müsait duruma getirildi.`,
        appointmentId: apt.id,
        plate: apt.customer.plateNumber,
        customerName: apt.customer.fullName,
      });
    } else {
      logSystemEvent({
        type: 'cancelled_by_admin',
        title: '✕ Randevunuz İşletme Tarafından İptal Edildi',
        message: `Sn. ${apt.customer.fullName}, ${apt.customer.plateNumber} nolu randevunuz işletme tarafından iptal edildi. Detaylı bilgi için lütfen işletmemizle iletişime geçiniz.`,
        appointmentId: apt.id,
        plate: apt.customer.plateNumber,
        customerName: apt.customer.fullName,
      });
    }

    dispatchDataSync();
    return {
      ...apt,
      status: 'cancelled',
      cancelledBy,
      cancelledAt,
      cancellationReason,
    };
  } catch (e) {
    console.error('Failed to cancel appointment', e);
    return null;
  }
}

// Reactivate cancelled appointment
export function reactivateAppointment(id: string): AppointmentData | null {
  try {
    const current = getAllStoredAppointments();
    const apt = current.find((a) => a.id === id);
    if (!apt) return null;

    const updated = current.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status: 'confirmed' as const,
          cancelledBy: undefined,
          cancelledAt: undefined,
          cancellationReason: undefined,
        };
      }
      return a;
    });

    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));

    logSystemEvent({
      type: 'approved',
      title: '🔄 Randevu Tekrar Aktif Edildi',
      message: `${apt.customer.fullName} (${apt.customer.plateNumber}) randevusu yönetici tarafından yeniden aktif randevular listesine alındı.`,
      appointmentId: apt.id,
      plate: apt.customer.plateNumber,
      customerName: apt.customer.fullName,
    });

    dispatchDataSync();
    return { ...apt, status: 'confirmed' };
  } catch (e) {
    console.error('Failed to reactivate appointment', e);
    return null;
  }
}

export function deleteStoredAppointment(id: string): void {
  try {
    const current = getAllStoredAppointments();
    const updated = current.filter((a) => a.id !== id);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
    dispatchDataSync();
  } catch (e) {
    console.error('Failed to delete appointment from localStorage', e);
  }
}

export function updateAppointmentStatus(
  id: string,
  status: AppointmentData['status'],
  adminNotes?: string
): void {
  try {
    const current = getAllStoredAppointments();
    const updated = current.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status,
          adminNotes: adminNotes !== undefined ? adminNotes : a.adminNotes,
        };
      }
      return a;
    });
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
    dispatchDataSync();
  } catch (e) {
    console.error('Failed to update status in localStorage', e);
  }
}

// Purge helper
export function purgeCompletedAppointments(): void {
  // We keep completed & cancelled records in historical tabs
}

export function seedSampleAppointmentsIfEmpty(): AppointmentData[] {
  return getAllStoredAppointments();
}

// ----------------------------------------------------
// DIGITAL LOYALTY CARD (5-STAMP) SYSTEM
// ----------------------------------------------------

export function getLoyaltyProfiles(): LoyaltyCustomerProfile[] {
  try {
    const raw = localStorage.getItem(LOYALTY_PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCustomerLoyaltyProfile(plate: string): LoyaltyCustomerProfile | null {
  const cleanPlate = plate.toUpperCase().trim();
  const profiles = getLoyaltyProfiles();
  return profiles.find((p) => p.plate === cleanPlate) || null;
}

export function getCustomerStampsCount(plate: string): number {
  const profile = getCustomerLoyaltyProfile(plate);
  return profile ? profile.stamps : 0;
}

export function addStampToCustomer(
  plate: string,
  appointment: AppointmentData
): { stamps: number; giftUnlocked: boolean; profile: LoyaltyCustomerProfile } {
  const cleanPlate = plate.toUpperCase().trim();
  const profiles = getLoyaltyProfiles();
  const existing = profiles.find((p) => p.plate === cleanPlate);

  const historyItem: StampHistoryItem = {
    id: `stamp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    appointmentId: appointment.id,
    date: appointment.date,
    awardedAt: new Date().toISOString(),
    serviceNames: appointment.selectedServices.map((s) => s.name),
    note: `${appointment.time} randevusu`,
  };

  let newStamps = 1;
  let updatedProfile: LoyaltyCustomerProfile;

  if (existing) {
    newStamps = Math.min(5, existing.stamps + 1);
    updatedProfile = {
      ...existing,
      fullName: appointment.customer.fullName || existing.fullName,
      phone: appointment.customer.phone || existing.phone,
      stamps: newStamps,
      history: [historyItem, ...(existing.history || [])],
      lastUpdated: new Date().toISOString(),
    };
  } else {
    newStamps = 1;
    updatedProfile = {
      plate: cleanPlate,
      fullName: appointment.customer.fullName,
      phone: appointment.customer.phone,
      stamps: 1,
      history: [historyItem],
      lastUpdated: new Date().toISOString(),
    };
  }

  const updatedProfiles = [
    updatedProfile,
    ...profiles.filter((p) => p.plate !== cleanPlate),
  ];

  localStorage.setItem(LOYALTY_PROFILES_KEY, JSON.stringify(updatedProfiles));
  dispatchDataSync();

  return {
    stamps: newStamps,
    giftUnlocked: newStamps === 5,
    profile: updatedProfile,
  };
}

export function setCustomerStampsDirect(
  plate: string,
  stamps: number,
  fullName?: string,
  phone?: string
): LoyaltyCustomerProfile {
  const cleanPlate = plate.toUpperCase().trim();
  const clamped = Math.max(0, Math.min(5, stamps));
  const profiles = getLoyaltyProfiles();
  const existing = profiles.find((p) => p.plate === cleanPlate);

  let updatedProfile: LoyaltyCustomerProfile;

  if (existing) {
    updatedProfile = {
      ...existing,
      stamps: clamped,
      fullName: fullName || existing.fullName,
      phone: phone || existing.phone,
      lastUpdated: new Date().toISOString(),
    };
  } else {
    updatedProfile = {
      plate: cleanPlate,
      fullName: fullName || 'Müşteri',
      phone: phone || '',
      stamps: clamped,
      history: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  const updated = [
    updatedProfile,
    ...profiles.filter((p) => p.plate !== cleanPlate),
  ];

  localStorage.setItem(LOYALTY_PROFILES_KEY, JSON.stringify(updated));
  dispatchDataSync();
  return updatedProfile;
}

export function redeemGiftStamp(plate: string): LoyaltyCustomerProfile | null {
  const cleanPlate = plate.toUpperCase().trim();
  const profiles = getLoyaltyProfiles();
  const existing = profiles.find((p) => p.plate === cleanPlate);
  if (!existing) return null;

  const updatedProfile: LoyaltyCustomerProfile = {
    ...existing,
    stamps: 0, // Reset for next cycle of 5 stamps
    lastUpdated: new Date().toISOString(),
    history: [
      {
        id: `redeem-${Date.now()}`,
        appointmentId: 'gift-redeemed',
        date: new Date().toISOString().split('T')[0],
        awardedAt: new Date().toISOString(),
        serviceNames: ['🎁 5/5 Hediye Cilalı Yıkama Kullanıldı'],
        note: 'Hediye yıkama hakkı teslim edildi, kart sıfırlandı.',
      },
      ...(existing.history || []),
    ],
  };

  const updated = [
    updatedProfile,
    ...profiles.filter((p) => p.plate !== cleanPlate),
  ];

  localStorage.setItem(LOYALTY_PROFILES_KEY, JSON.stringify(updated));
  dispatchDataSync();
  return updatedProfile;
}

// Map helper for quick plate -> stamps lookup
export function getCustomerStampsMap(): Record<string, number> {
  const profiles = getLoyaltyProfiles();
  const map: Record<string, number> = {};
  for (const p of profiles) {
    map[p.plate] = p.stamps;
  }
  return map;
}

export function updateCustomerStamps(key: string, stamps: number): void {
  setCustomerStampsDirect(key, stamps);
}

// ----------------------------------------------------
// SAVED CUSTOMER PROFILE
// ----------------------------------------------------

export function getSavedCustomerProfile(): CustomerFormData | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCustomerProfile(data: CustomerFormData): void {
  try {
    localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function getBusinessConfig(): BusinessConfig {
  return DEFAULT_BUSINESS_CONFIG;
}
