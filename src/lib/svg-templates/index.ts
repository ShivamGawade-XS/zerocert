import { Cert } from '@/types';
import { drawClassicSVG } from './templates/classic';
import { drawDarkSVG } from './templates/dark';
import { drawMinimalSVG } from './templates/minimal';
import { drawCustomSVG } from './templates/custom';

interface SVGTemplateProps {
  cert: Cert;
  eventName: string;
  orgName: string;
  logoUrls: string[];
  sigImgs: (string | null)[];
}

const TEMPLATE_MAP: Record<string, (props: SVGTemplateProps) => JSX.Element> = {
  classic: drawClassicSVG,
  dark: drawDarkSVG,
  minimal: drawMinimalSVG,
  custom: drawCustomSVG,

  // Fallbacks for legacy/alternative canvas templates to keep compatibility
  neon: drawDarkSVG,
  brutal: drawMinimalSVG,
  retro: drawDarkSVG,
  corp: drawClassicSVG,
  midnight: drawDarkSVG,
  vintage: drawClassicSVG,
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
