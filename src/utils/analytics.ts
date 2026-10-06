import { AppointmentData, LoyaltyCustomerProfile } from '../types';

export interface LiveAnalyticsSummary {
  todayStr: string;
  completedTodayCount: number;
  activeTodayCount: number;
  cancelledTodayCount: number;
  estimatedDailyRevenue: number;
  completedRevenue: number;
  averageWashMinutes: number;
  loyaltyGiftEligibleCount: number;
  popularServices: Array<{
    name: string;
    count: number;
    share: string;
    sharePercent: number;
  }>;
  peronOccupancy: Array<{
    peronNumber: number;
    peron: string;
    typeLabel: string;
    rate: string;
    ratePercent: number;
    count: string;
    bookedCount: number;
    color: string;
    barColor: string;
  }>;
}

const SERVICE_PRICE_MAP: Record<string, number> = {
  wash_standard: 450,
  wash_vip: 750,
  wash_express: 300,
  detail_full: 2800,
  detail_seats: 1200,
  detail_ozone: 400,
  detail_floor_ceiling: 800,
  coating_polish: 3500,
  coating_ceramic: 8500,
  extra_engine: 450,
  extra_headlight: 600,
  extra_glass_water_repel: 350,
};

export function calculateLiveAnalytics(
  allAppointments: AppointmentData[],
  loyaltyProfiles: LoyaltyCustomerProfile[],
  targetDate?: string
): LiveAnalyticsSummary {
  const todayStr = targetDate || new Date().toISOString().split('T')[0];

  // 1. Filter today's appointments
  const todayApts = allAppointments.filter((a) => a.date === todayStr);
  const completedToday = todayApts.filter((a) => a.status === 'completed');
  const activeToday = todayApts.filter((a) => a.status !== 'cancelled');
  const cancelledToday = todayApts.filter((a) => a.status === 'cancelled');

  // 2. Revenue calculation (live based on actual selected services)
  let estimatedDailyRevenue = 0;
  let completedRevenue = 0;

  for (const apt of activeToday) {
    let aptPrice = 0;
    if (apt.selectedServices && apt.selectedServices.length > 0) {
      for (const s of apt.selectedServices) {
        aptPrice += SERVICE_PRICE_MAP[s.id] || 450;
      }
    } else {
      aptPrice = 450;
    }
    estimatedDailyRevenue += aptPrice;
    if (apt.status === 'completed') {
      completedRevenue += aptPrice;
    }
  }

  // 3. Average wash duration (live based on today's booked services)
  let totalMinutes = 0;
  let durationCount = 0;
  for (const apt of activeToday) {
    totalMinutes += apt.totalDurationMinutes || 45;
    durationCount++;
  }
  const averageWashMinutes = durationCount > 0 ? Math.round(totalMinutes / durationCount) : 0;

  // 4. Loyalty gift eligible count (5/5 stamps)
  const loyaltyGiftEligibleCount = loyaltyProfiles.filter(
    (p) => p.stamps >= 5 || p.voucherRedeemedAt
  ).length;

  // 5. En Çok Tercih Edilen Hizmetler (Live dynamic tally from all valid appointments)
  const serviceCountMap = new Map<string, number>();
  let totalServiceCount = 0;

  const validApts = allAppointments.filter((a) => a.status !== 'cancelled');

  for (const apt of validApts) {
    if (apt.selectedServices && apt.selectedServices.length > 0) {
      for (const s of apt.selectedServices) {
        const name = s.name.trim();
        serviceCountMap.set(name, (serviceCountMap.get(name) || 0) + 1);
        totalServiceCount++;
      }
    }
  }

  // If no services booked yet, return empty list (zero mock data)
  const popularServices: Array<{ name: string; count: number; share: string; sharePercent: number }> = [];

  if (totalServiceCount > 0) {
    const sortedServices = Array.from(serviceCountMap.entries()).sort((a, b) => b[1] - a[1]);
    for (const [name, count] of sortedServices.slice(0, 4)) {
      const sharePercent = Math.round((count / totalServiceCount) * 100);
      popularServices.push({
        name,
        count,
        share: `${sharePercent}%`,
        sharePercent,
      });
    }
  }

  // 6. 4 Peron Günlük Doluluk Oranı (Live calculation based on peron assignments)
  // Max peron capacity per day: 8 time windows (08:30 to 17:30)
  const MAX_SLOTS_PER_PERON = 8;
  const peronMeta = [
    { number: 1, label: '1. Peron (Hızlı Yıkama)', type: 'Hızlı Yıkama', color: 'text-amber-400', bar: 'bg-amber-500' },
    { number: 2, label: '2. Peron (Standart Bakım)', type: 'Standart Bakım', color: 'text-cyan-400', bar: 'bg-cyan-500' },
    { number: 3, label: '3. Peron (Detay & Cila)', type: 'Detay & Cila', color: 'text-emerald-400', bar: 'bg-emerald-500' },
    { number: 4, label: '4. Peron (VIP & Kuaför)', type: 'VIP & Kuaför', color: 'text-purple-400', bar: 'bg-purple-500' },
  ];

  const peronOccupancy = peronMeta.map((pm) => {
    const booked = activeToday.filter((a) => a.time.includes(`${pm.number}. Peron`)).length;
    const ratePercent = Math.min(100, Math.round((booked / MAX_SLOTS_PER_PERON) * 100));

    return {
      peronNumber: pm.number,
      peron: pm.label,
      typeLabel: pm.type,
      rate: `%${ratePercent}`,
      ratePercent,
      count: `${booked} Araç`,
      bookedCount: booked,
      color: pm.color,
      barColor: pm.bar,
    };
  });

  return {
    todayStr,
    completedTodayCount: completedToday.length,
    activeTodayCount: activeToday.length,
    cancelledTodayCount: cancelledToday.length,
    estimatedDailyRevenue,
    completedRevenue,
    averageWashMinutes,
    loyaltyGiftEligibleCount,
    popularServices,
    peronOccupancy,
  };
}
