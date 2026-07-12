import { Cert } from '@/types';
import { CERT_W, CERT_H, drawLogos, drawSignatures } from '../base';

export function drawMinimal(
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

  ctx.fillStyle = '#FEFEFE';
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  ctx.strokeStyle = '#F0F0F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(32, 32, CERT_W - 64, CERT_H - 64);

  ctx.fillStyle = '#000';
  ctx.fillRect(32, 88, 160, 1);

  // Draw logos top-left
  drawLogos(ctx, logoImgs, 46, 36, 38, 'left');

  ctx.fillStyle = '#000';
  ctx.font = "9px 'Courier New'";
  ctx.textAlign = 'right';
  ctx.fillText(orgName.toUpperCase(), CERT_W - 46, 56);
  
  ctx.fillStyle = '#CCC';
  ctx.fillText('CERTXCHANGE.IN', CERT_W - 46, 72);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.font = 'bold 72px Georgia';
  ctx.fillText('Certificate', CERT_W / 2, 208);
  
  ctx.fillStyle = '#AAA';
  ctx.font = '14px Georgia';
  ctx.fillText('of Completion', CERT_W / 2, 238);

  ctx.fillStyle = '#E8E8E8';
  ctx.fillRect(CERT_W / 2 - 60, 256, 120, 1);
  
  ctx.fillStyle = '#999';
  ctx.font = 'italic 14px Georgia';
  ctx.fillText('awarded to', CERT_W / 2, 292);

  ctx.fillStyle = '#000';
  ctx.font = 'bold 52px Georgia';
  ctx.fillText(name, CERT_W / 2, 364);
  
  ctx.fillStyle = '#000';
  ctx.fillRect(CERT_W / 2 - 200, 380, 400, 0.5);

  ctx.fillStyle = '#999';
  ctx.font = 'italic 14px Georgia';
  ctx.fillText('for completing', CERT_W / 2, 418);
  
  ctx.fillStyle = '#000';
  ctx.font = '22px Georgia';
  ctx.fillText(eventName, CERT_W / 2, 452);

  ctx.font = "10px 'Courier New'";
  ctx.fillStyle = '#AAA';
  extras.forEach(([k, v], i) => ctx.fillText(`${k}: ${v}`, CERT_W / 2, 472 + i * 16));

  const ey = 492 + extras.length * 16;
  ctx.fillStyle = '#CCC';
  ctx.font = "10px 'Courier New'";
  ctx.fillText(`${issued}  ·  ID ${certId}`, CERT_W / 2, ey);

  if (cert.fields?.Signatories) {
    const parsedSigs = Array.isArray(cert.fields.Signatories)
      ? cert.fields.Signatories
      : typeof cert.fields.Signatories === 'string'
      ? JSON.parse(cert.fields.Signatories)
      : [];
    drawSignatures(ctx, parsedSigs, sigImgs, 'minimal');
  }

  ctx.fillStyle = '#EBEBEB';
  ctx.fillRect(32, CERT_H - 44, CERT_W - 64, 1);
  
  ctx.fillStyle = '#CCC';
  ctx.font = "8px 'Courier New'";
  ctx.fillText(`VERIFY AT CERTXCHANGE.IN — ${certId}`, CERT_W / 2, CERT_H - 28);
}
