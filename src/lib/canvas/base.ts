import { Signatory } from '@/types';

export const CERT_W = 960;
export const CERT_H = 700;
export const MARGIN = 60;

// Draw up to 5 organization logos side-by-side
export function drawLogos(
  ctx: CanvasRenderingContext2D,
  logos: HTMLImageElement[],
  startX: number,
  y: number,
  h: number,
  align: 'left' | 'center' | 'right' = 'left'
): void {
  const activeLogos = logos.filter(Boolean);
  if (activeLogos.length === 0) return;

  const spacing = 12;
  const scaledWidths = activeLogos.map(img => Math.round((img.width / img.height) * h));
  const totalWidth = scaledWidths.reduce((a, b) => a + b, 0) + spacing * (activeLogos.length - 1);

  let lx = startX;
  if (align === 'center') {
    lx = CERT_W / 2 - totalWidth / 2;
  } else if (align === 'right') {
    lx = startX - totalWidth;
  }

  activeLogos.forEach((img, idx) => {
    const lw = scaledWidths[idx];
    ctx.drawImage(img, lx, y, lw, h);
    lx += lw + spacing;
  });
}

// Draw signature authority blocks with dynamic spacing
export function drawSignatures(
  ctx: CanvasRenderingContext2D,
  signatories: Signatory[],
  sigImgs: (HTMLImageElement | null)[],
  style: 'classic' | 'dark' | 'neon' | 'minimal' | 'brutal' | 'retro' = 'classic'
): number {
  if (!signatories || signatories.length === 0) return 0;
  const count = signatories.length;
  const blockH = 72;
  const startY = CERT_H - blockH - (style === 'neon' || style === 'retro' ? 34 : 18);
  const blockW = (CERT_W - 120) / count;

  signatories.forEach((sig, i) => {
    const bx = 60 + i * blockW;
    const cx = bx + blockW / 2;
    const img = sigImgs[i];

    // Render signature: either drawn/uploaded image or typed text
    if (img) {
      const sh = 36;
      const sw = Math.min(blockW - 20, (img.width / img.height) * sh);
      ctx.drawImage(img, cx - sw / 2, startY, sw, sh);
    } else if (sig.signatureType === 'typed' && sig.signatureData) {
      ctx.save();
      const fonts: Record<string, string> = {
        dancing_script: "'Dancing Script',cursive",
        pacifico: "'Pacifico',cursive",
        caveat: "'Caveat',cursive",
      };
      ctx.font = `28px ${fonts[sig.signatureFont || 'dancing_script']}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = style === 'minimal' || style === 'classic' || style === 'brutal' ? '#000' : '#FFF';
      ctx.shadowBlur = 0;
      ctx.fillText(sig.signatureData.slice(0, 24), cx, startY + 32);
      ctx.restore();
    }

    // Rule line
    const lc =
      style === 'classic'
        ? '#B8922A'
        : style === 'dark'
        ? '#E8FF0066'
        : style === 'neon'
        ? '#00FFFF88'
        : style === 'minimal'
        ? '#CCCCCC'
        : style === 'brutal'
        ? '#000'
        : '#FF88FF88';

    ctx.beginPath();
    ctx.moveTo(bx + 8, startY + 42);
    ctx.lineTo(bx + blockW - 8, startY + 42);
    ctx.strokeStyle = lc;
    ctx.lineWidth = style === 'brutal' ? 3 : 1;
    ctx.stroke();

    // Name
    ctx.textAlign = 'center';
    const nameColor = style === 'minimal' || style === 'classic' ? '#222' : style === 'brutal' ? '#000' : '#FFF';
    ctx.fillStyle = nameColor;
    ctx.font = `bold 11px var(--font-ibm-plex-mono), 'Courier New'`;
    ctx.shadowBlur = 0;
    ctx.fillText((sig.name || '').slice(0, 22).toUpperCase(), cx, startY + 56);

    // Designation
    const desigColor =
      style === 'minimal' ? '#888' : style === 'classic' ? '#9A7A50' : style === 'brutal' ? '#333' : '#7070A0';
    ctx.fillStyle = desigColor;
    ctx.font = `italic 9px Georgia`;
    ctx.fillText((sig.designation || '').slice(0, 26), cx, startY + 68);
  });

  return blockH + 8;
}

// Draw a security certificate seal
export function drawSeal(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 52, 0, Math.PI * 2);
  ctx.fillStyle = '#0A0A1C';
  ctx.fill();
  ctx.strokeStyle = '#E8FF00';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#E8FF00';
  ctx.font = `bold 8px var(--font-ibm-plex-mono), 'Courier New'`;
  ctx.textAlign = 'center';
  ctx.fillText('BLOCKCHAIN', x, y - 8);
  ctx.fillText('ANCHORED', x, y + 4);

  ctx.fillStyle = '#888';
  ctx.font = `7px var(--font-ibm-plex-mono), 'Courier New'`;
  ctx.fillText('CERTXCHANGE', x, y + 16);
  ctx.restore();
}
