export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount).replace('TRY', '₺');
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} dk`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} saat`;
  }
  return `${hours} sa ${remainingMinutes} dk`;
}

export function formatTurkishDate(dateStr: string): string {
  if (!dateStr) return '';
  // dateStr is YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}

export function formatPlate(rawPlate: string): string {
  if (!rawPlate) return '';
  return rawPlate
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-ZÇĞİÖŞÜ\s]/gi, '')
    .replace(/\s+/g, ' ');
}

export function generateAppointmentId(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `ESSE-${randomDigits}`;
}
