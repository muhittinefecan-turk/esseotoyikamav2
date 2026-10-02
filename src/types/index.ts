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
  time: string; // HH:mm
  totalDurationMinutes: number;
  customer: CustomerFormData;
  status: 'pending' | 'sent_via_whatsapp';
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
