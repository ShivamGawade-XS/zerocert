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
  titleX: number;
  setTitleX: (x: number) => void;
  nameY: number;
  setNameY: (y: number) => void;
  nameX: number;
  setNameX: (x: number) => void;
  eventY: number;
  setEventY: (y: number) => void;
  eventX: number;
  setEventX: (x: number) => void;
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
  titleX,
  setTitleX,
  nameY,
  setNameY,
  nameX,
  setNameX,
  eventY,
  setEventY,
  eventX,
  setEventX,
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
        titleX,
        nameY,
        nameX,
        eventY,
        eventX,
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

  const SliderRow = ({
    label,
    value,
    min,
    max,
    onChange,
    unit = 'px',
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
    unit?: string;
  }) => (
    <div>
      <div className="flex justify-between text-[9px] font-mono text-muted mb-1">
        <span>{label}</span>
        <span className="text-accent">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded cursor-pointer"
        style={{ accentColor: customAccentColor || '#B8922A' }}
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-surface border border-border p-6 rounded-lg">
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 space-y-5 overflow-y-auto max-h-[760px] pr-1">
        <div>
          <div className="text-accent text-[9px] tracking-widest uppercase font-mono mb-0.5">Canvas Tool</div>
          <h3 className="font-display text-sm text-text uppercase tracking-wider font-bold">Element Customizer</h3>
        </div>

        {/* Canvas Size */}
        <div className="p-3 bg-bg border border-border rounded-lg space-y-2">
          <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Canvas Ratio</div>
          <select
            value={`${canvasWidth}x${canvasHeight}`}
            onChange={(e) => {
              const [w, h] = e.target.value.split('x').map(Number);
              const rh = h / canvasHeight;
              const rw = w / canvasWidth;
              setCanvasWidth(w);
              setCanvasHeight(h);
              setTitleY(Math.round(titleY * rh));
              setNameY(Math.round(nameY * rh));
              setEventY(Math.round(eventY * rh));
              setSigsY(Math.round(sigsY * rh));
              setTitleX(Math.round(titleX * rw));
              setNameX(Math.round(nameX * rw));
              setEventX(Math.round(eventX * rw));
            }}
            className="w-full font-mono text-[10px] p-2 bg-surface border border-border focus:border-accent text-text outline-none rounded cursor-pointer"
          >
            <option value="960x700">Standard Landscape (960×700)</option>
            <option value="1414x1000">A4 Landscape (1414×1000)</option>
            <option value="1294x1000">US Letter Landscape (1294×1000)</option>
            <option value="1000x1000">Square (1000×1000)</option>
          </select>
        </div>

        {/* Colors */}
        <div className="p-3 bg-bg border border-border rounded-lg space-y-3">
          <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Colour Palette</div>
          {[
            { label: 'Background', value: customBgColor, set: setCustomBgColor },
            { label: 'Primary Text', value: customTextColor, set: setCustomTextColor },
            { label: 'Accent Theme', value: customAccentColor, set: setCustomAccentColor },
          ].map((cp) => (
            <div key={cp.label} className="flex items-center gap-2">
              <input type="color" value={cp.value} onChange={(e) => cp.set(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer flex-shrink-0 bg-bg" />
              <div className="flex-1 min-w-0">
                <div className="text-[8px] text-muted uppercase tracking-wider mb-0.5">{cp.label}</div>
                <input type="text" value={cp.value} onChange={(e) => cp.set(e.target.value)}
                  className="w-full font-mono text-[10px] p-1.5 bg-surface border border-border text-text outline-none rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Title block */}
        <div className="p-3 bg-bg border border-border rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Title / Certificate Type</div>
          </div>
          <SliderRow label="Horizontal (X)" value={titleX} min={0} max={canvasWidth} onChange={setTitleX} />
          <SliderRow label="Vertical (Y)" value={titleY} min={60} max={Math.round(canvasHeight * 0.5)} onChange={setTitleY} />
          <SliderRow label="Font Size" value={titleSize} min={12} max={36} onChange={setTitleSize} />
        </div>

        {/* Name block */}
        <div className="p-3 bg-bg border border-border rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Recipient Name</div>
          </div>
          <SliderRow label="Horizontal (X)" value={nameX} min={0} max={canvasWidth} onChange={setNameX} />
          <SliderRow label="Vertical (Y)" value={nameY} min={100} max={Math.round(canvasHeight * 0.75)} onChange={setNameY} />
          <SliderRow label="Font Size" value={nameSize} min={28} max={76} onChange={setNameSize} />
        </div>

        {/* Event block */}
        <div className="p-3 bg-bg border border-border rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
            <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Event Details</div>
          </div>
          <SliderRow label="Horizontal (X)" value={eventX} min={0} max={canvasWidth} onChange={setEventX} />
          <SliderRow label="Vertical (Y)" value={eventY} min={150} max={Math.round(canvasHeight * 0.88)} onChange={setEventY} />
          <SliderRow label="Font Size" value={eventSize} min={16} max={42} onChange={setEventSize} />
        </div>

        {/* Signatures block */}
        <div className="p-3 bg-bg border border-border rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
            <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Signature Area</div>
          </div>
          <SliderRow label="Vertical (Y)" value={sigsY} min={Math.round(canvasHeight * 0.55)} max={Math.round(canvasHeight * 0.96)} onChange={setSigsY} />
        </div>
      </div>

      {/* Canvas */}
      <div className="lg:col-span-8 flex flex-col bg-[#0A0A0A] border border-border p-4 rounded-lg">
        <div className="text-[9px] font-mono text-muted uppercase tracking-widest mb-2 flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Title</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Name</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Event</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Sigs</span>
          </span>
          <span className="text-accent font-bold">{canvasWidth} × {canvasHeight}</span>
        </div>

        <div
          className="w-full rounded overflow-hidden shadow-lg border border-border/50"
          style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
        >
          {svgPreview}
        </div>

        <div className="mt-2 text-[8px] font-mono text-muted text-center">
          ⚡ All adjustments reflect instantly · Colour, position &amp; size sliders update the live SVG canvas above
        </div>
      </div>
    </div>
  );
}
