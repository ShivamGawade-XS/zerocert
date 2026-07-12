'use client';

import { renderSVGTemplate } from '@/lib/svg-templates';

interface CertCanvasEditorProps {
  eventName: string;
  orgName: string;
  customBgColor: string;
  setCustomBgColor: (c: string) => void;
  customTextColor: string;
  setCustomTextColor: (c: string) => void;
  customAccentColor: string;
  setCustomAccentColor: (c: string) => void;
  titleY: number;
  setTitleY: (y: number) => void;
  nameY: number;
  setNameY: (y: number) => void;
  eventY: number;
  setEventY: (y: number) => void;
  sigsY: number;
  setSigsY: (y: number) => void;
  titleSize: number;
  setTitleSize: (s: number) => void;
  nameSize: number;
  setNameSize: (s: number) => void;
  eventSize: number;
  setEventSize: (s: number) => void;
  canvasWidth: number;
  setCanvasWidth: (w: number) => void;
  canvasHeight: number;
  setCanvasHeight: (h: number) => void;
  customBgPreview: string | null;
}

export default function CertCanvasEditor({
  eventName,
  orgName,
  customBgColor,
  setCustomBgColor,
  customTextColor,
  setCustomTextColor,
  customAccentColor,
  setCustomAccentColor,
  titleY,
  setTitleY,
  nameY,
  setNameY,
  eventY,
  setEventY,
  sigsY,
  setSigsY,
  titleSize,
  setTitleSize,
  nameSize,
  setNameSize,
  eventSize,
  setEventSize,
  canvasWidth,
  setCanvasWidth,
  canvasHeight,
  setCanvasHeight,
  customBgPreview,
}: CertCanvasEditorProps) {

  // Dummy certificate object to trigger custom SVG drawing
  const mockCert: any = {
    cert_id: 'ZC-PREVIEW',
    sha256_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    status: 'active',
    issued_at: new Date().toISOString(),
    fields: {
      Name: 'Priya Sharma',
      Email: 'priya@example.com',
      bg_color: JSON.stringify({
        bgColor: customBgColor,
        titleY,
        nameY,
        eventY,
        sigsY,
        titleSize,
        nameSize,
        eventSize,
        canvasWidth,
        canvasHeight,
      }),
      text_color: customTextColor,
      accent_color: customAccentColor,
      bg_image: customBgPreview || '',
      Signatories: JSON.stringify([
        { name: 'Dr. Anita Roy', title: 'Director', signatureType: 'typed', signatureData: 'Anita Roy', signatureFont: 'Great Vibes, cursive' },
      ]),
    },
  };

  const svgPreview = renderSVGTemplate(
    'custom',
    mockCert,
    eventName || 'Your Event Name',
    orgName || 'Your Organization',
    [],
    [null]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-surface border border-border p-6 rounded-lg animate-fadeIn">
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div>
          <div className="text-accent text-[9px] tracking-widest uppercase font-mono mb-1">Canvas Tool</div>
          <h3 className="font-display text-base text-text uppercase tracking-wider font-bold">Element Customizer</h3>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="space-y-2">
          <label className="block text-[10px] text-muted tracking-widest uppercase font-bold">Canvas Ratio / Template Size</label>
          <select 
            value={`${canvasWidth}x${canvasHeight}`}
            onChange={(e) => {
              const [w, h] = e.target.value.split('x').map(Number);
              setCanvasWidth(w);
              setCanvasHeight(h);
              // Auto-scale vertical alignment positions proportionately to fit new height
              const ratio = h / canvasHeight;
              setTitleY(Math.round(titleY * ratio));
              setNameY(Math.round(nameY * ratio));
              setEventY(Math.round(eventY * ratio));
              setSigsY(Math.round(sigsY * ratio));
            }}
            className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none rounded cursor-pointer"
          >
            <option value="960x700">Standard Landscape (1.37:1)</option>
            <option value="1414x1000">A4 Landscape (1.41:1)</option>
            <option value="1294x1000">US Letter Landscape (1.29:1)</option>
            <option value="1000x1000">Square (1:1)</option>
          </select>
        </div>

        {/* Color controls */}
        <div className="space-y-4">
          <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Palette</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[8px] text-muted uppercase mb-1">Background</label>
              <input
                type="color"
                value={customBgColor}
                onChange={(e) => setCustomBgColor(e.target.value)}
                className="w-full h-8 rounded border border-border cursor-pointer bg-bg"
              />
            </div>
            <div>
              <label className="block text-[8px] text-muted uppercase mb-1">Primary Text</label>
              <input
                type="color"
                value={customTextColor}
                onChange={(e) => setCustomTextColor(e.target.value)}
                className="w-full h-8 rounded border border-border cursor-pointer bg-bg"
              />
            </div>
            <div>
              <label className="block text-[8px] text-muted uppercase mb-1">Accent Theme</label>
              <input
                type="color"
                value={customAccentColor}
                onChange={(e) => setCustomAccentColor(e.target.value)}
                className="w-full h-8 rounded border border-border cursor-pointer bg-bg"
              />
            </div>
          </div>
        </div>

        {/* Sliders for Positions (Y Coordinates) */}
        <div className="space-y-4">
          <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Vertical Alignment (Y)</div>
          
          <div>
            <div className="flex justify-between text-[9px] font-mono text-muted mb-1">
              <span>Title position</span>
              <span>{titleY}px</span>
            </div>
            <input
              type="range"
              min={Math.round(canvasHeight * 0.08)}
              max={Math.round(canvasHeight * 0.4)}
              value={titleY}
              onChange={(e) => setTitleY(Number(e.target.value))}
              className="w-full accent-accent bg-bg h-1 rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[9px] font-mono text-muted mb-1">
              <span>Recipient name position</span>
              <span>{nameY}px</span>
            </div>
            <input
              type="range"
              min={Math.round(canvasHeight * 0.25)}
              max={Math.round(canvasHeight * 0.65)}
              value={nameY}
              onChange={(e) => setNameY(Number(e.target.value))}
              className="w-full accent-accent bg-bg h-1 rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[9px] font-mono text-muted mb-1">
              <span>Event details position</span>
              <span>{eventY}px</span>
            </div>
            <input
              type="range"
              min={Math.round(canvasHeight * 0.45)}
              max={Math.round(canvasHeight * 0.82)}
              value={eventY}
              onChange={(e) => setEventY(Number(e.target.value))}
              className="w-full accent-accent bg-bg h-1 rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[9px] font-mono text-muted mb-1">
              <span>Signature blocks position</span>
              <span>{sigsY}px</span>
            </div>
            <input
              type="range"
              min={Math.round(canvasHeight * 0.68)}
              max={Math.round(canvasHeight * 0.94)}
              value={sigsY}
              onChange={(e) => setSigsY(Number(e.target.value))}
              className="w-full accent-accent bg-bg h-1 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Sliders for Font Sizes */}
        <div className="space-y-4">
          <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Font Sizing</div>

          <div>
            <div className="flex justify-between text-[9px] font-mono text-muted mb-1">
              <span>Title font size</span>
              <span>{titleSize}px</span>
            </div>
            <input
              type="range"
              min="14"
              max="36"
              value={titleSize}
              onChange={(e) => setTitleSize(Number(e.target.value))}
              className="w-full accent-accent bg-bg h-1 rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[9px] font-mono text-muted mb-1">
              <span>Recipient font size</span>
              <span>{nameSize}px</span>
            </div>
            <input
              type="range"
              min="36"
              max="76"
              value={nameSize}
              onChange={(e) => setNameSize(Number(e.target.value))}
              className="w-full accent-accent bg-bg h-1 rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[9px] font-mono text-muted mb-1">
              <span>Event font size</span>
              <span>{eventSize}px</span>
            </div>
            <input
              type="range"
              min="18"
              max="42"
              value={eventSize}
              onChange={(e) => setEventSize(Number(e.target.value))}
              className="w-full accent-accent bg-bg h-1 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="lg:col-span-8 flex flex-col justify-center bg-[#0C0C0C] border border-border p-4 rounded-lg">
        <div className="text-[9px] font-mono text-muted uppercase tracking-widest mb-2 flex items-center justify-between">
          <span>Live Editor Workspace</span>
          <span className="text-accent">{canvasWidth} x {canvasHeight} Dynamic Viewbox</span>
        </div>
        <div 
          className="w-full rounded overflow-hidden shadow-lg border border-border/50 transition-all duration-300"
          style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
        >
          {svgPreview}
        </div>
        <div className="mt-3 text-[9px] font-mono text-muted text-center animate-pulse">
          ⚡ Canvas aspect ratio and all layout coordinate ranges adapt dynamically to the selection.
        </div>
      </div>
    </div>
  );
}
