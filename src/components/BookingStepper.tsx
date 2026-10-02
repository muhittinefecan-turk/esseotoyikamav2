import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Calendar, User, Send } from 'lucide-react';

interface BookingStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  isDarkMode: boolean;
}

const STEPS = [
  { step: 1, title: 'Hizmet Seçimi', short: 'Hizmet', icon: Sparkles },
  { step: 2, title: 'Tarih & Peron', short: 'Tarih', icon: Calendar },
  { step: 3, title: 'Araç & Notlar', short: 'Bilgiler', icon: User },
  { step: 4, title: 'Onay & İletişim', short: 'Onay', icon: Send },
];

export const BookingStepper: React.FC<BookingStepperProps> = ({
  currentStep,
  onStepClick,
  isDarkMode,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto mb-6 sm:mb-8 px-2"
    >
      <div className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl border glass-panel transition-all ${
        isDarkMode 
          ? 'border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.5)]' 
          : 'bg-white/85 border-zinc-200 shadow-md'
      }`}>
        <div className="relative flex items-center justify-between">
          {/* Progress connecting line */}
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full -z-10 rounded-full ${
            isDarkMode ? 'bg-white/10' : 'bg-zinc-200'
          }`} />
          
          {/* Active progress fill */}
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 -z-10 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 shadow-sm"
            initial={false}
            animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />

          {STEPS.map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            const isClickable = s.step < currentStep;
            const Icon = s.icon;

            return (
              <button
                key={s.step}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(s.step)}
                className={`flex flex-col items-center group relative ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 border ${
                    isCompleted
                      ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/30'
                      : isCurrent
                      ? 'bg-amber-500 border-amber-300 text-black shadow-lg shadow-amber-500/35 ring-4 ring-amber-500/20 scale-105'
                      : isDarkMode
                      ? 'bg-zinc-900 border-white/15 text-zinc-500 group-hover:border-white/30'
                      : 'bg-white border-zinc-300 text-zinc-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <div className="mt-2 text-center">
                  <div
                    className={`text-[11px] sm:text-xs font-black tracking-tight ${
                      isCurrent
                        ? 'text-amber-500'
                        : isCompleted
                        ? isDarkMode ? 'text-zinc-200' : 'text-zinc-700'
                        : isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  >
                    <span className="hidden sm:inline">{s.title}</span>
                    <span className="sm:hidden">{s.short}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
