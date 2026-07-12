'use client';

import { useToasts, ToastType } from '@/lib/toast';

const typeStyles: Record<ToastType, string> = {
  success: 'border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]',
  error:   'border-red-500/40  bg-red-500/10  text-red-400',
  info:    'border-[#1565FE]/40 bg-[#1565FE]/10 text-[#1565FE]',
};

const typeIcon: Record<ToastType, string> = {
  success: '✓',
  error: '⚠',
  info: 'ℹ',
};

export default function ToastContainer() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm font-mono text-xs shadow-lg animate-in slide-in-from-bottom-2 duration-300 ${typeStyles[t.type]}`}
        >
          <span className="font-bold text-sm shrink-0">{typeIcon[t.type]}</span>
          <span className="leading-relaxed">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
