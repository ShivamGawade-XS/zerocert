import { Cert } from '@/types';
import { CERT_W, CERT_H, drawLogos, drawSignatures, drawSeal } from '../base';

export function drawClassic(
  ctx: CanvasRenderingContext2D,
  cert: Cert,
  eventName: string,
  orgName: string,
  logoImgs: HTMLImageElement[],
  sigImgs: (HTMLImageElement | null)[]
): void {
  const isCollab = logoImgs.length > 1;
  const sigs = cert.fields ? cert.fields.Signatories || [] : [];
  const name = cert.fields?.Name || 'Participant';
  const certId = cert.cert_id || 'ZC-XXXXXX';
  const hash = cert.sha256_hash || '0'.repeat(64);
  const issued = new Date(cert.issued_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const extras = Object.entries(cert.fields || {}).filter(([k]) => k !== 'Name' && k !== 'Email');

  ctx.fillStyle = '#FAFAF3';
  ctx.fillRect(0, 0, CERT_W, CERT_H);
  
  ctx.strokeStyle = '#B8922A';
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, CERT_W - 28, CERT_H - 28);
  
  ctx.strokeStyle = '#D4AF60';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(26, 26, CERT_W - 52, CERT_H - 52);

  // Corner ornaments
  [[34, 34], [CERT_W - 86, 34], [34, CERT_H - 86], [CERT_W - 86, CERT_H - 86]].forEach(([x, y]) => {
    ctx.strokeStyle = '#D4AF6066';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 52, 52);
  });

  const hH = isCollab ? 110 : 90;
  ctx.fillStyle = '#0A0A1C';
  ctx.fillRect(32, 32, CERT_W - 64, hH);
  
  ctx.fillStyle = '#E8FF00';
  ctx.fillRect(32, 32, 7, hH);

  // Draw logos
  drawLogos(ctx, logoImgs, CERT_W - 54, 32 + (hH - 62) / 2, 62, 'right');

  ctx.fillStyle = '#FFF';
  ctx.font = "600 13px 'Courier New'";
  ctx.textAlign = 'left';
  ctx.fillText(orgName.toUpperCase(), 54, 32 + hH / 2 - 4);
  
  if (isCollab) {
    ctx.fillStyle = '#E8FF0099';
    ctx.font = "9px 'Courier New'";
    ctx.fillText('IN COLLABORATION', 54, 32 + hH / 2 + 12);
  }

  ctx.fillStyle = '#E8FF00';
  ctx.font = "10px 'Courier New'";
  ctx.textAlign = 'right';
  ctx.fillText('CERTXCHANGE · BLOCKCHAIN VERIFIED', CERT_W - 48, 32 + hH - 12);

  const by = 32 + hH;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#12102A';
  ctx.font = 'bold 56px Georgia';
  ctx.fillText('CERTIFICATE', CERT_W / 2, by + 78);
  
  ctx.font = '19px Georgia';
  ctx.fillStyle = '#8A6820';
  ctx.fillText('OF COMPLETION', CERT_W / 2, by + 106);

  const g = ctx.createLinearGradient(80, 0, CERT_W - 80, 0);
  g.addColorStop(0, 'transparent');
  g.addColorStop(0.3, '#B8922A');
  g.addColorStop(0.7, '#B8922A');
  g.addColorStop(1, 'transparent');
  ctx.strokeStyle = g;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, by + 122);
  ctx.lineTo(CERT_W - 80, by + 122);
  ctx.stroke();

  ctx.fillStyle = '#9A7A50';
  ctx.font = 'italic 16px Georgia';
  ctx.fillText('This is to certify that', CERT_W / 2, by + 158);

  ctx.fillStyle = '#08081E';
  ctx.font = 'bold 50px Georgia';
  ctx.fillText(name, CERT_W / 2, by + 222);

  const nw = ctx.measureText(name).width;
  ctx.beginPath();
  ctx.moveTo(CERT_W / 2 - nw / 2 - 8, by + 234);
  ctx.lineTo(CERT_W / 2 + nw / 2 + 8, by + 234);
  ctx.strokeStyle = '#B8922A';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#9A7A50';
  ctx.font = 'italic 16px Georgia';
  ctx.fillText('has successfully completed', CERT_W / 2, by + 268);

  ctx.fillStyle = '#08081E';
  ctx.font = 'bold 26px Georgia';
  ctx.fillText(eventName, CERT_W / 2, by + 302);

  ctx.font = "10px 'Courier New'";
  ctx.fillStyle = '#777';
  extras.forEach(([k, v], i) => ctx.fillText(`${k}: ${v}`, CERT_W / 2, by + 322 + i * 16));

  const ey = by + 340 + extras.length * 16;
  ctx.fillStyle = '#AAA';
  ctx.font = "10px 'Courier New'";
  ctx.fillText(`Issued: ${issued}`, CERT_W / 2, ey);
  ctx.fillText(`ID: ${certId}`, CERT_W / 2, ey + 16);
  ctx.fillStyle = '#CCC';
  ctx.font = "9px 'Courier New'";
  ctx.fillText(`SHA-256: ${hash.slice(0, 44)}…`, CERT_W / 2, ey + 30);

  if (cert.fields?.Signatories) {
    const parsedSigs = Array.isArray(cert.fields.Signatories)
      ? cert.fields.Signatories
      : typeof cert.fields.Signatories === 'string'
      ? JSON.parse(cert.fields.Signatories)
      : [];
    drawSignatures(ctx, parsedSigs, sigImgs, 'classic');
  }

  // Draw seal
  drawSeal(ctx, CERT_W - 78, CERT_H - 78);

  ctx.beginPath();
  ctx.moveTo(80, CERT_H - 28);
  ctx.lineTo(CERT_W - 80, CERT_H - 28);
  ctx.strokeStyle = '#DDD';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.fillStyle = '#BBB';
  ctx.font = "8px 'Courier New'";
  ctx.fillText(`Verify at certxchange.vercel.app/verify — ${certId}`, CERT_W / 2, CERT_H - 14);
}
