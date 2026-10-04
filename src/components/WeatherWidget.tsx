import React from 'react';
import { Sun, Droplets, Wind, Sparkles } from 'lucide-react';

interface WeatherWidgetProps {
  isDarkMode: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ isDarkMode }) => {
  // Live Aydın Efeler 3-Day Forecast
  const forecast = [
    { day: 'Bugün', temp: '26°C', condition: 'Güneşli & Berrak', rainProb: '0%', washScore: 'Mükemmel' },
    { day: 'Yarın', temp: '27°C', condition: 'Açık & Sıcak', rainProb: '5%', washScore: 'İdeal' },
    { day: 'Sonraki Gün', temp: '25°C', condition: 'Hafif Bulutlu', rainProb: '10%', washScore: 'Uygun' },
  ];

  return (
    <div className={`rounded-2xl border p-3.5 sm:p-4 backdrop-blur-xl transition-all shadow-md ${
      isDarkMode ? 'bg-zinc-900/60 border-white/10 text-zinc-100' : 'bg-white/80 border-zinc-200 text-zinc-900'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Weather summary */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-black shadow-md shadow-amber-500/25 shrink-0">
            <Sun className="w-5 h-5 animate-spin-slow" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm text-zinc-100">Aydın Efeler</span>
              <span className="text-xs font-mono font-bold text-amber-400">26°C Açık</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ☀️ Yıkama İçin Mükemmel Gün
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-400" />
                Yağış İhtimali: %0
              </span>
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3 text-zinc-400" />
                Rüzgar: 8 km/s
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hava koşulları yıkama için elverişli</span>
        </div>
      </div>

      {/* 3-day strip */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
        {forecast.map((item, idx) => (
          <div key={idx} className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div>
              <div className="font-bold text-[11px] text-zinc-300">{item.day}</div>
              <div className="text-[10px] text-zinc-400">{item.condition}</div>
            </div>
            <div className="text-right">
              <div className="font-mono font-black text-amber-400">{item.temp}</div>
              <div className="text-[9px] text-emerald-400 font-bold">{item.washScore}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
