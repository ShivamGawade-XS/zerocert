import { Cert } from '@/types';
import { drawClassic } from './templates/classic';
import { drawDark } from './templates/dark';
import { drawNeon } from './templates/neon';
import { drawMinimal } from './templates/minimal';
import { drawBrutal } from './templates/brutal';
import { drawRetro } from './templates/retro';
import { drawCorp } from './templates/corp';
import { drawMidnight } from './templates/midnight';
import { drawVintage } from './templates/vintage';

const RENDERERS: Record<string, Function> = {
  classic: drawClassic,
  dark: drawDark,
  neon: drawNeon,
  minimal: drawMinimal,
  brutal: drawBrutal,
  retro: drawRetro,
  corp: drawCorp,
  midnight: drawMidnight,
  vintage: drawVintage,
};

export function drawCert(
  ctx: CanvasRenderingContext2D,
  cert: Cert,
  eventName: string,
  orgName: string,
  logoImgs: HTMLImageElement[],
  sigImgs: (HTMLImageElement | null)[]
): void {
  // Determine template from cert fields or default
  const templateId = (cert.fields?.template || cert.fields?.Template || 'classic').toLowerCase();
  const renderer = RENDERERS[templateId] || drawClassic;
  
  ctx.save();
  renderer(ctx, cert, eventName, orgName, logoImgs, sigImgs);
  ctx.restore();
}
