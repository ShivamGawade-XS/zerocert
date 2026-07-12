import { Cert } from '@/types';
import { CERT_W, CERT_H, drawLogos, drawSignatures } from '../base';

export function drawBrutal(
  ctx: CanvasRenderingContext2D,
  cert: Cert,
  eventName: string,
  orgName: string,
  logoImgs: HTMLImageElement[],
  sigImgs: (HTMLImageElement | null)[]
): void {
  const isCollab = logoImgs.length > 1;
  const name = cert.fields?.Name || 'Participant';
  const certId = cert.cert_id || 'ZC-XXXXXX';
  const issued = new Date(cert.issued_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const extras = Object.entries(cert.fields || {}).filter(([k]) => k !== 'Name' && k !== 'Email');

  ctx.fillStyle = '#F5F500';
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  const hH = isCollab ? 124 : 108;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CERT_W, hH);
  ctx.fillRect(0, CERT_H - 56, CERT_W, 56);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, CERT_W - 10, CERT_H - 10);
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, CERT_W - 36, CERT_H - 36);

  // Draw logos in header
  drawLogos(ctx, logoImgs, 22, (hH - 72) / 2, 72, 'left');

  ctx.fillStyle = '#F5F500';
  ctx.font = "bold 14px 'Courier New'";
  ctx.textAlign = 'right';
  ctx.fillText(orgName.toUpperCase(), CERT_W - 22, 54);
  
  ctx.fillStyle = '#888';
  ctx.font = "10px 'Courier New'";
  ctx.fillText('CERTXCHANGE.IN', CERT_W - 22, 70);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.font = 'bold 82px Impact';
  ctx.fillText('CERT', CERT_W / 2, hH + 86);
  
  ctx.font = "16px 'Courier New'";
  ctx.fillText('OF COMPLETION', CERT_W / 2, hH + 110);

  ctx.font = "12px 'Courier New'";
  ctx.fillText('THIS CERTIFIES THAT:', CERT_W / 2, hH + 150);
  
  ctx.font = 'bold 56px Impact';
  ctx.fillText(name, CERT_W / 2, hH + 214);
  
  ctx.fillRect(CERT_W / 2 - 240, hH + 222, 480, 6);

  ctx.font = "14px 'Courier New'";
  ctx.fillText('HAS COMPLETED:', CERT_W / 2, hH + 260);
  
  ctx.font = 'bold 28px Impact';
  ctx.fillText(eventName.toUpperCase(), CERT_W / 2, hH + 294);

  ctx.font = "10px 'Courier New'";
  ctx.fillStyle = '#333';
  extras.forEach(([k, v], i) => ctx.fillText(`${k}: ${v}`, CERT_W / 2, hH + 314 + i * 16));

  const ey = hH + 332 + extras.length * 16;
  ctx.font = "10px 'Courier New'";
  ctx.fillText(`${issued}  ·  ID: ${certId}`, CERT_W / 2, ey);

  if (cert.fields?.Signatories) {
    const parsedSigs = Array.isArray(cert.fields.Signatories)
      ? cert.fields.Signatories
      : typeof cert.fields.Signatories === 'string'
      ? JSON.parse(cert.fields.Signatories)
      : [];
    drawSignatures(ctx, parsedSigs, sigImgs, 'brutal');
  }

  ctx.fillStyle = '#F5F500';
  ctx.font = "bold 10px 'Courier New'";
  ctx.fillText(`VERIFY: CERTXCHANGE.IN — ${certId}`, CERT_W / 2, CERT_H - 26);
}
