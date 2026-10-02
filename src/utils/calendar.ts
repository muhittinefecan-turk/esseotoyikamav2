import { AppointmentData, BusinessConfig } from '../types';

function parseStartAndEnd(dateStr: string, timeStr: string, durationMinutes: number) {
  // dateStr is YYYY-MM-DD, timeStr is HH:mm
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const startDate = new Date(year, month - 1, day, hour, minute);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const formatGCal = (d: Date) => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  return {
    startGCal: formatGCal(startDate),
    endGCal: formatGCal(endDate),
    startDate,
    endDate,
  };
}

export function getGoogleCalendarUrl(appointment: AppointmentData, business: BusinessConfig): string {
  const { startGCal, endGCal } = parseStartAndEnd(
    appointment.date,
    appointment.time,
    appointment.totalDurationMinutes
  );

  const title = encodeURIComponent(`${business.name} - Randevu (${appointment.customer.plateNumber})`);
  const serviceNames = appointment.selectedServices.map((s) => s.name).join(', ');
  const details = encodeURIComponent(
    `Esse Oto Yıkama & Detailing Randevusu\n` +
    `Araç: ${appointment.customer.carModel || ''} (${appointment.customer.plateNumber})\n` +
    `Hizmetler: ${serviceNames}\n` +
    `Not: ${appointment.customer.notes || 'Yok'}\n` +
    `Randevu Kodu: #${appointment.id}\n` +
    `İletişim: ${business.phone}`
  );
  const location = encodeURIComponent(`${business.address}, ${business.district} / ${business.city}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startGCal}/${endGCal}&details=${details}&location=${location}`;
}

export function downloadIcsFile(appointment: AppointmentData, business: BusinessConfig): void {
  const { startDate, endDate } = parseStartAndEnd(
    appointment.date,
    appointment.time,
    appointment.totalDurationMinutes
  );

  const formatIcs = (d: Date) => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };

  const serviceNames = appointment.selectedServices.map((s) => s.name).join(', ');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Esse Oto Yikama//Randevu Sistemi//TR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:appointment-${appointment.id}-${Date.now()}@esseotoyikama.com`,
    `DTSTAMP:${formatIcs(new Date())}`,
    `DTSTART:${formatIcs(startDate)}`,
    `DTEND:${formatIcs(endDate)}`,
    `SUMMARY:${business.name} - Randevu (${appointment.customer.plateNumber})`,
    `DESCRIPTION:Esse Oto Yıkama Randevusu\\nAraç: ${appointment.customer.plateNumber} ${appointment.customer.carModel || ''}\\nHizmet: ${serviceNames}\\nNot: ${appointment.customer.notes || 'Yok'}\\nRandevu No: #${appointment.id}`,
    `LOCATION:${business.address}, ${business.district} / ${business.city}`,
    'STATUS:CONFIRMED',
    // 24 Saat Öncesi Otomatik Alarm
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Esse Oto Yıkama randevunuza 24 saat kaldı!',
    'END:VALARM',
    // 1 Saat Öncesi Otomatik Alarm
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Esse Oto Yıkama randevunuza 1 saat kaldı! Lütfen hareket ediniz.',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `esse-randevu-${appointment.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
