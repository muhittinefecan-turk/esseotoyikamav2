import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Car,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Phone,
  MessageSquare,
  Lock,
  LogOut,
  ArrowLeft,
  Award,
  RefreshCw,
  Shield,
  Layers,
  Check,
  X,
  ChevronRight,
  Bell,
  Sparkles,
  Send,
  Copy,
  CalendarDays,
  Percent,
  CheckCircle,
} from 'lucide-react';
import { AppointmentData, BusinessConfig, VehicleCategory } from '../types';
import { SERVICES_LIST } from '../data/servicesData';
import { formatTurkishDate } from '../utils/formatters';
import {
  getStoredAppointments,
  saveAppointmentToStorage,
  updateAppointmentStatus,
  deleteStoredAppointment,
  seedSampleAppointmentsIfEmpty,
  getCustomerStampsMap,
  updateCustomerStamps,
  purgeCompletedAppointments,
} from '../utils/storage';

interface AdminDashboardProps {
  business: BusinessConfig;
  isDarkMode: boolean;
  onExitAdmin: () => void;
}

// 8-character alphanumeric secure admin password from environment variable
// Kept strictly internal and hidden from any UI labels or console logs
const SECURE_ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string) || 'Esse2017';

const HOUR_WINDOWS_LIST = [
  '08:30 - 09:30',
  '09:30 - 10:30',
  '10:30 - 11:30',
  '11:30 - 12:30',
  '12:30 - 13:30',
  '13:30 - 14:30',
  '14:30 - 15:30',
  '15:30 - 16:30',
  '16:30 - 17:30',
  '17:30 - 18:30',
  '18:30 - 19:30',
];

const PERONS_LIST = [
  { id: '1. Peron', name: '1. Peron (Hızlı & Köpüklü Yıkama)' },
  { id: '2. Peron', name: '2. Peron (Detaylı Dış Yıkama)' },
  { id: '3. Peron', name: '3. Peron (İç Kuaför & Koltuk)' },
  { id: '4. Peron', name: '4. Peron (Boya Koruma & Kurutma)' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  business,
  onExitAdmin,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('esse_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'appointments' | 'capacity' | 'loyalty'>('appointments');

  // Appointments State
  const [appointments, setAppointments] = useState<AppointmentData[]>(() => {
    purgeCompletedAppointments();
    return seedSampleAppointmentsIfEmpty();
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'all'>('today');

  // Dates
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Capacity Tab State (Date and Peron filtering)
  const [capacitySelectedDate, setCapacitySelectedDate] = useState<string>(todayStr);
  const [capacitySelectedPeron, setCapacitySelectedPeron] = useState<string>('all');

  // Modals & Notifications
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notificationModalApt, setNotificationModalApt] = useState<AppointmentData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedNotificationKey, setCopiedNotificationKey] = useState<string | null>(null);

  // Customer Stamps State
  const [stampsMap, setStampsMap] = useState<Record<string, number>>(() => getCustomerStampsMap());

  // Form State for Manual Appointment
  const [newApt, setNewApt] = useState({
    fullName: '',
    phone: '',
    plateNumber: '',
    carModel: '',
    vehicleType: 'sedan' as VehicleCategory,
    date: todayStr,
    hour: '',
    peron: '1. Peron',
    services: [SERVICES_LIST[0].id],
    notes: '',
  });

  // Clean completed appointments on mount
  useEffect(() => {
    purgeCompletedAppointments();
    setAppointments(getStoredAppointments());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const refreshData = () => {
    purgeCompletedAppointments();
    setAppointments(getStoredAppointments());
    setStampsMap(getCustomerStampsMap());
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput.trim() === SECURE_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('esse_admin_auth', 'true');
      setPasswordError('');
    } else {
      setPasswordError('Hatalı yönetici şifresi girdiniz!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('esse_admin_auth');
    setPasswordInput('');
  };

  // Status Change Handler
  const handleStatusChange = (id: string, newStatus: AppointmentData['status']) => {
    updateAppointmentStatus(id, newStatus);
    refreshData();
    showToast(`Randevu durumu güncellendi: ${newStatus}`);
  };

  // One-Click Cancel Handler (Immediate execution)
  const handleCancelAppointment = (apt: AppointmentData) => {
    updateAppointmentStatus(apt.id, 'cancelled', 'Yönetici tarafından iptal edildi.');
    setAppointments((prev) => prev.map((a) => (a.id === apt.id ? { ...a, status: 'cancelled' } : a)));
    showToast(`Randevu iptal edildi: ${apt.customer.fullName} (${apt.customer.plateNumber})`);
  };

  // AUTOMATIC COMPLETE & AWARD STAMP & PURGE (Requested by user)
  const handleCompleteAndAwardStamp = (apt: AppointmentData) => {
    const plate = apt.customer.plateNumber.toUpperCase().trim();
    const currentStamps = stampsMap[plate] || 0;
    const nextStamps = Math.min(5, currentStamps + 1);

    // 1. Update loyalty stamps
    updateCustomerStamps(plate, nextStamps);
    setStampsMap(getCustomerStampsMap());

    // 2. Automatically delete completed appointment from active list
    deleteStoredAppointment(apt.id);
    setAppointments((prev) => prev.filter((a) => a.id !== apt.id));

    // 3. Inform Admin
    const isGiftUnlocked = nextStamps === 5;
    const celebrationMsg = isGiftUnlocked
      ? `🎉 TEBRİKLER! ${plate} 5/5 damgayı tamamladı! Bir sonraki yıkaması ÜCRETSİZ HEDİYE!`
      : `✅ ${apt.customer.fullName} (${plate}) tamamlandı, sistemden silindi ve otomatik +1 damga verildi! (Toplam: ${nextStamps}/5)`;

    showToast(celebrationMsg);
  };

  // Immediate Delete Handler (No window.confirm to avoid iframe blocking)
  const handleDeleteAppointment = (id: string) => {
    deleteStoredAppointment(id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    showToast('Randevu kaydı başarıyla silindi.');
  };

  // Capacity Checker for Selected Date & Selected Peron
  const capacityData = useMemo(() => {
    const selectedDateApts = appointments.filter(
      (a) => a.date === capacitySelectedDate && a.status !== 'cancelled'
    );

    const relevantPerons = capacitySelectedPeron === 'all'
      ? PERONS_LIST
      : PERONS_LIST.filter((p) => p.id === capacitySelectedPeron);

    const totalSlots = HOUR_WINDOWS_LIST.length * relevantPerons.length;
    
    const bookedApts = selectedDateApts.filter((a) => {
      if (capacitySelectedPeron === 'all') return true;
      return a.time.includes(capacitySelectedPeron);
    });

    const bookedSlotsCount = bookedApts.length;
    const occupancyPercentage = totalSlots > 0 ? Math.round((bookedSlotsCount / totalSlots) * 100) : 0;

    const matrix = HOUR_WINDOWS_LIST.map((hw) => {
      const peronsStatus = relevantPerons.map((p) => {
        const found = selectedDateApts.find((a) => {
          return (
            (a.time.includes(hw) && a.time.includes(p.id)) ||
            (a.time.startsWith(hw.split(' - ')[0]) && a.time.includes(p.id))
          );
        });

        return {
          peronId: p.id,
          peronName: p.name,
          isBooked: !!found,
          appointment: found || null,
        };
      });

      return {
        hourWindow: hw,
        peronsStatus,
      };
    });

    return {
      totalSlots,
      bookedSlotsCount,
      freeSlotsCount: Math.max(0, totalSlots - bookedSlotsCount),
      occupancyPercentage,
      matrix,
      relevantPerons,
    };
  }, [appointments, capacitySelectedDate, capacitySelectedPeron]);

  // STRICT FILTERING: ONLY SHOW OPEN & FUTURE UNBOOKED HOURS IN MODAL (Requested by user)
  const availableHoursInModal = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isToday = newApt.date === todayStr;

    return HOUR_WINDOWS_LIST.filter((hw) => {
      // 1. Filter out past hours for today
      if (isToday) {
        const [startH, startM] = hw.split(' - ')[0].split(':').map(Number);
        if (startH < currentHour || (startH === currentHour && startM <= currentMinute + 15)) {
          return false; // Filter out past hours!
        }
      }

      // 2. Filter out already booked hours on selected date & selected peron
      const isBooked = appointments.some((a) => {
        if (a.date !== newApt.date || a.status === 'cancelled') return false;
        return (
          (a.time.includes(hw) && a.time.includes(newApt.peron)) ||
          (a.time.startsWith(hw.split(' - ')[0]) && a.time.includes(newApt.peron))
        );
      });

      return !isBooked; // ONLY return available slots!
    });
  }, [appointments, newApt.date, newApt.peron, todayStr]);

  // Auto-select first available hour when list updates
  useEffect(() => {
    if (availableHoursInModal.length > 0) {
      if (!availableHoursInModal.includes(newApt.hour)) {
        setNewApt((prev) => ({ ...prev, hour: availableHoursInModal[0] }));
      }
    } else {
      setNewApt((prev) => ({ ...prev, hour: '' }));
    }
  }, [availableHoursInModal, newApt.hour]);

  // Create Manual Appointment
  const handleCreateManualAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApt.fullName || !newApt.phone || !newApt.plateNumber) {
      alert('Lütfen müşteri adı, telefon ve plaka bilgilerini doldurunuz.');
      return;
    }

    if (!newApt.hour) {
      alert('Lütfen müsait bir saat dilimi seçiniz. Seçilen peron ve tarihte müsait saat bulunmamaktadır.');
      return;
    }

    // Double check conflict prevention
    const hasConflict = appointments.some((a) => {
      if (a.date !== newApt.date || a.status === 'cancelled') return false;
      return (
        (a.time.includes(newApt.hour) && a.time.includes(newApt.peron)) ||
        (a.time.startsWith(newApt.hour.split(' - ')[0]) && a.time.includes(newApt.peron))
      );
    });

    if (hasConflict) {
      alert('Çakışma tespit edildi! Bu saat ve peron zaten rezerve edilmiştir. Lütfen başka bir saat seçiniz.');
      return;
    }

    const selectedServiceItems = SERVICES_LIST.filter((s) => newApt.services.includes(s.id));
    const totalDuration = selectedServiceItems.reduce((acc, s) => acc + s.durationMinutes, 0);

    const apt: AppointmentData = {
      id: `apt-manual-${Date.now()}`,
      createdAt: new Date().toISOString(),
      vehicleType: newApt.vehicleType,
      selectedServices: selectedServiceItems.length > 0 ? selectedServiceItems : [SERVICES_LIST[0]],
      date: newApt.date,
      time: `${newApt.hour} (${newApt.peron})`,
      totalDurationMinutes: totalDuration || 60,
      customer: {
        fullName: newApt.fullName,
        phone: newApt.phone,
        plateNumber: newApt.plateNumber.toUpperCase().trim(),
        carModel: newApt.carModel,
        notes: newApt.notes,
      },
      status: 'confirmed',
      adminNotes: 'Yönetici paneli üzerinden manuel oluşturuldu.',
    };

    saveAppointmentToStorage(apt);
    refreshData();
    setIsAddModalOpen(false);
    showToast(`✅ Yeni randevu başarıyla eklendi: ${newApt.plateNumber} (${newApt.hour})`);

    setNewApt({
      fullName: '',
      phone: '',
      plateNumber: '',
      carModel: '',
      vehicleType: 'sedan',
      date: todayStr,
      hour: '',
      peron: '1. Peron',
      services: [SERVICES_LIST[0].id],
      notes: '',
    });
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Date filter
      if (dateFilter === 'today' && apt.date !== todayStr) return false;
      if (dateFilter === 'tomorrow' && apt.date !== tomorrowStr) return false;

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending_or_wp') {
          if (apt.status !== 'pending' && apt.status !== 'sent_via_whatsapp') return false;
        } else if (apt.status !== statusFilter) {
          return false;
        }
      }

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = apt.customer.fullName.toLowerCase().includes(q);
        const matchesPlate = apt.customer.plateNumber.toLowerCase().includes(q);
        const matchesPhone = apt.customer.phone.toLowerCase().includes(q);
        const matchesCar = apt.customer.carModel.toLowerCase().includes(q);
        if (!matchesName && !matchesPlate && !matchesPhone && !matchesCar) return false;
      }

      return true;
    });
  }, [appointments, dateFilter, statusFilter, searchTerm, todayStr, tomorrowStr]);

  // Metrics
  const metrics = useMemo(() => {
    const todayApts = appointments.filter((a) => a.date === todayStr);
    const confirmedCount = todayApts.filter((a) => a.status === 'confirmed').length;
    const inProgressCount = todayApts.filter((a) => a.status === 'in_progress').length;
    const completedCount = todayApts.filter((a) => a.status === 'completed').length;
    const pendingCount = todayApts.filter((a) => a.status === 'pending' || a.status === 'sent_via_whatsapp').length;
    return {
      todayTotal: todayApts.length,
      confirmed: confirmedCount,
      inProgress: inProgressCount,
      completed: completedCount,
      pending: pendingCount,
    };
  }, [appointments, todayStr]);

  // Generate Customer Notification Messages
  const getCustomerNotifications = (apt: AppointmentData) => {
    const plate = apt.customer.plateNumber.toUpperCase().trim();
    const stamps = stampsMap[plate] || 0;
    const services = apt.selectedServices.map((s) => s.name).join(', ');

    return [
      {
        id: '1_hour',
        title: '🔔 1 Saat Sonra Randevunuz Var',
        shortDesc: 'Randevu saati yaklaştığında müşteriye anlık internet bildirimi',
        badge: 'Acil / 1 Saat Kaldı',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        message: `Sayın ${apt.customer.fullName},\n\nEsse Oto Yıkama & Detailing (Aydın Efeler) randevunuza 1 SAAT KALDI! ⏰\n\n📅 Tarih: ${formatTurkishDate(apt.date)}\n🚗 Araç / Plaka: ${apt.customer.carModel || ''} (${plate})\n⚡ Saat & Peron: ${apt.time}\n✨ Hizmet: ${services}\n\n📍 Adres: Ata Mah. Çevre Bulvarı No:142 Efeler / Aydın\n📞 Tel: 0552 943 91 68\n\nSıra beklemeden peronunuza giriş yapabilirsiniz. Bekliyoruz!`,
      },
      {
        id: '4_hour',
        title: '⏳ 4 Saat Sonra Randevunuz Var',
        shortDesc: 'Günün erken saatlerinde otomatik hazırlık bildirimi',
        badge: 'Ön Hatırlatma / 4 Saat',
        badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        message: `Sayın ${apt.customer.fullName},\n\nBugün saat ${apt.time.split(' ')[0]} için Esse Oto Yıkama randevunuza 4 saat kalmıştır. 🚘\n\nPeronumuz ve uzman ekibimiz aracınız için hazırlanmaktadır. Randevu saatinizde sizi ağırlamaktan onur duyarız.\n\n📍 Konum: Çevre Bulvarı, Efeler/Aydın\n📞 İletişim: 0552 943 91 68`,
      },
      {
        id: 'in_progress',
        title: '🚿 Aracınız Şu An Yıkanıyor / İşlemde',
        shortDesc: 'Aracın perona alındığı ve temizliğe başlandığı bildirimi',
        badge: 'Canlı Durum: Yıkanıyor',
        badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        message: `Sayın ${apt.customer.fullName},\n\n${plate} plakalı aracınız teslim alınmış olup ${apt.time.split('(')[1]?.replace(')', '') || 'Peronumuzda'} titizlikle yıkanmaya başlanmıştır! 🧼✨\n\nİç dış detaylı bakım ve kurutma işlemleri ortalama 45-60 dk içerisinde tamamlanacaktır. Bekleme salonumuzda sıcak çay/kahve ikramımız ile dinlenebilirsiniz.\n\nEsse Detailing Aydın`,
      },
      {
        id: 'completed_ready',
        title: '✨ Aracınızın Yıkaması Tamamlandı (Hazır)',
        shortDesc: 'Araç teslimata hazır olduğunda gönderilen bildirim',
        badge: 'Teslime Hazır ✓',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        message: `Sayın ${apt.customer.fullName},\n\nMüjde! 🌟 ${plate} plakalı aracınızın yıkama ve detaylı bakım işlemleri tamamlanmış olup pırıl pırıl teslime hazırdır!\n\nAracınızı istediğiniz zaman teslim alabilirsiniz. Esse Oto Yıkama'yı tercih ettiğiniz için teşekkür ederiz. Kazasız sürüşler dileriz! 🚗💨`,
      },
      {
        id: 'loyalty_awarded',
        title: '🎁 Sadakat Kartınıza +1 Damga Eklendi',
        shortDesc: 'Müşteriye hediye damga ve puan bildirimi',
        badge: `Damga: ${stamps}/5`,
        badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        message: `Sayın ${apt.customer.fullName},\n\nSon yıkama işleminizle birlikte Dijital Esse VIP Sadakat Kartınıza +1 Damga eklendi! 🎉\n\n📌 Mevcut Damga Durumunuz: ${stamps} / 5 Damga\n${stamps >= 5 ? '🏆 TEBRİKLER! 5 damgayı tamamladınız. Bir sonraki cilalı oto yıkamanız ÜCRETSİZ HEDİYEMİZDİR!' : '4 damga sonrası hediye cilalı yıkama hakkınız açılacaktır.'}\n\nEsse Oto Yıkama – Aydın Efeler`,
      },
    ];
  };

  const sendWhatsAppNotification = (phone: string, text: string) => {
    const rawDigits = phone.replace(/[^0-9]/g, '');
    const cleanPhone = rawDigits.startsWith('0') ? '9' + rawDigits : rawDigits.startsWith('90') ? rawDigits : '90' + rawDigits;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyNotificationText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotificationKey(key);
    setTimeout(() => setCopiedNotificationKey(null), 2500);
  };

  // IF NOT AUTHENTICATED -> SECURE 8-CHARACTER ALPHANUMERIC PASSWORD SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-amber-500/40 bg-zinc-900/95 shadow-2xl backdrop-blur-2xl"
        >
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
              <Shield className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-zinc-100">
              ESSE DETAILING
            </h1>
            <p className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider">
              Yönetici Kontrol Paneli
            </p>
            <p className="text-xs text-zinc-400 pt-1">
              Randevu, peron ve müşteri yönetimi için lütfen 8 haneli yönetici şifrenizi giriniz.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Yönetici Şifresi
              </label>
              <input
                type="password"
                maxLength={20}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                placeholder="••••••••"
                className="w-full py-3.5 px-4 text-center tracking-[0.3em] text-xl font-black bg-zinc-800/90 border border-white/10 rounded-2xl text-amber-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
              {passwordError && (
                <p className="text-rose-400 text-xs text-center mt-2.5 font-bold flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>Güvenli Giriş Yap</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center text-xs text-zinc-400">
            <button
              type="button"
              onClick={onExitAdmin}
              className="hover:text-amber-400 flex items-center gap-1.5 font-bold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Müşteri Sayfasına Dön</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 max-w-md p-4 rounded-2xl bg-zinc-900 border border-amber-500/60 shadow-2xl text-xs font-bold text-amber-300 flex items-center gap-3 backdrop-blur-2xl"
          >
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1">{toastMessage}</div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-zinc-950/90 border-b border-white/10 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExitAdmin}
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Siteye Dön"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Müşteri Sayfasına Git</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-zinc-100">
                  ESSE DETAILING
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black shadow-sm">
                  Yönetici Paneli
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                <span>Aydın Efeler Çevre Bulvarı</span>
                <span>·</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  4 Bağımsız İstasyon Peronu Aktif
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Yeni Randevu Ekle</span>
            </button>

            <button
              type="button"
              onClick={refreshData}
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-zinc-300 transition-all cursor-pointer"
              title="Yenile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all cursor-pointer"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Bugün Toplam</div>
            <div className="text-2xl font-black text-zinc-100 mt-1">{metrics.todayTotal}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Aktif Araç</div>
          </div>

          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Bekleyen / WP</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{metrics.pending}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Teyit Bekliyor</div>
          </div>

          <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-xl">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Onaylanan</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">{metrics.confirmed}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Saatinde Gelecek</div>
          </div>

          <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-xl">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Peronda Yıkanıyor</div>
            <div className="text-2xl font-black text-blue-400 mt-1">{metrics.inProgress}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">İşleme Alındı</div>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Tamamlanan</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{metrics.completed}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Otomatik Silindi & Damga</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'appointments'
                ? 'bg-amber-500 text-black shadow-lg font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Aktif Randevular ({appointments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capacity')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'capacity'
                ? 'bg-amber-500 text-black shadow-lg font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kapasite & 4 Peron Doluluk Kontrolü</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('loyalty')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'loyalty'
                ? 'bg-amber-500 text-black shadow-lg font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Sadakat Kartı & Damga Kayıtları</span>
          </button>
        </div>

        {/* TAB 1: ALL APPOINTMENTS & CUSTOMER LIST */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="İsim, plaka (09 DB 482), telefon veya araç ara..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-800/80 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-800/80 border border-white/10 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    dateFilter === 'today' ? 'bg-amber-500 text-black font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Bugün
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('tomorrow')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    dateFilter === 'tomorrow' ? 'bg-amber-500 text-black font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Yarın
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    dateFilter === 'all' ? 'bg-amber-500 text-black font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tüm Günler
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2.5 px-3 text-xs bg-zinc-800/80 border border-white/10 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer shrink-0"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="pending_or_wp">Bekleyen & WhatsApp</option>
                <option value="confirmed">Onaylanan</option>
                <option value="in_progress">Peronda Yıkanıyor</option>
                <option value="cancelled">İptal Edilen</option>
              </select>
            </div>

            {/* List */}
            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center border border-white/10 rounded-3xl bg-zinc-900/40 text-zinc-400 space-y-3">
                <Calendar className="w-10 h-10 mx-auto text-zinc-600" />
                <div className="font-bold text-sm text-zinc-300">Bu filtrelere uygun randevu bulunamadı.</div>
                <p className="text-xs text-zinc-500">
                  Yeni bir randevu eklemek için yukarıdaki "+ Yeni Randevu Ekle" butonuna tıklayabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => {
                  const plate = apt.customer.plateNumber.toUpperCase().trim();
                  const currentCustomerStamps = stampsMap[plate] || 0;

                  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                    pending: { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', label: 'Onay Bekliyor' },
                    sent_via_whatsapp: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', label: 'WhatsApp Gönderildi' },
                    confirmed: { bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-400', label: 'Onaylandı' },
                    in_progress: { bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400', label: 'Peronda Yıkanıyor' },
                    completed: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', label: 'Tamamlandı' },
                    cancelled: { bg: 'bg-rose-500/15 border-rose-500/30', text: 'text-rose-400', label: 'İptal Edildi' },
                  };

                  const currentStatus = statusConfig[apt.status] || statusConfig.pending;

                  return (
                    <motion.div
                      key={apt.id}
                      layout
                      className="p-5 rounded-3xl border border-white/10 bg-zinc-900/80 hover:border-white/20 transition-all space-y-4 shadow-xl"
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-black text-base text-zinc-100">
                            {apt.customer.fullName}
                          </span>

                          <span className="px-3 py-1 rounded-xl bg-zinc-800 border border-white/20 font-mono font-black text-amber-400 text-sm tracking-wider shadow-inner">
                            {plate}
                          </span>

                          <span className={`px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${currentStatus.bg} ${currentStatus.text}`}>
                            {currentStatus.label}
                          </span>

                          <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>Sadakat: {currentCustomerStamps}/5 Damga</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          <span className="flex items-center gap-1.5 text-amber-400 font-extrabold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/25">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{apt.time}</span>
                          </span>

                          <span className="flex items-center gap-1.5 text-zinc-300 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{formatTurkishDate(apt.date)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="space-y-1 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Araç & İletişim:
                          </div>
                          <div className="font-bold text-zinc-200">
                            {apt.customer.carModel || 'Model Belirtilmedi'}
                          </div>
                          <div className="text-zinc-400 font-mono">
                            {apt.customer.phone}
                          </div>
                        </div>

                        <div className="space-y-1 bg-white/[0.02] p-3 rounded-2xl border border-white/5 md:col-span-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Seçilen Hizmetler:
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {apt.selectedServices.map((s) => (
                              <span
                                key={s.id}
                                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-200 font-medium text-[11px]"
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {apt.customer.notes && (
                          <div className="md:col-span-3 text-xs text-amber-300/90 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                            <strong>Müşteri Notu:</strong> {apt.customer.notes}
                          </div>
                        )}
                      </div>

                      {/* ACTION BUTTONS WITH CLEAR READABLE TURKISH LABELS */}
                      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                        {/* Status Management Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1. Onayla Button */}
                          {apt.status !== 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(apt.id, 'confirmed')}
                              className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>✓ Onayla</span>
                            </button>
                          )}

                          {/* 2. Yıkamaya Al Button */}
                          {apt.status !== 'in_progress' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(apt.id, 'in_progress')}
                              className="px-3.5 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            >
                              <Car className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>🚿 Yıkamaya Al</span>
                            </button>
                          )}

                          {/* 3. Tamamla & Otomatik Damga Ver (Requested by user: Auto-deletes and awards stamp) */}
                          <button
                            type="button"
                            onClick={() => handleCompleteAndAwardStamp(apt)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>✨ Tamamla & Damga Ver (Sil)</span>
                          </button>

                          {/* 4. Tek Tıkla İptal Et Button */}
                          {apt.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleCancelAppointment(apt)}
                              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            >
                              <X className="w-3.5 h-3.5 stroke-[3]" />
                              <span>❌ Randevuyu İptal Et</span>
                            </button>
                          )}
                        </div>

                        {/* Customer Communication & Notification Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 5. Bildirim Gönder Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setNotificationModalApt(apt)}
                            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>🔔 İnternet Bildirimi Gönder (1 Saat / Hazır)</span>
                          </button>

                          {/* 6. Ara Button */}
                          <a
                            href={`tel:${apt.customer.phone}`}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Phone className="w-3.5 h-3.5 text-amber-400" />
                            <span>📞 Telefonla Ara</span>
                          </a>

                          {/* 7. Sil Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(apt.id)}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer"
                            title="Kalıcı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CAPACITY & REAL-TIME OCCUPANCY CONTROL FOR SELECTED DAY & PERON (Requested by user) */}
        {activeTab === 'capacity' && (
          <div className="space-y-5">
            {/* Header & Filter Controls */}
            <div className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-zinc-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  <span>Kapasite & Peron Doluluk Kontrolü</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Seçilen gün ve peron için anlık doluluk durumunu kontrol edin, boş slotlara çakışma olmadan hızlı randevu tanımlayın.
                </p>
              </div>

              {/* Controls: Date Picker + Peron Dropdown */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-1 shrink-0">
                    <CalendarDays className="w-4 h-4 text-amber-400" />
                    <span>Gün:</span>
                  </label>
                  <input
                    type="date"
                    value={capacitySelectedDate}
                    onChange={(e) => setCapacitySelectedDate(e.target.value)}
                    className="px-3 py-2 text-xs bg-zinc-800 border border-white/15 rounded-xl text-zinc-100 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-1 shrink-0">
                    <Car className="w-4 h-4 text-amber-400" />
                    <span>Peron:</span>
                  </label>
                  <select
                    value={capacitySelectedPeron}
                    onChange={(e) => setCapacitySelectedPeron(e.target.value)}
                    className="px-3 py-2 text-xs bg-zinc-800 border border-white/15 rounded-xl text-zinc-100 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">Tüm Peronlar (4 Peron)</option>
                    <option value="1. Peron">1. Peron (Hızlı & Köpük)</option>
                    <option value="2. Peron">2. Peron (Detaylı Dış Yıkama)</option>
                    <option value="3. Peron">3. Peron (İç Kuaför & Koltuk)</option>
                    <option value="4. Peron">4. Peron (Boya Koruma & Kurutma)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Capacity KPI Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl border border-white/10 bg-zinc-900/50">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Seçim</div>
                <div className="text-xs font-black text-amber-400 mt-1 truncate">
                  {formatTurkishDate(capacitySelectedDate)}
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  {capacitySelectedPeron === 'all' ? '4 Peron Toplamı' : capacitySelectedPeron}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Müsait (Boş) Slot</div>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">
                  {capacityData.freeSlotsCount} / {capacityData.totalSlots}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/5">
                <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Dolu (Rezerve) Slot</div>
                <div className="text-2xl font-black text-rose-400 mt-0.5">
                  {capacityData.bookedSlotsCount} Araç
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Doluluk Oranı</span>
                  <Percent className="w-3.5 h-3.5" />
                </div>
                <div className="text-2xl font-black text-amber-400 mt-0.5">
                  %{capacityData.occupancyPercentage}
                </div>
              </div>
            </div>

            {/* Dynamic Grid: If Single Peron vs All Perons */}
            {capacitySelectedPeron !== 'all' ? (
              /* SINGLE PERON VIEW: Detailed Hour-by-Hour Timeline */
              <div className="p-5 rounded-3xl border border-white/10 bg-zinc-900/60 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-zinc-100">{capacitySelectedPeron} Canlı Çizelgesi</h3>
                    <p className="text-xs text-zinc-400">
                      {formatTurkishDate(capacitySelectedDate)} günü için çalışma saatleri dökümü
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                    {capacityData.bookedSlotsCount} Dolu · {capacityData.freeSlotsCount} Boş
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {HOUR_WINDOWS_LIST.map((hw) => {
                    const bookedApt = appointments.find((a) => {
                      if (a.date !== capacitySelectedDate || a.status === 'cancelled') return false;
                      return (
                        (a.time.includes(hw) && a.time.includes(capacitySelectedPeron)) ||
                        (a.time.startsWith(hw.split(' - ')[0]) && a.time.includes(capacitySelectedPeron))
                      );
                    });

                    if (bookedApt) {
                      return (
                        <div
                          key={hw}
                          className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{hw}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase">
                              DOLU
                            </span>
                          </div>

                          <div className="text-xs space-y-0.5">
                            <div className="font-mono font-black text-zinc-100 text-sm">
                              {bookedApt.customer.plateNumber}
                            </div>
                            <div className="text-zinc-300 font-bold truncate">
                              {bookedApt.customer.fullName}
                            </div>
                            <div className="text-zinc-400 text-[11px] truncate">
                              {bookedApt.selectedServices.map((s) => s.name).join(', ')}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400 font-mono">{bookedApt.customer.phone}</span>
                            <button
                              type="button"
                              onClick={() => setNotificationModalApt(bookedApt)}
                              className="text-amber-400 font-bold hover:underline flex items-center gap-1"
                            >
                              <Bell className="w-3 h-3" />
                              <span>Bildirim</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={hw}
                        className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{hw}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                            MÜSAİT (BOŞ)
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400">
                          Bu saat dilimi için peron boştur. Araç kabul edilebilir.
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setNewApt({
                              ...newApt,
                              date: capacitySelectedDate,
                              hour: hw,
                              peron: capacitySelectedPeron,
                            });
                            setIsAddModalOpen(true);
                          }}
                          className="w-full py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Bu Saate Randevu Ata</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ALL PERONS 4x11 MATRIX TABLE */
              <div className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-zinc-900/60 overflow-x-auto space-y-3">
                <div className="grid grid-cols-5 gap-2 min-w-[700px] border-b border-white/10 pb-2 text-xs font-black text-zinc-400 uppercase tracking-wider">
                  <div className="col-span-1">Saat Dilimi</div>
                  <div className="col-span-1 text-center">1. Peron (Hızlı)</div>
                  <div className="col-span-1 text-center">2. Peron (Dış Yıkama)</div>
                  <div className="col-span-1 text-center">3. Peron (İç Kuaför)</div>
                  <div className="col-span-1 text-center">4. Peron (Boya/Cila)</div>
                </div>

                <div className="space-y-2 min-w-[700px]">
                  {capacityData.matrix.map((row) => (
                    <div key={row.hourWindow} className="grid grid-cols-5 gap-2 items-center text-xs">
                      {/* Hour Window Label */}
                      <div className="col-span-1 font-bold text-zinc-300 flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02]">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{row.hourWindow}</span>
                      </div>

                      {/* 4 Peron Slots */}
                      {row.peronsStatus.map((slot) => {
                        if (slot.isBooked && slot.appointment) {
                          return (
                            <div
                              key={slot.peronId}
                              className="col-span-1 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex flex-col justify-between"
                            >
                              <div className="font-mono font-black text-xs text-amber-400 truncate">
                                {slot.appointment.customer.plateNumber}
                              </div>
                              <div className="text-[10px] text-zinc-300 truncate">
                                {slot.appointment.customer.fullName}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={slot.peronId}
                            type="button"
                            onClick={() => {
                              setNewApt({
                                ...newApt,
                                date: capacitySelectedDate,
                                hour: row.hourWindow,
                                peron: slot.peronId,
                              });
                              setIsAddModalOpen(true);
                            }}
                            className="col-span-1 p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Bu saate hızlı randevu ekle"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Müsait (Boş)</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LOYALTY STAMPS MANAGEMENT */}
        {activeTab === 'loyalty' && (
          <div className="space-y-5">
            <div className="p-5 rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-zinc-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Dijital Sadakat (5 Damga) Kartı Yönetimi</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Müşteriler kendileri damga ekleyemez; tamamlanan randevularda sistem otomatik damga verir veya siz buradan düzenleyebilirsiniz.
                </p>
              </div>
            </div>

            {/* Loyalty Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(stampsMap).map(([plate, stamps]) => {
                const isFull = stamps >= 5;

                return (
                  <div
                    key={plate}
                    className="p-5 rounded-3xl border border-white/10 bg-zinc-900/80 space-y-4 flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-xl bg-zinc-800 border border-white/20 font-mono font-black text-amber-400 text-sm tracking-wider">
                          {plate}
                        </span>

                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          isFull
                            ? 'bg-amber-500 text-black font-extrabold animate-pulse'
                            : 'bg-white/10 text-zinc-300'
                        }`}>
                          {stamps} / 5 Damga
                        </span>
                      </div>

                      {/* Visual Stamps */}
                      <div className="flex items-center gap-2 py-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                              i <= stamps
                                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                                : 'bg-zinc-800 text-zinc-600 border border-white/5'
                            }`}
                          >
                            {i <= stamps ? '✓' : i === 5 ? '🎁' : i}
                          </div>
                        ))}
                      </div>

                      {isFull && (
                        <div className="text-xs font-black text-amber-300 bg-amber-500/15 p-2.5 rounded-2xl border border-amber-500/30 mt-2">
                          🎉 Bu araç 5 damgayı tamamladı! Şimdiki veya bir sonraki yıkaması ÜCRETSİZ HEDİYE!
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          const next = Math.min(5, stamps + 1);
                          updateCustomerStamps(plate, next);
                          setStampsMap(getCustomerStampsMap());
                          showToast(`${plate} için +1 damga eklendi (Toplam: ${next}/5)`);
                        }}
                        className="flex-1 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-xs border border-amber-500/30 transition-all cursor-pointer"
                      >
                        +1 Damga Ekle
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          updateCustomerStamps(plate, 0);
                          setStampsMap(getCustomerStampsMap());
                          showToast(`${plate} için damgalar sıfırlandı.`);
                        }}
                        className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-400 hover:text-white text-xs border border-white/10 transition-all cursor-pointer"
                        title="Damgaları Sıfırla"
                      >
                        Sıfırla
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: NOTIFICATION CENTER */}
      <AnimatePresence>
        {notificationModalApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl p-6 rounded-3xl border border-amber-500/40 bg-zinc-900 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-black font-black">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-100">
                      İnternet Bildirim Merkezi: {notificationModalApt.customer.fullName}
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      {notificationModalApt.customer.plateNumber} · {notificationModalApt.customer.phone}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setNotificationModalApt(null)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {getCustomerNotifications(notificationModalApt).map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 rounded-2xl border border-white/10 bg-zinc-800/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-black text-sm text-zinc-100">{notif.title}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${notif.badgeColor}`}>
                        {notif.badge}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400">{notif.shortDesc}</p>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-line">
                      {notif.message}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copyNotificationText(notif.id, notif.message)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold flex items-center gap-1.5 border border-white/10"
                      >
                        {copiedNotificationKey === notif.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Kopyalandı!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Metni Kopyala</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => sendWhatsAppNotification(notificationModalApt.customer.phone, notif.message)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp ile Gönder ➔</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: MANUAL APPOINTMENT (STRICTLY FILTERED: ONLY AVAILABLE FUTURE HOURS SHOWN) */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl border border-amber-500/40 bg-zinc-900 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-black font-black">
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-100">Yeni Randevu Oluştur</h2>
                    <p className="text-xs text-zinc-400">Yalnızca müsait ve çakışmayan saatler listelenir</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManualAppointment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Müşteri Ad Soyad *</label>
                    <input
                      type="text"
                      required
                      value={newApt.fullName}
                      onChange={(e) => setNewApt({ ...newApt, fullName: e.target.value })}
                      placeholder="Mehmet Can"
                      className="w-full p-2.5 text-xs bg-zinc-800 border border-white/10 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Telefon Numarası *</label>
                    <input
                      type="tel"
                      required
                      value={newApt.phone}
                      onChange={(e) => setNewApt({ ...newApt, phone: e.target.value })}
                      placeholder="0532 123 45 67"
                      className="w-full p-2.5 text-xs bg-zinc-800 border border-white/10 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Araç Plakası *</label>
                    <input
                      type="text"
                      required
                      value={newApt.plateNumber}
                      onChange={(e) => setNewApt({ ...newApt, plateNumber: e.target.value.toUpperCase() })}
                      placeholder="09 DB 482"
                      className="w-full p-2.5 text-xs bg-zinc-800 border border-white/10 rounded-xl text-amber-400 font-mono font-bold uppercase focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Araç Modeli & Renk</label>
                    <input
                      type="text"
                      value={newApt.carModel}
                      onChange={(e) => setNewApt({ ...newApt, carModel: e.target.value })}
                      placeholder="Volkswagen Passat Siyah"
                      className="w-full p-2.5 text-xs bg-zinc-800 border border-white/10 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Tarih</label>
                    <input
                      type="date"
                      value={newApt.date}
                      onChange={(e) => setNewApt({ ...newApt, date: e.target.value })}
                      className="w-full p-2.5 text-xs bg-zinc-800 border border-white/10 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">İstasyon Peronu</label>
                    <select
                      value={newApt.peron}
                      onChange={(e) => setNewApt({ ...newApt, peron: e.target.value })}
                      className="w-full p-2.5 text-xs bg-zinc-800 border border-white/10 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
                    >
                      {PERONS_LIST.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* ONLY AVAILABLE UNBOOKED HOURS SHOWN (No past hours, no booked hours) */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      Saat Dilimi ({availableHoursInModal.length} Müsait)
                    </label>
                    {availableHoursInModal.length > 0 ? (
                      <select
                        value={newApt.hour}
                        onChange={(e) => setNewApt({ ...newApt, hour: e.target.value })}
                        className="w-full p-2.5 text-xs bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 focus:outline-none focus:border-amber-500 font-bold"
                      >
                        {availableHoursInModal.map((hour) => (
                          <option key={hour} value={hour} className="bg-zinc-900 text-emerald-400">
                            🟢 {hour} (Müsait)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                        Dolu / Kapalı
                      </div>
                    )}
                  </div>
                </div>

                {/* If no hours left */}
                {availableHoursInModal.length === 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      Seçilen tarih ve {newApt.peron} için müsait saat kalmamıştır. Lütfen başka bir peron veya gün seçiniz.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Hizmet Seçimi</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1.5 border border-white/10 rounded-xl bg-zinc-800/50">
                    {SERVICES_LIST.map((s) => {
                      const isChecked = newApt.services.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                            isChecked ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-zinc-800 border-white/5 text-zinc-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewApt({ ...newApt, services: [...newApt.services, s.id] });
                              } else {
                                setNewApt({ ...newApt, services: newApt.services.filter((id) => id !== s.id) });
                              }
                            }}
                            className="accent-amber-500"
                          />
                          <span className="truncate">{s.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Yönetici Notu</label>
                  <textarea
                    rows={2}
                    value={newApt.notes}
                    onChange={(e) => setNewApt({ ...newApt, notes: e.target.value })}
                    placeholder="Örn: Müşteri dükkandan randevu aldı..."
                    className="w-full p-2.5 text-xs bg-zinc-800 border border-white/10 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="submit"
                    disabled={availableHoursInModal.length === 0}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition-all ${
                      availableHoursInModal.length > 0
                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25 active:scale-95 cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Randevuyu Sisteme Kaydet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
