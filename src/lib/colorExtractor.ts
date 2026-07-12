export interface ExtractedTheme {
  bgColor: string;
  textColor: string;
  accentColor: string;
  styleName: string;
}

// Convert RGB components to Hex string
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Compute luminance to check if a color is light or dark
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculate color distance in RGB space
function getColorDistance(c1: number[], c2: number[]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
}

export function extractThemeFromImage(imgElement: HTMLImageElement): ExtractedTheme {
  const canvas = document.createElement('canvas');
  const size = 100; // Resize to 100x100 for fast pixel clustering
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      bgColor: '#FFFFFF',
      textColor: '#111111',
      accentColor: '#B8922A',
      styleName: 'Default Light',
    };
  }

  ctx.drawImage(imgElement, 0, 0, size, size);
  const imgData = ctx.getImageData(0, 0, size, size).data;

  const colorCounts: Record<string, { rgb: number[]; count: number }> = {};
  
  // Sample pixels (every 3rd pixel for speed & clustering)
  for (let i = 0; i < imgData.length; i += 12) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const a = imgData[i + 3];

    if (a < 150) continue; // Skip highly transparent pixels

    // Quantize color values to reduce noise (group by multiples of 8)
    const qr = Math.round(r / 8) * 8;
    const qg = Math.round(g / 8) * 8;
    const qb = Math.round(b / 8) * 8;
    const hex = rgbToHex(qr, qg, qb);

    if (colorCounts[hex]) {
      colorCounts[hex].count++;
    } else {
      colorCounts[hex] = { rgb: [qr, qg, qb], count: 1 };
    }
  }

  // Sort colors by frequency
  const sortedColors = Object.entries(colorCounts).sort(
    (a, b) => b[1].count - a[1].count
  );

  if (sortedColors.length === 0) {
    return {
      bgColor: '#FFFFFF',
      textColor: '#111111',
      accentColor: '#B8922A',
      styleName: 'Classic Gold',
    };
  }

  // 1. Dominant background color is the most frequent color
  const dominantHex = sortedColors[0][0];
  const dominantRgb = sortedColors[0][1].rgb;
  const luminance = getLuminance(dominantRgb[0], dominantRgb[1], dominantRgb[2]);
  
  const isDarkBg = luminance < 0.4;
  const bgColor = dominantHex;

  // 2. Select accent color (must have contrast and saturation difference from background)
  let accentColor = '#B8922A'; // Fallback
  let maxVibrancy = -1;

  for (let i = 1; i < Math.min(sortedColors.length, 30); i++) {
    const [hex, data] = sortedColors[i];
    const rgb = data.rgb;

    // Saturated difference check
    const rDiff = Math.abs(rgb[0] - dominantRgb[0]);
    const gDiff = Math.abs(rgb[1] - dominantRgb[1]);
    const bDiff = Math.abs(rgb[2] - dominantRgb[2]);
    const diff = rDiff + gDiff + bDiff;

    // Contrast ratio estimation
    const valLuminance = getLuminance(rgb[0], rgb[1], rgb[2]);
    const contrast = isDarkBg 
      ? (valLuminance + 0.05) / (luminance + 0.05)
      : (luminance + 0.05) / (valLuminance + 0.05);

    // Prefer high contrast and noticeable color difference
    if (diff > 120 && contrast > 1.5) {
      const vibrancy = diff * contrast;
      if (vibrancy > maxVibrancy) {
        maxVibrancy = vibrancy;
        accentColor = hex;
      }
    }
  }

  // 3. Define text color based on background luminance
  const textColor = isDarkBg ? '#FFFFFF' : '#111111';
  const styleName = isDarkBg ? 'AI Prestige Dark' : 'AI Editorial Light';

  return {
    bgColor,
    textColor,
    accentColor,
    styleName,
  };
}
