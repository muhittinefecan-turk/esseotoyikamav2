import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Clock, Car, Truck, Sparkles, Shield, Droplets, Wrench, ChevronRight, Table, Info } from 'lucide-react';
import { ServiceItem, VehicleCategory } from '../types';
import { SERVICES_LIST } from '../data/servicesData';
import { VEHICLE_TYPES } from '../data/businessConfig';
import { formatDuration } from '../utils/formatters';

interface Step1ServicesProps {
  selectedVehicle: VehicleCategory;
  onSelectVehicle: (v: VehicleCategory) => void;
  selectedServices: ServiceItem[];
  onToggleService: (service: ServiceItem) => void;
  onNext: () => void;
  isDarkMode: boolean;
}

export const Step1Services: React.FC<Step1ServicesProps> = ({
  selectedVehicle,
  onSelectVehicle,
  selectedServices,
  onToggleService,
  onNext,
  isDarkMode,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showTableModal, setShowTableModal] = useState<boolean>(false);

  const vehicleConfig = VEHICLE_TYPES.find((v) => v.id === selectedVehicle) || VEHICLE_TYPES[0];

  const getServiceDuration = (service: ServiceItem) => {
    return service.durationMinutes + (service.category === 'wash' || service.category === 'detail' ? vehicleConfig.timeExtraMinutes : 0);
  };

  const filteredServices = activeCategory === 'all'
    ? SERVICES_LIST
    : SERVICES_LIST.filter((s) => s.category === activeCategory);

  const totalDuration = selectedServices.reduce((sum, s) => sum + getServiceDuration(s), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6 pb-28 sm:pb-32"
    >
      {/* Vehicle Type Selector */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs sm:text-sm font-bold tracking-wider uppercase text-zinc-400">
            1. Araç Segmentini Seçin
          </label>
          <span className="text-[11px] text-amber-500 font-semibold">
            İşlem süresi aracınıza göre ayarlanır
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {VEHICLE_TYPES.map((type) => {
            const isSelected = selectedVehicle === type.id;
            return (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => onSelectVehicle(type.id)}
                className={`relative p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-xl ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-amber-500/20 border-amber-500 shadow-[0_8px_32px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
                      : 'bg-amber-50 border-amber-500 shadow-md ring-1 ring-amber-500'
                    : isDarkMode
                    ? 'glass-panel border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      isSelected
                        ? 'bg-amber-500 text-black shadow-md'
                        : isDarkMode ? 'bg-white/10 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {type.id === 'sedan' && <Car className="w-5 h-5" />}
                      {type.id === 'suv' && <Car className="w-5 h-5 stroke-[2.2]" />}
                      {type.id === 'commercial' && <Truck className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm tracking-tight">{type.name}</div>
                      <div className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {type.description}
                      </div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-black'
                      : isDarkMode ? 'border-white/20' : 'border-zinc-300'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* TOP INLINE SUMMARY & QUICK NEXT BUTTON */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md ${
        selectedServices.length > 0
          ? 'glass-panel-amber border-amber-500/40 text-zinc-100'
          : 'glass-panel border-white/10 text-zinc-400'
      }`}>
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-black font-black text-xs shadow-md">
              {selectedServices.length}
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-200">
                {selectedServices.length > 0 ? (
                  <span>Seçilen Hizmet: <strong className="text-amber-400">{selectedServices.length} Adet</strong></span>
                ) : (
                  <span>Lütfen aşağıdan hizmet seçiniz</span>
                )}
              </div>
              <div className="text-[11px] text-zinc-400">
                {totalDuration > 0 ? `Toplam İşlem Süresi: ~${formatDuration(totalDuration)}` : 'Süre otomatik hesaplanır'} · Fiyat: Araç başında
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={selectedServices.length === 0}
          onClick={onNext}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            selectedServices.length > 0
              ? 'glass-button text-black active:scale-95 shadow-md shadow-amber-500/30'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
          }`}
        >
          <span>Tarih & Saat Seçimine Geç</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Notice About Dynamic Pricing */}
      <div className={`p-3.5 rounded-2xl border backdrop-blur-xl flex items-center gap-3 text-xs ${
        isDarkMode ? 'glass-panel border-white/10 text-zinc-300' : 'bg-amber-50/70 border-amber-200 text-amber-950'
      }`}>
        <Info className="w-4 h-4 text-amber-500 shrink-0" />
        <div className="leading-snug">
          <strong>Fiyatlandırma:</strong> Araç boyutuna, boya ve kirlilik durumuna göre ücretsiz ön inceleme sonrasında araç başında netleştirilir.
        </div>
      </div>

      {/* Category Tabs & Full Guide Modal Button */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <label className="text-xs sm:text-sm font-bold tracking-wider uppercase text-zinc-400">
            2. Hizmetleri Seçin
          </label>

          <button
            type="button"
            onClick={() => setShowTableModal(true)}
            className={`text-xs px-3 py-1.5 rounded-xl border glass-pill flex items-center gap-1.5 transition-all cursor-pointer ${
              isDarkMode
                ? 'border-white/10 text-amber-400 hover:bg-white/[0.08]'
                : 'bg-white border-zinc-200 text-amber-700 hover:bg-zinc-100 shadow-2xs'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tüm Hizmet & Süre Listesi</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'all', label: 'Tüm Hizmetler', icon: Sparkles },
            { id: 'wash', label: 'Yıkama & Temizlik', icon: Droplets },
            { id: 'detail', label: 'Detaylı Kuaför', icon: Sparkles },
            { id: 'coating', label: 'Pasta Cila & Seramik', icon: Shield },
            { id: 'extra', label: 'Ek Bakımlar', icon: Wrench },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer backdrop-blur-xl ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 border border-amber-400 scale-[1.02]'
                    : isDarkMode
                    ? 'glass-panel border-white/10 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-2xs'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Services Grid (Enhanced Glassmorphism Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 mt-3">
          {filteredServices.map((service) => {
            const isSelected = selectedServices.some((s) => s.id === service.id);
            const duration = getServiceDuration(service);

            return (
              <motion.div
                key={service.id}
                layout
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onToggleService(service)}
                className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer group ${
                  isSelected
                    ? isDarkMode
                      ? 'glass-panel-amber border-amber-500 shadow-[0_12px_36px_rgba(245,158,11,0.22)] ring-1 ring-amber-500/60'
                      : 'bg-amber-50/90 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                    : isDarkMode
                    ? 'glass-panel border-white/15 hover:border-white/25 hover:bg-white/[0.08]'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      {service.badge && (
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isSelected || service.popular
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isDarkMode
                            ? 'bg-white/10 text-zinc-300 border border-white/10'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {service.badge}
                        </span>
                      )}
                      <h3 className="font-extrabold text-base tracking-tight leading-snug">
                        {service.name}
                      </h3>
                    </div>

                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-amber-500 border-amber-500 text-black shadow-sm'
                        : isDarkMode
                        ? 'border-white/20 group-hover:border-white/40'
                        : 'border-zinc-300 group-hover:border-zinc-400'
                    }`}>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                      )}
                    </div>
                  </div>

                  {/* Short Description */}
                  <p className={`mt-2 text-xs leading-relaxed ${
                    isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
                  }`}>
                    {service.description}
                  </p>

                  {/* Features */}
                  {service.features && service.features.length > 0 && (
                    <ul className="mt-3 space-y-1.5 border-t pt-3 border-white/10">
                      {service.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px]">
                          <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className={isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Duration & Price Notice */}
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/10 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Tahmini Süre: ~{formatDuration(duration)}</span>
                  </div>

                  <span className="text-[11px] font-semibold text-zinc-400">
                    Yerinde Fiyat
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM INLINE CARD */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 shadow-xl ${
        selectedServices.length > 0
          ? 'glass-panel-amber border-amber-500/50'
          : 'glass-panel border-white/10'
      }`}>
        <div>
          <div className="text-sm font-extrabold text-zinc-100">
            Seçilen Hizmet Sayısı: <span className="text-amber-400">{selectedServices.length} Adet</span>
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            {totalDuration > 0 ? `Tahmini Bitiş Süresi: ~${formatDuration(totalDuration)}` : 'Hizmet seçiniz'} · Ödeme araç başında nakit veya FAST ile yapılır
          </div>
        </div>

        <button
          type="button"
          disabled={selectedServices.length === 0}
          onClick={onNext}
          className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            selectedServices.length > 0
              ? 'glass-button text-black active:scale-95 shadow-lg shadow-amber-500/30'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
          }`}
        >
          <span>Tarih & Saat Seçimine Geç</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* FIXED VIEWPORT BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-zinc-950/95 backdrop-blur-2xl border-t border-white/15 shadow-[0_-10px_35px_rgba(0,0,0,0.8)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-zinc-400">
              Seçilen: <strong className="text-amber-400">{selectedServices.length} Hizmet</strong>
            </span>
            <span className="text-xs font-black text-zinc-100 truncate">
              {totalDuration > 0 ? `~${formatDuration(totalDuration)}` : 'Hizmet seçin'}
            </span>
          </div>

          <button
            type="button"
            disabled={selectedServices.length === 0}
            onClick={onNext}
            className={`px-5 sm:px-7 py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedServices.length > 0
                ? 'glass-button text-black active:scale-95 shadow-md shadow-amber-500/30'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
            }`}
          >
            <span>Tarih & Saat Seçimine Geç</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full Services Modal Guide */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden glass-panel ${
            isDarkMode ? 'border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Hizmet Kataloğu & Tahmini Süreler</h3>
                  <p className="text-xs text-zinc-400">
                    Esse Oto Yıkama tüm hizmet açıklamaları ve ortalama süreleri.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTableModal(false)}
                className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold cursor-pointer hover:bg-white/10"
              >
                Kapat ✕
              </button>
            </div>

            <div className="p-3 sm:p-4 max-h-[70vh] overflow-y-auto space-y-2.5">
              {SERVICES_LIST.map((srv) => {
                const duration = getServiceDuration(srv);
                const isSelected = selectedServices.some((s) => s.id === srv.id);

                return (
                  <div
                    key={srv.id}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15'
                        : isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-zinc-200 bg-zinc-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{srv.name}</span>
                        {srv.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {srv.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 max-w-xl">
                        {srv.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-xs font-bold text-amber-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>~{formatDuration(duration)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleService(srv)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-black'
                            : isDarkMode ? 'bg-white/10 hover:bg-white/20 text-zinc-200' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800'
                        }`}
                      >
                        {isSelected ? 'Seçildi ✓' : '+ Ekle'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
