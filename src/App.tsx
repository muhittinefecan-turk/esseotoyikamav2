/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
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

import { 
  AppointmentData, 
  BusinessConfig, 
  CustomerFormData, 
  ServiceItem, 
  VehicleCategory 
} from './types';
import { SERVICES_LIST } from './data/servicesData';
import { VEHICLE_TYPES } from './data/businessConfig';
import { 
  getStoredAppointments, 
  saveAppointmentToStorage, 
  deleteStoredAppointment, 
  getBusinessConfig
} from './utils/storage';
import { generateAppointmentId } from './utils/formatters';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [business] = useState<BusinessConfig>(() => getBusinessConfig());
  const [appointments, setAppointments] = useState<AppointmentData[]>(() => getStoredAppointments());

  // Stepper State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCategory>('sedan');
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([SERVICES_LIST[0]]);

  // Date and Time State
  const getInitialDate = () => {
    const d = new Date();
    // If today is Sunday, default to Monday
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

  // Customer Form State
  const [customerData, setCustomerData] = useState<CustomerFormData>({
    fullName: '',
    phone: '',
    email: '',
    plateNumber: '',
    carModel: '',
    notes: '',
  });

  // Current Active Appointment
  const [activeAppointment, setActiveAppointment] = useState<AppointmentData | null>(null);

  // Appointments Modal
  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(false);

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
  const handleProceedToConfirmation = () => {
    const newAppointment: AppointmentData = {
      id: generateAppointmentId(),
      createdAt: new Date().toISOString(),
      vehicleType: selectedVehicle,
      selectedServices,
      date: selectedDate,
      time: selectedTime,
      totalDurationMinutes: totalDuration,
      customer: { ...customerData },
      status: 'pending',
    };

    setActiveAppointment(newAppointment);
    saveAppointmentToStorage(newAppointment);
    setAppointments(getStoredAppointments());
    setCurrentStep(4);
    scrollToBooking();
  };

  const handleAppointmentSentViaWp = () => {
    if (activeAppointment) {
      const updated: AppointmentData = {
        ...activeAppointment,
        status: 'sent_via_whatsapp',
      };
      setActiveAppointment(updated);
      saveAppointmentToStorage(updated);
      setAppointments(getStoredAppointments());
    }
  };

  const handleCancelAppointment = (aptToCancel: AppointmentData) => {
    deleteStoredAppointment(aptToCancel.id);
    setAppointments(getStoredAppointments());
    if (activeAppointment?.id === aptToCancel.id) {
      setActiveAppointment(null);
    }
    // Return to step 2 so user can re-book on that same time or pick another
    setCurrentStep(2);
    scrollToBooking();
  };

  const handleRebook = (pastApt: AppointmentData) => {
    setSelectedVehicle(pastApt.vehicleType);
    setSelectedServices(pastApt.selectedServices);
    setSelectedDate(pastApt.date);
    setSelectedTime(pastApt.time);
    setCustomerData({ ...pastApt.customer });
    setCurrentStep(2);
    scrollToBooking();
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedServices([SERVICES_LIST[0]]);
    setCustomerData({
      fullName: '',
      phone: '',
      email: '',
      plateNumber: '',
      carModel: '',
      notes: '',
    });
    setActiveAppointment(null);
    scrollToBooking();
  };

  const handleDeleteAppointment = (id: string) => {
    deleteStoredAppointment(id);
    setAppointments(getStoredAppointments());
    if (activeAppointment?.id === id) {
      setActiveAppointment(null);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors relative overflow-hidden ${
      isDarkMode ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {/* Background ambient orbs for Glassmorphism */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] ambient-glow-amber pointer-events-none blur-[120px] -z-10 opacity-70" />
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] ambient-glow-cyan pointer-events-none blur-[120px] -z-10 opacity-40" />

      {/* Top Navbar */}
      <Navbar
        business={business}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onOpenAppointments={() => setIsAppointmentsModalOpen(true)}
        appointmentsCount={appointments.length}
      />

      <main className="flex-1">
        {/* Hero Section with Glassmorphism and Real Visuals */}
        <HeroSection
          business={business}
          isDarkMode={isDarkMode}
          onScrollToBooking={scrollToBooking}
        />

        {/* Booking App Area */}
        <div ref={bookingRef} className="py-6 sm:py-10 max-w-4xl mx-auto px-3 sm:px-6">
          <BookingStepper
            currentStep={currentStep}
            onStepClick={(step) => {
              setCurrentStep(step);
              scrollToBooking();
            }}
            isDarkMode={isDarkMode}
          />

          {/* Stepper Views with Soft Fade-In-Up Page Transitions */}
          <div className="mt-4 sm:mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -18, filter: 'blur(4px)' }}
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
                    onChange={setCustomerData}
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

        {/* Working Hours & Location Map */}
        <LocationAndHours business={business} isDarkMode={isDarkMode} />

        {/* Customer Reviews */}
        <ReviewsSection isDarkMode={isDarkMode} />
      </main>

      {/* Footer */}
      <Footer
        business={business}
        isDarkMode={isDarkMode}
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* PWA In-App Install Prompt Banner */}
      <InstallPwaPrompt isDarkMode={isDarkMode} />

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
