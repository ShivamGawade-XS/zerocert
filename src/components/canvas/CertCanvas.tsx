'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { jsPDF } from 'jspdf';
import { Cert } from '@/types';
import { drawCert } from '@/lib/canvas';

interface CertCanvasProps {
  cert: Cert;
  eventName: string;
  orgName: string;
  orgLogoUrl?: string | null;
  coLogos?: string[];
  signatories?: any[];
  onReady?: (canvas: HTMLCanvasElement) => void;
}

export interface CertCanvasRef {
  downloadPNG: () => void;
  downloadPDF: () => void;
}

const loadImg = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((res) => {
    if (!src) {
      res(null);
      return;
    }
    const i = new Image();
    i.crossOrigin = 'anonymous'; // Avoid tainted canvas for cross-origin images
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });

export const CertCanvas = forwardRef<CertCanvasRef, CertCanvasProps>(({
  cert,
  eventName,
  orgName,
  orgLogoUrl,
  coLogos = [],
  signatories = [],
  onReady,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const W = 960;
  const H = 700;

  useEffect(() => {
    let active = true;
    setLoading(true);

    const logoSrcs = [orgLogoUrl, ...coLogos].filter(Boolean) as string[];
    const sigSrcs = signatories.map((s) =>
      s.signatureType !== 'typed' && s.signatureData ? s.signatureData : null
    );

    Promise.all([
      Promise.all(logoSrcs.map((src) => loadImg(src))),
      Promise.all(sigSrcs.map((src) => (src ? loadImg(src) : Promise.resolve(null)))),
    ]).then(([logoImgs, sigImgs]) => {
      if (!active) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Filter loaded logos
      const activeLogos = logoImgs.filter(Boolean) as HTMLImageElement[];
      
      // Draw certificate
      drawCert(ctx, cert, eventName, orgName, activeLogos, sigImgs);
      setLoading(false);
      onReady?.(canvas);
    });

    return () => {
      active = false;
    };
  }, [cert, eventName, orgName, orgLogoUrl, coLogos, signatories, onReady]);

  const cleanFilename = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9_\-]/g, '_') + '_certificate';
  };

  useImperativeHandle(ref, () => ({
    downloadPNG() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cleanFilename(cert.fields?.Name || 'certificate')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }, 'image/png');
    },
    downloadPDF() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${cleanFilename(cert.fields?.Name || 'certificate')}.pdf`);
    },
  }));

  return (
    <div className="relative w-full overflow-hidden border border-border bg-surface rounded">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/85 backdrop-blur-sm z-20">
          <div className="text-center font-mono text-xs text-accent animate-pulse">
            Rendering Certificate Canvas…
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full h-auto block select-none"
      />
    </div>
  );
});

CertCanvas.displayName = 'CertCanvas';
