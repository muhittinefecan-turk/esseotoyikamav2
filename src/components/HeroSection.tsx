import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Award, CheckCircle2, ChevronRight, Phone, Sparkles, Shield, Download, Check } from 'lucide-react';
import { BusinessConfig } from '../types';
import { usePWAInstall } from '../context/PWAInstallContext';

import heroImg from '../assets/images/esse_hero_detailing_1790959392176.jpg';
import interiorImg from '../assets/images/esse_interior_care_1790959405690.jpg';
import ceramicImg from '../assets/images/esse_ceramic_gloss_1790959419328.jpg';

interface HeroSectionProps {
  business: BusinessConfig;
  isDarkMode: boolean;
  onScrollToBooking?: () => void;
}

export const CompactHeroBar: React.FC<HeroSectionProps> = ({
  business,
  isDarkMode,
}) => {
  const { installApp, isInstalled } = usePWAInstall();

  return (
    <div className={`border-b transition-colors ${
      isDarkMode ? 'bg-zinc-950/80 border-white/10' : 'bg-amber-50/70 border-amber-200/70'
    } py-2.5 px-3 sm:px-6`}>
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center flex-wrap justify-center sm:justify-start gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-[11px]">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
            <span>{business.rating}</span>
            <span className="text-zinc-500">·</span>
            <span>2017'den Beri {business.reviewCount}+ Yorum</span>
          </div>

          <span className="hidden md:inline text-zinc-500">·</span>
          <span className="text-[11px] font-bold text-zinc-300 hidden md:inline">
            Aydın Efeler Çevre Bulvarı
          </span>

          <span className="hidden sm:inline text-zinc-500">·</span>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>4 Peron Aktif</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isInstalled && (
            <button
              type="button"
              onClick={installApp}
              className="px-2.5 py-1 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3 h-3 stroke-[2.5]" />
              <span>PWA Yükle</span>
            </button>
          )}

          <a
            href={`tel:${business.phone}`}
            className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 transition-all"
          >
            <Phone className="w-3 h-3 text-amber-400" />
            <span>{business.phone}</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  business,
  isDarkMode,
  onScrollToBooking,
}) => {
  const [activePhotoTab, setActivePhotoTab] = useState<'wash' | 'interior' | 'ceramic'>('wash');
  const { installApp, isInstalled } = usePWAInstall();

  const handleInstallClick = async () => {
    await installApp();
  };

  const photos = {
    wash: {
      src: heroImg,
      title: 'Aktif Köpük & Detaylı Dış Yıkama',
      desc: 'Ph nötr kar köpüğü, çift kova süngerleme ve çiziksiz hava kurutma.',
      badge: 'En Popüler',
      tag: '4 Peron Kapasite',
    },
    interior: {
      src: interiorImg,
      title: 'Buharlı Detaylı Koltuk & İç Kuaför',
      desc: 'Tavan, taban, koltuk leke çıkarma ve antibakteriyel klima ozonlama.',
      badge: 'Sıfır Araç Hissi',
      tag: 'Derin Temizlik',
    },
    ceramic: {
      src: ceramicImg,
      title: '9H Nano Seramik & Pasta Cila',
      desc: 'Kılcal çizik giderme, ayna derinliğinde parlaklık ve 2 yıl hidrofobik zırh.',
      badge: 'Maksimum Koruma',
      tag: 'Ayna Parlaklığı',
    },
  };

  const currentPhoto = photos[activePhotoTab];

  return (
    <section className="relative overflow-hidden pt-4 pb-8 sm:pt-8 sm:pb-14">
      {/* Dynamic Ambient Background Orbs */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 ambient-glow-amber pointer-events-none blur-3xl opacity-60 animate-pulse duration-1000" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 ambient-glow-cyan pointer-events-none blur-3xl opacity-50" />

      <div className="max-w-6xl mx-auto px-3 sm:px-6 relative">
        {/* Main Grid: Left copy, Right Visual Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Heading, Badges, CTAs */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left"
          >
            {/* Rating Glass Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold glass-pill transition-all ${
                isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
              }`}
            >
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="font-bold text-amber-500">{business.rating}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-[11px] sm:text-xs">2017'den Beri {business.reviewCount}+ Yorum</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </motion.div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Aracınız İçin{' '}
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                Kusursuz Bakım
              </span>{' '}
              ve Ayna Parlaklığı
            </h1>

            {/* Subtitle */}
            <p className={`text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed ${
              isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
            }`}>
              Aydın Efeler Çevre Bulvarı'nda pasta cila, boya koruma, seramik kaplama ve detaylı iç kuaför. Sıra beklemeden, peron seçimiyle online randevunuzu hemen oluşturun.
            </p>

            {/* CTA Buttons - Mobile Friendly */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={onScrollToBooking}
                  className="px-7 py-4 rounded-2xl font-black text-sm text-black glass-button flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/30"
                >
                  <span>Hemen Randevu Oluştur</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <a
                  href={`tel:${business.phone}`}
                  className={`px-5 py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 glass-pill hover:bg-white/10 transition-all ${
                    isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                  }`}
                >
                  <Phone className="w-4 h-4 text-amber-500" />
                  <span>{business.phone}</span>
                </a>
              </div>

              {/* HEMEN RANDEVU OLUŞTUR BUTONUNUN HEMEN ALTINDA UYGULAMAYI YÜKLE BUTONU */}
              <div className="flex justify-center lg:justify-start pt-1">
                {isInstalled ? (
                  <div className="px-4 py-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold flex items-center gap-2 backdrop-blur-md">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Esse Oto Uygulaması Cihazınızda Yüklü</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 backdrop-blur-xl transition-all cursor-pointer shadow-md group active:scale-95"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-500 text-black flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
                      <Download className="w-3.5 h-3.5 stroke-[2.8]" />
                    </div>
                    <span>Uygulamayı Cihazına Yükle (Ana Ekrana Ekle)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 font-extrabold border border-amber-500/35 uppercase">
                      PWA
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Quality Points with Icons */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-left max-w-lg mx-auto lg:mx-0">
              <div className="p-2.5 rounded-2xl border border-white/10 glass-pill flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold">4 Peron Kapasitesi</span>
              </div>

              <div className="p-2.5 rounded-2xl border border-white/10 glass-pill flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold">9H Nano Seramik</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-2.5 rounded-2xl border border-white/10 glass-pill flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-[11px] font-bold">Çiziksiz Yıkama</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Visual Interactive Gallery with Real Detailing Photos */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="lg:col-span-5 relative mt-4 lg:mt-0 space-y-3"
          >
            {/* Interactive Photo Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'wash', label: '🚿 Yıkama & Köpük' },
                { id: 'interior', label: '💺 İç Kuaför' },
                { id: 'ceramic', label: '💎 Seramik & Cila' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePhotoTab(tab.id as 'wash' | 'interior' | 'ceramic')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer backdrop-blur-xl ${
                    activePhotoTab === tab.id
                      ? 'bg-amber-500 text-black shadow-md border border-amber-400 scale-[1.02]'
                      : isDarkMode
                      ? 'bg-white/[0.04] border border-white/10 text-zinc-300 hover:bg-white/[0.08]'
                      : 'bg-white border border-zinc-200 text-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Featured Photo with Glass Frame & Transitions */}
            <div className={`relative rounded-3xl overflow-hidden p-2 transition-all group glass-panel ${
              isDarkMode ? 'border-white/15' : 'bg-white border-zinc-200 shadow-xl'
            }`}>
              <div className="relative rounded-2xl overflow-hidden aspect-16/10">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activePhotoTab}
                    src={currentPhoto.src}
                    alt={currentPhoto.title}
                    initial={{ opacity: 0.4, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.4 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="eager"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                {/* Floating Badge on Image */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-amber-400">
                  <Sparkles className="w-3 h-3" />
                  <span>{currentPhoto.badge}</span>
                </div>

                {/* Floating Glass Tag on Image */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-3 rounded-xl bg-black/65 backdrop-blur-md border border-white/15 text-xs text-white">
                  <div>
                    <div className="font-black flex items-center gap-1.5 text-xs sm:text-sm">
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{currentPhoto.title}</span>
                    </div>
                    <div className="text-[10px] text-zinc-300 mt-0.5 max-w-xs truncate">
                      {currentPhoto.desc}
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500 text-black font-black uppercase shrink-0">
                    {currentPhoto.tag}
                  </span>
                </div>
              </div>
            </div>

            {/* Mini Thumbnails Row */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActivePhotoTab('wash')}
                className={`p-1.5 rounded-xl border transition-all overflow-hidden flex items-center gap-2 cursor-pointer ${
                  activePhotoTab === 'wash' ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={heroImg} alt="Dış Yıkama" className="w-10 h-10 rounded-lg object-cover" />
                <span className="text-[10px] font-bold text-left hidden sm:inline leading-tight">Yıkama</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePhotoTab('interior')}
                className={`p-1.5 rounded-xl border transition-all overflow-hidden flex items-center gap-2 cursor-pointer ${
                  activePhotoTab === 'interior' ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={interiorImg} alt="İç Kuaför" className="w-10 h-10 rounded-lg object-cover" />
                <span className="text-[10px] font-bold text-left hidden sm:inline leading-tight">Kuaför</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePhotoTab('ceramic')}
                className={`p-1.5 rounded-xl border transition-all overflow-hidden flex items-center gap-2 cursor-pointer ${
                  activePhotoTab === 'ceramic' ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={ceramicImg} alt="Seramik" className="w-10 h-10 rounded-lg object-cover" />
                <span className="text-[10px] font-bold text-left hidden sm:inline leading-tight">Seramik</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
