import { AppointmentData, LoyaltyCustomerProfile, SystemNotificationEvent } from '../types';

export const API_BASE = '/api';

// Fetch all appointments from automated database
export async function apiFetchAppointments(): Promise<AppointmentData[]> {
  try {
    const res = await fetch(`${API_BASE}/appointments`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API fetch appointments failed, fallback to local cache:', err);
  }
  return [];
}

// Create new appointment in automated database
export async function apiCreateAppointment(apt: AppointmentData, reschedulingOldId?: string): Promise<AppointmentData | null> {
  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...apt, reschedulingOldId }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API create appointment failed:', err);
  }
  return null;
}

// Update appointment in automated database
export async function apiUpdateAppointment(id: string, patch: Partial<AppointmentData>): Promise<AppointmentData | null> {
  try {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API update appointment failed:', err);
  }
  return null;
}

// Delete appointment from automated database
export async function apiDeleteAppointment(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('API delete appointment failed:', err);
    return false;
  }
}

// Cancel appointment in automated database
export async function apiCancelAppointment(id: string, cancelledBy: 'customer' | 'admin', reason?: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/appointments/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelledBy, reason }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API cancel appointment failed:', err);
    return false;
  }
}

// Fetch loyalty profiles from automated database
export async function apiFetchLoyaltyProfiles(): Promise<LoyaltyCustomerProfile[]> {
  try {
    const res = await fetch(`${API_BASE}/loyalty`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API fetch loyalty profiles failed:', err);
  }
  return [];
}

// Save or award stamp in automated database
export async function apiSaveLoyaltyStamp(plate: string, fullName: string, phone: string, stamps: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/loyalty/stamp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plate, fullName, phone, stamps }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API save loyalty stamp failed:', err);
    return false;
  }
}

// Redeem voucher in automated database
export async function apiRedeemVoucher(codeOrPlate: string): Promise<{ success: boolean; message: string; profile?: LoyaltyCustomerProfile }> {
  try {
    const res = await fetch(`${API_BASE}/loyalty/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeOrPlate }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: 'Sunucuya bağlanılamadı: ' + err.message };
  }
}

// Fetch system notifications from automated database
export async function apiFetchNotifications(): Promise<SystemNotificationEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/notifications`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API fetch notifications failed:', err);
  }
  return [];
}
