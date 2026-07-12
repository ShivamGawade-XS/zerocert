import { Cert } from '@/types';
import { CERT_W, CERT_H, drawLogos, drawSignatures } from '../base';

export function drawCorp(
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

  // Corporate deep navy & white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  // Border frame
  ctx.strokeStyle = '#0F2C59';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, CERT_W - 12, CERT_H - 12);

  ctx.strokeStyle = '#DAC0A3';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, CERT_W - 36, CERT_H - 36);

  // Left stripe
  ctx.fillStyle = '#0F2C59';
  ctx.fillRect(20, 20, 32, CERT_H - 40);

  // Draw logos top right
  drawLogos(ctx, logoImgs, CERT_W - 60, 36, 48, 'right');

  ctx.fillStyle = '#0F2C59';
  ctx.font = 'bold 36px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText('CERTIFICATE OF RECOGNITION', 80, 110);

  ctx.fillStyle = '#DAC0A3';
  ctx.fillRect(80, 126, CERT_W - 340, 3);

  ctx.fillStyle = '#555';
  ctx.font = '13px var(--font-ibm-plex-mono), Courier New';
  ctx.fillText(`ISSUED BY: ${orgName.toUpperCase()}`, 80, 150);

  ctx.fillStyle = '#333';
  ctx.font = 'italic 16px Georgia';
  ctx.fillText('This certificate is proudly presented to', 80, 220);

  // Name
  ctx.fillStyle = '#0F2C59';
  ctx.font = 'bold 44px Georgia';
  ctx.fillText(name, 80, 280);

  ctx.fillStyle = '#555';
  ctx.font = 'italic 15px Georgia';
  ctx.fillText('for successful completion of the requirements for', 80, 330);

  ctx.fillStyle = '#DAC0A3';
  ctx.font = 'bold 22px Georgia';
  ctx.fillText(eventName, 80, 370);

  // Extra details
  ctx.font = '11px var(--font-ibm-plex-mono), Courier New';
  ctx.fillStyle = '#777';
  extras.forEach(([k, v], i) => {
    ctx.fillText(`${k.toUpperCase()}: ${v}`, 80, 410 + i * 18);
  });

  const ey = 420 + extras.length * 18;
  ctx.fillStyle = '#999';
  ctx.fillText(`Verification ID: ${certId}`, 80, ey + 20);
  ctx.fillText(`Date: ${issued}`, 80, ey + 38);

  if (cert.fields?.Signatories) {
    const parsedSigs = Array.isArray(cert.fields.Signatories)
      ? cert.fields.Signatories
      : typeof cert.fields.Signatories === 'string'
      ? JSON.parse(cert.fields.Signatories)
      : [];
    drawSignatures(ctx, parsedSigs, sigImgs, 'classic');
  }

  // Small verify footer link
  ctx.fillStyle = '#888';
  ctx.font = '8px var(--font-ibm-plex-mono), Courier New';
  ctx.fillText(`Secure verification link: certxchange.vercel.app/verify?id=${certId}`, 80, CERT_H - 24);
}
