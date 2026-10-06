/**
 * Cloudflare D1 Unified State & Storage Adapter
 * 
 * Replaces all localStorage usage with Cloudflare D1 Storage:
 * - Pure Cloudflare D1 database operations
 * - In-memory live session cache synced with D1
 * - Zero localStorage persistence or mock data
 */

import {
  AppointmentData,
  BusinessConfig,
  CustomerFormData,
  LoyaltyCustomerProfile,
  StampHistoryItem,
  WashStage,
  VehicleInspectionPhoto,
} from '../types';
import { DEFAULT_BUSINESS_CONFIG } from '../data/businessConfig';
import { logSystemEvent } from './notifications';
import {
  fetchAppointmentsSQL,
  fetchActiveAppointmentsSQL,
  insertAppointmentSQL,
  updateAppointmentStatusSQL,
  updateWashStageSQL,
  cancelAppointmentSQL,
  deleteAppointmentSQL,
  fetchLoyaltyProfilesSQL,
  saveLoyaltyStampSQL,
  completeAndAwardStampSQL,
  redeemVoucherSQL,
  saveCustomerSQL,
  fetchCustomerSQL,
  addInspectionPhotoSQL,
  notifyDataChanged,
} from '../services/db';

// In-memory live cache populated exclusively from D1
let runtimeAppointments: AppointmentData[] = [];
let runtimeLoyalty: LoyaltyCustomerProfile[] = [];
let runtimeCustomerProfile: CustomerFormData | null = null;
let isSyncing = false;

// ----------------------------------------------------
// D1 LIVE SYNCHRONIZATION
// ----------------------------------------------------

export async function initializeDatabaseSync(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const [apts, loyalty, cust] = await Promise.all([
      fetchAppointmentsSQL(),
      fetchLoyaltyProfilesSQL(),
      fetchCustomerSQL(),
    ]);

    runtimeAppointments = apts;
    runtimeLoyalty = loyalty;
    if (cust) runtimeCustomerProfile = cust;

    notifyDataChanged();
  } catch (err) {
    console.warn('D1 database sync notice:', err);
  } finally {
    isSyncing = false;
  }
}

if (typeof window !== 'undefined') {
  initializeDatabaseSync();
  window.addEventListener('esse_data_updated', () => {
    fetchAppointmentsSQL().then((list) => {
      runtimeAppointments = list;
    });
    fetchLoyaltyProfilesSQL().then((list) => {
      runtimeLoyalty = list;
    });
  });
}

// ----------------------------------------------------
// APPOINTMENTS REPOSITORY (D1-backed)
// ----------------------------------------------------

export function getAllStoredAppointments(): AppointmentData[] {
  return runtimeAppointments;
}

export function getActiveAppointments(): AppointmentData[] {
  return runtimeAppointments.filter(
    (a) => a.status !== 'cancelled' && a.status !== 'completed'
  );
}

export function getStoredAppointments(): AppointmentData[] {
  return runtimeAppointments;
}

export function getCancelledAppointments(): AppointmentData[] {
  return runtimeAppointments
    .filter((a) => a.status === 'cancelled')
    .sort((a, b) => {
      const timeA = new Date(a.cancelledAt || a.createdAt).getTime();
      const timeB = new Date(b.cancelledAt || b.createdAt).getTime();
      return timeB - timeA;
    });
}

export function getCompletedAppointments(): AppointmentData[] {
  return runtimeAppointments
    .filter((a) => a.status === 'completed')
    .sort((a, b) => new Date(b.stampedAt || b.createdAt).getTime() - new Date(a.stampedAt || a.createdAt).getTime());
}

export function saveAppointmentToStorage(appointment: AppointmentData): void {
  // 1. Update runtime cache immediately
  runtimeAppointments = [appointment, ...runtimeAppointments.filter((a) => a.id !== appointment.id)];

  // 2. Persist to Cloudflare D1
  insertAppointmentSQL(appointment).catch((err) => {
    console.error('Failed to insert appointment in D1:', err);
  });

  // 3. Log event
  logSystemEvent({
    type: 'created',
    title: '✨ Yeni Randevu Oluşturuldu',
    message: `Sn. ${appointment.customer.fullName} (${appointment.customer.plateNumber}), ${appointment.date} saat ${appointment.time} randevusu D1 veri tabanına işlendi.`,
    appointmentId: appointment.id,
    plate: appointment.customer.plateNumber,
    customerName: appointment.customer.fullName,
  });

  notifyDataChanged();
}

export function approveAppointment(id: string): AppointmentData | null {
  const apt = runtimeAppointments.find((a) => a.id === id);
  if (!apt) return null;

  const newStatus: AppointmentData['status'] = apt.status === 'confirmed' ? 'in_progress' : 'confirmed';
  const updatedApt: AppointmentData = { ...apt, status: newStatus };

  runtimeAppointments = runtimeAppointments.map((a) => (a.id === id ? updatedApt : a));

  updateAppointmentStatusSQL(id, newStatus).catch(() => {});

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

  notifyDataChanged();
  return updatedApt;
}

export function completeAndAwardStamp(id: string): { apt: AppointmentData; currentStamps: number; giftUnlocked: boolean } | null {
  const apt = runtimeAppointments.find((a) => a.id === id);
  if (!apt) return null;

  const plate = (apt.customer.plateNumber || '').toUpperCase().trim();
  const existingProfile = runtimeLoyalty.find((p) => p.plate.toUpperCase().trim() === plate);
  const currentStamps = Math.min(5, (existingProfile?.stamps || 0) + 1);
  const giftUnlocked = currentStamps >= 5;
  const stampedAt = new Date().toISOString();

  const updatedApt: AppointmentData = {
    ...apt,
    status: 'completed',
    stampedAt,
  };

  runtimeAppointments = runtimeAppointments.map((a) => (a.id === id ? updatedApt : a));

  // Execute D1 transaction
  completeAndAwardStampSQL(id).catch(() => {});

  logSystemEvent({
    type: 'completed',
    title: '🎉 Randevunuz Tamamlandı!',
    message: `Sn. ${apt.customer.fullName}, ${apt.customer.plateNumber} aracınızın işlemleri tamamlandı. Dijital kartınıza 1 damga eklendi (${currentStamps}/5).`,
    appointmentId: apt.id,
    plate: apt.customer.plateNumber,
    customerName: apt.customer.fullName,
  });

  notifyDataChanged();
  return {
    apt: updatedApt,
    currentStamps,
    giftUnlocked,
  };
}

export function cancelAppointment(
  id: string,
  cancelledBy: 'customer' | 'admin',
  reason?: string
): AppointmentData | null {
  const apt = runtimeAppointments.find((a) => a.id === id);
  if (!apt) return null;

  const cancelledAt = new Date().toISOString();
  const cancellationReason = reason || (cancelledBy === 'customer' 
    ? 'Müşteri tarafından iptal edildi' 
    : 'İşletme tarafından iptal edildi');

  const updatedApt: AppointmentData = {
    ...apt,
    status: 'cancelled',
    cancelledBy,
    cancelledAt,
    cancellationReason,
  };

  runtimeAppointments = runtimeAppointments.map((a) => (a.id === id ? updatedApt : a));

  // Persist directly to D1
  cancelAppointmentSQL(id, cancelledBy, cancellationReason).catch(() => {});

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

  notifyDataChanged();
  return updatedApt;
}

export function deleteAppointmentFromStorage(id: string): boolean {
  runtimeAppointments = runtimeAppointments.filter((a) => a.id !== id);
  deleteAppointmentSQL(id).catch(() => {});
  notifyDataChanged();
  return true;
}

export function updateAppointmentStatusInStorage(
  id: string,
  status: AppointmentData['status']
): AppointmentData | null {
  const apt = runtimeAppointments.find((a) => a.id === id);
  if (!apt) return null;

  const updated: AppointmentData = { ...apt, status };
  runtimeAppointments = runtimeAppointments.map((a) => (a.id === id ? updated : a));
  updateAppointmentStatusSQL(id, status).catch(() => {});
  notifyDataChanged();
  return updated;
}

export function updateWashStageInStorage(
  appointmentId: string,
  stage: WashStage
): AppointmentData | null {
  return updateWashStage(appointmentId, stage);
}

export function purgeCompletedAppointments(): number {
  const toPurge = runtimeAppointments.filter((a) => a.status === 'completed' || a.status === 'cancelled');
  const count = toPurge.length;
  for (const a of toPurge) {
    deleteAppointmentSQL(a.id).catch(() => {});
  }
  runtimeAppointments = runtimeAppointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled');
  notifyDataChanged();
  return count;
}

// ----------------------------------------------------
// LOYALTY CARD REPOSITORY (D1-backed)
// ----------------------------------------------------

export function getLoyaltyProfiles(): LoyaltyCustomerProfile[] {
  return runtimeLoyalty;
}

export function getCustomerStampsCount(plate: string): number {
  const clean = plate.toUpperCase().trim();
  const profile = runtimeLoyalty.find((p) => p.plate.toUpperCase().trim() === clean);
  return profile?.stamps || 0;
}

export function addStampToCustomer(
  plate: string,
  appointmentData?: AppointmentData
): { stamps: number; giftUnlocked: boolean; voucherCode?: string } {
  const clean = plate.toUpperCase().trim();
  const existing = runtimeLoyalty.find((p) => p.plate.toUpperCase().trim() === clean);
  const currentStamps = (existing?.stamps || 0) + 1;
  const newStamps = currentStamps > 5 ? 5 : currentStamps;
  const giftUnlocked = newStamps >= 5;
  const voucherCode = giftUnlocked ? (existing?.voucherCode || `ESSE-VIP-${Math.floor(1000 + Math.random() * 9000)}`) : undefined;

  const fullName = appointmentData?.customer.fullName || existing?.fullName || 'Müşteri';
  const phone = appointmentData?.customer.phone || existing?.phone || '';

  const newProfile: LoyaltyCustomerProfile = {
    plate: clean,
    fullName,
    phone,
    stamps: newStamps,
    voucherCode,
    history: existing?.history || [],
    lastUpdated: new Date().toISOString(),
  };

  runtimeLoyalty = [newProfile, ...runtimeLoyalty.filter((p) => p.plate.toUpperCase().trim() !== clean)];

  saveLoyaltyStampSQL(clean, fullName, phone, newStamps).catch(() => {});
  notifyDataChanged();

  return { stamps: newStamps, giftUnlocked, voucherCode };
}

export function setCustomerStampsDirect(plate: string, count: number): void {
  const clean = plate.toUpperCase().trim();
  const existing = runtimeLoyalty.find((p) => p.plate.toUpperCase().trim() === clean);
  const stamps = Math.max(0, Math.min(5, count));
  const fullName = existing?.fullName || 'Müşteri';
  const phone = existing?.phone || '';

  const newProfile: LoyaltyCustomerProfile = {
    plate: clean,
    fullName,
    phone,
    stamps,
    history: existing?.history || [],
    lastUpdated: new Date().toISOString(),
  };

  runtimeLoyalty = [newProfile, ...runtimeLoyalty.filter((p) => p.plate.toUpperCase().trim() !== clean)];

  saveLoyaltyStampSQL(clean, fullName, phone, stamps).catch(() => {});
  notifyDataChanged();
}

export function redeemGiftStamp(plate: string): LoyaltyCustomerProfile | null {
  const clean = plate.toUpperCase().trim();
  const existing = runtimeLoyalty.find((p) => p.plate.toUpperCase().trim() === clean);
  if (!existing) return null;

  const updated: LoyaltyCustomerProfile = {
    ...existing,
    stamps: 0,
    voucherCode: undefined,
    voucherRedeemedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  runtimeLoyalty = [updated, ...runtimeLoyalty.filter((p) => p.plate.toUpperCase().trim() !== clean)];

  redeemVoucherSQL(clean).catch(() => {});
  notifyDataChanged();
  return updated;
}

export function getCustomerStampsMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of runtimeLoyalty) {
    map[p.plate.toUpperCase().trim()] = p.stamps;
  }
  return map;
}

export function updateCustomerStamps(key: string, stamps: number): void {
  setCustomerStampsDirect(key, stamps);
}

// ----------------------------------------------------
// SAVED CUSTOMER PROFILE (D1-backed)
// ----------------------------------------------------

export function getSavedCustomerProfile(): CustomerFormData | null {
  return runtimeCustomerProfile;
}

export function saveCustomerProfile(data: CustomerFormData): void {
  runtimeCustomerProfile = data;
  saveCustomerSQL(data).catch(() => {});
  notifyDataChanged();
}

export function getBusinessConfig(): BusinessConfig {
  return DEFAULT_BUSINESS_CONFIG;
}

// ----------------------------------------------------
// LIVE WASH STAGES TRACKER
// ----------------------------------------------------

export const WASH_STAGE_LABELS: Record<WashStage, { name: string; desc: string; percent: number; icon: string }> = {
  queue: { name: 'Sırada Bekliyor', desc: 'Araç peron sırasına alındı.', percent: 10, icon: '⏳' },
  foam_prewash: { name: 'Köpük & Ön Yıkama', desc: 'Kir yumuşatıcı pH nötr köpük ve ön basınçlı durulama.', percent: 30, icon: '🫧' },
  rim_underbody: { name: 'Jant & Davlumbaz', desc: 'Demir tozu arındırma ve davlumbaz temizliği.', percent: 50, icon: '🛞' },
  interior_vacuum: { name: 'İç Detay & Vakum', desc: 'Koltuk ve taban vakumlama, toz alma ve cam temizliği.', percent: 75, icon: '🧹' },
  wax_drying: { name: 'Hızlı Cila & Kurulama', desc: 'Boya koruyucu ıslak cila ve mikrofiber kurulama.', percent: 90, icon: '✨' },
  ready_for_pickup: { name: 'Teslime Hazır!', desc: 'İşlemler tamamlandı, araç park alanında anahtar bekliyor.', percent: 100, icon: '🎉' },
};

export function updateWashStage(appointmentId: string, stage: WashStage): AppointmentData | null {
  const apt = runtimeAppointments.find((a) => a.id === appointmentId);
  if (!apt) return null;

  const stageInfo = WASH_STAGE_LABELS[stage];
  const stageUpdatedAt = new Date().toISOString();

  const updated: AppointmentData = {
    ...apt,
    washStage: stage,
    stageUpdatedAt,
    status: stage === 'ready_for_pickup' ? 'confirmed' : 'in_progress',
  };

  runtimeAppointments = runtimeAppointments.map((a) => (a.id === appointmentId ? updated : a));

  updateWashStageSQL(appointmentId, stage).catch(() => {});

  logSystemEvent({
    type: 'in_progress',
    title: `${stageInfo.icon} ${stageInfo.name} (${apt.customer.plateNumber})`,
    message: `Sn. ${apt.customer.fullName}, ${apt.customer.plateNumber} aracınızın işlemi: ${stageInfo.desc}`,
    appointmentId: apt.id,
    plate: apt.customer.plateNumber,
    customerName: apt.customer.fullName,
  });

  notifyDataChanged();
  return updated;
}

// ----------------------------------------------------
// VEHICLE INSPECTION PHOTOS (D1-backed)
// ----------------------------------------------------

export function addInspectionPhoto(
  appointmentId: string,
  photo: Omit<VehicleInspectionPhoto, 'id' | 'takenAt'>
): VehicleInspectionPhoto | null {
  const apt = runtimeAppointments.find((a) => a.id === appointmentId);
  if (!apt) return null;

  const newPhoto: VehicleInspectionPhoto = {
    id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    takenAt: new Date().toISOString(),
    ...photo,
  };

  const updated: AppointmentData = {
    ...apt,
    photos: [...(apt.photos || []), newPhoto],
  };

  runtimeAppointments = runtimeAppointments.map((a) => (a.id === appointmentId ? updated : a));

  addInspectionPhotoSQL(appointmentId, photo).catch(() => {});
  notifyDataChanged();
  return newPhoto;
}

// ----------------------------------------------------
// VIP AUTO-LOOKUP BY PLATE
// ----------------------------------------------------

export function findCustomerHistoryByPlate(plateInput: string): { 
  customer: CustomerFormData | null; 
  lastAppointment: AppointmentData | null;
  loyaltyProfile: LoyaltyCustomerProfile | null;
} {
  const clean = plateInput.toUpperCase().replace(/\s+/g, '').trim();
  if (clean.length < 5) {
    return { customer: null, lastAppointment: null, loyaltyProfile: null };
  }

  const matchApt = runtimeAppointments.find(
    (a) => a.customer.plateNumber.toUpperCase().replace(/\s+/g, '') === clean
  );

  const matchProfile = runtimeLoyalty.find(
    (p) => p.plate.toUpperCase().replace(/\s+/g, '') === clean
  ) || null;

  const matchSaved = runtimeCustomerProfile && runtimeCustomerProfile.plateNumber.toUpperCase().replace(/\s+/g, '') === clean
    ? runtimeCustomerProfile
    : null;

  const customer = matchApt?.customer || matchSaved || (matchProfile ? {
    fullName: matchProfile.fullName,
    phone: matchProfile.phone,
    plateNumber: matchProfile.plate,
    carModel: '',
  } : null);

  return {
    customer,
    lastAppointment: matchApt || null,
    loyaltyProfile: matchProfile,
  };
}

// ----------------------------------------------------
// QR LOYALTY VOUCHER CODE
// ----------------------------------------------------

export function getOrCreateVoucherForPlate(plate: string): string {
  const clean = plate.toUpperCase().trim();
  const profile = runtimeLoyalty.find((p) => p.plate.toUpperCase().trim() === clean);

  if (profile?.voucherCode) {
    return profile.voucherCode;
  }

  const newCode = `ESSE-VIP-${Math.floor(1000 + Math.random() * 9000)}`;
  if (profile) {
    profile.voucherCode = newCode;
    saveLoyaltyStampSQL(clean, profile.fullName, profile.phone, profile.stamps).catch(() => {});
    notifyDataChanged();
  }
  return newCode;
}

export function redeemVoucherCode(codeOrPlate: string): { success: boolean; message: string; profile?: LoyaltyCustomerProfile } {
  const clean = codeOrPlate.toUpperCase().trim();
  const profile = runtimeLoyalty.find(
    (p) => p.voucherCode?.toUpperCase() === clean || p.plate.toUpperCase().trim() === clean
  );

  if (!profile) {
    return { success: false, message: 'Geçersiz veya bulunamayan kupon kodu / plaka.' };
  }

  if (profile.stamps < 5 && !profile.voucherCode) {
    return { success: false, message: 'Bu müşterinin henüz 5/5 damgası dolmamış.' };
  }

  const updated = redeemGiftStamp(profile.plate);
  return {
    success: true,
    message: `${profile.fullName} (${profile.plate}) için 5/5 Hediye Cilalı Yıkama hakkı başarıyla doğrulandı ve uygulandı!`,
    profile: updated || undefined,
  };
}
