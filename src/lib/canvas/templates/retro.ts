import { Cert } from '@/types';
import { CERT_W, CERT_H, drawLogos, drawSignatures } from '../base';

export function drawRetro(
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
  const issued = new Date(cert.issued_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const extras = Object.entries(cert.fields || {}).filter(([k]) => k !== 'Name' && k !== 'Email');

  const rg = ctx.createLinearGradient(0, 0, 0, CERT_H);
  rg.addColorStop(0, '#1a0533');
  rg.addColorStop(0.5, '#2d1b4e');
  rg.addColorStop(1, '#0d1f4e');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  // Synthwave grid lines
  ctx.strokeStyle = '#FF00FF22';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= CERT_W; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, CERT_H / 2);
    ctx.lineTo(CERT_W / 2, CERT_H + 10);
    ctx.stroke();
  }
  for (let y = CERT_H / 2; y <= CERT_H; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CERT_W, y);
    ctx.stroke();
  }

  // Sunset sun
  const sun = ctx.createRadialGradient(CERT_W / 2, 134, 0, CERT_W / 2, 134, 116);
  sun.addColorStop(0, '#FF6B35');
  sun.addColorStop(0.4, '#FF006699');
  sun.addColorStop(1, 'transparent');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, CERT_W, 270);

  // Sun stripes
  [0, 22, 41, 57, 70, 82].forEach((y) => {
    ctx.fillStyle = '#1a053388';
    ctx.fillRect(CERT_W / 2 - 112, 76 + y, 224, y === 0 ? 15 : 8);
  });

  const tg = ctx.createLinearGradient(0, 80, 0, 168);
  tg.addColorStop(0, '#FFF');
  tg.addColorStop(0.3, '#FF88FF');
  tg.addColorStop(0.6, '#8888FF');
  tg.addColorStop(1, '#FF88FF');

  ctx.fillStyle = tg;
  ctx.textAlign = 'center';
  ctx.font = 'bold 70px Impact';
  ctx.fillText('CERTIFICATE', CERT_W / 2, 168);
  
  ctx.fillStyle = '#FF00FF88';
  ctx.font = "10px 'Courier New'";
  ctx.fillText('// OF COMPLETION //', CERT_W / 2, 196);

  ctx.strokeStyle = '#FF00FF44';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 212);
  ctx.lineTo(CERT_W - 80, 212);
  ctx.stroke();

  // Draw logos centered
  drawLogos(ctx, logoImgs, CERT_W / 2, 220, 36, 'center');

  const base = 268;
  ctx.fillStyle = '#FF88FF99';
  ctx.font = "10px 'Courier New'";
  ctx.fillText(orgName.toUpperCase(), CERT_W / 2, base + 14);
  
  ctx.fillStyle = '#BBBBFF';
  ctx.font = 'italic 14px Georgia';
  ctx.fillText('presented to', CERT_W / 2, base + 38);

  const ng = ctx.createLinearGradient(0, base + 46, 0, base + 92);
  ng.addColorStop(0, '#FFF');
  ng.addColorStop(1, '#FF88FF');
  ctx.fillStyle = ng;
  ctx.font = 'bold 46px Georgia';
  ctx.shadowColor = '#FF00FF';
  ctx.shadowBlur = 18;
  ctx.fillText(name, CERT_W / 2, base + 92);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#FF88FF66';
  ctx.font = "11px 'Courier New'";
  ctx.fillText(`for completing: ${eventName}`, CERT_W / 2, base + 120);

  ctx.font = "9px 'Courier New'";
  ctx.fillStyle = '#8888FF';
  extras.forEach(([k, v], i) => ctx.fillText(`${k}: ${v}`, CERT_W / 2, base + 138 + i * 16));

  const ey = base + 156 + extras.length * 16;
  ctx.fillStyle = '#55557A';
  ctx.font = "10px 'Courier New'";
  ctx.fillText(`${issued}  ·  ID: ${certId}`, CERT_W / 2, ey);

  if (cert.fields?.Signatories) {
    const parsedSigs = Array.isArray(cert.fields.Signatories)
      ? cert.fields.Signatories
      : typeof cert.fields.Signatories === 'string'
      ? JSON.parse(cert.fields.Signatories)
      : [];
    drawSignatures(ctx, parsedSigs, sigImgs, 'retro');
  }

  const gb = ctx.createLinearGradient(0, 0, CERT_W, 0);
  gb.addColorStop(0, '#FF00FF');
  gb.addColorStop(0.5, '#8888FF');
  gb.addColorStop(1, '#FF00FF');
  ctx.fillStyle = gb;
  ctx.fillRect(0, CERT_H - 26, CERT_W, 26);
  
  ctx.fillStyle = '#FFF';
  ctx.font = "9px 'Courier New'";
  ctx.fillText(`VERIFY: CERTXCHANGE.IN/VERIFY — ${certId}`, CERT_W / 2, CERT_H - 8);
}
