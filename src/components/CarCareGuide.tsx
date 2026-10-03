import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, CloudRain, Wind, Sparkles, Shield, Clock, CheckCircle } from 'lucide-react';

export const CarCareGuide: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [activeSeason, setActiveSeason] = useState<'summer' | 'winter' | 'spring'>('summer');

  const seasons = {
    summer: {
      title: 'Yaz Dönemi & Ege Sıcakları',
      icon: Sun,
      color: 'text-amber-400',
      tips: [
        'Aydın’ın aşırı sıcaklarında güneş yanığı ve UV vernik solmasına karşı seramik veya kaliteli wax koruması şarttır.',
        'Ağaç altı parklarında damlayan reçine ve kuş pislikleri sıcağın etkisiyle verniğe dakikalar içinde işler; sıcak kaportayı kuru bezle silmeyin, derhal pH nötr şampuanla yıkayın.',
        'Sıcak jantlara ve kaportaya doğrudan soğuk su tutulması fren disklerinde eğilmeye neden olabilir.',
      ],
    },
    winter: {
      title: 'Kış Dönemi & Yağmur / Çamur',
      icon: CloudRain,
      color: 'text-cyan-400',
      tips: [
        'Asit yağmurları ve yoldan sıçrayan çamur vernik gözeneklerine yerleşir; ayda en az 2 kez cilalı yıkama tavsiye edilir.',
        'Ön cama uygulanan su itici yağmur kaydırıcı katman, 60 km/s üzeri hızlarda silecek ihtiyacını ortadan kaldırarak gece görüşünü artırır.',
        'Kışın araç içindeki nem ve buğu sorununu engellemek için polen filtresi temizliği ve ozon dezenfeksiyonu yaptırın.',
      ],
    },
    spring: {
      title: 'Bahar Dönemi & Detaylı Tazelenme',
      icon: Wind,
      color: 'text-emerald-400',
      tips: [
        'Kışın biriken tuz ve çamurun ardından ilkbahar başında motor yıkama ve şasi altı temizliği yapılması korozyonu önler.',
        'Koltuklarda biriken kış rutubetini yok etmek ve bakteri/akarları temizlemek için 6 ayda bir buharlı koltuk yıkama yapılmalıdır.',
        'Bahar aylarında pasta cila ile kışın oluşan kılcal çizikleri giderip yaz güneşine pürüzsüz girin.',
      ],
    },
  };

  const current = seasons[activeSeason];
  const CurrentIcon = current.icon;

  const intervals = [
    { service: 'Cilalı Dış & İç Yıkama', freq: '15 Günde Bir', desc: 'Boya parlaklığını korur, toz yapışmasını geciktirir.' },
    { service: 'Hızlı Cila & Boya Besleme', freq: 'Ayda 1 Kez', desc: 'Mevcut wax tabakasını tazeler, su iticiliği artırır.' },
    { service: 'Buharlı Koltuk Yıkama', freq: '6 Ayda 1 Kez', desc: 'Derin kir, ter ve toz akarlarını sterilize eder.' },
    { service: 'Pasta Cila & Çizik Giderme', freq: 'Yılda 1 Kez', desc: 'Kılcal fırça ve hare çiziklerini tamamen yok eder.' },
    { service: 'Seramik Kaplama', freq: '2-3 Yılda 1 Kez', desc: 'Verniği 9H sertlikte zırh gibi korur, çizilmelere direnç sağlar.' },
  ];

  return (
    <section className="py-12 sm:py-16 max-w-5xl mx-auto px-3 sm:px-6">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Uzman Detailing Tavsiyeleri</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          Mevsimsel Araç Bakım & Periyot Rehberi
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          Aracınızın değerini ve boyasını yıllarca ilk günkü kondisyonda tutmanız için profesyonel ipuçları.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Seasonal Switcher */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-white/10 bg-white/[0.02]">
            {(['summer', 'winter', 'spring'] as const).map((s) => {
              const info = seasons[s];
              const Icon = info.icon;
              const isActive = activeSeason === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveSeason(s)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{s === 'summer' ? 'Yaz' : s === 'winter' ? 'Kış' : 'İlkbahar'}</span>
                </button>
              );
            })}
          </div>

          <div className={`p-5 rounded-3xl border glass-panel space-y-4 ${
            isDarkMode ? 'border-white/10 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <CurrentIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">{current.title}</h3>
                <p className="text-xs text-zinc-400">Aydın iklimine özel koruma önerileri</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {current.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Maintenance Frequency Table */}
        <div className="lg:col-span-6">
          <div className={`p-5 rounded-3xl border glass-panel space-y-4 h-full ${
            isDarkMode ? 'border-white/10 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black">Önerilen Bakım Aralıkları</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                Periyodik Takvim
              </span>
            </div>

            <div className="space-y-2">
              {intervals.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-zinc-100">{item.service}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl shrink-0 border border-amber-500/20">
                    {item.freq}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
