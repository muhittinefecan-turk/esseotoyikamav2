import { BusinessConfig, VehicleTypeOption } from '../types';

export const MAX_SLOT_CAPACITY = 4; // Aynı saate 4 araca kadar istasyon kapasitesi

export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  name: 'Esse Oto Yıkama',
  tagline: 'Pasta Cila, Boya Koruma, Seramik Kaplama ve Detaylı Temizlik Merkezi',
  phone: '0552 943 91 68',
  whatsappNumber: '905529439168',
  address: 'Ata, Çevre Bulvarı, 09010 Efeler',
  city: 'Aydın',
  district: 'Efeler',
  googleMapsUrl: 'https://maps.google.com/?q=Ata,+Çevre+Bulvarı,+09010+Efeler/Aydın',
  rating: 4.9,
  reviewCount: 348,
  weekdayHours: '08:30 - 19:30 (Pazartesi - Cumartesi)',
  sundayHours: 'Pazar Günleri Kapalıdır',
};

export const BUSINESS_EXTRA_DETAILS = {
  category: 'Araba Yıkama & Detailing',
  foundedDate: '1 Mayıs 2017',
  instagramUrl: 'https://www.instagram.com/okan_ozcal',
  tiktokUrl: 'http://tiktok.com/@okan.zcal',
  smsUrl: 'sms:+905529439168',
  paymentMethods: 'Nakit, Havale / FAST ve Yerinde Ödeme',
  amenities: [
    'Temiz kurulama havluları',
    'Müşteri tuvaleti',
    'Yüksek çekişli araç elektrikli süpürgesi',
    'Sıcak buharlı koltuk ekstraksiyon makinesi',
    'Camdan araç izlemeli bekleme alanı',
    'Ücretsiz çay ve kahve',
  ],
};

export const VEHICLE_TYPES: VehicleTypeOption[] = [
  {
    id: 'sedan',
    name: 'Binek Araç',
    description: 'Sedan, Hatchback, Coupe, Station Wagon',
    timeExtraMinutes: 0,
    icon: 'car',
  },
  {
    id: 'suv',
    name: 'SUV / Crossover',
    description: 'SUV, Crossover, Geniş Aile Araçları',
    timeExtraMinutes: 15,
    icon: 'car-front',
  },
  {
    id: 'commercial',
    name: 'Ticari / Minibüs',
    description: 'Hafif Ticari, Van, Minibüs, Pickup',
    timeExtraMinutes: 30,
    icon: 'truck',
  },
];
