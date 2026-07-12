import { Cert } from '@/types';
import { CERT_W, CERT_H, drawLogos, drawSignatures } from '../base';

export function drawDark(
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

  const bg = ctx.createRadialGradient(CERT_W / 2, CERT_H / 2, 0, CERT_W / 2, CERT_H / 2, CERT_W);
  bg.addColorStop(0, '#14143A');
  bg.addColorStop(1, '#060612');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  ctx.fillStyle = '#E8FF00';
  ctx.fillRect(0, 0, CERT_W, 4);

  [[0, 0], [CERT_W - 40, 0], [0, CERT_H - 40], [CERT_W - 40, CERT_H - 40]].forEach(([x, y]) => {
    ctx.strokeStyle = '#E8FF0022';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 40, 40);
  });

  const lh = 48;
  drawLogos(ctx, logoImgs, CERT_W / 2, 16, lh, 'center');

  const base = logoImgs.length ? 80 : 50;
  ctx.fillStyle = '#55557A';
  ctx.font = "10px 'Courier New'";
  ctx.textAlign = 'center';
  ctx.fillText(`${orgName.toUpperCase()}  ·  ${eventName.toUpperCase()}`, CERT_W / 2, base + 12);

  ctx.fillStyle = '#FFFFFF22';
  ctx.fillRect(60, base + 24, CERT_W - 120, 1);

  ctx.fillStyle = '#E8FF00';
  ctx.font = 'bold 62px Impact';
  ctx.fillText('CERTIFICATE', CERT_W / 2, base + 88);

  ctx.fillStyle = '#55557A';
  ctx.font = "12px 'Courier New'";
  ctx.fillText('OF  COMPLETION', CERT_W / 2, base + 114);

  ctx.fillStyle = '#FFFFFF22';
  ctx.fillRect(60, base + 130, CERT_W - 120, 1);

  ctx.fillStyle = '#55557A';
  ctx.font = 'italic 14px Georgia';
  ctx.fillText('presented to', CERT_W / 2, base + 164);

  ctx.shadowColor = '#E8FF00';
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 50px Georgia';
  ctx.fillText(name, CERT_W / 2, base + 222);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#55557A';
  ctx.font = 'italic 14px Georgia';
  ctx.fillText('for completing', CERT_W / 2, base + 258);

  ctx.fillStyle = '#E8FF00';
  ctx.font = 'bold 24px Georgia';
  ctx.fillText(eventName, CERT_W / 2, base + 290);

  ctx.font = "10px 'Courier New'";
  ctx.fillStyle = '#333355';
  extras.forEach(([k, v], i) => ctx.fillText(`${k}: ${v}`, CERT_W / 2, base + 312 + i * 16));

  const ey = base + 330 + extras.length * 16;
  ctx.fillStyle = '#333355';
  ctx.font = "10px 'Courier New'";
  ctx.fillText(`${issued}  ·  ID: ${certId}`, CERT_W / 2, ey);

  if (cert.fields?.Signatories) {
    const parsedSigs = Array.isArray(cert.fields.Signatories)
      ? cert.fields.Signatories
      : typeof cert.fields.Signatories === 'string'
      ? JSON.parse(cert.fields.Signatories)
      : [];
    drawSignatures(ctx, parsedSigs, sigImgs, 'dark');
  }

  ctx.fillStyle = '#E8FF0022';
  ctx.fillRect(0, CERT_H - 32, CERT_W, 32);
  
  ctx.fillStyle = '#E8FF0066';
  ctx.font = "10px 'Courier New'";
  ctx.fillText(`VERIFY: ZEROCERT.APP/VERIFY — ${certId}`, CERT_W / 2, CERT_H - 12);
}
