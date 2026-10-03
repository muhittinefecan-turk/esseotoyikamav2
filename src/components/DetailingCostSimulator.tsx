import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  Clock, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  ChevronRight, 
  Car, 
  Layers, 
  Gauge, 
  HelpCircle,
  Flame
} from 'lucide-react';
import { VehicleCategory, ServiceItem } from '../types';
import { SERVICES_LIST } from '../data/servicesData';
import { formatDuration } from '../utils/formatters';

interface SimulatorProps {
  isDarkMode: boolean;
  onApplyPackage: (vehicle: VehicleCategory, services: ServiceItem[]) => void;
}

export const DetailingCostSimulator: React.FC<SimulatorProps> = ({ isDarkMode, onApplyPackage }) => {
  const [vehicle, setVehicle] = useState<VehicleCategory>('sedan');
  const [paintState, setPaintState] = useState<'mild' | 'medium' | 'heavy'>('medium');
  const [interiorState, setInteriorState] = useState<'clean' | 'stained' | 'heavy'>('stained');
  const [addons, setAddons] = useState<string[]>(['motor', 'rain']);

  // Toggle addons
  const toggleAddon = (id: string) => {
    setAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  // Calculate matching services
  const calculatePackage = () => {
    const selected: ServiceItem[] = [];

    // Always base wash
    const baseWash = SERVICES_LIST.find((s) => s.id === 'cilali-yikama');
    if (baseWash) selected.push(baseWash);

    // Paint service
    if (paintState === 'mild') {
      const s = SERVICES_LIST.find((s) => s.id === 'hizli-cila');
      if (s) selected.push(s);
    } else if (paintState === 'medium') {
      const s = SERVICES_LIST.find((s) => s.id === 'pasta-cila');
      if (s) selected.push(s);
    } else if (paintState === 'heavy') {
      const s = SERVICES_LIST.find((s) => s.id === 'seramik-kaplama');
      if (s) selected.push(s);
    }

    // Interior service
    if (interiorState === 'stained' || interiorState === 'heavy') {
      const s = SERVICES_LIST.find((s) => s.id === 'koltuk-yikama');
      if (s) selected.push(s);
    }

    // Addons
    if (addons.includes('motor')) {
      const s = SERVICES_LIST.find((s) => s.id === 'motor-yikama');
      if (s) selected.push(s);
    }
    if (addons.includes('headlight')) {
      const s = SERVICES_LIST.find((s) => s.id === 'far-parlatma');
      if (s) selected.push(s);
    }
    if (addons.includes('ozon')) {
      const s = SERVICES_LIST.find((s) => s.id === 'ozon-sterilizasyon');
      if (s) selected.push(s);
    }
    if (addons.includes('rain')) {
      const s = SERVICES_LIST.find((s) => s.id === 'cam-su-itici');
      if (s) selected.push(s);
    }

    // Total duration calculation
    let vehicleExtra = 0;
    if (vehicle === 'suv') vehicleExtra = 15;
    if (vehicle === 'commercial') vehicleExtra = 25;

    const totalMinutes = selected.reduce((sum, s) => sum + s.durationMinutes + vehicleExtra, 0);

    return {
      services: selected,
      totalMinutes,
      difficulty: paintState === 'heavy' || interiorState === 'heavy' ? 'Ağır Detay & Restorasyon' : 'Standart Profesyonel Bakım',
      bay: totalMinutes > 150 ? 'Peron 1 (Detaylı Bakım)' : 'Peron 2 (Hızlı & Periyodik Yıkama)',
    };
  };

  const calculated = calculatePackage();

  const handleApply = () => {
    onApplyPackage(vehicle, calculated.services);
  };

  return (
    <section className="py-12 sm:py-16 max-w-5xl mx-auto px-3 sm:px-6">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Calculator className="w-3.5 h-3.5" />
          <span>Akıllı Paket & Süre Simülatörü</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          Aracınıza Özel İşlem ve Süre Hesaplayın
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          Aracınızın mevcut durumunu seçin; ihtiyacınız olan işlemleri, tahmini süreyi ve uygun peronu anında belirleyelim.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Interactive Choices */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Araç Tipi */}
          <div className={`p-4 sm:p-5 rounded-3xl border glass-panel space-y-3 ${
            isDarkMode ? 'border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Car className="w-4 h-4" />
              <span>1. Araç Kasanız</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sedan', label: 'Sedan / HB' },
                { id: 'suv', label: 'SUV / Crossover' },
                { id: 'commercial', label: 'Ticari / Minibüs' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setVehicle(t.id as VehicleCategory)}
                  className={`p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                    vehicle === t.id
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                      : isDarkMode
                      ? 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06]'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Boya Durumu */}
          <div className={`p-4 sm:p-5 rounded-3xl border glass-panel space-y-3 ${
            isDarkMode ? 'border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>2. Kaporta & Boya Durumu</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'mild', label: 'İyi Durumda', desc: 'Sadece parlaklık & cila gerekir' },
                { id: 'medium', label: 'Kılcal Çizikler', desc: 'Fırça ve hare izleri var' },
                { id: 'heavy', label: 'Mat & Güneş Yanığı', desc: 'Ağır çizik, solmuş vernik' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPaintState(p.id as 'mild' | 'medium' | 'heavy')}
                  className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                    paintState === p.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : isDarkMode
                      ? 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06]'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <div className="text-xs font-black">{p.label}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. İç Koltuk Durumu */}
          <div className={`p-4 sm:p-5 rounded-3xl border glass-panel space-y-3 ${
            isDarkMode ? 'border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              <span>3. İç Mekan & Koltuk Kirliliği</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'clean', label: 'Normal Toz', desc: 'Standart süpürge yeterli' },
                { id: 'stained', label: 'Su & İçecek Lekeleri', desc: 'Kumaşta belirgin lekeler' },
                { id: 'heavy', label: 'Ağır Kir & Çamur', desc: 'Kapsamlı buharlı yıkama şart' },
              ].map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setInteriorState(i.id as 'clean' | 'stained' | 'heavy')}
                  className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                    interiorState === i.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : isDarkMode
                      ? 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06]'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <div className="text-xs font-black">{i.label}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{i.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Ek Bakım Tercihleri */}
          <div className={`p-4 sm:p-5 rounded-3xl border glass-panel space-y-3 ${
            isDarkMode ? 'border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>4. Ekstra Dokunuşlar (İsteğe Bağlı)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'motor', label: 'Motor Temizleme & Koruma' },
                { id: 'headlight', label: 'Far Camı Parlatma' },
                { id: 'ozon', label: 'Ozon Klima Sterilizasyonu' },
                { id: 'rain', label: 'Su İtici Yağmur Kaydırıcı' },
              ].map((addon) => {
                const isSelected = addons.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                        : isDarkMode
                        ? 'border-white/10 bg-white/[0.02] text-zinc-400 hover:text-zinc-200'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    <span>{addon.label}</span>
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-amber-500 text-black font-black' : 'border border-zinc-500'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Calculated Output & CTA */}
        <div className="lg:col-span-5 sticky top-24">
          <div className={`p-6 rounded-3xl border glass-panel space-y-5 shadow-2xl relative overflow-hidden ${
            isDarkMode ? 'border-amber-500/40 text-zinc-100' : 'bg-white border-amber-500/35 text-zinc-900'
          }`}>
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Önerilen Paket</span>
                <h3 className="text-lg font-black text-amber-400">{calculated.difficulty}</h3>
              </div>
              <div className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-400 text-xs font-bold border border-amber-500/30">
                Simülasyon
              </div>
            </div>

            {/* Time and Bay Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-1">
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tahmini Süre</span>
                </div>
                <div className="text-xl font-black text-amber-400">
                  ~{formatDuration(calculated.totalMinutes)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-1">
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-semibold">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Uygun Peron</span>
                </div>
                <div className="text-xs font-black text-zinc-100 truncate">
                  {calculated.bay}
                </div>
              </div>
            </div>

            {/* Service Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 block">Dahil Edilen Hizmetler ({calculated.services.length}):</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {calculated.services.map((s) => (
                  <div
                    key={s.id}
                    className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold truncate max-w-[200px]">{s.name}</span>
                    <span className="text-[11px] text-zinc-400 shrink-0">~{s.durationMinutes} dk</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Policy Note */}
            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[11px] text-zinc-300 leading-relaxed">
              💡 <strong>Yerinde Fiyat Politikası:</strong> Kesin fiyat aracınız Esse Oto Yıkama'ya geldiğinde boya kalınlığı, çizik derinliği ve kir oranına göre şeffafça belirlenir.
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={handleApply}
              className="w-full py-4 px-6 rounded-2xl font-black text-sm text-black glass-button flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>Bu Paketi Seç ve Randevuya Geç</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
