import React, { useEffect, useRef } from 'react';
import { X, ShieldCheck, MapPin, Clock, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';

export function CampusSafetyModal({ isOpen, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const safeZones = [
    {
      name: 'Campus Student Center',
      spot: 'Main Information Desk (1st Floor Lobby)',
      hours: 'Mon - Sun: 7:00 AM - 11:00 PM',
      lighting: 'High Security & Monitored Area',
    },
    {
      name: 'University Main Library',
      spot: 'Circulation & Reserves Desk (Entrance Floor)',
      hours: 'Mon - Sun: 8:00 AM - Midnight',
      lighting: 'Staffed Campus Checkpoint',
    },
    {
      name: 'Dining Commons Commons',
      spot: 'Central Atrium Seating Area',
      hours: 'Daily: 7:30 AM - 9:00 PM',
      lighting: 'High Foot-Traffic Public Zone',
    },
    {
      name: 'Residence Quad Hub',
      spot: 'Quad Welcome Desk & Mail Room',
      hours: 'Daily: 9:00 AM - 10:00 PM',
      lighting: 'Card-Access Campus Safe Zone',
    },
  ];

  const safetySteps = [
    {
      title: 'Always Meet in Daylight & Public Zones',
      desc: 'Never agree to meet in isolated parking lots or off-campus locations. Stick to our designated campus checkpoints.',
      icon: MapPin,
    },
    {
      title: 'Protect Private Dorm Information',
      desc: 'Keep dorm room numbers and private personal schedules strictly confidential. Per ThriftSync safety rules, private pickup info is never exposed.',
      icon: ShieldCheck,
    },
    {
      title: 'Inspect Before Handover',
      desc: 'Verify textbook edition, electronics functionality, or garment condition in person before confirming exchange.',
      icon: Eye,
    },
    {
      title: 'Confirm Handover Bilaterally in App',
      desc: 'Both buyer and seller must confirm handover in the ThriftSync dashboard to release deposits and finalize records.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campus-safety-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative text-text animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          aria-label="Close safety guide"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sustainability/10 border border-sustainability/20 text-sustainability dark:text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="size-3.5" />
            <span>Campus Security Protocol</span>
          </div>
          <h2 id="campus-safety-title" className="text-2xl font-black tracking-tight text-text">
            Safe Peer Handover Guidelines
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            ThriftSync is built for verified campus members. Follow these standards for safe physical exchanges.
          </p>
        </div>

        {/* 4 Safety Rules */}
        <div className="space-y-3 mb-6">
          {safetySteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 text-xs"
              >
                <div className="size-7 rounded-xl bg-sustainability/10 text-sustainability dark:text-green-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Icon className="size-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-text">{step.title}</h4>
                  <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Designated Campus Safe Zones */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
            Verified Campus Handover Checkpoints
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {safeZones.map((zone, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-background border border-stone-200 dark:border-stone-800 text-xs"
              >
                <div className="flex items-center gap-1.5 font-bold text-text mb-1">
                  <MapPin className="size-3.5 text-sustainability" />
                  <span>{zone.name}</span>
                </div>
                <p className="text-stone-600 dark:text-stone-300 text-[11px]">{zone.spot}</p>
                <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-1.5">
                  <Clock className="size-3" />
                  <span>{zone.hours}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Hotline Note */}
        <div className="mt-6 p-3 rounded-xl bg-rental/10 border border-rental/20 text-rental dark:text-orange-400 text-xs flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>If anything feels suspicious during a meetup, decline the exchange and report it immediately to campus safety.</span>
        </div>
      </div>
    </div>
  );
}

export default CampusSafetyModal;
