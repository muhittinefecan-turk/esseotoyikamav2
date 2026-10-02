import React from 'react';
import { Phone, MessageSquare, MapPin, Clock, ExternalLink } from 'lucide-react';
import { BusinessConfig } from '../types';
import { BUSINESS_EXTRA_DETAILS } from '../data/businessConfig';

interface FooterProps {
  business: BusinessConfig;
  isDarkMode: boolean;
  onScrollToTop: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  business,
  isDarkMode,
  onScrollToTop,
}) => {
  return (
    <footer className={`border-t transition-colors ${
      isDarkMode ? 'bg-zinc-950/80 border-white/10 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
    }`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-6">
          {/* Brand & Purpose */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-zinc-100 tracking-tight">
                {business.name}
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm text-zinc-400">
              {business.tagline}. Aydın Efeler'de 1 Mayıs 2017'den beri kaliteli araç bakım ve temizlik hizmeti.
            </p>
          </div>

          {/* Contact & Address */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-200">
              İletişim & Konum
            </h4>
            <div className="flex items-start gap-2 pt-1">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {business.address}, {business.district} / {business.city}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-500 shrink-0" />
              <a href={`tel:${business.phone}`} className="hover:text-amber-400 transition-colors font-semibold">
                {business.phone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              <a
                href={`https://wa.me/${business.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors font-semibold"
              >
                WhatsApp: {business.phone}
              </a>
            </div>
          </div>

          {/* Social Profiles & Hours */}
          <div className="space-y-3 text-xs">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-200 flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Çalışma Saatleri</span>
              </h4>
              <div className="text-[11px] text-zinc-400 space-y-0.5">
                <div>{business.weekdayHours}</div>
                <div>{business.sundayHours}</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-200 mb-1.5">
                Sosyal Medya
              </h4>
              <div className="flex items-center gap-2">
                <a
                  href={BUSINESS_EXTRA_DETAILS.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg border border-white/10 text-[11px] text-zinc-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  <span>Instagram</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
                <a
                  href={BUSINESS_EXTRA_DETAILS.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg border border-white/10 text-[11px] text-zinc-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  <span>TikTok</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div>
            © 2017 – {new Date().getFullYear()} {business.name}. Tüm hakları saklıdır.
          </div>

          <button
            onClick={onScrollToTop}
            className="hover:text-amber-400 transition-colors cursor-pointer text-xs font-semibold"
          >
            Yukarı Çık ↑
          </button>
        </div>
      </div>
    </footer>
  );
};
