import { AppointmentData, BusinessConfig } from '../types';
import { DEFAULT_BUSINESS_CONFIG } from '../data/businessConfig';

const APPOINTMENTS_KEY = 'esse_local_appointments_v2';

export function getStoredAppointments(): AppointmentData[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load appointments from localStorage', e);
    return [];
  }
}

export function saveAppointmentToStorage(appointment: AppointmentData): void {
  try {
    const current = getStoredAppointments();
    const updated = [appointment, ...current.filter((a) => a.id !== appointment.id)];
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated.slice(0, 30)));
  } catch (e) {
    console.error('Failed to save appointment to localStorage', e);
  }
}

export function deleteStoredAppointment(id: string): void {
  try {
    const current = getStoredAppointments();
    const updated = current.filter((a) => a.id !== id);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete appointment from localStorage', e);
  }
}

export function getBusinessConfig(): BusinessConfig {
  return DEFAULT_BUSINESS_CONFIG;
}
