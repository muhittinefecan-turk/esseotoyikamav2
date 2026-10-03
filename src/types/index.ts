export type VehicleCategory = 'sedan' | 'suv' | 'commercial';

export interface VehicleTypeOption {
  id: VehicleCategory;
  name: string;
  description: string;
  timeExtraMinutes: number;
  icon: string;
}

export type ServiceCategory = 'wash' | 'detail' | 'coating' | 'extra';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  durationMinutes: number;
  popular?: boolean;
  features: string[];
  badge?: string;
}

export interface CustomerFormData {
  fullName: string;
  phone: string;
  email?: string;
  plateNumber: string;
  carModel: string;
  notes?: string;
}

export interface AppointmentData {
  id: string;
  createdAt: string;
  vehicleType: VehicleCategory;
  selectedServices: ServiceItem[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm or "HH:mm - HH:mm (X. Peron)"
  totalDurationMinutes: number;
  customer: CustomerFormData;
  status: 'pending' | 'sent_via_whatsapp' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  adminNotes?: string;
  cancelledBy?: 'customer' | 'admin';
  cancelledAt?: string;
  cancellationReason?: string;
  stampedAt?: string;
}

export interface LoyaltyCustomerProfile {
  plate: string;
  fullName: string;
  phone: string;
  stamps: number; // 0 to 5
  history: StampHistoryItem[];
  lastUpdated: string;
}

export interface StampHistoryItem {
  id: string;
  appointmentId: string;
  date: string;
  awardedAt: string;
  serviceNames: string[];
  note?: string;
}

export interface SystemNotificationEvent {
  id: string;
  timestamp: string;
  type: 'created' | 'approved' | 'in_progress' | 'completed' | 'cancelled_by_admin' | 'cancelled_by_customer' | 'stamp_awarded';
  title: string;
  message: string;
  appointmentId?: string;
  plate?: string;
  customerName?: string;
}

export interface BusinessConfig {
  name: string;
  tagline: string;
  phone: string; // 0552 943 91 68
  whatsappNumber: string; // 905529439168
  address: string;
  city: string;
  district: string;
  googleMapsUrl: string;
  rating: number;
  reviewCount: number;
  weekdayHours: string;
  sundayHours: string;
}
