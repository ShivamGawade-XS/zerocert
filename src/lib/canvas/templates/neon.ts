import { Cert } from '@/types';
import { CERT_W, CERT_H, drawLogos, drawSignatures } from '../base';

export function drawNeon(
  ctx: CanvasRenderingContext2D,
  cert: Cert,
  eventName: string,
  orgName: string,
  logoImgs: HTMLImageElement[],
  sigImgs: (HTMLImageElement | null)[]
): void {
  const name = cert.fields?.Name || 'Participant';
  const certId = cert.cert_id || 'ZC-XXXXXX';
  const hash = cert.sha256_hash || '0'.repeat(64);
  const extras = Object.entries(cert.fields || {}).filter(([k]) => k !== 'Name' && k !== 'Email');

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  ctx.strokeStyle = '#0A1428';
  ctx.lineWidth = 1;
  for (let x = 0; x < CERT_W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CERT_H);
    ctx.stroke();
  }
  for (let y = 0; y < CERT_H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CERT_W, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 18;
  ctx.strokeRect(16, 16, CERT_W - 32, CERT_H - 32);

  ctx.strokeStyle = '#FF00FF';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 12;
  ctx.strokeRect(24, 24, CERT_W - 48, CERT_H - 48);
  ctx.shadowBlur = 0;

  // Draw logos on top left
  drawLogos(ctx, logoImgs, 32, 32, 46, 'left');

  ctx.fillStyle = '#00FFFF';
  ctx.font = "bold 11px 'Courier New'";
  ctx.textAlign = 'right';
  ctx.fillText(orgName.toUpperCase(), CERT_W - 32, 54);
  
  ctx.fillStyle = '#FF00FF';
  ctx.font = "9px 'Courier New'";
  ctx.fillText('BLOCKCHAIN_VERIFIED :: CERTXCHANGE', CERT_W - 32, 70);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF00FF';
  ctx.shadowColor = '#FF00FF';
  ctx.shadowBlur = 22;
  ctx.font = 'bold 70px Impact';
  ctx.fillText('CERTIFICATE', CERT_W / 2 + 2, 190);
  
  ctx.fillStyle = '#00FFFF';
  ctx.shadowColor = '#00FFFF';
  ctx.fillText('CERTIFICATE', CERT_W / 2 - 2, 188);
  
  ctx.fillStyle = '#FFF';
  ctx.shadowBlur = 0;
  ctx.fillText('CERTIFICATE', CERT_W / 2, 189);

  ctx.fillStyle = '#00FFFF88';
  ctx.font = "10px 'Courier New'";
  ctx.fillText('// OF ACHIEVEMENT //', CERT_W / 2, 216);

  for (let i = 130; i < CERT_H; i += 4) {
    ctx.fillStyle = '#FFFFFF02';
    ctx.fillRect(0, i, CERT_W, 2);
  }

  ctx.fillStyle = '#888';
  ctx.font = "12px 'Courier New'";
  ctx.fillText('> AWARDED_TO:', CERT_W / 2, 264);

  ctx.fillStyle = '#00FFFF';
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 18;
  ctx.font = 'bold 46px Georgia';
  ctx.fillText(name, CERT_W / 2, 326);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#FF00FF';
  ctx.font = "11px 'Courier New'";
  ctx.fillText(`> EVENT: ${eventName}`, CERT_W / 2, 362);

  ctx.font = "10px 'Courier New'";
  ctx.fillStyle = '#55557A';
  extras.forEach(([k, v], i) => ctx.fillText(`> ${k.toUpperCase()}: ${v}`, CERT_W / 2, 382 + i * 16));

  const ey = 402 + extras.length * 16;
  ctx.fillStyle = '#333';
  ctx.font = "9px 'Courier New'";
  ctx.fillText(`HASH: 0x${hash.slice(0, 36).toUpperCase()}…`, CERT_W / 2, ey);
  ctx.fillText(`CERT_ID: ${certId}`, CERT_W / 2, ey + 14);

  if (cert.fields?.Signatories) {
    const parsedSigs = Array.isArray(cert.fields.Signatories)
      ? cert.fields.Signatories
      : typeof cert.fields.Signatories === 'string'
      ? JSON.parse(cert.fields.Signatories)
      : [];
    drawSignatures(ctx, parsedSigs, sigImgs, 'neon');
  }

  const ng = ctx.createLinearGradient(0, 0, CERT_W, 0);
  ng.addColorStop(0, '#FF00FF');
  ng.addColorStop(0.5, '#00FFFF');
  ng.addColorStop(1, '#FF00FF');
  ctx.fillStyle = ng;
  ctx.fillRect(0, CERT_H - 30, CERT_W, 30);
  
  ctx.fillStyle = '#000';
  ctx.font = "9px 'Courier New'";
  ctx.fillText(`VERIFY // CERTXCHANGE.IN // ${certId}`, CERT_W / 2, CERT_H - 10);
}
