import { Cert } from '@/types';
import { CERT_W, CERT_H, drawLogos, drawSignatures } from '../base';

export function drawVintage(
  ctx: CanvasRenderingContext2D,
  cert: Cert,
  eventName: string,
  orgName: string,
  logoImgs: HTMLImageElement[],
  sigImgs: (HTMLImageElement | null)[]
): void {
  const name = cert.fields?.Name || 'Participant';
  const certId = cert.cert_id || 'ZC-XXXXXX';
  const issued = new Date(cert.issued_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const extras = Object.entries(cert.fields || {}).filter(([k]) => k !== 'Name' && k !== 'Email');

  // Sepia paper background
  ctx.fillStyle = '#EED9B3';
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  // Distressed double border
  ctx.strokeStyle = '#4A3B32';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, CERT_W - 40, CERT_H - 40);

  ctx.strokeStyle = '#4A3B32';
  ctx.lineWidth = 1;
  ctx.strokeRect(26, 26, CERT_W - 52, CERT_H - 52);

  // Corner fleurons (mocked via simple geometry)
  [[32, 32], [CERT_W - 48, 32], [32, CERT_H - 48], [CERT_W - 48, CERT_H - 48]].forEach(([x, y]) => {
    ctx.fillStyle = '#4A3B32';
    ctx.fillRect(x - 4, y - 4, 8, 8);
  });

  // Draw logos in the center top
  drawLogos(ctx, logoImgs, CERT_W / 2, 44, 44, 'center');

  ctx.fillStyle = '#4A3B32';
  ctx.textAlign = 'center';
  ctx.font = 'italic 12px Georgia';
  ctx.fillText(orgName.toUpperCase(), CERT_W / 2, 114);

  ctx.font = 'bold 44px Georgia';
  ctx.fillText('Diploma of Achievement', CERT_W / 2, 180);

  ctx.strokeStyle = '#4A3B32';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(CERT_W / 2 - 160, 200);
  ctx.lineTo(CERT_W / 2 + 160, 200);
  ctx.stroke();

  ctx.font = 'italic 16px Georgia';
  ctx.fillText('This document certifies that', CERT_W / 2, 238);

  ctx.font = 'bold 38px Georgia';
  ctx.fillText(name, CERT_W / 2, 290);

  ctx.font = 'italic 16px Georgia';
  ctx.fillText('has satisfactorily completed all conditions of the event', CERT_W / 2, 340);

  ctx.font = 'bold 22px Georgia';
  ctx.fillText(eventName, CERT_W / 2, 380);

  // Extras
  ctx.font = 'italic 11px Georgia';
  extras.forEach(([k, v], i) => {
    ctx.fillText(`${k}: ${v}`, CERT_W / 2, 410 + i * 18);
  });

  const ey = 420 + extras.length * 18;
  ctx.font = '10px var(--font-ibm-plex-mono), Courier New';
  ctx.fillText(`Date: ${issued}  |  Doc ID: ${certId}`, CERT_W / 2, ey + 20);

  if (cert.fields?.Signatories) {
    const parsedSigs = Array.isArray(cert.fields.Signatories)
      ? cert.fields.Signatories
      : typeof cert.fields.Signatories === 'string'
      ? JSON.parse(cert.fields.Signatories)
      : [];
    drawSignatures(ctx, parsedSigs, sigImgs, 'classic');
  }

  // Footer verify
  ctx.fillStyle = '#4A3B32';
  ctx.font = '8px var(--font-ibm-plex-mono), Courier New';
  ctx.fillText(`Verification Registry: certxchange.vercel.app/verify?id=${certId}`, CERT_W / 2, CERT_H - 32);
}
