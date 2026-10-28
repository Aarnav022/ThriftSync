import React from 'react';
import { Sparkles, CheckCircle, ShieldCheck } from 'lucide-react';

export function ConditionBadge({ condition = 'Good', size = 'sm' }) {
  const norm = (condition || '').toLowerCase();

  let colorClasses = 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]';
  let Icon = CheckCircle;

  if (norm.includes('new') || norm.includes('pristine')) {
    colorClasses = 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]';
    Icon = Sparkles;
  } else if (norm.includes('fair') || norm.includes('worn')) {
    colorClasses = 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]';
    Icon = ShieldCheck;
  }

  const sizeClasses = size === 'xs' 
    ? 'text-[10px] px-1.5 py-0.5 gap-1' 
    : 'text-xs px-2.5 py-0.5 gap-1.5';

  return (
    <span className={`inline-flex items-center font-bold rounded-full border shadow-2xs select-none ${colorClasses} ${sizeClasses}`}>
      <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      <span>{condition}</span>
    </span>
  );
}
