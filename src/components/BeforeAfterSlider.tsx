import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, SlidersHorizontal, ShieldCheck, Sun, CheckCircle2 } from 'lucide-react';
import heroImg from '../assets/images/esse_hero_detailing_1790959392176.jpg';
import interiorImg from '../assets/images/esse_interior_care_1790959405690.jpg';
import ceramicImg from '../assets/images/esse_ceramic_gloss_1790959419328.jpg';

interface BeforeAfterItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  beforeLabel: string;
  afterLabel: string;
  image: string;
  // CSS filter for the "before" side to simulate dull/oxidized/scratched paint
  beforeFilter: string;
}

const ITEMS: BeforeAfterItem[] = [
  {
    id: 'paint',
    title: 'Pasta Cila & Seramik Kaplama',
    badge: 'Boya Yenileme',
    description: 'Kılcal dairesel fırça çizikleri ve matlaşmış vernik tabakası giderilerek ayna parlaklığı ve hidrofobik su iticilik kazandırılır.',
    beforeLabel: 'ÖNCE: Matlaşmış Vernik & Çizikler',
    afterLabel: 'SONRA: Ayna Parlaklığı & Seramik',
    image: ceramicImg,
    beforeFilter: 'contrast(0.75) saturate(0.5) brightness(0.85) blur(1px)',
  },
  {
    id: 'interior',
    title: 'Detaylı Koltuk & Buharlı İç Kuaför',
    badge: 'Hijyenik Temizlik',
    description: 'Kumaş ve deri döşemelerdeki derinleşmiş su lekeleri, ter, toz ve kirler 140°C kuru buhar ve vakumla sıfırlanır.',
    beforeLabel: 'ÖNCE: Lekeli & Tozlu Koltuklar',
    afterLabel: 'SONRA: Steril & Lekesiz Dokuma',
    image: interiorImg,
    beforeFilter: 'contrast(0.8) sepia(0.35) brightness(0.75)',
  },
  {
    id: 'wash',
    title: 'Aktif Köpüklü Detaylı Dış Yıkama',
    badge: 'Çiziksiz Temizlik',
    description: 'Çift kova yöntemi ve pH nötr aktif köpük ile jant balata tozları, zift ve böcek kalıntıları boyaya zarar vermeden arındırılır.',
    beforeLabel: 'ÖNCE: Ağır Çamur & Balata Tozu',
    afterLabel: 'SONRA: Kusursuz Parlak Yüzey',
    image: heroImg,
    beforeFilter: 'grayscale(0.6) brightness(0.8) contrast(0.85)',
  },
];

export const BeforeAfterSlider: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<string>('paint');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  const currentItem = ITEMS.find((i) => i.id === activeTab) || ITEMS[0];

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = Math.round((x / rect.width) * 100);
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      handleMove(e.clientX);
    }
  };

  return (
    <section className="py-12 sm:py-16 max-w-5xl mx-auto px-3 sm:px-6">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Farkı Kendi Gözlerinizle Görün</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          Öncesi / Sonrası Karşılaştırma
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          Çizgiyi parmağınızla veya farenizle sağa sola kaydırarak Esse Oto Yıkama işçiliğinin farkını anında inceleyin.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
        {ITEMS.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setSliderPosition(50);
              }}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap backdrop-blur-xl ${
                isActive
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 border border-amber-400 scale-[1.02]'
                  : isDarkMode
                  ? 'glass-panel border-white/10 text-zinc-400 hover:text-zinc-200'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm'
              }`}
            >
              {item.title}
            </button>
          );
        })}
      </div>

      {/* Interactive Slider Container */}
      <div className="max-w-3xl mx-auto">
        <div
          ref={containerRef}
          onMouseDown={(e) => {
            isDraggingRef.current = true;
            handleMove(e.clientX);
          }}
          onMouseUp={() => {
            isDraggingRef.current = false;
          }}
          onMouseLeave={() => {
            isDraggingRef.current = false;
          }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchStart={(e) => {
            if (e.touches[0]) handleMove(e.touches[0].clientX);
          }}
          className="relative h-[320px] sm:h-[430px] rounded-3xl overflow-hidden select-none cursor-ew-resize border border-amber-500/35 shadow-[0_20px_50px_rgba(0,0,0,0.6)] group"
        >
          {/* AFTER (Full background) */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={currentItem.image}
              alt="Sonraki Hali"
              className="w-full h-full object-cover"
            />
            {/* After Tag */}
            <div className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-black backdrop-blur-md flex items-center gap-1.5 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentItem.afterLabel}</span>
            </div>
          </div>

          {/* BEFORE (Clipped layer) */}
          <div
            className="absolute inset-0 h-full overflow-hidden z-10 transition-all duration-75"
            style={{ width: `${sliderPosition}%` }}
          >
            <div
              className="absolute inset-0 h-full"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100vw',
              }}
            >
              <img
                src={currentItem.image}
                alt="Önceki Hali"
                className="w-full h-full object-cover"
                style={{ filter: currentItem.beforeFilter }}
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Before Tag */}
            <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-700 text-zinc-300 text-xs font-black backdrop-blur-md shadow-lg">
              <span>{currentItem.beforeLabel}</span>
            </div>
          </div>

          {/* Dividing Vertical Line & Handle */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute inset-y-0 -left-[1.5px] w-[3px] bg-amber-400 shadow-[0_0_15px_#f59e0b]" />

            {/* Draggable Button Handle */}
            <div className="absolute top-1/2 -left-5 -translate-y-1/2 w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center shadow-xl shadow-amber-500/50 border-2 border-white scale-100 group-hover:scale-110 transition-transform">
              <SlidersHorizontal className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Instruction Pill */}
          <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 text-zinc-300 text-[11px] font-semibold backdrop-blur-md border border-white/10 pointer-events-none">
            <span>Kaydırmak için sürükleyin</span>
          </div>
        </div>

        {/* Caption Card */}
        <div className={`mt-4 p-4 rounded-2xl border glass-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isDarkMode ? 'border-white/10 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
        }`}>
          <div>
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>{currentItem.badge} - Profesyonel Standart</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              {currentItem.description}
            </p>
          </div>
          <span className="text-[11px] px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold shrink-0">
            Aydın Efeler Çevre Bulvarı
          </span>
        </div>
      </div>
    </section>
  );
};
