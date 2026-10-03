import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, FileText, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Plus, Sparkles, Shield, Clock, HelpCircle, X } from 'lucide-react';
import { CustomerFormData } from '../types';
import { formatPlate } from '../utils/formatters';

interface Step3CustomerInfoProps {
  formData: CustomerFormData;
  onChange: (data: CustomerFormData) => void;
  onNext: () => void;
  onBack: () => void;
  isDarkMode: boolean;
}

const PREFERENCE_CATEGORIES = [
  {
    title: 'Koltuk & İç Döşeme',
    icon: Sparkles,
    options: [
      'Koltukta kahve/içecek lekesi var',
      'Deri koltuklara besleyici koruma sütü',
      'Bebek koltuğu takılı, sökülmesin',
      'Tavan sarkma riski olmadan buharlı silinsin',
    ],
  },
  {
    title: 'Koku & Evcil Hayvan',
    icon: Shield,
    options: [
      'Bagajda kedi/köpek tüyü temizliği',
      'Ağır sigara veya nem kokusu ozonlama',
      'Klima hava menfezlerine antibakteriyel buhar',
      'Hafif kokusuz orijinal kalsın',
    ],
  },
  {
    title: 'Dış Kaporta & Motor',
    icon: CheckCircle2,
    options: [
      'Motor bölümü yıkanmasın (yalnızca kuru toz alma)',
      'Jant demir tozu ve balata temizliğine ekstra özen',
      'Ön cam ve kaputta reçine/sinek temizliği',
      'Kapı araları ve bagaj fitilleri detaylı silinsin',
    ],
  },
  {
    title: 'Zamanlama & Teslimat',
    icon: Clock,
    options: [
      'İşim acele, lütfen hızlı teslimat',
      'Saat 18:00\'e kadar teslim almam gerekiyor',
      'İşlem tamamlanınca WhatsApp\'tan haber verilsin',
    ],
  },
];

export const Step3CustomerInfo: React.FC<Step3CustomerInfoProps> = ({
  formData,
  onChange,
  onNext,
  onBack,
  isDarkMode,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [savedProfile, setSavedProfile] = useState<CustomerFormData | null>(() => {
    try {
      const stored = localStorage.getItem('esse_saved_customer');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleApplySavedProfile = () => {
    if (savedProfile) {
      onChange({
        ...formData,
        fullName: savedProfile.fullName || formData.fullName,
        phone: savedProfile.phone || formData.phone,
        email: savedProfile.email || formData.email,
        plateNumber: savedProfile.plateNumber || formData.plateNumber,
        carModel: savedProfile.carModel || formData.carModel,
      });
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    let cleaned = value;
    if (field === 'plateNumber') {
      cleaned = formatPlate(value);
    }
    onChange({
      ...formData,
      [field]: cleaned,
    });

    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleToggleOption = (option: string) => {
    const currentNotes = formData.notes?.trim() || '';
    if (currentNotes.includes(option)) {
      const filtered = currentNotes
        .split('\n')
        .filter((line) => !line.includes(option))
        .join('\n');
      handleInputChange('notes', filtered.trim());
    } else {
      const updated = currentNotes ? `${currentNotes}\n• ${option}` : `• ${option}`;
      handleInputChange('notes', updated);
    }
  };

  const handleClearNotes = () => {
    handleInputChange('notes', '');
  };

  const validateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName || formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Lütfen adınızı ve soyadınızı eksiksiz giriniz.';
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Lütfen geçerli bir cep telefonu numarası giriniz (örn: 05xx xxx xx xx).';
    }

    if (!formData.plateNumber || formData.plateNumber.trim().length < 5) {
      newErrors.plateNumber = 'Lütfen araç plakanızı giriniz (örn: 09 ABC 123).';
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Lütfen geçerli bir e-posta adresi giriniz.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (rememberMe) {
      try {
        localStorage.setItem('esse_saved_customer', JSON.stringify(formData));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }
    }

    onNext();
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onSubmit={validateAndProceed} 
      className="space-y-6 pb-20"
    >
      <div className="flex items-center justify-between border-b pb-3 border-white/10">
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight">Müşteri ve Araç Bilgileri</h2>
          <p className="text-xs text-zinc-400">
            Randevunuzun teyidi ve servis planlaması için bilgilerinizi giriniz.
          </p>
        </div>
      </div>

      {/* Quick Auto-Fill if Saved Customer in LocalStorage */}
      {savedProfile && (
        <div className="p-3.5 rounded-2xl border border-amber-500/35 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-zinc-200">
            <span className="text-lg">🚗</span>
            <div>
              <span className="font-bold text-amber-400">Kayıtlı Araç Profiliniz: </span>
              <span className="font-mono font-bold text-white">{savedProfile.plateNumber}</span>
              <span className="text-zinc-400"> ({savedProfile.fullName})</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplySavedProfile}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-[11px] hover:bg-amber-400 transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            Bilgileri Tek Tıkla Doldur
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Ad Soyad */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-400">
            Adınız ve Soyadınız <span className="text-amber-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              required
              placeholder="Örn: Ahmet Yılmaz"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm transition-all focus:outline-none backdrop-blur-xl ${
                errors.fullName
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : isDarkMode
                  ? 'glass-panel border-white/10 text-zinc-100 focus:border-amber-400 focus:bg-white/[0.08]'
                  : 'bg-white border-zinc-300 text-zinc-900 focus:border-amber-500 shadow-2xs'
              }`}
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Telefon Numarası */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-400">
            Telefon Numaranız <span className="text-amber-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="tel"
              required
              placeholder="05xx xxx xx xx"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm transition-all focus:outline-none backdrop-blur-xl ${
                errors.phone
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : isDarkMode
                  ? 'glass-panel border-white/10 text-zinc-100 focus:border-amber-400 focus:bg-white/[0.08]'
                  : 'bg-white border-zinc-300 text-zinc-900 focus:border-amber-500 shadow-2xs'
              }`}
            />
          </div>
          {errors.phone ? (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.phone}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-zinc-500">
              WhatsApp onay bildirimi bu numara üzerinden iletilir.
            </p>
          )}
        </div>

        {/* Araç Plakası */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-400">
            Araç Plakası <span className="text-amber-500">*</span>
          </label>
          <div className="flex items-center rounded-2xl overflow-hidden border border-zinc-600 bg-white text-black shadow-md">
            <div className="bg-[#003399] text-white px-3 py-3 flex flex-col items-center justify-center font-bold text-xs select-none">
              <span className="text-[10px] leading-none mb-0.5">🇹🇷</span>
              <span className="text-xs font-black tracking-tighter">TR</span>
            </div>
            <input
              type="text"
              required
              placeholder="09 AB 123"
              maxLength={12}
              value={formData.plateNumber}
              onChange={(e) => handleInputChange('plateNumber', e.target.value)}
              className="w-full px-3 py-3 font-mono-plate font-black text-base tracking-widest text-zinc-950 bg-transparent focus:outline-none uppercase placeholder:text-zinc-400 placeholder:normal-case placeholder:font-sans placeholder:text-sm"
            />
          </div>
          {errors.plateNumber && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.plateNumber}
            </p>
          )}
        </div>

        {/* Araç Marka & Model */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-400">
            Araç Marka / Modeli
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Örn: Renault Megane / VW Passat / BMW 3"
              value={formData.carModel}
              onChange={(e) => handleInputChange('carModel', e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl border text-sm transition-all focus:outline-none backdrop-blur-xl ${
                isDarkMode
                  ? 'glass-panel border-white/10 text-zinc-100 focus:border-amber-400 focus:bg-white/[0.08]'
                  : 'bg-white border-zinc-300 text-zinc-900 focus:border-amber-500 shadow-2xs'
              }`}
            />
          </div>
        </div>

        {/* E-posta Adresi (Opsiyonel) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-zinc-400">
            E-Posta Adresi <span className="text-zinc-500 text-[11px] font-normal">(İsteğe Bağlı)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              placeholder="ornek@mail.com"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm transition-all focus:outline-none backdrop-blur-xl ${
                errors.email
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : isDarkMode
                  ? 'glass-panel border-white/10 text-zinc-100 focus:border-amber-400 focus:bg-white/[0.08]'
                  : 'bg-white border-zinc-300 text-zinc-900 focus:border-amber-500 shadow-2xs'
              }`}
            />
          </div>
        </div>
      </div>

      {/* GENİŞLETİLMİŞ ÇOK SATIRLI NOTLAR VE GLASSMORPHISM PANELİ */}
      <div className={`p-5 sm:p-7 rounded-3xl border glass-panel space-y-5 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${
        isDarkMode ? 'border-white/15' : 'bg-white/90 border-zinc-200 shadow-md'
      }`}>
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-100 tracking-tight">
                Ek Notlar ve Özel İstekleriniz
              </h3>
              <p className="text-xs text-zinc-400">
                Aracınızın hassasiyetlerini ve teslimat isteklerinizi belirtebilirsiniz.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            WhatsApp Bildirimine Eklenir
          </span>
        </div>

        {/* Hızlı Seçim Rozetleri (Kategorize) */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Hızlı İstek Seçenekleri (Tek Tıkla Ekleyin):
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PREFERENCE_CATEGORIES.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div key={idx} className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                    <Icon className="w-3.5 h-3.5 text-amber-500" />
                    <span>{cat.title}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {cat.options.map((opt, oIdx) => {
                      const isChecked = formData.notes?.includes(opt);
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleToggleOption(opt)}
                          className={`text-[11px] px-2.5 py-1.5 rounded-xl border transition-all text-left flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
                            isChecked
                              ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md shadow-amber-500/20 scale-[1.02]'
                              : isDarkMode
                              ? 'glass-pill border-white/10 text-zinc-300 hover:border-white/20 hover:text-white hover:bg-white/[0.08]'
                              : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                          }`}
                        >
                          {isChecked ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          )}
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GENİŞLETİLMİŞ ÇOK SATIRLI TEXTAREA & İPUÇLARI (GLASS-PANEL) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>Ayrıntılı Müşteri Açıklaması:</span>
            </label>

            {formData.notes?.trim() && (
              <button
                type="button"
                onClick={handleClearNotes}
                className="text-[11px] text-zinc-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Notu Temizle</span>
              </button>
            )}
          </div>

          {/* Large Textarea with glass-panel Class */}
          <div className="relative group">
            <textarea
              rows={6}
              placeholder="Aracınızla ilgili özel isteklerinizi veya notlarınızı buraya yazabilirsiniz..."
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className={`glass-panel w-full min-h-[160px] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border text-sm leading-relaxed transition-all focus:outline-none resize-y ${
                isDarkMode
                  ? 'text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'
                  : 'text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
              }`}
            />
          </div>

          {/* Helpful Tips Pill Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div className="p-2.5 rounded-xl border border-white/10 glass-pill flex items-center gap-2 text-zinc-400">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Leke, koku veya tüy durumunu belirtin</span>
            </div>

            <div className="p-2.5 rounded-xl border border-white/10 glass-pill flex items-center gap-2 text-zinc-400">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Teslimat saati aciliyetinizi yazın</span>
            </div>

            <div className="p-2.5 rounded-xl border border-white/10 glass-pill flex items-center gap-2 text-zinc-400">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Hassas aksamları (motor vb.) not edin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
        <label className="flex items-center gap-3 text-xs text-zinc-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 accent-amber-500 focus:ring-amber-400 cursor-pointer"
          />
          <span>Bu cihazda bilgilerimi güvenle hatırla (Sonraki randevularda formu otomatik doldurur)</span>
        </label>
      </div>

      {/* Navigation Buttons (Mobile Optimized) */}
      <div className="pt-4 flex items-center justify-between border-t border-white/10">
        <button
          type="button"
          onClick={onBack}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDarkMode ? 'hover:bg-white/10 text-zinc-300 border border-white/10' : 'hover:bg-zinc-100 text-zinc-600'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Geri: Tarih & Saat</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl sm:rounded-2xl font-black text-sm glass-button text-black active:scale-95 flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>Randevu Özetini İncele</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.form>
  );
};
