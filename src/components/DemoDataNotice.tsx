import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DemoDataNoticeProps {
  className?: string;
}

export const DemoDataNotice: React.FC<DemoDataNoticeProps> = ({ className = '' }) => {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono tracking-wide ${className}`}
      role="status"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
      <span className="font-semibold">SIMULATED DEMO DATA — NOT LIVE CITY DATA</span>
    </div>
  );
};
