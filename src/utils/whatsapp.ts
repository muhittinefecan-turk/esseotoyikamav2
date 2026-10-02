import { AppointmentData, BusinessConfig } from '../types';
import { formatDuration, formatTurkishDate } from './formatters';

/**
 * WhatsApp mesajlarındaki karakter kodlama sorununu gidermek ve  (Unicode replacement)
 * karakterlerini engellemek için UTF-8 normalize edilmiş ve güvenli WhatsApp formatlayıcı.
 */
export function cleanWhatsAppText(text: string): string {
  if (!text) return '';

  // 1. Unicode NFC normalizasyonu: birleşik karakterleri ve Türkçe harfleri standart UTF-8 formuna getirir
  let normalized = text.normalize('NFC');

  // 2. WhatsApp URL ayrıştırıcılarında bozulup  yaratan kutu çizim karakterlerini standart tirelere dönüştür
  normalized = normalized.replace(/[━─═—–]/g, '-');

  // 3. Android ve WhatsApp Web'de bozulma yapan görünmez varyasyon seçicileri (\uFE00-\uFE0F),
  // sıfır genişlikli karakterleri (\u200B-\u200D), kontrol baytlarını ve BOM (\uFEFF) temizle:
  normalized = normalized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFE00-\uFE0F\u200B-\u200F\uFEFF\uFFF0-\uFFFF]/g, '');

  return normalized.trim();
}

/**
 * Metni UTF-8 uyumlu güvenli WhatsApp URI formatına çevirir
 */
export function encodeWhatsAppUri(text: string): string {
  const cleaned = cleanWhatsAppText(text);
  return encodeURIComponent(cleaned);
}

export function buildWhatsAppMessage(appointment: AppointmentData, business: BusinessConfig): string {
  const vehicleTypeName =
    appointment.vehicleType === 'sedan'
      ? 'Binek (Sedan / Hatchback)'
      : appointment.vehicleType === 'suv'
      ? 'SUV / Crossover'
      : 'Ticari / Minibüs';

  const servicesText = appointment.selectedServices
    .map((s) => `  * ${s.name} (~${formatDuration(s.durationMinutes)})`)
    .join('\n');

  const formattedDate = formatTurkishDate(appointment.date);
  const customerNotes = appointment.customer.notes?.trim()
    ? `*MUSTERI OZEL ISTEKLERI / NOTU:*\n"${appointment.customer.notes.trim()}"`
    : `*Musteri Notu:* Ozel bir not iletilmedi.`;

  const rawMessage = `*YENI RANDEVU TALEBI - ${business.name.toUpperCase()}*
*Randevu Kodu:* #${appointment.id}
----------------------------------------
*MUSTERI BILGILERI*
* Ad Soyad: ${appointment.customer.fullName}
* Telefon: ${appointment.customer.phone}
${appointment.customer.email ? `* E-Posta: ${appointment.customer.email}\n` : ''}*ARAC BILGILERI*
* Plaka: ${appointment.customer.plateNumber}
* Model: ${appointment.customer.carModel || 'Belirtilmedi'}
* Segment: ${vehicleTypeName}

*SECILEN HIZMETLER & SURELER*
${servicesText}

*Toplam Tahmini Sure:* ~${formatDuration(appointment.totalDurationMinutes)}
*Fiyat Durumu:* Arac basinda, boya ve kir durumuna gore belirlenecektir.

*RANDEVU TARIHI:* ${formattedDate}
*RANDEVU SAATI & PERON:* ${appointment.time}

${customerNotes}
----------------------------------------
*Adres:* ${business.address}, ${business.district} / ${business.city}
*Iletisim:* ${business.phone}`;

  return cleanWhatsAppText(rawMessage);
}

export function getWhatsAppUrl(appointment: AppointmentData, business: BusinessConfig): string {
  const cleanPhone = business.whatsappNumber.replace(/[^0-9]/g, '');
  const message = buildWhatsAppMessage(appointment, business);
  return `https://wa.me/${cleanPhone}?text=${encodeWhatsAppUri(message)}`;
}

export function buildCancellationWhatsAppMessage(appointment: AppointmentData, business: BusinessConfig): string {
  const formattedDate = formatTurkishDate(appointment.date);
  const serviceNames = appointment.selectedServices.map((s) => s.name).join(', ');

  const rawMessage = `*RANDEVU IPTAL BILDIRIMI*
*${business.name}*
----------------------------------------
Sayin yetkili, asagidaki randevumu iptal etmek istiyorum:

* Randevu Kodu: #${appointment.id}
* Musteri: ${appointment.customer.fullName}
* Telefon: ${appointment.customer.phone}
* Arac Plakasi: ${appointment.customer.plateNumber}
* Randevu Tarihi: ${formattedDate}
* Randevu Saati: ${appointment.time}
* Hizmetler: ${serviceNames}

*Not:* Musaitlik durumunda daha sonra tekrar randevu olusturacagim. Iyi calismalar dilerim.`;

  return cleanWhatsAppText(rawMessage);
}

export function getCancellationWhatsAppUrl(appointment: AppointmentData, business: BusinessConfig): string {
  const cleanPhone = business.whatsappNumber.replace(/[^0-9]/g, '');
  const message = buildCancellationWhatsAppMessage(appointment, business);
  return `https://wa.me/${cleanPhone}?text=${encodeWhatsAppUri(message)}`;
}
