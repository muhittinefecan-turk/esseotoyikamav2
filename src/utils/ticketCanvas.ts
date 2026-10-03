import { AppointmentData, BusinessConfig } from '../types';
import { formatDuration, formatTurkishDate } from './formatters';

export function downloadAppointmentTicketImage(
  appointment: AppointmentData,
  business: BusinessConfig
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Dark Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGrad.addColorStop(0, '#09090b');
  bgGrad.addColorStop(0.5, '#18181b');
  bgGrad.addColorStop(1, '#09090b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 630);

  // 2. Gold Ambient Glow
  const glow = ctx.createRadialGradient(1000, 150, 20, 1000, 150, 400);
  glow.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
  glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1200, 630);

  // 3. Gold Border with rounded look
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 1140, 570);

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, 1120, 550);

  // 4. Header: ESSE OTO YIKAMA
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ESSE OTO YIKAMA & DETAYLI KUAFÖR', 70, 95);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Aydın Efeler Çevre Bulvarı • 2017’den Beri Profesyonel Bakım', 70, 130);

  // VIP TICKET BADGE
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(940, 65, 190, 48);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('VIP RANDEVU', 965, 97);

  // Separator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 165);
  ctx.lineTo(1130, 165);
  ctx.stroke();

  // 5. Left Column: Details
  const startY = 220;
  const lineHeight = 65;

  // Randevu Kodu
  ctx.fillStyle = '#71717a';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('RANDEVU KODU', 70, startY);
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 28px "JetBrains Mono", monospace';
  ctx.fillText(appointment.id, 70, startY + 32);

  // Tarih & Saat
  ctx.fillStyle = '#71717a';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TARİH & SAAT', 400, startY);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${formatTurkishDate(appointment.date)} - ${appointment.time}`, 400, startY + 32);

  // Peron
  const bay = appointment.selectedServices.some((s) => s.category === 'coating' || s.category === 'detail')
    ? 'PERON 1 (Detaylı Bakım)'
    : 'PERON 2 (Hızlı & Periyodik Yıkama)';
  ctx.fillStyle = '#71717a';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ATANAN PERON', 850, startY);
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(bay, 850, startY + 32);

  // Row 2: Customer & Vehicle
  const row2Y = startY + lineHeight + 35;

  ctx.fillStyle = '#71717a';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('MÜŞTERİ ADI', 70, row2Y);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(appointment.customer.fullName || 'Misafir Müşteri', 70, row2Y + 32);

  ctx.fillStyle = '#71717a';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ARAÇ PLAKASI & MODEL', 400, row2Y);
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  const carText = `${appointment.customer.plateNumber || 'PLAKA BELİRTİLMEDİ'} ${
    appointment.customer.carModel ? `(${appointment.customer.carModel})` : ''
  }`;
  ctx.fillText(carText, 400, row2Y + 32);

  ctx.fillStyle = '#71717a';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TAHMİNİ İŞLEM SÜRESİ', 850, row2Y);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`~${formatDuration(appointment.totalDurationMinutes)}`, 850, row2Y + 32);

  // Row 3: Services List
  const row3Y = row2Y + lineHeight + 35;
  ctx.fillStyle = '#71717a';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SEÇİLEN HİZMETLER', 70, row3Y);

  ctx.fillStyle = '#e4e4e7';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  const serviceNames = appointment.selectedServices.map((s) => s.name).join('  •  ');
  ctx.fillText(serviceNames.length > 85 ? serviceNames.slice(0, 85) + '...' : serviceNames, 70, row3Y + 30);

  // Bottom Notice
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(70, 520);
  ctx.lineTo(1130, 520);
  ctx.stroke();

  ctx.fillStyle = '#71717a';
  ctx.font = '15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('İşletme İletişim: 0552 943 91 68  •  Adres: Ata Mh. Çevre Blv. Efeler/Aydın (Pazar Günleri Kapalıdır)', 70, 560);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText('ESSE-VERIFIED-TICKET', 950, 560);

  // Trigger Download
  const link = document.createElement('a');
  link.download = `esse-randevu-${appointment.id}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
