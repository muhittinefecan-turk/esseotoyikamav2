/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { CompactHeroBar } from './components/HeroSection';
import { BookingStepper } from './components/BookingStepper';
import { Step1Services } from './components/Step1Services';
import { Step2DateTime } from './components/Step2DateTime';
import { Step3CustomerInfo } from './components/Step3CustomerInfo';
import { Step4Confirmation } from './components/Step4Confirmation';
import { MyAppointmentsModal } from './components/MyAppointmentsModal';
import { LocationAndHours } from './components/LocationAndHours';
import { ReviewsSection } from './components/ReviewsSection';
import { Footer } from './components/Footer';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { LoyaltyCardModal } from './components/LoyaltyCardModal';
import { CountdownWidget } from './components/CountdownWidget';
import { CarCareGuide } from './components/CarCareGuide';
import { FaqSection } from './components/FaqSection';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationPermissionBanner } from './components/NotificationPermissionBanner';
import { WeatherWidget } from './components/WeatherWidget';
import { LiveWashProgressTracker } from './components/LiveWashProgressTracker';
import { useAppointmentNotificationWatcher } from './hooks/useAppointmentNotificationWatcher';
import { Bell, X as XCloseIcon, Zap } from 'lucide-react';

import { 
  AppointmentData, 
  BusinessConfig, 
  CustomerFormData, 
  ServiceItem, 
  VehicleCategory,
  SystemNotificationEvent
} from './types';
import { SERVICES_LIST } from './data/servicesData';
import { VEHICLE_TYPES } from './data/businessConfig';
import { 
  getBusinessConfig,
  getActiveAppointments,
  getSavedCustomerProfile,
  saveCustomerProfile
} from './utils/storage';
import {
  checkAndInitializeSchema,
  fetchAppointmentsSQL,
  fetchActiveAppointmentsSQL,
  insertAppointmentSQL,
  cancelAppointmentSQL,
  deleteAppointmentSQL,
  saveCustomerSQL,
  fetchCustomerSQL,
} from './services/db';
import { generateAppointmentId } from './utils/formatters';
import { sendNativePushNotification } from './utils/notifications';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [business] = useState<BusinessConfig>(() => getBusinessConfig());
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const { activeAlert, dismissAlert } = useAppointmentNotificationWatcher();

  // Real-time live system notification alert state
  const [liveSystemAlert, setLiveSystemAlert] = useState<{ id: string; title: string; message: string } | null>(null);

  useEffect(() => {
    if (liveSystemAlert) {
      const timer = setTimeout(() => setLiveSystemAlert(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [liveSystemAlert]);

  // Service Worker Registration & Real-Time System Notification Event Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Register Service Worker for native background notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('Service Worker registration failed:', err));

      // 2. Service Worker Message Listener (e.g. notification click)
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NOTIFICATION_CLICK') {
          setIsAppointmentsModalOpen(true);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSwMessage);

      // 3. Real-Time System Notification Listener (auto-triggers browser notification without manual WhatsApp)
      const handleSystemNotification = (e: Event) => {
        const customEvent = e as CustomEvent<SystemNotificationEvent>;
        if (customEvent.detail) {
          const ev = customEvent.detail;

          // Dispatch to service worker for native notification tray
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SHOW_NOTIFICATION',
              title: ev.title,
              body: ev.message,
              icon: '/icon-192.png',
              tag: ev.id,
            });
          } else {
            sendNativePushNotification(ev.title, ev.message, ev.id);
          }

          // Show in-app live alert toast
          setLiveSystemAlert({
            id: ev.id,
            title: ev.title,
            message: ev.message,
          });

          // Sync data immediately
          setAppointments(getActiveAppointments());
        }
      };

      window.addEventListener('esse_notification_event', handleSystemNotification);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
        window.removeEventListener('esse_notification_event', handleSystemNotification);
      };
    }
  }, []);

  // Keep appointments state in live sync across any updates & initial D1 load
  useEffect(() => {
    // 1. Startup Table Schema Check (appointments, customers, loyalty)
    checkAndInitializeSchema().catch(() => {});

    // 2. Fetch Active Appointments via SQL
    fetchActiveAppointmentsSQL().then((list) => {
      setAppointments(list);
    });

    // 3. Load Saved Customer Profile via SQL
    fetchCustomerSQL().then((cust) => {
      if (cust) {
        setCustomerData({
          fullName: cust.fullName || '',
          phone: cust.phone || '',
          email: cust.email || '',
          plateNumber: cust.plateNumber || '',
          carModel: cust.carModel || '',
          notes: '',
        });
      }
    });

    const handleSync = () => {
      fetchActiveAppointmentsSQL().then((list) => {
        setAppointments(list);
      });
    };
    window.addEventListener('esse_data_updated', handleSync);
    return () => {
      window.removeEventListener('esse_data_updated', handleSync);
    };
  }, []);

  // Stepper State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCategory>('sedan');
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([SERVICES_LIST[0]]);
  const [reschedulingAppointmentId, setReschedulingAppointmentId] = useState<string | null>(null);

  // Date and Time State
  const getInitialDate = () => {
    const d = new Date();
    // If today is past closing time (18:30) or Sunday, advance to next open day
    if (d.getHours() >= 18 && d.getMinutes() >= 30) {
      d.setDate(d.getDate() + 1);
    } else if (d.getHours() >= 19) {
      d.setDate(d.getDate() + 1);
    }
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getInitialDate);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Customer Form State - Saved once, auto-filled forever
  const [customerData, setCustomerData] = useState<CustomerFormData>(() => {
    const saved = getSavedCustomerProfile();
    if (saved) return saved;
    return {
      fullName: '',
      phone: '',
      email: '',
      plateNumber: '',
      carModel: '',
      notes: '',
    };
  });

  const handleUpdateCustomerData = (data: CustomerFormData) => {
    setCustomerData(data);
    saveCustomerProfile(data);
    saveCustomerSQL(data).catch(() => {});
  };

  // Current Active Appointment
  const [activeAppointment, setActiveAppointment] = useState<AppointmentData | null>(null);

  // Appointments Modal
  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(false);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);

  // Admin Mode Route & State (/admin or #/admin or ?admin=true)
  const checkIsAdminPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path === '/admin' ||
      path.startsWith('/admin/') ||
      hash === '#/admin' ||
      hash === '#admin' ||
      search.includes('admin=true')
    );
  };

  const [isAdminMode, setIsAdminMode] = useState<boolean>(checkIsAdminPath);

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminMode(checkIsAdminPath());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const openAdmin = () => {
    setIsAdminMode(true);
    try {
      window.history.pushState(null, '', '/admin');
    } catch {
      window.location.hash = '#/admin';
    }
  };

  const exitAdmin = () => {
    setIsAdminMode(false);
    try {
      window.history.pushState(null, '', '/');
    } catch {
      window.location.hash = '';
    }
  };

  const bookingRef = useRef<HTMLDivElement>(null);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-zinc-950 text-zinc-100 antialiased selection:bg-amber-500 selection:text-black';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-zinc-50 text-zinc-900 antialiased selection:bg-amber-500 selection:text-black';
    }
  }, [isDarkMode]);

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleToggleService = (service: ServiceItem) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  // Duration Calculation only
  const vehicleConfig = VEHICLE_TYPES.find((v) => v.id === selectedVehicle) || VEHICLE_TYPES[0];
  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + s.durationMinutes + (s.category === 'wash' || s.category === 'detail' ? vehicleConfig.timeExtraMinutes : 0),
    0
  );

  // Proceed to Step 4
  const handleProceedToConfirmation = async () => {
    // If rescheduling an existing appointment, delete the old appointment so duplicates never occur
    if (reschedulingAppointmentId) {
      await deleteAppointmentSQL(reschedulingAppointmentId);
      setReschedulingAppointmentId(null);
    }

    const newAppointment: AppointmentData = {
      id: generateAppointmentId(),
      createdAt: new Date().toISOString(),
      vehicleType: selectedVehicle,
      selectedServices,
      date: selectedDate,
      time: selectedTime,
      totalDurationMinutes: totalDuration,
      customer: { ...customerData },
      status: 'confirmed',
    };

    setActiveAppointment(newAppointment);
    // Persist directly via SQL INSERT / D1 binding
    await insertAppointmentSQL(newAppointment);
    const updatedList = await fetchActiveAppointmentsSQL();
    setAppointments(updatedList);
    setCurrentStep(4);
    scrollToBooking();
  };

  const handleAppointmentSentViaWp = () => {
    if (activeAppointment) {
      fetchActiveAppointmentsSQL().then(setAppointments);
    }
  };

  const handleCancelAppointment = async (aptToCancel: AppointmentData) => {
    await cancelAppointmentSQL(aptToCancel.id, 'customer', 'Müşteri randevusunu iptal etti');
    const updatedList = await fetchActiveAppointmentsSQL();
    setAppointments(updatedList);
    if (activeAppointment?.id === aptToCancel.id) {
      setActiveAppointment(null);
    }
    // Return to step 2 so user can re-book on that same time or pick another
    setCurrentStep(2);
    scrollToBooking();
  };

  const handleRebook = (pastApt: AppointmentData) => {
    setReschedulingAppointmentId(pastApt.id);
    setSelectedVehicle(pastApt.vehicleType);
    setSelectedServices(pastApt.selectedServices);
    setSelectedDate(pastApt.date);
    setSelectedTime(pastApt.time);
    setCustomerData({ ...pastApt.customer });
    setCurrentStep(2);
    scrollToBooking();
  };

  const handleReset = async () => {
    setReschedulingAppointmentId(null);
    setCurrentStep(1);
    setSelectedServices([SERVICES_LIST[0]]);
    // Retrieve saved customer profile via SQL
    const profile = await fetchCustomerSQL();
    setCustomerData({
      fullName: profile?.fullName || '',
      phone: profile?.phone || '',
      email: profile?.email || '',
      plateNumber: profile?.plateNumber || '',
      carModel: profile?.carModel || '',
      notes: '',
    });
    setActiveAppointment(null);
    scrollToBooking();
  };

  const handleDeleteAppointment = async (id: string) => {
    await deleteAppointmentSQL(id);
    const updatedList = await fetchAppointmentsSQL();
    setAppointments(updatedList.filter((a) => a.status !== 'cancelled' && a.status !== 'completed'));
    if (activeAppointment?.id === id) {
      setActiveAppointment(null);
    }
  };

  // Render Admin Dashboard if on /admin route
  if (isAdminMode) {
    return (
      <AdminDashboard
        business={business}
        isDarkMode={isDarkMode}
        onExitAdmin={exitAdmin}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors relative overflow-hidden ${
      isDarkMode ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {/* Background ambient orbs for Glassmorphism */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] ambient-glow-amber pointer-events-none blur-[120px] -z-10 opacity-70" />
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] ambient-glow-cyan pointer-events-none blur-[120px] -z-10 opacity-40" />

      {/* Real-Time Internet In-App Notification Banner (1-Saat & 4-Saat Bildirimleri) */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="sticky top-0 z-50 px-4 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black shadow-2xl border-b border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-black text-amber-400 flex items-center justify-center font-black shrink-0 shadow-md">
                <Bell className="w-4 h-4 animate-bounce stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[11px] font-black tracking-wider uppercase">
                  {activeAlert.title}
                </div>
                <div className="text-xs font-bold text-black/90">
                  {activeAlert.message}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsAppointmentsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-black text-white hover:bg-zinc-900 text-xs font-black shadow-sm cursor-pointer active:scale-95"
              >
                Randevumu İncele
              </button>
              <button
                type="button"
                onClick={dismissAlert}
                className="p-1 rounded-xl bg-black/15 hover:bg-black/30 text-black font-black cursor-pointer"
                title="Kapat"
              >
                <XCloseIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time System Notification Toast (Native Push event listener) */}
      <AnimatePresence>
        {liveSystemAlert && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-60 w-full max-w-lg px-4 pointer-events-none"
          >
            <div className="p-4 rounded-2xl bg-zinc-950/95 border border-amber-500/50 shadow-2xl text-zinc-100 flex items-start justify-between gap-3 pointer-events-auto backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0 font-black shadow-md shadow-amber-500/20">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <div className="font-black text-xs text-amber-400">{liveSystemAlert.title}</div>
                  <div className="text-[11px] text-zinc-300 mt-0.5 leading-snug">{liveSystemAlert.message}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLiveSystemAlert(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Kapat"
              >
                <XCloseIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Notification Permission Banner */}
      <NotificationPermissionBanner isDarkMode={isDarkMode} />

      {/* Top Navbar */}
      <Navbar
        business={business}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onOpenAppointments={() => setIsAppointmentsModalOpen(true)}
        onOpenLoyalty={() => setIsLoyaltyModalOpen(true)}
        onOpenAdmin={openAdmin}
        appointmentsCount={appointments.length}
      />

      <main className="flex-1">
        {/* Compact Trust & Header Strip - Takes minimal vertical height so booking is instantly on-screen */}
        <CompactHeroBar
          business={business}
          isDarkMode={isDarkMode}
        />

        {/* Live Weather Forecast & 48-Hour Rain Guarantee Banner (Feature 2) */}
        <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-2 pb-1">
          <WeatherWidget isDarkMode={isDarkMode} />
        </div>

        {/* Live Wash Progress Tracker (Feature 1) */}
        {(activeAppointment?.status === 'in_progress' || (appointments.length > 0 && appointments[0].status === 'in_progress')) && (
          <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-2">
            <LiveWashProgressTracker
              appointment={activeAppointment || appointments[0]}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Live Appointment Countdown Widget (If appointment exists) */}
        <CountdownWidget
          appointment={activeAppointment || (appointments.length > 0 ? appointments[0] : null)}
          isDarkMode={isDarkMode}
          onViewAppointment={() => setIsAppointmentsModalOpen(true)}
        />

        {/* Quick Rebook Bar for repeat customers (Feature 4) */}
        {appointments.length > 0 && (
          <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => handleRebook(appointments[0])}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Son Randevumu Tek Tıkla Tekrarla ({appointments[0].customer.plateNumber})</span>
            </button>
          </div>
        )}

        {/* Booking App Area - DIRECTLY AT TOP WITHOUT SCROLLING */}
        <div ref={bookingRef} className="pt-2 pb-8 max-w-4xl mx-auto px-3 sm:px-6">
          {/* Sticky Stepper Bar - Stays Fixed on Screen */}
          <div className={`sticky top-14 sm:top-16 z-30 pt-2 pb-1 backdrop-blur-2xl transition-all ${
            isDarkMode ? 'bg-zinc-950/85' : 'bg-white/85'
          }`}>
            <BookingStepper
              currentStep={currentStep}
              onStepClick={(step) => {
                setCurrentStep(step);
                scrollToBooking();
              }}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Stepper Views with Soft Fade-In-Up Page Transitions */}
          <div className="mt-3 sm:mt-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20, filter: 'blur(3px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -16, filter: 'blur(3px)' }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {currentStep === 1 && (
                  <Step1Services
                    selectedVehicle={selectedVehicle}
                    onSelectVehicle={setSelectedVehicle}
                    selectedServices={selectedServices}
                    onToggleService={handleToggleService}
                    onNext={() => {
                      setCurrentStep(2);
                      scrollToBooking();
                    }}
                    isDarkMode={isDarkMode}
                  />
                )}

                {currentStep === 2 && (
                  <Step2DateTime
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    selectedTime={selectedTime}
                    onSelectTime={setSelectedTime}
                    onNext={() => {
                      setCurrentStep(3);
                      scrollToBooking();
                    }}
                    onBack={() => {
                      setCurrentStep(1);
                      scrollToBooking();
                    }}
                    isDarkMode={isDarkMode}
                    existingAppointments={appointments}
                  />
                )}

                {currentStep === 3 && (
                  <Step3CustomerInfo
                    formData={customerData}
                    onChange={handleUpdateCustomerData}
                    onNext={handleProceedToConfirmation}
                    onBack={() => {
                      setCurrentStep(2);
                      scrollToBooking();
                    }}
                    isDarkMode={isDarkMode}
                  />
                )}

                {currentStep === 4 && activeAppointment && (
                  <Step4Confirmation
                    appointment={activeAppointment}
                    business={business}
                    onBack={() => {
                      setCurrentStep(3);
                      scrollToBooking();
                    }}
                    onReset={handleReset}
                    onAppointmentSent={handleAppointmentSentViaWp}
                    onCancelAppointment={handleCancelAppointment}
                    isDarkMode={isDarkMode}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* 1. Interactive Before / After Comparison Slider */}
        <BeforeAfterSlider isDarkMode={isDarkMode} />

        {/* 2. Seasonal Car Care Guide & Intervals */}
        <CarCareGuide isDarkMode={isDarkMode} />

        {/* Working Hours & Location Map */}
        <LocationAndHours business={business} isDarkMode={isDarkMode} />

        {/* 4. Searchable Interactive FAQ Section */}
        <FaqSection isDarkMode={isDarkMode} />

        {/* Customer Reviews */}
        <ReviewsSection isDarkMode={isDarkMode} />
      </main>

      {/* Footer */}
      <Footer
        business={business}
        isDarkMode={isDarkMode}
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onOpenAdmin={openAdmin}
      />

      {/* PWA In-App Install Prompt Banner */}
      <InstallPwaPrompt isDarkMode={isDarkMode} />

      {/* Digital Loyalty Stamp Card Modal */}
      <LoyaltyCardModal
        isOpen={isLoyaltyModalOpen}
        onClose={() => setIsLoyaltyModalOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* My Stored Appointments Modal */}
      <MyAppointmentsModal
        isOpen={isAppointmentsModalOpen}
        onClose={() => setIsAppointmentsModalOpen(false)}
        appointments={appointments}
        business={business}
        onDelete={handleDeleteAppointment}
        onRebook={handleRebook}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
