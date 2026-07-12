'use client';

import { useEffect, useCallback } from 'react';
import { renderSVGTemplate } from '@/lib/svg-templates';

const DUMMY_CERT: any = {
  id: 'preview',
  cert_id: 'ZC-000001',
  event_id: 'preview',
  org_id: 'preview',
  sha256_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  status: 'active',
  issued_at: new Date().toISOString(),
  fields: {
    Name: 'Priya Sharma',
    Email: 'priya@example.com',
    Signatories: JSON.stringify([
      { name: 'Dr. Anita Roy', title: 'Director', signatureType: 'typed', signatureData: 'Anita Roy', signatureFont: 'Great Vibes, cursive' },
      { name: 'Prof. Kumar', title: 'Head of Dept', signatureType: 'typed', signatureData: 'A. Kumar', signatureFont: 'Dancing Script, cursive' },
    ]),
  },
};

interface TemplatePreviewModalProps {
  templateId: string;
  templateName: string;
  eventName?: string;
  orgName?: string;
  onClose: () => void;
  onSelect: () => void;
}

export default function TemplatePreviewModal({
  templateId,
  templateName,
  eventName = 'National Innovation Hackathon 2026',
  orgName = 'Your Organization',
  onClose,
  onSelect,
}: TemplatePreviewModalProps) {

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const svgElement = renderSVGTemplate(
    templateId,
    DUMMY_CERT,
    eventName,
    orgName,
    [],
    [null, null]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-5xl bg-surface border border-border rounded-lg shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg">
          <div>
            <div className="text-accent text-[9px] tracking-widest uppercase font-mono">Template Preview</div>
            <div className="font-display text-base text-text uppercase tracking-wider font-bold">{templateName}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSelect}
              className="px-5 py-2 bg-accent hover:bg-accentH text-black text-[10px] font-bold tracking-widest uppercase rounded transition"
            >
              ✓ Use This Template
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded border border-border hover:border-err hover:text-err text-muted transition"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Certificate preview */}
        <div className="p-6 bg-[#0A0A0A]">
          <div className="w-full aspect-[960/700] overflow-hidden rounded border border-border shadow-lg">
            {svgElement}
          </div>
        </div>

        {/* Footer note */}
        <div className="px-5 py-3 border-t border-border bg-bg text-[9px] text-muted font-mono text-center">
          Preview uses dummy data — your real event name and recipient names will appear when certificates are issued.
          Press <kbd className="px-1 py-0.5 bg-surface border border-border rounded text-[8px]">Esc</kbd> to close.
        </div>
      </div>
    </div>
  );
}
