import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, MessageSquare, ExternalLink, Calendar, CreditCard, Ban } from 'lucide-react';
import { BusinessConfig } from '../types';
import { BUSINESS_EXTRA_DETAILS } from '../data/businessConfig';

interface LocationAndHoursProps {
  business: BusinessConfig;
  isDarkMode: boolean;
}

export const LocationAndHours: React.FC<LocationAndHoursProps> = ({
  business,
  isDarkMode,
}) => {
  return (
    <section className="py-8 sm:py-14 border-t border-white/10 transition-colors relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 -left-20 w-80 h-80 ambient-glow-amber pointer-events-none blur-3xl opacity-30" />

      <div className="max-w-6xl mx-auto px-3 sm:px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch"
        >
          {/* Working Hours & Amenities */}
          <div className={`p-5 sm:p-7 rounded-3xl border flex flex-col justify-between glass-panel transition-all ${
            isDarkMode 
              ? 'border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)]' 
              : 'bg-white/80 border-zinc-200 shadow-md'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight">Çalışma Saatlerimiz</h3>
                    <p className="text-xs text-zinc-400">Haftalık mesai ve operasyon saatleri</p>
                  </div>
                </div>

                {/* PAZAR GÜNÜ KAPALI ROZETİ */}
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 shadow-sm">
                  <Ban className="w-3 h-3" />
                  <span>Pazar Kapalı</span>
                </span>
              </div>

              {/* Saat Satırları */}
              <div className="space-y-3 mt-4">
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs sm:text-sm backdrop-blur-md transition-all ${
                  isDarkMode ? 'bg-white/[0.04] border-white/10' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-zinc-200">Pazartesi – Cumartesi</span>
                  </div>
                  <span className="font-black text-amber-400">08:30 – 19:30</span>
                </div>

                {/* PAZAR GÜNÜ KAPALI SATIRI */}
                <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between text-xs sm:text-sm backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="font-bold text-rose-300">Pazar Günü</span>
                  </div>
                  <span className="font-black text-rose-400">KAPALI (Haftalık İzin)</span>
                </div>
              </div>

              {/* Founded Badge */}
              <div className="mt-4 p-3 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-2.5 text-xs text-zinc-300">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>Açılış:</strong> 1 Mayıs 2017'den beri Aydın Efeler'de kesintisiz hizmet.</span>
              </div>

              {/* Amenities */}
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                  İşletme Olanakları & Tesis Özellikleri
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {BUSINESS_EXTRA_DETAILS.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-[11px] truncate">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Method Notice */}
            <div className="mt-5 pt-3.5 border-t border-white/10 text-xs text-zinc-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Ödeme:</strong> Nakit, FAST / Havale ve Yerinde Ödeme kabul edilir.</span>
            </div>
          </div>

          {/* Location & Contact & Socials */}
          <div className={`p-5 sm:p-7 rounded-3xl border flex flex-col justify-between glass-panel transition-all ${
            isDarkMode 
              ? 'border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)]' 
              : 'bg-white/80 border-zinc-200 shadow-md'
          }`}>
            <div>
              <div className="flex items-center gap-2.5 mb-3 border-b border-white/10 pb-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">Konum ve İletişim</h3>
                  <p className="text-xs text-zinc-400">Efeler Çevre Bulvarı üzerindeyiz</p>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-sm">
                <div className="font-black text-base text-zinc-100">{business.name}</div>
                <div className="text-zinc-200 font-medium leading-relaxed">{business.address}</div>
                <div className="text-xs text-amber-400 font-bold">Hizmet Bölgesi: Aydın, Efeler</div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
                <a
                  href={business.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-2xl text-xs font-black glass-button text-black flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Haritada Yol Tarifi Al</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                <a
                  href={`tel:${business.phone}`}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 backdrop-blur-xl transition-all ${
                    isDarkMode 
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-zinc-200' 
                      : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800'
                  }`}
                >
                  <Phone className="w-4 h-4 text-amber-500" />
                  <span>{business.phone}</span>
                </a>
              </div>

              {/* Social Media Links */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Sosyal Medya Profilleri
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={BUSINESS_EXTRA_DETAILS.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 rounded-xl border border-white/10 text-xs font-bold text-zinc-200 hover:bg-white/10 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>📷 Instagram</span>
                    <span className="text-[10px] text-zinc-400">@okan_ozcal</span>
                  </a>

                  <a
                    href={BUSINESS_EXTRA_DETAILS.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 rounded-xl border border-white/10 text-xs font-bold text-zinc-200 hover:bg-white/10 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>🎵 TikTok</span>
                    <span className="text-[10px] text-zinc-400">@okan.zcal</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
              <a
                href={`https://wa.me/${business.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex-1 py-3 px-4 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp: {business.phone}</span>
              </a>

              <a
                href={BUSINESS_EXTRA_DETAILS.smsUrl}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl text-xs font-bold border border-white/10 text-zinc-300 hover:bg-white/10 text-center"
              >
                SMS Gönder
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
