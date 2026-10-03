import React from 'react';
import { Phone, MessageSquare, Sun, Moon, Calendar, Gift } from 'lucide-react';
import { BusinessConfig } from '../types';

interface NavbarProps {
  business: BusinessConfig;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAppointments: () => void;
  onOpenLoyalty: () => void;
  appointmentsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  business,
  isDarkMode,
  onToggleTheme,
  onOpenAppointments,
  onOpenLoyalty,
  appointmentsCount,
}) => {
  return (
    <header className={`sticky top-0 z-40 transition-all ${
      isDarkMode 
        ? 'bg-zinc-950/70 backdrop-blur-xl border-b border-white/10 text-zinc-100 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' 
        : 'bg-white/80 backdrop-blur-xl border-b border-zinc-200 text-zinc-900 shadow-xs'
    }`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-black font-black shadow-lg shadow-amber-500/25 border border-amber-300/40">
            <span className="text-lg sm:text-xl tracking-tighter">ES</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-zinc-950 animate-pulse" title="Açık & Randevuya Hazır" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-xl tracking-tight">
                ESSE
              </span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Detailing
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 truncate max-w-[150px] sm:max-w-xs">
              {business.district} / {business.city}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick Call Button */}
          <a
            href={`tel:${business.phone}`}
            className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isDarkMode 
                ? 'bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 backdrop-blur-md' 
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-amber-500" />
            <span>{business.phone}</span>
          </a>

          {/* Quick WhatsApp Button */}
          <a
            href={`https://wa.me/${business.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp ile İletişim"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">WhatsApp</span>
          </a>

          {/* Digital Loyalty Card Button */}
          <button
            onClick={onOpenLoyalty}
            className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              isDarkMode ? 'hover:bg-white/10 text-amber-400 border border-white/5' : 'hover:bg-zinc-100 text-amber-600 border border-zinc-200'
            }`}
            title="Dijital Sadakat / Yıkama Kartım"
            aria-label="Sadakat Kartı"
          >
            <Gift className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-bold">Kartım</span>
          </button>

          {/* Stored Appointments Button */}
          <button
            onClick={onOpenAppointments}
            className={`relative p-2.5 rounded-xl transition-all cursor-pointer ${
              isDarkMode ? 'hover:bg-white/10 text-zinc-300 border border-white/5' : 'hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
            }`}
            title="Randevularım"
            aria-label="Randevularım"
          >
            <Calendar className="w-4 h-4" />
            {appointmentsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold rounded-full bg-amber-500 text-black">
                {appointmentsCount}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isDarkMode ? 'hover:bg-white/10 text-amber-400 border border-white/5' : 'hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
            }`}
            title={isDarkMode ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
            aria-label="Tema Değiştir"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
