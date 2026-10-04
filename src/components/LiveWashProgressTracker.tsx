import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Clock, Car, Image, ChevronRight, X, AlertCircle } from 'lucide-react';
import { AppointmentData, WashStage, VehicleInspectionPhoto } from '../types';
import { WASH_STAGE_LABELS } from '../utils/storage';

interface LiveWashProgressTrackerProps {
  appointment: AppointmentData;
  isDarkMode: boolean;
}

const STAGES_ORDER: WashStage[] = [
  'foam_prewash',
  'rim_underbody',
  'interior_vacuum',
  'wax_drying',
  'ready_for_pickup',
];

export const LiveWashProgressTracker: React.FC<LiveWashProgressTrackerProps> = ({
  appointment,
  isDarkMode,
}) => {
  const currentStage = appointment.washStage || (appointment.status === 'in_progress' ? 'foam_prewash' : 'queue');
  const stageInfo = WASH_STAGE_LABELS[currentStage] || WASH_STAGE_LABELS.queue;
  const [selectedPhoto, setSelectedPhoto] = useState<VehicleInspectionPhoto | null>(null);

  const currentStageIndex = STAGES_ORDER.indexOf(currentStage);

  return (
    <div className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-xl space-y-4 ${
      isDarkMode ? 'bg-zinc-950/80 border-amber-500/30 text-zinc-100' : 'bg-white border-amber-500/35 text-zinc-900'
    }`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/20">
            {stageInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xs sm:text-sm">Canlı Yıkama Takibi</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-zinc-800 text-amber-400 font-bold border border-white/10">
                {appointment.customer.plateNumber}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{stageInfo.desc}</div>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono font-black text-base text-amber-400">
            %{stageInfo.percent}
          </span>
          <div className="text-[10px] text-zinc-500">Tamamlandı</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-800/80 h-2.5 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${stageInfo.percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* 5-Step Segment Dots */}
      <div className="grid grid-cols-5 gap-1 pt-1">
        {STAGES_ORDER.map((stageKey, idx) => {
          const info = WASH_STAGE_LABELS[stageKey];
          const isDone = currentStageIndex > idx || currentStage === 'ready_for_pickup';
          const isCurrent = currentStage === stageKey;

          return (
            <div key={stageKey} className="text-center space-y-1">
              <div
                className={`w-7 h-7 mx-auto rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-amber-500 text-black ring-4 ring-amber-500/20 animate-pulse'
                    : 'bg-zinc-800 text-zinc-500 border border-white/5'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
              </div>
              <div className={`text-[9px] font-bold truncate ${isCurrent ? 'text-amber-400' : isDone ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {info.name.split(' ')[0]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vehicle Inspection Photos (Feature 3) */}
      {appointment.photos && appointment.photos.length > 0 && (
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-amber-400" />
            <span>Araç Kabul & Parlayan Sonuç Fotoğrafları ({appointment.photos.length})</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {appointment.photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-video rounded-xl overflow-hidden border border-white/15 cursor-pointer group shadow-sm"
              >
                <img
                  src={photo.url}
                  alt={photo.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                    photo.type === 'before' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {photo.type === 'before' ? 'Giriş Durumu' : 'Teslim Parlaklığı'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Zoom Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full rounded-3xl overflow-hidden border border-white/20 bg-zinc-950 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 text-white hover:bg-black transition-colors z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.label}
                className="w-full max-h-[70vh] object-contain bg-black"
              />

              <div className="p-4 bg-zinc-900 flex items-center justify-between text-xs">
                <div>
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                    selectedPhoto.type === 'before' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {selectedPhoto.type === 'before' ? 'Kabul / Öncesi' : 'Teslim / Sonrası'}
                  </span>
                  <p className="font-bold text-zinc-200 mt-1">{selectedPhoto.label}</p>
                </div>
                <span className="font-mono text-zinc-400 text-[11px]">
                  {new Date(selectedPhoto.takenAt).toLocaleString('tr-TR')}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
