import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle } from 'lucide-react';

interface ReviewsSectionProps {
  isDarkMode: boolean;
}

const REVIEWS = [
  {
    name: 'Serkan B.',
    car: 'Volkswagen Passat',
    service: 'Komple Detaylı İç Kuaför & Koltuk Yıkama',
    comment: 'Aracı 2. el almıştım, koltuklarda ve tavanda lekeler vardı. Teslim aldığımda sıfır araba kokusu ve temizliği vardı. Randevu saati dakik, bekleme olmadı.',
    rating: 5,
    date: '3 gün önce',
  },
  {
    name: 'Burak D.',
    car: 'BMW 320i',
    service: '3 Aşamalı Pasta Cila & Seramik Kaplama',
    comment: 'Siyah renk aracımda hare ve kılcal çizikler canımı sıkıyordu. Esse Detailing ekibi mükemmel iş çıkardı. Aynaya bakıyor gibiyim, ellerinize sağlık.',
    rating: 5,
    date: '1 hafta önce',
  },
  {
    name: 'Merve K.',
    car: 'Peugeot 2008 SUV',
    service: 'Cilalı İç-Dış Yıkama + Ozon Dezenfeksiyon',
    comment: 'Çocuklu aile olarak aracın hijyeni çok önemliydi. WhatsApp üzerinden randevu alıp gittim, doğrudan istasyona aldılar. 45 dakikada tertemiz teslim edildi.',
    rating: 5,
    date: '2 hafta önce',
  },
];

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ isDarkMode }) => {
  return (
    <section className="py-8 sm:py-14 border-t border-white/10 transition-colors relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-6"
        >
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-500 uppercase tracking-wider mb-1">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Müşteri Deneyimi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Google Değerlendirmeleri
            </h2>
          </div>

          <div className="text-xs text-zinc-400 font-semibold">
            4.9 ★ Yıldız Ortalama (348+ Onaylı Yorum)
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {REVIEWS.map((rev, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`p-5 sm:p-6 rounded-3xl border flex flex-col justify-between glass-panel transition-all ${
                isDarkMode 
                  ? 'border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.5)]' 
                  : 'bg-white/85 border-zinc-200 shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-zinc-400">{rev.date}</span>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${
                  isDarkMode ? 'text-zinc-200' : 'text-zinc-700'
                }`}>
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>{rev.name}</span>
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {rev.car} · <span className="text-amber-400/90">{rev.service}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
