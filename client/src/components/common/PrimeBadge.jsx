import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function PrimeBadge({ size = 'md' }) {
  if (size === 'sm') {
    return (
      <div className="inline-flex items-center gap-1 select-none" title="Campus Verified: Inspected & Guaranteed Handover">
        <span className="text-[#2A6F4E] font-black italic tracking-tight text-[11px] leading-none">
          verified
        </span>
        <ShieldCheck className="w-3 h-3 text-[#E07A5F]" />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 select-none" title="Campus Verified: Inspected & Guaranteed Handover">
      <span className="text-[#2A6F4E] font-black italic tracking-tight text-[13px] leading-none">
        campus verified
      </span>
      <ShieldCheck className="w-3.5 h-3.5 text-[#E07A5F]" />
    </div>
  );
}
