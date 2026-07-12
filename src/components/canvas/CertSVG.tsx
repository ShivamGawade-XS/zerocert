'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { jsPDF } from 'jspdf';
import { Cert } from '@/types';
import { renderSVGTemplate } from '@/lib/svg-templates';

interface CertSVGProps {
  cert: Cert;
  eventName: string;
  orgName: string;
  orgLogoUrl?: string | null;
  coLogos?: string[];
  signatories?: any[];
  onReady?: (svgElement: SVGSVGElement) => void;
}

export interface CertSVGRef {
  downloadPNG: () => void;
  downloadPDF: () => void;
}

const toDataURL = async (url: string): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return url; // Fallback to original URL
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn(`CORS restriction while fetching image ${url}, falling back to direct URL:`, e);
    return url;
  }
};

export const CertSVG = forwardRef<CertSVGRef, CertSVGProps>(({
  cert,
  eventName,
  orgName,
  orgLogoUrl,
  coLogos = [],
  signatories = [],
  onReady,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [preloadedLogos, setPreloadedLogos] = useState<string[]>([]);
  const [preloadedSigs, setPreloadedSigs] = useState<(string | null)[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const logoSrcs = [orgLogoUrl, ...coLogos].filter(Boolean) as string[];
    const sigSrcs = signatories.map((s) =>
      s.signatureType !== 'typed' && s.signatureData ? s.signatureData : null
    );

    Promise.all([
      Promise.all(logoSrcs.map((src) => toDataURL(src))),
      Promise.all(sigSrcs.map((src) => (src ? toDataURL(src) : Promise.resolve(null)))),
    ]).then(([logos, sigs]) => {
      if (!active) return;
      setPreloadedLogos(logos.filter(Boolean) as string[]);
      setPreloadedSigs(sigs);
      setLoading(false);

      // Trigger onReady on next tick after React finishes rendering
      setTimeout(() => {
        const svg = containerRef.current?.querySelector('svg');
        if (svg && onReady) onReady(svg);
      }, 50);
    });

    return () => {
      active = false;
    };
  }, [cert, eventName, orgName, orgLogoUrl, coLogos, signatories, onReady]);

  const cleanFilename = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9_\-]/g, '_') + '_certificate';
  };

  const getSVGHtml = (): string | null => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return null;
    
    // Set explicit width/height for rasterization
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('width', '960');
    svgClone.setAttribute('height', '700');
    
    return new XMLSerializer().serializeToString(svgClone);
  };

  const rasterizeSVG = (svgString: string): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 960;
        canvas.height = 700;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  };

  useImperativeHandle(ref, () => ({
    async downloadPNG() {
      const svgString = getSVGHtml();
      if (!svgString) return;
      try {
        const canvas = await rasterizeSVG(svgString);
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
      } catch (err) {
        console.error('Failed to export SVG to PNG:', err);
      }
    },
    async downloadPDF() {
      const svgString = getSVGHtml();
      if (!svgString) return;
      try {
        const canvas = await rasterizeSVG(svgString);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${cleanFilename(cert.fields?.Name || 'certificate')}.pdf`);
      } catch (err) {
        console.error('Failed to export SVG to PDF:', err);
      }
    },
  }));

  const templateId = (cert.fields?.template || cert.fields?.Template || 'classic').toLowerCase();

  return (
    <div className="relative w-full aspect-[960/700] overflow-hidden border border-border bg-surface rounded" ref={containerRef}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/85 backdrop-blur-sm z-20">
          <div className="text-center font-mono text-xs text-accent animate-pulse">
            Rendering Vector Certificate…
          </div>
        </div>
      )}
      
      {/* Inline SVG element rendering */}
      {!loading && renderSVGTemplate(templateId, cert, eventName, orgName, preloadedLogos, preloadedSigs)}
    </div>
  );
});

CertSVG.displayName = 'CertSVG';
