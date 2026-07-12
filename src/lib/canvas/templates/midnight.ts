import { Cert } from '@/types';
import { CERT_W, CERT_H, drawLogos, drawSignatures } from '../base';

export function drawMidnight(
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

  // Midnight Violet theme
  ctx.fillStyle = '#0B0720';
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  // Gradient border
  const borderGrad = ctx.createLinearGradient(0, 0, CERT_W, CERT_H);
  borderGrad.addColorStop(0, '#9B5CFF');
  borderGrad.addColorStop(0.5, '#FF3355');
  borderGrad.addColorStop(1, '#00AAFF');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, CERT_W - 32, CERT_H - 32);

  // Ambient glows
  const rGrad = ctx.createRadialGradient(CERT_W / 2, CERT_H / 2, 50, CERT_W / 2, CERT_H / 2, 400);
  rGrad.addColorStop(0, '#1A0D3A');
  rGrad.addColorStop(1, '#0B0720');
  ctx.fillStyle = rGrad;
  ctx.fillRect(19, 19, CERT_W - 38, CERT_H - 38);

  // Draw logos top left
  drawLogos(ctx, logoImgs, 40, 36, 44, 'left');

  ctx.fillStyle = '#9B5CFF';
  ctx.font = 'bold 12px var(--font-ibm-plex-mono), Courier New';
  ctx.textAlign = 'right';
  ctx.fillText(orgName.toUpperCase(), CERT_W - 40, 52);

  ctx.fillStyle = '#FFF';
  ctx.textAlign = 'center';
  ctx.font = 'bold 54px Impact';
  ctx.fillText('CERTIFICATE OF ACCOMPLISHMENT', CERT_W / 2, 170);

  ctx.fillStyle = '#FF3355';
  ctx.fillRect(CERT_W / 2 - 120, 190, 240, 2);

  ctx.fillStyle = '#7070A0';
  ctx.font = 'italic 15px Georgia';
  ctx.fillText('proudly presented to', CERT_W / 2, 230);

  // Name with soft violet shadow
  ctx.save();
  ctx.shadowColor = '#9B5CFF';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 46px Georgia';
  ctx.fillText(name, CERT_W / 2, 290);
  ctx.restore();

  ctx.fillStyle = '#7070A0';
  ctx.font = 'italic 15px Georgia';
  ctx.fillText('for successful completion of', CERT_W / 2, 330);

  ctx.fillStyle = '#00AAFF';
  ctx.font = 'bold 24px Georgia';
  ctx.fillText(eventName, CERT_W / 2, 366);

  // Extras
  ctx.font = '10px var(--font-ibm-plex-mono), Courier New';
  ctx.fillStyle = '#4A4A6A';
  extras.forEach(([k, v], i) => {
    ctx.fillText(`${k.toUpperCase()}: ${v}`, CERT_W / 2, 400 + i * 16);
  });

  const ey = 410 + extras.length * 16;
  ctx.fillStyle = '#7070A0';
  ctx.fillText(`Issued Date: ${issued}   |   Cert ID: ${certId}`, CERT_W / 2, ey + 20);

  if (cert.fields?.Signatories) {
    const parsedSigs = Array.isArray(cert.fields.Signatories)
      ? cert.fields.Signatories
      : typeof cert.fields.Signatories === 'string'
      ? JSON.parse(cert.fields.Signatories)
      : [];
    drawSignatures(ctx, parsedSigs, sigImgs, 'dark');
  }

  // Footer link
  ctx.fillStyle = '#4A4A6A';
  ctx.font = '9px var(--font-ibm-plex-mono), Courier New';
  ctx.fillText(`Verify validity at: zerocert.app/verify/${certId}`, CERT_W / 2, CERT_H - 24);
}
