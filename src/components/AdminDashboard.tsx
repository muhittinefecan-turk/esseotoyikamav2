import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Car,
  Search,
  Plus,
  Trash2,
  Phone,
  Lock,
  LogOut,
  ArrowLeft,
  Award,
  Layers,
  Check,
  X,
  Bell,
  Sparkles,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Gift,
  User,
  History,
  Filter,
  CheckCircle2,
  BarChart3,
  Image,
  Camera,
  QrCode,
  FileText,
  Printer,
  Copy,
  TrendingUp,
  DollarSign,
  Database,
  Terminal,
  Play,
  Server
} from 'lucide-react';
import { 
  AppointmentData, 
  BusinessConfig, 
  VehicleCategory, 
  LoyaltyCustomerProfile, 
  SystemNotificationEvent,
  WashStage,
  VehicleInspectionPhoto
} from '../types';
import { SERVICES_LIST } from '../data/servicesData';
import { formatTurkishDate, formatDuration } from '../utils/formatters';
import {
  WASH_STAGE_LABELS,
  redeemVoucherCode,
  redeemGiftStamp,
  setCustomerStampsDirect
} from '../utils/storage';
import {
  checkAndInitializeSchema,
  resetDatabaseClean,
  fetchAppointmentsSQL,
  fetchLoyaltyProfilesSQL,
  insertAppointmentSQL,
  updateAppointmentStatusSQL,
  updateWashStageSQL,
  cancelAppointmentSQL,
  reactivateAppointmentSQL,
  deleteAppointmentSQL,
  addInspectionPhotoSQL,
  saveLoyaltyStampSQL,
  completeAndAwardStampSQL,
  redeemVoucherSQL,
  executeD1Sql,
  d1GetHealth,
  D1HealthStatus
} from '../services/db';
import {
  getSystemEvents,
  clearSystemEvents,
  sendNativePushNotification,
  requestNativeNotificationPermission
} from '../utils/notifications';
import { QrCodeScannerModal } from './QrCodeScannerModal';
import { QuickNotificationDrawer } from './QuickNotificationDrawer';
import { calculateLiveAnalytics } from '../utils/analytics';

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
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  business,
  isDarkMode,
  onExitAdmin,
}) => {
  // Authentication State (in-memory, zero sessionStorage)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'appointments' | 'cancelled' | 'loyalty' | 'notifications' | 'capacity' | 'analytics'>('appointments');

  // Inspection Photo Modal State (Feature 3)
  const [photoModalApt, setPhotoModalApt] = useState<AppointmentData | null>(null);
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const [photoLabel, setPhotoLabel] = useState<string>('Giriş Öncesi Çizik & Jant Durumu');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Voucher Verification State (Feature 6)
  const [voucherInput, setVoucherInput] = useState<string>('');
  const [voucherResult, setVoucherResult] = useState<{ success: boolean; message: string } | null>(null);

  // Quick Notification Response Drawer State
  const [quickNotifDrawerApt, setQuickNotifDrawerApt] = useState<AppointmentData | null>(null);

  // QR Code Scanner Modal State
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);

  // Appointments State (Initialized empty, populated via SQL fetch)
  const [allAppointments, setAllAppointments] = useState<AppointmentData[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemNotificationEvent[]>(() => getSystemEvents());
  const [loyaltyProfiles, setLoyaltyProfiles] = useState<LoyaltyCustomerProfile[]>([]);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'all'>('all');

  // Cancelled tab filter
  const [cancelledFilter, setCancelledFilter] = useState<'all' | 'customer' | 'admin'>('all');

  // Loyalty tab search & filter
  const [loyaltySearch, setLoyaltySearch] = useState<string>('');
  const [loyaltyStampFilter, setLoyaltyStampFilter] = useState<string>('all');
  const [loyaltySort, setLoyaltySort] = useState<'stamps_desc' | 'stamps_asc' | 'date_desc'>('stamps_desc');
  const [selectedLoyaltyCustomer, setSelectedLoyaltyCustomer] = useState<LoyaltyCustomerProfile | null>(null);

  // Modals & Feedback Toast
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cloudflare D1 SQL Setup & Health State
  const [d1Status, setD1Status] = useState<D1HealthStatus | null>(null);
  const [isD1ModalOpen, setIsD1ModalOpen] = useState(false);
  const [isD1Initializing, setIsD1Initializing] = useState(false);
  const [d1InitLogs, setD1InitLogs] = useState<string[]>([]);
  const [sqlQueryInput, setSqlQueryInput] = useState('SELECT id, customer_plate_number, status, time FROM appointments LIMIT 10;');
  const [sqlQueryResults, setSqlQueryResults] = useState<any[] | null>(null);
  const [sqlExecuting, setSqlExecuting] = useState(false);

  // Dates helpers
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

  // Form State for Manual Appointment
  const [newApt, setNewApt] = useState({
    fullName: '',
    phone: '',
    plateNumber: '',
    carModel: '',
    vehicleType: 'sedan' as VehicleCategory,
    date: todayStr,
    time: '09:30 - 10:30 (1. Peron)',
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronize data via SQL queries
  const reloadData = async () => {
    try {
      const [serverApts, serverLoyalty, health] = await Promise.all([
        fetchAppointmentsSQL(),
        fetchLoyaltyProfilesSQL(),
        d1GetHealth(),
      ]);
      setAllAppointments(serverApts);
      setLoyaltyProfiles(serverLoyalty);
      setD1Status(health);
    } catch (err) {
      console.warn('reloadData SQL error:', err);
    }
    setSystemEvents(getSystemEvents());
  };

  useEffect(() => {
    checkAndInitializeSchema().catch(() => {});
    reloadData();
  }, []);

  useEffect(() => {
    const handleSync = () => {
      reloadData();
    };
    window.addEventListener('esse_data_updated', handleSync);
    window.addEventListener('esse_notification_event', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('esse_data_updated', handleSync);
      window.removeEventListener('esse_notification_event', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Active appointments list
  const activeAppointments = useMemo(() => {
    return allAppointments.filter((a) => a.status !== 'cancelled' && a.status !== 'completed');
  }, [allAppointments]);

  // Cancelled appointments list (newest on top)
  const cancelledAppointments = useMemo(() => {
    return allAppointments
      .filter((a) => a.status === 'cancelled')
      .sort((a, b) => {
        const timeA = new Date(a.cancelledAt || a.createdAt).getTime();
        const timeB = new Date(b.cancelledAt || b.createdAt).getTime();
        return timeB - timeA;
      });
  }, [allAppointments]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const active = activeAppointments.length;
    const confirmed = activeAppointments.filter((a) => a.status === 'confirmed').length;
    const inProgress = activeAppointments.filter((a) => a.status === 'in_progress').length;
    const pending = activeAppointments.filter((a) => a.status === 'pending' || a.status === 'sent_via_whatsapp').length;
    const cancelled = cancelledAppointments.length;
    return { active, confirmed, inProgress, pending, cancelled };
  }, [activeAppointments, cancelledAppointments]);

  // Live Dynamic Analytics (Strictly computed from real D1 appointments and loyalty profiles)
  const liveAnalytics = useMemo(() => {
    return calculateLiveAnalytics(allAppointments, loyaltyProfiles, todayStr);
  }, [allAppointments, loyaltyProfiles, todayStr]);

  // Filtered Active Appointments
  const filteredActiveAppointments = useMemo(() => {
    return activeAppointments.filter((apt) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        apt.customer.fullName.toLowerCase().includes(q) ||
        apt.customer.plateNumber.toLowerCase().includes(q) ||
        apt.customer.phone.includes(q) ||
        apt.customer.carModel.toLowerCase().includes(q) ||
        apt.id.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && (apt.status === 'pending' || apt.status === 'sent_via_whatsapp')) ||
        (statusFilter === 'confirmed' && apt.status === 'confirmed') ||
        (statusFilter === 'in_progress' && apt.status === 'in_progress');

      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' && apt.date === todayStr) ||
        (dateFilter === 'tomorrow' && apt.date === tomorrowStr);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [activeAppointments, searchTerm, statusFilter, dateFilter, todayStr, tomorrowStr]);

  // Filtered Cancelled Appointments
  const filteredCancelledAppointments = useMemo(() => {
    return cancelledAppointments.filter((apt) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        apt.customer.fullName.toLowerCase().includes(q) ||
        apt.customer.plateNumber.toLowerCase().includes(q) ||
        apt.customer.phone.includes(q);

      const matchesParty =
        cancelledFilter === 'all' ||
        (cancelledFilter === 'customer' && apt.cancelledBy === 'customer') ||
        (cancelledFilter === 'admin' && apt.cancelledBy === 'admin');

      return matchesSearch && matchesParty;
    });
  }, [cancelledAppointments, searchTerm, cancelledFilter]);

  // Filtered Loyalty Profiles
  const filteredLoyaltyProfiles = useMemo(() => {
    let list = [...loyaltyProfiles];

    if (loyaltySearch.trim()) {
      const q = loyaltySearch.toLowerCase().trim();
      list = list.filter((p) => 
        p.plate.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        p.phone.includes(q)
      );
    }

    if (loyaltyStampFilter !== 'all') {
      const count = parseInt(loyaltyStampFilter, 10);
      list = list.filter((p) => p.stamps === count);
    }

    if (loyaltySort === 'stamps_desc') {
      list.sort((a, b) => b.stamps - a.stamps);
    } else if (loyaltySort === 'stamps_asc') {
      list.sort((a, b) => a.stamps - b.stamps);
    } else if (loyaltySort === 'date_desc') {
      list.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }

    return list;
  }, [loyaltyProfiles, loyaltySearch, loyaltyStampFilter, loyaltySort]);

  // =========================================================================
  // EXPLICIT SQL EVENT HANDLERS REQUIRED BY SPECIFICATION
  // =========================================================================

  // 1. handleApproveAppointment (Onayla / Yıkamaya Al via SQL)
  const handleApproveAppointment = async (aptId: string) => {
    const apt = allAppointments.find((a) => a.id === aptId);
    if (!apt) return;
    const nextStatus = (apt.status === 'pending' || apt.status === 'sent_via_whatsapp') ? 'confirmed' : 'in_progress';
    const nextStage = nextStatus === 'in_progress' ? 'foam_prewash' : 'queue';
    await updateAppointmentStatusSQL(aptId, nextStatus, nextStage);
    await reloadData();
    showToast(nextStatus === 'confirmed' 
      ? 'Randevu onaylandı ve müşteriye bildirim iletildi!' 
      : 'Araç yıkamaya alındı ve müşteriye bildirim iletildi!');
  };

  // 2. handleCompleteAppointment (Tamamla & Damga Ver via SQL)
  const handleCompleteAppointment = async (aptId: string) => {
    const res = await completeAndAwardStampSQL(aptId);
    await reloadData();
    showToast(`Randevu tamamlandı! Dijital karta +1 damga eklendi (${res.stamps}/5). Randevu aktif listeden kaldırıldı.`);
  };

  // 3. handleCancelAppointment (Randevuyu İptal Et via SQL)
  const handleCancelAppointment = async (aptId: string) => {
    await cancelAppointmentSQL(aptId, 'admin', 'İşletme yetkilisi tarafından iptal edildi');
    await reloadData();
    showToast('Randevu iptal edildi, İptal Edilenler bölümüne taşındı ve müşteriye bildirim gönderildi.');
  };

  // 4. handleDeleteAppointment (Kalıcı Olarak Sil via SQL)
  const handleDeleteAppointment = async (aptId: string) => {
    await deleteAppointmentSQL(aptId);
    await reloadData();
    showToast('Randevu sistemden ve veri tabanından kalıcı olarak silindi.');
  };

  // 5. handleCallCustomer (Telefonla Ara)
  const handleCallCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  // 6. handleReactivateAppointment (İptal Edileni Tekrar Aktif Et via SQL)
  const handleReactivateAppointment = async (aptId: string) => {
    await reactivateAppointmentSQL(aptId);
    await reloadData();
    showToast('Randevu yeniden onaylandı ve aktif randevular listesine taşındı.');
  };

  // 7. handleAdvanceWashStage (Aşama İlerletme via SQL)
  const handleAdvanceWashStage = async (apt: AppointmentData) => {
    const stages: WashStage[] = ['queue', 'foam_prewash', 'rim_underbody', 'interior_vacuum', 'wax_drying', 'ready_for_pickup'];
    const current = apt.washStage || 'queue';
    const nextIdx = Math.min(stages.length - 1, stages.indexOf(current) + 1);
    const nextStage = stages[nextIdx];
    await updateWashStageSQL(apt.id, nextStage);
    await reloadData();
    showToast(`Aşama ilerletildi: ${WASH_STAGE_LABELS[nextStage].icon} ${WASH_STAGE_LABELS[nextStage].name}`);
  };

  // Cloudflare D1 Setup Utility: Initialize Schema
  const handleRunD1SchemaInit = async () => {
    setIsD1Initializing(true);
    setD1InitLogs(['⚡ Cloudflare D1 SQL şeması kontrol ediliyor...']);
    try {
      const res = await checkAndInitializeSchema(true);
      setD1InitLogs((prev) => [
        ...prev,
        `✅ ${res.message}`,
        `📁 Doğrulanan Tablolar: ${res.tables.join(', ')}`,
        '✨ Cloudflare D1 SQL veritabanı aktif, şema hazırlandı!',
      ]);
      showToast('Cloudflare D1 SQL şeması başarıyla başlatıldı!');
      await reloadData();
    } catch (err: any) {
      setD1InitLogs((prev) => [...prev, `❌ Hata: ${err.message}`]);
      showToast('Şema başlatma hatası: ' + err.message);
    } finally {
      setIsD1Initializing(false);
    }
  };

  // Cloudflare D1 Full Database Reset & Purge (Zero Mock Data)
  const handleResetDatabaseClean = async () => {
    if (!window.confirm('DİKKAT: Veritabanındaki tüm eski/demo veriler temizlenecek ve tablolar boş olarak sıfırlanacaktır. Devam etmek istiyor musunuz?')) return;
    setIsD1Initializing(true);
    setD1InitLogs(['🧹 Cloudflare D1 veritabanı tamamen sıfırlanıyor (Demo veriler temizleniyor)...']);
    try {
      const res = await resetDatabaseClean();
      setD1InitLogs((prev) => [
        ...prev,
        `✅ ${res.message}`,
        '✨ Veritabanı başarıyla temizlendi, sıfır mock veri!',
      ]);
      showToast('Cloudflare D1 veritabanı sıfırlandı ve temizlendi!');
      await reloadData();
    } catch (err: any) {
      setD1InitLogs((prev) => [...prev, `❌ Hata: ${err.message}`]);
      showToast('Sıfırlama hatası: ' + err.message);
    } finally {
      setIsD1Initializing(false);
    }
  };

  // Cloudflare D1 Interactive SQL Query Runner
  const handleExecuteSql = async () => {
    if (!sqlQueryInput.trim()) return;
    setSqlExecuting(true);
    try {
      const res = await executeD1Sql(sqlQueryInput.trim());
      if (res.success) {
        setSqlQueryResults(res.results || []);
        showToast(`SQL sorgusu tamamlandı (${res.results?.length || 0} satır).`);
      } else {
        showToast(`SQL Hatası: ${res.error || 'Bilinmeyen hata'}`);
      }
    } catch (err: any) {
      showToast(`Sorgu hatası: ${err.message}`);
    } finally {
      setSqlExecuting(false);
    }
  };

  // 8. handleAddInspectionPhoto (Araç Fotoğrafı Ekleme via SQL)
  const handleAddInspectionPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoModalApt || !photoUrl.trim()) {
      showToast('Lütfen geçerli bir görsel URL giriniz veya çekilen fotoğrafı seçiniz.');
      return;
    }
    await addInspectionPhotoSQL(photoModalApt.id, {
      type: photoType,
      url: photoUrl.trim(),
      label: photoLabel || (photoType === 'before' ? 'Kabul Durumu' : 'Teslim Parlaklığı'),
    });
    await reloadData();
    setPhotoModalApt(null);
    setPhotoUrl('');
    showToast('Araç fotoğrafı başarıyla kaydedildi.');
  };

  // 9. handleVerifyAndRedeemVoucher (QR Kupon Doğrulama via SQL)
  const handleVerifyAndRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) {
      showToast('Lütfen kupon kodu veya plaka giriniz.');
      return;
    }
    const result = await redeemVoucherSQL(voucherInput.trim());
    setVoucherResult(result);
    if (result.success) {
      await reloadData();
      showToast(result.message);
    }
  };

  // 10. handleCopyDailyReport (Gün Sonu Raporu Kopyalama - Feature 5)
  const handleCopyDailyReport = () => {
    const todayApts = allAppointments.filter((a) => a.date === todayStr);
    const completedApts = todayApts.filter((a) => a.status === 'completed');
    const cancelledApts = todayApts.filter((a) => a.status === 'cancelled');
    const estRevenue = liveAnalytics.estimatedDailyRevenue;

    const reportText = `🚗 *ESSE OTO YIKAMA GÜN SONU RAPORU*
📅 Tarih: ${formatTurkishDate(todayStr)}

✅ Tamamlanan Yıkama: ${completedApts.length} Araç
⏳ Sırada / Aktif: ${todayApts.length - completedApts.length - cancelledApts.length} Araç
❌ İptal Edilen: ${cancelledApts.length} Araç
💰 Tahmini Günlük Ciro: ~${estRevenue.toLocaleString('tr-TR')} TL

🌟 *İşlem Gören Araçlar:*
${completedApts.slice(0, 8).map((a) => `• ${a.customer.plateNumber} (${a.customer.fullName}) - ${a.time}`).join('\n') || '• Henüz tamamlanan araç yok'}

📞 İletişim: ${business.phone}
📍 Adres: ${business.address}`;

    navigator.clipboard.writeText(reportText);
    showToast('Gün sonu özeti panoya kopyalandı! WhatsApp veya SMS ile paylaşabilirsiniz.');
  };

  // 11. handleQrScan (Kameradan QR Okunduğunda)
  const handleQrScan = async (code: string) => {
    setVoucherInput(code);
    setIsQrScannerOpen(false);
    const result = await redeemVoucherSQL(code);
    setVoucherResult(result);
    if (result.success) {
      await reloadData();
      showToast(result.message);
    } else {
      showToast(`QR Algılandı (${code}): ${result.message}`);
    }
  };

  // Handle Authentication Submission (in-memory, zero sessionStorage)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SECURE_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Hatalı şifre. Lütfen tekrar deneyiniz.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    setPasswordError('');
  };

  // Manual appointment creation via SQL INSERT
  const handleCreateManualAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApt.fullName || !newApt.plateNumber || !newApt.phone) {
      showToast('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    const createdApt: AppointmentData = {
      id: `ESSE-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      vehicleType: newApt.vehicleType,
      selectedServices: [SERVICES_LIST[0]],
      date: newApt.date,
      time: newApt.time,
      totalDurationMinutes: 45,
      customer: {
        fullName: newApt.fullName,
        phone: newApt.phone,
        plateNumber: newApt.plateNumber.toUpperCase().trim(),
        carModel: newApt.carModel || 'Belirtilmedi',
        notes: newApt.notes,
      },
      status: 'confirmed',
    };

    await insertAppointmentSQL(createdApt);
    await reloadData();
    setIsAddModalOpen(false);
    showToast(`Yeni randevu başarıyla eklendi (#${createdApt.id})`);

    setNewApt({
      fullName: '',
      phone: '',
      plateNumber: '',
      carModel: '',
      vehicleType: 'sedan',
      date: todayStr,
      time: '09:30 - 10:30 (1. Peron)',
      notes: '',
    });
  };

  // Test native push notification
  const handleTestNativePush = async () => {
    const perm = await requestNativeNotificationPermission();
    if (perm === 'granted') {
      sendNativePushNotification(
        '🔔 Esse Detailing Canlı Bildirim Testi',
        'Bildirim sistemi sorunsuz çalışıyor. Randevu durum güncellemeleriniz bu cihazda anlık görüntülenecektir.'
      );
      showToast('Gerçek tarayıcı bildiriminiz başarıyla iletildi!');
    } else {
      showToast('Lütfen tarayıcınızın bildirim iznini etkinleştiriniz.');
    }
  };

  // =========================================================================
  // LOGIN SCREEN
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-zinc-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/15 bg-zinc-900/90 shadow-2xl glass-panel space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/25">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Yetkili Yönetici Girişi</h1>
            <p className="text-xs text-zinc-400">
              {business.name} yönetim merkezine erişmek için 8 haneli güvenli yönetici şifrenizi giriniz.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Yönetici şifresi"
                maxLength={32}
                autoFocus
                className="w-full px-4 py-3 text-center tracking-widest text-sm bg-black/60 border border-white/15 rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
              />
              {passwordError && (
                <div className="text-rose-400 text-xs font-bold text-center mt-2 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              Yönetici Paneline Giriş Yap
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ana Sayfaya Geri Dön</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-24">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-5 left-1/2 z-60 px-5 py-3 rounded-2xl bg-amber-500 text-black font-black text-xs shadow-2xl flex items-center gap-2 border border-amber-300 pointer-events-none"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/20">
              ES
            </div>
            <div>
              <div className="font-black text-sm tracking-tight flex items-center gap-2">
                <span>{business.name} Yönetim Merkezi</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Canlı Sistem
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Gerçek Zamanlı Randevu, İptal ve Sadakat Kartı Yönetimi
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsD1ModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Cloudflare D1 SQL Veritabanı ve Şema Yönetimi"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Cloudflare D1 SQL</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">+ Yeni Randevu Ekle</span>
              <span className="sm:hidden">+ Randevu</span>
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-zinc-300 text-xs transition-colors"
              title="Siteye Dön"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs transition-colors cursor-pointer"
              title="Güvenli Çıkış"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Aktif Randevular</div>
            <div className="text-2xl font-black text-zinc-100 mt-1">{metrics.active}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Sırada Bekleyen / İşlemde</div>
          </div>

          <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-xl">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Onaylanan</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">{metrics.confirmed}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Peronu Hazır</div>
          </div>

          <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-xl">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Yıkamada</div>
            <div className="text-2xl font-black text-blue-400 mt-1">{metrics.inProgress}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">İşlem Devam Ediyor</div>
          </div>

          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-xl">
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">İptal Edilenler</div>
            <div className="text-2xl font-black text-rose-400 mt-1">{metrics.cancelled}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Müşteri / İşletme İptalleri</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
          {/* TAB 1: Aktif Randevular */}
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
            <span>Aktif Randevular ({activeAppointments.length})</span>
          </button>

          {/* TAB 2: İptal Edilen Randevular (Requested by user) */}
          <button
            type="button"
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'cancelled'
                ? 'bg-rose-600 text-white shadow-lg font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>İptal Edilen Randevular ({cancelledAppointments.length})</span>
          </button>

          {/* TAB 3: Dijital Sadakat (5 Damga) */}
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
            <span>Dijital Sadakat (5 Damga) Kartı ({loyaltyProfiles.length})</span>
          </button>

          {/* TAB 4: İnternet Bildirim Merkezi */}
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'notifications'
                ? 'bg-amber-500 text-black shadow-lg font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>İnternet Bildirim Merkezi ({systemEvents.length})</span>
          </button>

          {/* TAB 5: 4 Peron Kapasite Planı */}
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
            <span>4 Peron Doluluk Kontrolü</span>
          </button>

          {/* TAB 6: Raporlar & Ciro (Gün Sonu) */}
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-black shadow-lg font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Ciro & Gün Sonu Raporları</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: AKTİF RANDEVULAR                                          */}
        {/* ================================================================= */}
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
                  placeholder="İsim, plaka, telefon veya araç ara..."
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
                <option value="confirmed">Onaylanan</option>
                <option value="in_progress">Yıkamada</option>
                <option value="pending">Onay Bekleyen</option>
              </select>
            </div>

            {/* List */}
            {filteredActiveAppointments.length === 0 ? (
              <div className="p-12 text-center border border-white/10 rounded-3xl bg-zinc-900/40 text-zinc-400 space-y-3">
                <Calendar className="w-10 h-10 mx-auto text-zinc-600" />
                <div className="font-bold text-sm text-zinc-300">Aktif randevu bulunamadı.</div>
                <p className="text-xs text-zinc-500">
                  Yeni bir randevu eklemek için sağ üstteki "+ Yeni Randevu Ekle" butonunu kullanabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActiveAppointments.map((apt) => {
                  const plate = apt.customer.plateNumber.toUpperCase().trim();

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

                          {apt.status === 'confirmed' && (
                            <span className="px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider bg-cyan-500/15 border-cyan-500/30 text-cyan-400">
                              ✓ Onaylandı
                            </span>
                          )}
                          {apt.status === 'in_progress' && (
                            <span className="px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider bg-blue-500/15 border-blue-500/30 text-blue-400">
                              🫧 Yıkamada
                            </span>
                          )}
                          {(apt.status === 'pending' || apt.status === 'sent_via_whatsapp') && (
                            <span className="px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider bg-amber-500/15 border-amber-500/30 text-amber-400">
                              ⏳ Onay Bekliyor
                            </span>
                          )}
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
                            Hizmetler:
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

                      {/* LIVE WASH STAGE STRIP (Feature 1) */}
                      {apt.status === 'in_progress' && (
                        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-300">Yıkama Aşaması:</span>
                            <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-200 font-mono font-black border border-blue-400/30 flex items-center gap-1.5">
                              <span>{WASH_STAGE_LABELS[apt.washStage || 'foam_prewash'].icon}</span>
                              <span>{WASH_STAGE_LABELS[apt.washStage || 'foam_prewash'].name}</span>
                              <span className="text-[10px] opacity-75">%{WASH_STAGE_LABELS[apt.washStage || 'foam_prewash'].percent}</span>
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdvanceWashStage(apt)}
                            className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-black font-black text-xs transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <span>Aşamayı İlerlet ➔</span>
                          </button>
                        </div>
                      )}

                      {/* ACTION BUTTONS (MANDATORY EXACT BUTTONS FROM USER SPEC) */}
                      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1. [✓ Onayla / Yıkamaya Al] */}
                          <button
                            type="button"
                            onClick={() => handleApproveAppointment(apt.id)}
                            className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>
                              {apt.status === 'confirmed' ? '✓ Yıkamaya Al' : '✓ Onayla / Yıkamaya Al'}
                            </span>
                          </button>

                          {/* 2. [★ Tamamla & Damga Ver] */}
                          <button
                            type="button"
                            onClick={() => handleCompleteAppointment(apt.id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>★ Tamamla & Damga Ver</span>
                          </button>

                          {/* Quick Notification Response Drawer Trigger */}
                          <button
                            type="button"
                            onClick={() => setQuickNotifDrawerApt(apt)}
                            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Özelleştirilebilir Anlık Push Bildirimi Gönder"
                          >
                            <Bell className="w-3.5 h-3.5 animate-bounce text-amber-400" />
                            <span>🔔 Hızlı Bildirim</span>
                          </button>

                          {/* 3. [✕ Randevuyu İptal Et] */}
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                            <span>✕ Randevuyu İptal Et</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Photo Inspection Trigger (Feature 3) */}
                          <button
                            type="button"
                            onClick={() => setPhotoModalApt(apt)}
                            className="px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>📸 Fotoğraf ({apt.photos?.length || 0})</span>
                          </button>

                          {/* 4. [☎ Telefonla Ara] */}
                          <button
                            type="button"
                            onClick={() => handleCallCustomer(apt.customer.phone)}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 text-amber-400" />
                            <span>☎ Telefonla Ara</span>
                          </button>

                          {/* 5. [🗑 Sil] */}
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

        {/* ================================================================= */}
        {/* TAB 2: İPTAL EDİLEN RANDEVULAR (NEWEST AT TOP)                    */}
        {/* ================================================================= */}
        {activeTab === 'cancelled' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="İptal edilenler arasında isim, plaka veya telefon ara..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-800/80 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-800/80 border border-white/10 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setCancelledFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    cancelledFilter === 'all' ? 'bg-rose-600 text-white font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tümü ({cancelledAppointments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCancelledFilter('customer')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    cancelledFilter === 'customer' ? 'bg-rose-600 text-white font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  👤 Müşteri İptalleri
                </button>
                <button
                  type="button"
                  onClick={() => setCancelledFilter('admin')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    cancelledFilter === 'admin' ? 'bg-rose-600 text-white font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🏢 İşletme İptalleri
                </button>
              </div>
            </div>

            {filteredCancelledAppointments.length === 0 ? (
              <div className="p-12 text-center border border-white/10 rounded-3xl bg-zinc-900/40 text-zinc-400 space-y-3">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                <div className="font-bold text-sm text-zinc-300">İptal edilen randevu kaydı bulunmuyor.</div>
                <p className="text-xs text-zinc-500">
                  Müşteri veya yönetici tarafından iptal edilen randevular burada en üstte listelenir.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCancelledAppointments.map((apt) => {
                  const plate = apt.customer.plateNumber.toUpperCase().trim();
                  const isCustomerCancelled = apt.cancelledBy === 'customer';

                  return (
                    <div
                      key={apt.id}
                      className="p-5 rounded-3xl border border-rose-500/25 bg-zinc-900/80 space-y-4 shadow-xl"
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-black text-base text-zinc-100">
                            {apt.customer.fullName}
                          </span>

                          <span className="px-3 py-1 rounded-xl bg-zinc-800 border border-white/20 font-mono font-black text-rose-400 text-sm tracking-wider">
                            {plate}
                          </span>

                          {isCustomerCancelled ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 text-amber-400">
                              👤 Müşteri Tarafından İptal Edildi
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 border border-rose-500/30 text-rose-400">
                              🏢 İşletme Tarafından İptal Edildi
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-zinc-400">
                          {apt.cancelledAt && (
                            <span className="font-mono text-zinc-300">
                              İptal Zamanı: {new Date(apt.cancelledAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.cancelledAt).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                          <div className="text-[10px] text-zinc-400 font-bold uppercase">Planlanan Tarih & Saat:</div>
                          <div className="font-black text-zinc-200">{formatTurkishDate(apt.date)}</div>
                          <div className="text-amber-400 font-bold">{apt.time}</div>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                          <div className="text-[10px] text-zinc-400 font-bold uppercase">İletişim & Araç:</div>
                          <div className="font-bold text-zinc-200">{apt.customer.carModel || 'Araç'}</div>
                          <div className="font-mono text-zinc-400">{apt.customer.phone}</div>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                          <div className="text-[10px] text-zinc-400 font-bold uppercase">İptal Açıklaması:</div>
                          <div className="text-rose-300 font-medium">
                            {apt.cancellationReason || 'Açıklama belirtilmedi'}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReactivateAppointment(apt.id)}
                            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>🔄 Yeniden Aktif Et</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCallCustomer(apt.customer.phone)}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 text-amber-400" />
                            <span>☎ Telefonla Ara</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAppointment(apt.id)}
                          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>🗑 Kalıcı Olarak Sil</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: DİJİTAL SADAKAT (5 DAMGA) KARTI YÖNETİMİ                   */}
        {/* ================================================================= */}
        {activeTab === 'loyalty' && (
          <div className="space-y-4">
            {/* QR & Voucher Code Validation Box (Feature 6) */}
            <form onSubmit={handleVerifyAndRedeemVoucher} className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-black border border-amber-500/35 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black shrink-0 shadow-md shadow-amber-500/25">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-xs text-amber-400">5/5 QR Kupon & Hediye Yıkama Doğrulama</div>
                  <div className="text-[11px] text-zinc-400">Müşterinin telefonundaki QR kodunu, kupon kodunu (VIP-ESSE-xxxx) veya plakasını yazınız</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  placeholder="Örn: VIP-ESSE-9482 veya 09 DB 482"
                  className="px-3.5 py-2 text-xs bg-zinc-950 border border-white/20 rounded-xl font-mono text-amber-400 placeholder-zinc-500 uppercase focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
                  title="Kamerayla QR Oku"
                >
                  <Camera className="w-4 h-4" />
                  <span>📷 QR Oku</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
                >
                  Doğrula & Hediyeyi Teslim Et
                </button>
              </div>
            </form>

            {voucherResult && (
              <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                voucherResult.success ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}>
                <span>{voucherResult.message}</span>
                <button type="button" onClick={() => setVoucherResult(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STICKY TOP SEARCH & FILTER BAR (Requested by user) */}
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl space-y-3 sticky top-16 z-30 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={loyaltySearch}
                    onChange={(e) => setLoyaltySearch(e.target.value)}
                    placeholder="Müşteri adı (Muhittin), plaka veya telefon yazarak anında bulun..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-800 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Sort dropdown */}
                <select
                  value={loyaltySort}
                  onChange={(e) => setLoyaltySort(e.target.value as any)}
                  className="py-2.5 px-3 text-xs bg-zinc-800 border border-white/10 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer shrink-0"
                >
                  <option value="stamps_desc">En Çok Damga (Azalan)</option>
                  <option value="stamps_asc">En Az Damga (Artan)</option>
                  <option value="date_desc">Son İşlem Tarihi</option>
                </select>
              </div>

              {/* Stamp Count Filter Pills (0/5, 1/5, 2/5, 3/5, 4/5, 5/5) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                <span className="text-[11px] font-bold text-zinc-400 uppercase mr-1">Damga Filtresi:</span>
                {['all', '0', '1', '2', '3', '4', '5'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setLoyaltyStampFilter(f)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                      loyaltyStampFilter === f
                        ? 'bg-amber-500 text-black font-black'
                        : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {f === 'all' ? 'Tümü' : f === '5' ? '🎁 5/5 (Hediye Hazır)' : `${f}/5 Damga`}
                  </button>
                ))}
              </div>
            </div>

            {/* Loyalty Cards Grid */}
            {filteredLoyaltyProfiles.length === 0 ? (
              <div className="p-12 text-center border border-white/10 rounded-3xl bg-zinc-900/40 text-zinc-400 space-y-3">
                <Award className="w-10 h-10 mx-auto text-zinc-600" />
                <div className="font-bold text-sm text-zinc-300">Bu aramaya uygun müşteri sadakat kartı bulunamadı.</div>
                <p className="text-xs text-zinc-500">
                  Tamamlanan her randevuda müşterilerin dijital sadakat kartı burada otomatik olarak oluşturulur.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLoyaltyProfiles.map((profile) => {
                  const isFull = profile.stamps >= 5;

                  return (
                    <div
                      key={profile.plate}
                      onClick={() => setSelectedLoyaltyCustomer(profile)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-4 shadow-xl ${
                        isFull
                          ? 'border-amber-500/50 bg-amber-500/[0.05] hover:border-amber-400'
                          : 'border-white/10 bg-zinc-900/80 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-black text-sm text-zinc-100">{profile.fullName || 'Müşteri'}</div>
                          <div className="font-mono text-xs text-zinc-400 mt-0.5">{profile.phone}</div>
                        </div>

                        <span className="px-2.5 py-1 rounded-xl bg-zinc-800 border border-white/15 font-mono font-black text-amber-400 text-xs">
                          {profile.plate}
                        </span>
                      </div>

                      {/* 5-Stamp Visual Hole Bar */}
                      <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 font-semibold">Sadakat Durumu</span>
                          <span className={`font-mono font-black ${isFull ? 'text-amber-400' : 'text-zinc-300'}`}>
                            {profile.stamps}/5 Damga
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map((i) => {
                            const isStamped = i <= profile.stamps;
                            const isGift = i === 5;
                            return (
                              <div
                                key={i}
                                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                                  isStamped
                                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                                    : isGift
                                    ? 'border border-dashed border-amber-500/40 text-amber-400'
                                    : 'bg-zinc-800 text-zinc-600'
                                }`}
                              >
                                {isStamped ? '✓' : isGift ? '🎁' : i}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {isFull && (
                        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black flex items-center gap-2">
                          <Gift className="w-4 h-4 shrink-0 animate-bounce" />
                          <span>5 Damga Tamamlandı! Hediye Cilalı Yıkama Hakkı Açık!</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                        <span>{profile.history?.length || 0} Damga Geçmişi</span>
                        <span className="text-amber-400 font-bold hover:underline">Detayları Gör ➔</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: İNTERNET BİLDİRİM MERKEZİ (NO WHATSAPP - REAL SYSTEM LOG) */}
        {/* ================================================================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-zinc-100 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Sistem İnternet Bildirim Akışı</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Randevu onayları, peron işlemleri, iptaller ve sadakat damgaları için tarayıcı native push kayıtları
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestNativePush}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Tarayıcı Test Bildirimi Gönder</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearSystemEvents();
                    reloadData();
                    showToast('Bildirim kayıtları temizlendi.');
                  }}
                  className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Temizle
                </button>
              </div>
            </div>

            {systemEvents.length === 0 ? (
              <div className="p-12 text-center border border-white/10 rounded-3xl bg-zinc-900/40 text-zinc-400 space-y-3">
                <Bell className="w-10 h-10 mx-auto text-zinc-600" />
                <div className="font-bold text-sm text-zinc-300">Henüz bildirim kaydı oluşmadı.</div>
                <p className="text-xs text-zinc-500">
                  Müşteri randevu oluşturduğunda, admin onayladığında, tamamladığında veya iptal ettiğinde anlık kayıtlar burada birikir.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {systemEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl border border-white/10 bg-zinc-900/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-black text-sm text-zinc-100 flex items-center gap-2">
                        <span>{ev.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {new Date(ev.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} - {new Date(ev.timestamp).toLocaleDateString('tr-TR')}
                      </span>
                    </div>

                    <p className="text-zinc-300 leading-relaxed">{ev.message}</p>

                    {(ev.plate || ev.customerName) && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-400">
                        {ev.plate && (
                          <span className="font-mono bg-zinc-800 text-amber-400 px-2 py-0.5 rounded border border-white/10 font-bold">
                            {ev.plate}
                          </span>
                        )}
                        {ev.customerName && <span>{ev.customerName}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: 4 PERON KAPASİTE DOLULUK PLANI                             */}
        {/* ================================================================= */}
        {activeTab === 'capacity' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl">
              <h3 className="text-sm font-black text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>4 Peron Günlük Saat Dilimi Planı ({todayStr})</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Her saat diliminde maksimum 4 araç kabul edilir. Dolu olan peronlar müşteri randevu ekranından otomatik gizlenir.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HOUR_WINDOWS_LIST.map((slot) => {
                const bookedInSlot = activeAppointments.filter(
                  (a) => a.date === todayStr && a.time.includes(slot)
                );
                const count = bookedInSlot.length;
                const isFull = count >= 4;

                return (
                  <div
                    key={slot}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isFull
                        ? 'border-rose-500/40 bg-rose-500/5'
                        : count > 0
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-white/10 bg-zinc-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="font-black text-sm text-zinc-100">{slot}</span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        isFull ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {count}/4 Peron Dolu
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {[1, 2, 3, 4].map((peronIndex) => {
                        const booked = bookedInSlot.find((a) => a.time.includes(`${peronIndex}. Peron`));
                        return (
                          <div
                            key={peronIndex}
                            className={`p-2 rounded-xl text-center border text-[11px] font-bold ${
                              booked
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                : 'bg-white/[0.02] border-white/10 text-zinc-500'
                            }`}
                          >
                            <div className="text-[10px] text-zinc-400 uppercase">{peronIndex}. Peron</div>
                            <div className="font-black truncate mt-0.5">
                              {booked ? booked.customer.plateNumber : 'Müsait'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: CİRO, ANALİTİK & GÜN SONU RAPORLARI (Feature 5)            */}
        {/* ================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Header with Print & Copy Actions */}
            <div className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <span>Gün Sonu Raporu & İşletme Analitiği</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatTurkishDate(todayStr)} tarihli istasyon performans, ciro ve peron doluluk analizi
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDailyReport}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>📋 Gün Sonu Özetini Kopyala</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl border border-white/15 hover:bg-white/10 text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır / PDF</span>
                </button>
              </div>
            </div>

            {/* Metrics 4-Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-1">
                <div className="text-[11px] font-bold uppercase text-zinc-400">Bugün Yıkanan Araç</div>
                <div className="text-2xl font-black text-emerald-400">
                  {allAppointments.filter((a) => a.date === todayStr && a.status === 'completed').length} Araç
                </div>
                <div className="text-[10px] text-zinc-500">Tamamlandı & Teslim Edildi</div>
              </div>

              <div className="p-4 rounded-3xl bg-zinc-900/80 border border-amber-500/30 space-y-1">
                <div className="text-[11px] font-bold uppercase text-amber-400">Tahmini Günlük Ciro</div>
                <div className="text-2xl font-black text-amber-400">
                  {liveAnalytics.estimatedDailyRevenue.toLocaleString('tr-TR')} ₺
                </div>
                <div className="text-[10px] text-zinc-500">D1 Gerçek Hizmet Fiyatları</div>
              </div>

              <div className="p-4 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-1">
                <div className="text-[11px] font-bold uppercase text-zinc-400">Ortalama Yıkama Süresi</div>
                <div className="text-2xl font-black text-cyan-400">
                  {liveAnalytics.averageWashMinutes > 0 ? `~${liveAnalytics.averageWashMinutes} Dakika` : '0 Dakika'}
                </div>
                <div className="text-[10px] text-zinc-500">Peron Başına Hız (D1)</div>
              </div>

              <div className="p-4 rounded-3xl bg-zinc-900/80 border border-purple-500/30 space-y-1">
                <div className="text-[11px] font-bold uppercase text-purple-400">Sadakat Ödülü Kullanan</div>
                <div className="text-2xl font-black text-purple-300">
                  {liveAnalytics.loyaltyGiftEligibleCount} Müşteri
                </div>
                <div className="text-[10px] text-zinc-500">5/5 Damga Tamamlandı</div>
              </div>
            </div>

            {/* Service Breakdown & Peron Efficiency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Popular Services */}
              <div className="p-5 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-3">
                <h4 className="text-xs font-black uppercase text-zinc-300 tracking-wider">
                  En Çok Tercih Edilen Hizmetler
                </h4>
                {liveAnalytics.popularServices.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-zinc-950/60 border border-white/5 text-center text-zinc-500 text-xs">
                    Henüz işlem görmüş hizmet bulunmuyor (D1 verisi boş)
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {liveAnalytics.popularServices.map((s, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-zinc-200 font-bold">
                          <span>{s.name}</span>
                          <span className="font-mono text-amber-400">{s.count} Araç ({s.share})</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: s.share }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4 Peron Efficiency */}
              <div className="p-5 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-3">
                <h4 className="text-xs font-black uppercase text-zinc-300 tracking-wider">
                  4 Peron Günlük Doluluk Oranı
                </h4>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {liveAnalytics.peronOccupancy.map((p, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                      <div className="text-[10px] text-zinc-400 font-bold">{p.peron}</div>
                      <div className={`text-lg font-black ${p.color}`}>{p.rate}</div>
                      <div className="text-[10px] text-zinc-500">{p.count} işlem gördü</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL: CUSTOMER LOYALTY CARD DETAIL MODAL (Requested by user)       */}
      {/* =================================================================== */}
      <AnimatePresence>
        {selectedLoyaltyCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-xl p-6 rounded-3xl border border-amber-500/40 bg-zinc-950 shadow-2xl space-y-5 text-zinc-100 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500 text-black font-black">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black leading-tight">
                      {selectedLoyaltyCustomer.fullName} - Sadakat Kartı
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      {selectedLoyaltyCustomer.plate} · {selectedLoyaltyCustomer.phone}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLoyaltyCustomer(null)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 5-Stamp VIP Visual Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    ESSE VIP Sadakat Durumu
                  </span>
                  <span className="font-mono font-black text-sm text-zinc-100">
                    {selectedLoyaltyCustomer.stamps}/5 Damga
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((i) => {
                    const isStamped = i <= selectedLoyaltyCustomer.stamps;
                    const isGift = i === 5;
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-black transition-all ${
                          isStamped
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/30'
                            : isGift
                            ? 'border-2 border-dashed border-amber-500/50 text-amber-400'
                            : 'bg-zinc-800 text-zinc-600'
                        }`}
                      >
                        {isStamped ? '✓' : isGift ? <Gift className="w-5 h-5" /> : i}
                        <span className="text-[8px] font-black uppercase mt-0.5">
                          {isStamped ? 'ESSE' : isGift ? 'HEDİYE' : `${i}.`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {selectedLoyaltyCustomer.stamps >= 5 && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Gift className="w-4 h-4 shrink-0" />
                      <span>5 Damga Tamamlandı! Hediye Cilalı Yıkama Verilebilir.</span>
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = redeemGiftStamp(selectedLoyaltyCustomer.plate);
                        await redeemVoucherSQL(selectedLoyaltyCustomer.plate);
                        if (updated) {
                          setSelectedLoyaltyCustomer(updated);
                          await reloadData();
                          showToast('🎁 Hediye yıkama hakkı teslim edildi ve kart sıfırlandı!');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs cursor-pointer shadow-md active:scale-95"
                    >
                      Hediyeyi Teslim Et & Sıfırla
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Stamp Adjustment Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const next = Math.min(5, selectedLoyaltyCustomer.stamps + 1);
                    setCustomerStampsDirect(selectedLoyaltyCustomer.plate, next);
                    await saveLoyaltyStampSQL(selectedLoyaltyCustomer.plate, next, selectedLoyaltyCustomer.fullName, selectedLoyaltyCustomer.phone);
                    setSelectedLoyaltyCustomer((prev) => prev ? { ...prev, stamps: next } : null);
                    await reloadData();
                    showToast(`${selectedLoyaltyCustomer.plate} için +1 damga eklendi.`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-xs border border-amber-500/30 cursor-pointer transition-colors"
                >
                  +1 Damga Ekle
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const next = Math.max(0, selectedLoyaltyCustomer.stamps - 1);
                    setCustomerStampsDirect(selectedLoyaltyCustomer.plate, next);
                    await saveLoyaltyStampSQL(selectedLoyaltyCustomer.plate, next, selectedLoyaltyCustomer.fullName, selectedLoyaltyCustomer.phone);
                    setSelectedLoyaltyCustomer((prev) => prev ? { ...prev, stamps: next } : null);
                    await reloadData();
                    showToast(`${selectedLoyaltyCustomer.plate} için 1 damga silindi.`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs border border-white/10 cursor-pointer transition-colors"
                >
                  -1 Damga Sil
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setCustomerStampsDirect(selectedLoyaltyCustomer.plate, 0);
                    await saveLoyaltyStampSQL(selectedLoyaltyCustomer.plate, 0, selectedLoyaltyCustomer.fullName, selectedLoyaltyCustomer.phone);
                    setSelectedLoyaltyCustomer((prev) => prev ? { ...prev, stamps: 0 } : null);
                    await reloadData();
                    showToast('Damgalar sıfırlandı.');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/25 cursor-pointer transition-colors"
                >
                  Sıfırla
                </button>
              </div>

              {/* Stamp History List */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="text-xs font-black text-zinc-300 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Kazanılan Damga Geçmişi</span>
                </div>

                {(!selectedLoyaltyCustomer.history || selectedLoyaltyCustomer.history.length === 0) ? (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-zinc-500">
                    Henüz kayıtlı damga geçmişi bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedLoyaltyCustomer.history.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-zinc-200">
                            {h.serviceNames?.join(', ') || 'Randevu Tamamlama'}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {h.note || `Randevu: #${h.appointmentId}`}
                          </div>
                        </div>

                        <div className="text-right text-[11px] font-mono text-amber-400">
                          {new Date(h.awardedAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* MODAL: MANUAL APPOINTMENT CREATION                                  */}
      {/* =================================================================== */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg p-6 rounded-3xl border border-white/15 bg-zinc-950 shadow-2xl space-y-4 text-zinc-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-black font-black">
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-100">Yeni Randevu Oluştur</h2>
                    <p className="text-xs text-zinc-400">İstasyon paneline doğrudan randevu ekleyin</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManualAppointment} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Müşteri Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    value={newApt.fullName}
                    onChange={(e) => setNewApt({ ...newApt, fullName: e.target.value })}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Telefon Numarası *</label>
                    <input
                      type="tel"
                      required
                      value={newApt.phone}
                      onChange={(e) => setNewApt({ ...newApt, phone: e.target.value })}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Araç Plakası *</label>
                    <input
                      type="text"
                      required
                      value={newApt.plateNumber}
                      onChange={(e) => setNewApt({ ...newApt, plateNumber: e.target.value.toUpperCase() })}
                      placeholder="09 DB 482"
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-amber-400 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Araç Modeli</label>
                    <input
                      type="text"
                      value={newApt.carModel}
                      onChange={(e) => setNewApt({ ...newApt, carModel: e.target.value })}
                      placeholder="Örn: BMW 320i"
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Randevu Tarihi</label>
                    <input
                      type="date"
                      value={newApt.date}
                      onChange={(e) => setNewApt({ ...newApt, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Saat & Peron Seçimi</label>
                  <select
                    value={newApt.time}
                    onChange={(e) => setNewApt({ ...newApt, time: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {HOUR_WINDOWS_LIST.flatMap((hour) =>
                      [1, 2, 3, 4].map((p) => (
                        <option key={`${hour}-${p}`} value={`${hour} (${p}. Peron)`}>
                          {hour} ({p}. Peron)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Özel Notlar</label>
                  <textarea
                    rows={2}
                    value={newApt.notes}
                    onChange={(e) => setNewApt({ ...newApt, notes: e.target.value })}
                    placeholder="Müşteri talepleri veya özel yıkama notu..."
                    className="w-full px-3.5 py-2 text-xs bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-bold text-zinc-400 cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Randevuyu Sisteme Kaydet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* MODAL: VEHICLE INSPECTION PHOTO ATTACHMENT (Feature 3)              */}
      {/* =================================================================== */}
      <AnimatePresence>
        {photoModalApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg p-6 rounded-3xl border border-purple-500/40 bg-zinc-950 shadow-2xl space-y-4 text-zinc-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-purple-500 text-white font-black">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-100">Araç Ekspertiz & Teslim Fotoğrafı Ekle</h2>
                    <p className="text-xs text-zinc-400">
                      #{photoModalApt.id} - {photoModalApt.customer.plateNumber} ({photoModalApt.customer.fullName})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPhotoModalApt(null)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddInspectionPhoto} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">Fotoğraf Aşaması</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoType('before');
                        setPhotoLabel('Giriş Çizik / Jant Durumu');
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        photoType === 'before'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-black'
                          : 'bg-zinc-900 border-white/10 text-zinc-400'
                      }`}
                    >
                      📸 Giriş / Öncesi Fotoğrafı
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPhotoType('after');
                        setPhotoLabel('Teslim / Parlayan Sonuç');
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        photoType === 'after'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                          : 'bg-zinc-900 border-white/10 text-zinc-400'
                      }`}
                    >
                      ✨ Teslim / Sonrası Fotoğrafı
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Açıklama / Başlık</label>
                  <input
                    type="text"
                    required
                    value={photoLabel}
                    onChange={(e) => setPhotoLabel(e.target.value)}
                    placeholder="Örn: Sol kapı hafif çizik tespiti veya Jant parlatma sonucu"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Görsel Seçimi / URL</label>
                  <input
                    type="text"
                    required
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://... veya aşağıdaki hazır görsellerden seçin"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Pre-set Quick Samples */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase">Hızlı Hazır Görsel Şablonları:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Ön Yıkama', url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Detaylı İç', url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Cilalı Parlaklık', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80' },
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoUrl(sample.url)}
                        className="p-1.5 rounded-xl border border-white/10 bg-zinc-900 hover:border-purple-500/50 text-left transition-all"
                      >
                        <img src={sample.url} alt={sample.label} className="w-full h-14 object-cover rounded-lg mb-1" />
                        <span className="text-[10px] font-bold text-zinc-300 block truncate">{sample.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPhotoModalApt(null)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-bold text-zinc-400 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Fotoğrafı Randevuya Kaydet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* DRAWER: QUICK NOTIFICATION RESPONSE DRAWER                          */}
      {/* =================================================================== */}
      <AnimatePresence>
        {quickNotifDrawerApt && (
          <QuickNotificationDrawer
            isOpen={Boolean(quickNotifDrawerApt)}
            onClose={() => setQuickNotifDrawerApt(null)}
            appointment={quickNotifDrawerApt}
            isDarkMode={isDarkMode}
            onNotificationSent={(title) => {
              reloadData();
              showToast(`"${title}" bildirimi başarıyla iletildi.`);
            }}
          />
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* MODAL: QR CODE SCANNER MODAL                                        */}
      {/* =================================================================== */}
      <AnimatePresence>
        {isQrScannerOpen && (
          <QrCodeScannerModal
            isOpen={isQrScannerOpen}
            onClose={() => setIsQrScannerOpen(false)}
            onScan={handleQrScan}
            eligibleCustomers={loyaltyProfiles.filter((p) => p.stamps >= 5)}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* MODAL: CLOUDFLARE D1 SQL SETUP UTILITY & SCHEMA MANAGEMENT          */}
      {/* =================================================================== */}
      <AnimatePresence>
        {isD1ModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl p-6 rounded-3xl border border-cyan-500/40 bg-zinc-950 shadow-2xl space-y-5 text-zinc-100 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black flex items-center gap-2">
                      <span>Cloudflare D1 SQL Veritabanı & Şema Yönetimi</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Canlı SQL
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Kalıcı sunucu veritabanı, otomatik şema oluşturucu ve D1 SQL konsolu
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsD1ModalOpen(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Platform</div>
                  <div className="font-mono font-bold text-cyan-400 text-xs truncate">
                    {d1Status?.platform || 'Cloudflare Edge'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">D1 Bağlantısı</div>
                  <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Aktif & Senkron</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Randevu Kaydı</div>
                  <div className="font-mono font-bold text-amber-400 text-xs">
                    {allAppointments.length} Randevu
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Sadakat / Müşteri</div>
                  <div className="font-mono font-bold text-purple-400 text-xs">
                    {loyaltyProfiles.length} Müşteri
                  </div>
                </div>
              </div>

              {/* SECTION 1: Automatic Schema Initialization Setup Utility */}
              <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.03] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5" />
                      <span>Otomatik D1 SQL Şema Başlatıcı (Setup Utility)</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      appointments, customers, loyalty_profiles ve system_notifications tablolarını otomatik oluşturur.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isD1Initializing}
                    onClick={handleRunD1SchemaInit}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>{isD1Initializing ? 'Oluşturuluyor...' : 'Şemayı Başlat & Doğrula'}</span>
                  </button>
                </div>

                {d1InitLogs.length > 0 && (
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] space-y-1 text-zinc-300">
                    {d1InitLogs.map((log, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-cyan-400">›</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: Interactive D1 SQL Console */}
              <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cloudflare D1 SQL Konsolu (Test & Sorgulama)</span>
                  </h3>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-zinc-500">Hazır Şablonlar:</span>
                    <button
                      type="button"
                      onClick={() => setSqlQueryInput('SELECT id, customer_plate_number, status, time FROM appointments LIMIT 5;')}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-mono"
                    >
                      appointments
                    </button>
                    <button
                      type="button"
                      onClick={() => setSqlQueryInput('SELECT plate, full_name, stamps, voucher_code FROM loyalty_profiles LIMIT 5;')}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-mono"
                    >
                      loyalty
                    </button>
                    <button
                      type="button"
                      onClick={() => setSqlQueryInput('SELECT plate_number, full_name, phone, total_visits FROM customers LIMIT 5;')}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-mono"
                    >
                      customers
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={sqlQueryInput}
                    onChange={(e) => setSqlQueryInput(e.target.value)}
                    placeholder="SELECT * FROM appointments;"
                    className="w-full p-2.5 text-xs bg-black/60 border border-white/10 rounded-xl font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">
                      Standard SQLite / Cloudflare D1 SQL sözdizimi geçerlidir.
                    </span>

                    <button
                      type="button"
                      disabled={sqlExecuting}
                      onClick={handleExecuteSql}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>{sqlExecuting ? 'Çalıştırılıyor...' : 'Sorguyu Çalıştır'}</span>
                    </button>
                  </div>
                </div>

                {sqlQueryResults && (
                  <div className="mt-2 p-3 rounded-xl bg-black border border-white/10 font-mono text-[11px] max-h-40 overflow-y-auto">
                    <div className="text-[10px] font-bold text-zinc-500 mb-1">
                      Sonuç ({sqlQueryResults.length} satır):
                    </div>
                    {sqlQueryResults.length === 0 ? (
                      <div className="text-zinc-500">Kayıt bulunamadı.</div>
                    ) : (
                      <pre className="text-zinc-300 overflow-x-auto">
                        {JSON.stringify(sqlQueryResults, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 3: Cloudflare Wrangler Deployment Note (Kod 10021 Çözümü) */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5 text-zinc-300">
                <div className="font-black text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cloudflare Wrangler D1 Dağıtım Rehberi (Hata 10021 Önlemi)</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Cloudflare API, <code className="text-amber-300 font-mono">database_id</code> değeri geçersiz bir metin olduğunda 10021 hatası verir.
                  Wrangler ile yeni D1 veritabanı oluşturmak için terminalde aşağıdaki komutları kullanabilirsiniz:
                </p>
                <div className="p-2 rounded-lg bg-black/60 font-mono text-[10px] text-zinc-300 space-y-0.5 border border-white/5">
                  <div>1. <span className="text-amber-400">npx wrangler d1 create esse-db</span></div>
                  <div>2. Çıkan UUID değerini <span className="text-cyan-400">wrangler.toml</span> dosyasındaki <code className="text-white">database_id</code> satırına ekleyin.</div>
                  <div>3. <span className="text-amber-400">npx wrangler d1 execute esse-db --file=./schema.sql</span></div>
                  <div>4. <span className="text-emerald-400">npx wrangler deploy</span></div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsD1ModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
