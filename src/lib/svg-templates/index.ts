import { Cert } from '@/types';
import { drawClassicSVG } from './templates/classic';
import { drawDarkSVG } from './templates/dark';
import { drawMinimalSVG } from './templates/minimal';
import { drawCustomSVG } from './templates/custom';
import { drawNeonSVG } from './templates/neon';
import { drawBrutalSVG } from './templates/brutal';
import { drawRetroSVG } from './templates/retro';
import { drawCorpSVG } from './templates/corp';
import { drawMidnightSVG } from './templates/midnight';
import { drawVintageSVG } from './templates/vintage';

interface SVGTemplateProps {
  cert: Cert;
  eventName: string;
  orgName: string;
  logoUrls: string[];
  sigImgs: (string | null)[];
}

const TEMPLATE_MAP: Record<string, (props: SVGTemplateProps) => JSX.Element> = {
  classic:  drawClassicSVG,
  dark:     drawDarkSVG,
  minimal:  drawMinimalSVG,
  custom:   drawCustomSVG,
  neon:     drawNeonSVG,
  brutal:   drawBrutalSVG,
  retro:    drawRetroSVG,
  corp:     drawCorpSVG,
  midnight: drawMidnightSVG,
  vintage:  drawVintageSVG,
};

export function renderSVGTemplate(
  templateId: string,
  cert: Cert,
  eventName: string,
  orgName: string,
  logoUrls: string[],
  sigImgs: (string | null)[]
): JSX.Element {
  const normalizedId = (templateId || 'classic').toLowerCase().trim();
  const renderer = TEMPLATE_MAP[normalizedId] || drawClassicSVG;
  return renderer({ cert, eventName, orgName, logoUrls, sigImgs });
}

export { TEMPLATE_MAP };
