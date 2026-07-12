'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import { extractThemeFromImage } from '@/lib/colorExtractor';
import dynamic from 'next/dynamic';
import { renderSVGTemplate } from '@/lib/svg-templates';

const TemplatePreviewModal = dynamic(() => import('@/components/canvas/TemplatePreviewModal'), { ssr: false });
const CertCanvasEditor = dynamic(() => import('@/components/canvas/CertCanvasEditor'), { ssr: false });

// ─── Google Signature Fonts ───────────────────────────────────────────────────
const SIGNATURE_FONTS = [
  { id: 'Great Vibes, cursive',       name: 'Great Vibes',       sample: 'Elegant' },
  { id: 'Dancing Script, cursive',    name: 'Dancing Script',    sample: 'Classic' },
  { id: 'Pacifico, cursive',          name: 'Pacifico',          sample: 'Friendly' },
  { id: 'Caveat, cursive',            name: 'Caveat',            sample: 'Casual' },
  { id: 'Satisfy, cursive',           name: 'Satisfy',           sample: 'Stylish' },
  { id: 'Kalam, cursive',             name: 'Kalam',             sample: 'Natural' },
];

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'classic',  name: 'Classic Gold',    tag: 'FORMAL',      accent: '#B8922A' },
  { id: 'dark',     name: 'Dark Prestige',   tag: 'MODERN',      accent: '#E8FF00' },
  { id: 'neon',     name: 'Neon Cyber',      tag: 'HACKATHON',   accent: '#00FFFF' },
  { id: 'minimal',  name: 'Pure Minimal',    tag: 'ELEGANT',     accent: '#333333' },
  { id: 'brutal',   name: 'Brutalist',       tag: 'EDGY',        accent: '#F5F500' },
  { id: 'retro',    name: 'RetroWave',       tag: 'FUN',         accent: '#FF88FF' },
  { id: 'corp',     name: 'Corporate Blue',  tag: 'CORPORATE',   accent: '#1E4DA1' },
  { id: 'midnight', name: 'Midnight Violet', tag: 'PREMIUM',     accent: '#9B5CFF' },
  { id: 'vintage',  name: 'Vintage Sepia',   tag: 'CLASSIC',     accent: '#A0714F' },
  { id: 'custom',   name: '✦ Custom / AI',   tag: 'YOUR DESIGN', accent: '#FF3355' },
];

// ─── Preset Form Fields ────────────────────────────────────────────────────────
const PRESET_FIELDS = ['Roll No', 'Grade', 'College', 'Branch', 'Score', 'GitHub', 'LinkedIn', 'Department', 'Year'];

// ─── Dummy cert for preview ────────────────────────────────────────────────────
const DUMMY_CERT_FOR_REVIEW: any = {
  cert_id: 'ZC-000001',
  sha256_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  status: 'active',
  issued_at: new Date().toISOString(),
  fields: { Name: 'Priya Sharma', Email: 'priya@example.com' },
};

interface Signatory {
  name: string;
  title: string;
  signatureType: 'image' | 'typed';
  signatureUrl: string;
  signatureData: string;
  signatureFont: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 0: Details
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [serialPrefix, setSerialPrefix] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Step 1: Template layout coordinates & sizes
  const [template, setTemplate] = useState('classic');
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [customBgColor, setCustomBgColor] = useState('#FFFFFF');
  const [customTextColor, setCustomTextColor] = useState('#111111');
  const [customAccentColor, setCustomAccentColor] = useState('#B8922A');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [customBgPreview, setCustomBgPreview] = useState<string | null>(null);
  const [titleY, setTitleY] = useState(180);
  const [titleX, setTitleX] = useState(480);
  const [nameY, setNameY] = useState(324);
  const [nameX, setNameX] = useState(480);
  const [eventY, setEventY] = useState(416);
  const [eventX, setEventX] = useState(480);
  const [sigsY, setSigsY] = useState(560);
  const [titleSize, setTitleSize] = useState(20);
  const [nameSize, setNameSize] = useState(52);
  const [eventSize, setEventSize] = useState(26);
  const [canvasWidth, setCanvasWidth] = useState(960);
  const [canvasHeight, setCanvasHeight] = useState(700);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiStyleName, setAiStyleName] = useState<string | null>(null);

  // Step 2: Fields (with drag-to-reorder)
  const [formFields, setFormFields] = useState(['Name', 'Email']);
  const [newField, setNewField] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Step 3: Signatories & Co-Logos
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [newSignName, setNewSignName] = useState('');
  const [newSignTitle, setNewSignTitle] = useState('');
  const [newSignMode, setNewSignMode] = useState<'typed' | 'image'>('typed');
  const [newSignText, setNewSignText] = useState('');
  const [newSignFont, setNewSignFont] = useState(SIGNATURE_FONTS[0].id);
  const [coLogos, setCoLogos] = useState<string[]>([]);
  const [signUploading, setSignUploading] = useState(false);
  const [coLogoUploading, setCoLogoUploading] = useState(false);

  // Step 4: Email Templates
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const aiFileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const signFileRef = useRef<HTMLInputElement>(null);
  const coLogoFileRef = useRef<HTMLInputElement>(null);

  const steps = ['Details', 'Template', 'Fields', 'Signatories', 'Email', 'Review'];

  // ── Load Google Fonts for signatures ─────────────────────────────────────
  useEffect(() => {
    const fontNames = SIGNATURE_FONTS.map(f => f.name.replace(/ /g, '+')).join('|');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontNames}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // ── Field Helpers ─────────────────────────────────────────────────────────
  const addField = (fieldName?: string) => {
    const trimmed = (fieldName ?? newField).trim();
    if (trimmed && !formFields.includes(trimmed)) {
      setFormFields([...formFields, trimmed]);
      setNewField('');
    }
  };
  const removeField = (f: string) => {
    if (f === 'Name' || f === 'Email') return;
    setFormFields(formFields.filter((x) => x !== f));
  };

  // ── Drag-to-reorder ────────────────────────────────────────────────────────
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const reordered = [...formFields];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setFormFields(reordered);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // ── File helpers ────────────────────────────────────────────────────────
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  // ── BG Image Upload (upload to storage, store URL) ────────────────────
  const handleBgUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const base64Preview = await fileToBase64(file);
      setCustomBgPreview(base64Preview);
      // Upload to get permanent URL for storage
      const url = await uploadFile(file);
      setCustomBgImage(url);
    } catch (err: any) {
      setError('Background upload failed: ' + err.message);
    }
  }, []);

  // ── AI Theme Extraction ─────────────────────────────────────────────────
  const handleAIExtract = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiExtracting(true);
    setAiStyleName(null);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      setCustomBgPreview(base64); // local preview only
      // Try AI server first
      let theme: { bgColor: string; textColor: string; accentColor: string; styleName: string } | null = null;
      try {
        const res = await fetch('/api/ai/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.theme) theme = data.theme;
        }
      } catch { /* network error, fall through to local */ }

      // Client-side canvas color extraction fallback
      if (!theme) {
        const img = new Image();
        // data: URLs don't need CORS — do NOT set crossOrigin for them
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // resolve anyway, will use defaults
          img.src = base64;
        });
        try {
          theme = extractThemeFromImage(img);
        } catch {
          theme = { bgColor: '#1A1A2E', textColor: '#FFFFFF', accentColor: '#9B5CFF', styleName: 'Deep Space' };
        }
      }

      if (theme) {
        setCustomBgColor(theme.bgColor);
        setCustomTextColor(theme.textColor);
        setCustomAccentColor(theme.accentColor);
        setAiStyleName(theme.styleName || 'AI-Generated Theme');
      }

      // Also upload the bg image to storage
      try {
        const url = await uploadFile(file);
        setCustomBgImage(url);
      } catch { /* non-critical, canvas still works with preview */ }

    } catch (err: any) {
      setError('AI extraction failed: ' + (err.message || 'Unknown error'));
    } finally {
      setAiExtracting(false);
    }
  }, []);

  // ── Add Signatory ───────────────────────────────────────────────────────
  const addSignatoryTyped = () => {
    if (!newSignName.trim() || !newSignText.trim()) { setError('Both name and signature text are required'); return; }
    setSignatories([...signatories, {
      name: newSignName.trim(), title: newSignTitle.trim(),
      signatureType: 'typed', signatureUrl: '',
      signatureData: newSignText.trim(), signatureFont: newSignFont,
    }]);
    setNewSignName(''); setNewSignTitle(''); setNewSignText('');
    setError(null);
  };

  const handleSignatureUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newSignName.trim()) return;
    setSignUploading(true);
    try {
      const url = await uploadFile(file);
      setSignatories([...signatories, {
        name: newSignName.trim(), title: newSignTitle.trim(),
        signatureType: 'image', signatureUrl: url,
        signatureData: '', signatureFont: '',
      }]);
      setNewSignName(''); setNewSignTitle('');
    } catch (err: any) { setError(err.message); }
    finally { setSignUploading(false); }
  }, [newSignName, newSignTitle, signatories]);

  // ── Co-Logo Upload ──────────────────────────────────────────────────────
  const handleCoLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoLogoUploading(true);
    try {
      const url = await uploadFile(file);
      setCoLogos([...coLogos, url]);
    } catch (err: any) { setError(err.message); }
    finally { setCoLogoUploading(false); }
  }, [coLogos]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        name, date, description, template, serialPrefix, expiryDate,
        formFields, coLogos, signatories,
        emailSubject: emailSubject || null,
        emailBody: emailBody || null,
      };
      if (template === 'custom') {
        payload.bgColor = JSON.stringify({
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
        });
        payload.textColor = customTextColor;
        payload.accentColor = customAccentColor;
        payload.bgImage = customBgImage;
      }
      const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event');
      router.push('/dashboard');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Dummy cert for live preview at review step ─────────────────────────
  const reviewCert = {
    ...DUMMY_CERT_FOR_REVIEW,
    fields: {
      ...DUMMY_CERT_FOR_REVIEW.fields,
      Signatories: JSON.stringify(signatories.map(s => ({
        name: s.name, designation: s.title,
        signatureType: s.signatureType, signatureData: s.signatureData, signatureFont: s.signatureFont,
      }))),
      ...(template === 'custom' ? {
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
        bg_image: customBgImage,
      } : {}),
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      {/* Template preview modal */}
      {previewTemplateId && (
        <TemplatePreviewModal
          templateId={previewTemplateId}
          templateName={TEMPLATES.find(t => t.id === previewTemplateId)?.name || previewTemplateId}
          eventName={name || 'National Innovation Hackathon 2026'}
          orgName="Your Organization"
          onClose={() => setPreviewTemplateId(null)}
          onSelect={() => { setTemplate(previewTemplateId); setPreviewTemplateId(null); }}
        />
      )}

      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full z-10">
        {/* Step indicators */}
        <div className="flex gap-0 mb-10">
          {steps.map((s, i) => (
            <button key={s}
              onClick={() => { if (i < step) setStep(i); }}
              className={`flex-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all
                ${i <= step ? 'border-accent text-accent' : 'border-border text-muted'}
                ${i < step ? 'cursor-pointer hover:text-text' : 'cursor-default'}`}
            >
              <span className="opacity-50 mr-1">{String(i).padStart(2, '0')}</span>{s}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 border border-err/40 bg-err/10 rounded text-err text-xs font-mono" role="alert">⚠ {error}</div>
        )}

        {/* ═══════════ Step 0: Details ═══════════ */}
        {step === 0 && (
          <div>
            <h1 className="font-display text-3xl text-text uppercase tracking-wider mb-6">Event Details</h1>
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Event Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. National Hackathon 2026"
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded" />
              </div>
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Event Date *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded" />
              </div>
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Brief description (optional)"
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded resize-none" />
              </div>
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Serial Prefix</label>
                <input type="text" value={serialPrefix} onChange={(e) => setSerialPrefix(e.target.value)} placeholder="e.g. HACK"
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded" />
                <div className="text-[9px] text-muted mt-1">Generates: {serialPrefix || 'ZC'}-001, -002…</div>
              </div>
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Expiry Date</label>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded" />
              </div>
            </div>
            <button onClick={() => { if (!name || !date) { setError('Event name and date are required'); return; } setError(null); setStep(1); }}
              className="w-full py-3 bg-accent hover:bg-accentH text-black text-xs font-bold tracking-widest uppercase rounded transition">
              Next: Choose Template →
            </button>
          </div>
        )}

        {/* ═══════════ Step 1: Template ═══════════ */}
        {step === 1 && (
          <div>
            <h1 className="font-display text-3xl text-text uppercase tracking-wider mb-2">Choose Template</h1>
            <p className="text-xs text-muted mb-6">Click a template to select it. Click <span className="text-accent font-bold">Preview</span> to see a full-size certificate example.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {TEMPLATES.map((t) => (
                <div key={t.id}
                  className={`relative group bg-surface border-2 ${template === t.id ? 'border-accent' : 'border-border hover:border-borderHigh'} rounded overflow-hidden transition cursor-pointer`}
                  onClick={() => setTemplate(t.id)}
                >
                  {/* Mini SVG preview */}
                  <div className="w-full aspect-[960/700] overflow-hidden pointer-events-none">
                    <div className="scale-[0.33] origin-top-left w-[303%] aspect-[960/700]">
                      {renderSVGTemplate(t.id, {
                        ...DUMMY_CERT_FOR_REVIEW,
                        fields: { Name: 'John Doe', Email: 'john@example.com' },
                      }, name || 'Sample Event', 'Your Organization', [], [])}
                    </div>
                  </div>

                  {/* Overlay */}
                  <div className="px-2.5 py-2 border-t border-border">
                    <div className="font-mono text-[10px] font-bold text-text truncate">{t.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[8px] px-1.5 py-0.5 border rounded-sm" style={{ borderColor: t.accent + '55', color: t.accent }}>{t.tag}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewTemplateId(t.id); }}
                        className="text-[8px] text-accent hover:underline font-bold uppercase tracking-wider"
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {template === t.id && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-[9px] text-black font-bold">✓</div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Template Configuration Panel */}
            {template === 'custom' && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* AI Theme Extraction */}
                  <div className="p-4 bg-surface border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-accent">🤖</span>
                      <span className="font-mono text-xs font-bold text-text uppercase tracking-wider">AI Theme Extractor</span>
                      {aiStyleName && (
                        <span className="ml-auto text-[9px] px-2 py-0.5 bg-accent/20 text-accent rounded-full font-mono">{aiStyleName}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted mb-3">Upload your event banner or logo. AI will auto-extract colors to create a matching certificate theme.</p>
                    <input type="file" ref={aiFileRef} accept="image/png,image/jpeg,image/webp" onChange={handleAIExtract} className="hidden" />
                    <button onClick={() => aiFileRef.current?.click()} disabled={aiExtracting}
                      className="w-full py-3 border-2 border-dashed border-accent/40 hover:border-accent bg-accent/5 hover:bg-accent/10 text-accent text-xs font-bold tracking-widest uppercase rounded-lg transition disabled:opacity-50 disabled:cursor-wait">
                      {aiExtracting ? 'Analyzing…' : '✦ AI Auto-Extract Theme'}
                    </button>
                  </div>

                  {/* Background Image */}
                  <div className="p-4 bg-surface border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-accent">🖼️</span>
                      <span className="font-mono text-xs font-bold text-text uppercase tracking-wider font-bold">Canvas Background</span>
                    </div>
                    <p className="text-[10px] text-muted mb-3">Upload a custom vector/raster background image to layer behind certificate texts.</p>
                    <input type="file" ref={bgFileRef} accept="image/png,image/jpeg,image/webp" onChange={handleBgUpload} className="hidden" />
                    <button onClick={() => bgFileRef.current?.click()}
                      className="w-full py-3 border border-dashed border-border hover:border-accent bg-bg hover:bg-surface text-muted hover:text-text text-xs font-bold tracking-widest uppercase rounded transition">
                      {customBgPreview ? '✓ Image Uploaded' : '↑ Upload BG Image'}
                    </button>
                    {customBgPreview && (
                      <div className="mt-3 relative rounded overflow-hidden border border-border flex items-center justify-between p-2 bg-bg text-[10px]">
                        <span className="truncate max-w-[180px]">bg_image_uploaded.png</span>
                        <button onClick={() => { setCustomBgImage(null); setCustomBgPreview(null); }}
                          className="text-err hover:underline font-bold uppercase text-[8px] font-mono">Remove</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Canvas Layout Editor */}
                <CertCanvasEditor
                  eventName={name}
                  orgName="Your Organization"
                  customBgColor={customBgColor}
                  setCustomBgColor={setCustomBgColor}
                  customTextColor={customTextColor}
                  setCustomTextColor={setCustomTextColor}
                  customAccentColor={customAccentColor}
                  setCustomAccentColor={setCustomAccentColor}
                  titleY={titleY}
                  setTitleY={setTitleY}
                  titleX={titleX}
                  setTitleX={setTitleX}
                  nameY={nameY}
                  setNameY={setNameY}
                  nameX={nameX}
                  setNameX={setNameX}
                  eventY={eventY}
                  setEventY={setEventY}
                  eventX={eventX}
                  setEventX={setEventX}
                  sigsY={sigsY}
                  setSigsY={setSigsY}
                  titleSize={titleSize}
                  setTitleSize={setTitleSize}
                  nameSize={nameSize}
                  setNameSize={setNameSize}
                  eventSize={eventSize}
                  setEventSize={setEventSize}
                  canvasWidth={canvasWidth}
                  setCanvasWidth={setCanvasWidth}
                  canvasHeight={canvasHeight}
                  setCanvasHeight={setCanvasHeight}
                  customBgPreview={customBgPreview}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="px-5 py-2.5 border border-border hover:border-borderHigh text-muted text-xs font-bold tracking-widest uppercase rounded transition">← Back</button>
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 bg-accent hover:bg-accentH text-black text-xs font-bold tracking-widest uppercase rounded transition">Next: Form Fields →</button>
            </div>
          </div>
        )}

        {/* ═══════════ Step 2: Form Fields ═══════════ */}
        {step === 2 && (
          <div>
            <h1 className="font-display text-3xl text-text uppercase tracking-wider mb-2">Claim Form Fields</h1>
            <p className="text-xs text-muted mb-6">Drag to reorder. Click a preset to add it instantly.</p>

            {/* Preset quick-add chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {PRESET_FIELDS.filter(f => !formFields.includes(f)).map(f => (
                <button key={f} onClick={() => addField(f)}
                  className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase border border-border hover:border-accent bg-bg hover:bg-surface text-muted hover:text-accent rounded-full transition">
                  + {f}
                </button>
              ))}
            </div>

            {/* Draggable field list */}
            <div className="space-y-2 mb-6">
              {formFields.map((f, idx) => (
                <div key={f}
                  draggable={f !== 'Name' && f !== 'Email'}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  className={`flex items-center gap-3 px-4 py-2.5 bg-surface border rounded transition
                    ${dragOverIdx === idx && dragIdx !== idx ? 'border-accent bg-accent/5' : 'border-border'}
                    ${f !== 'Name' && f !== 'Email' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  {f !== 'Name' && f !== 'Email' && (
                    <span className="text-muted text-xs select-none">⠿</span>
                  )}
                  <span className="font-mono text-xs text-text flex-1">{f}</span>
                  {f !== 'Name' && f !== 'Email' ? (
                    <button onClick={() => removeField(f)} aria-label={`Remove field ${f}`}
                      className="text-muted hover:text-err text-xs transition">✕</button>
                  ) : (
                    <span className="text-[9px] text-muted uppercase tracking-wider">Required</span>
                  )}
                </div>
              ))}
            </div>

            {/* Custom field input */}
            <div className="flex gap-3 mb-8">
              <input type="text" value={newField} onChange={(e) => setNewField(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addField()}
                placeholder="Add custom field (e.g. Roll No, Grade…)"
                className="flex-1 font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded" />
              <button onClick={() => addField()}
                className="px-5 py-2 bg-surface border border-border hover:border-accent text-text text-xs font-bold tracking-widest uppercase rounded transition">Add</button>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-border hover:border-borderHigh text-muted text-xs font-bold tracking-widest uppercase rounded transition">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 bg-accent hover:bg-accentH text-black text-xs font-bold tracking-widest uppercase rounded transition">Next: Signatories →</button>
            </div>
          </div>
        )}

        {/* ═══════════ Step 3: Signatories & Co-Logos ═══════════ */}
        {step === 3 && (
          <div>
            <h1 className="font-display text-3xl text-text uppercase tracking-wider mb-2">Signatories & Partners</h1>
            <p className="text-xs text-muted mb-8">Add authorized signatories and partner logos for every issued certificate.</p>

            {/* Listed signatories */}
            {signatories.length > 0 && (
              <div className="space-y-2 mb-6">
                {signatories.map((s, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 bg-surface border border-border rounded">
                    <div className="h-10 w-24 flex items-center justify-center border border-border rounded bg-bg flex-shrink-0 overflow-hidden">
                      {s.signatureType === 'image' && s.signatureUrl ? (
                        <img src={s.signatureUrl} alt={`${s.name} signature`} className="h-full w-full object-contain" />
                      ) : (
                        <span style={{ fontFamily: s.signatureFont }} className="text-sm text-text leading-none px-1">{s.signatureData}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs font-bold text-text truncate">{s.name}</div>
                      {s.title && <div className="text-[9px] text-muted truncate">{s.title}</div>}
                      <div className="text-[8px] text-accent uppercase tracking-wider mt-0.5">
                        {s.signatureType === 'typed' ? `Typed · ${SIGNATURE_FONTS.find(f => f.id === s.signatureFont)?.name || s.signatureFont}` : 'Image Upload'}
                      </div>
                    </div>
                    <button onClick={() => setSignatories(signatories.filter((_, j) => j !== i))} aria-label={`Remove ${s.name}`}
                      className="text-muted hover:text-err text-xs transition shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add signatory form */}
            <div className="p-5 bg-surface border border-border rounded-lg space-y-4 mb-8">
              <div className="text-[10px] text-muted tracking-widest uppercase mb-2">Add Signatory</div>

              {/* Name & Title */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">Signatory Name *</label>
                  <input type="text" value={newSignName} onChange={(e) => setNewSignName(e.target.value)} placeholder="Dr. Jane Smith"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none transition rounded" />
                </div>
                <div>
                  <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">Designation / Title</label>
                  <input type="text" value={newSignTitle} onChange={(e) => setNewSignTitle(e.target.value)} placeholder="Director, CSE"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none transition rounded" />
                </div>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-0 border border-border rounded overflow-hidden">
                {(['typed', 'image'] as const).map(mode => (
                  <button key={mode} onClick={() => setNewSignMode(mode)}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition
                      ${newSignMode === mode ? 'bg-accent text-black' : 'bg-bg text-muted hover:text-text'}`}>
                    {mode === 'typed' ? '✏ Typed Signature' : '↑ Upload Image'}
                  </button>
                ))}
              </div>

              {/* Typed signature mode */}
              {newSignMode === 'typed' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">Signature Text *</label>
                    <input type="text" value={newSignText} onChange={(e) => setNewSignText(e.target.value)} placeholder="How the signature will appear…"
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none transition rounded" />
                  </div>

                  {/* Font picker */}
                  <div>
                    <label className="block text-[9px] text-muted tracking-widest uppercase mb-2">Signature Font</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SIGNATURE_FONTS.map(f => (
                        <button key={f.id} onClick={() => setNewSignFont(f.id)}
                          className={`p-2.5 border rounded text-center transition
                            ${newSignFont === f.id ? 'border-accent bg-accent/10' : 'border-border bg-bg hover:border-borderHigh'}`}>
                          <div style={{ fontFamily: f.id }} className="text-lg text-text leading-none mb-1">
                            {newSignText || 'Sign'}
                          </div>
                          <div className="text-[8px] text-muted uppercase tracking-wider">{f.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live preview */}
                  {newSignText && (
                    <div className="p-3 bg-bg border border-border rounded text-center">
                      <div className="text-[8px] text-muted uppercase tracking-widest mb-1">Preview on Certificate</div>
                      <div style={{ fontFamily: newSignFont }} className="text-3xl text-text">{newSignText}</div>
                    </div>
                  )}

                  <button onClick={addSignatoryTyped} disabled={!newSignName.trim() || !newSignText.trim()}
                    className="w-full py-2.5 bg-surface border border-accent/30 hover:border-accent text-accent text-[10px] font-bold tracking-widest uppercase rounded transition disabled:opacity-40">
                    + Add Typed Signatory
                  </button>
                </div>
              )}

              {/* Image upload mode */}
              {newSignMode === 'image' && (
                <div className="space-y-3">
                  <input type="file" ref={signFileRef} accept="image/png,image/jpeg,image/svg+xml" onChange={handleSignatureUpload} className="hidden" />
                  <button
                    onClick={() => { if (!newSignName.trim()) { setError('Signatory name is required before uploading'); return; } signFileRef.current?.click(); }}
                    disabled={signUploading}
                    className="w-full py-2.5 border border-dashed border-accent/30 hover:border-accent text-accent text-[10px] font-bold tracking-widest uppercase rounded transition disabled:opacity-50">
                    {signUploading ? 'Uploading…' : '↑ Upload Signature Image & Add'}
                  </button>
                </div>
              )}
            </div>

            {/* Co-Logos */}
            <div className="mb-8">
              <div className="text-[10px] text-muted tracking-widest uppercase mb-4">Partner / Sponsor Logos</div>
              {coLogos.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {coLogos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Partner logo ${i + 1}`} className="h-14 w-20 object-contain bg-white border border-border rounded p-1" />
                      <button onClick={() => setCoLogos(coLogos.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-err text-white text-[9px] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        aria-label="Remove logo">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <input type="file" ref={coLogoFileRef} accept="image/png,image/jpeg,image/svg+xml" onChange={handleCoLogoUpload} className="hidden" />
              <button onClick={() => coLogoFileRef.current?.click()} disabled={coLogoUploading}
                className="w-full py-3 border border-dashed border-border hover:border-accent bg-bg hover:bg-surface text-muted hover:text-text text-xs font-bold tracking-widest uppercase rounded transition disabled:opacity-50">
                {coLogoUploading ? 'Uploading…' : '↑ Upload Partner / Sponsor Logo'}
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-border hover:border-borderHigh text-muted text-xs font-bold tracking-widest uppercase rounded transition">← Back</button>
              <button onClick={() => setStep(4)} className="flex-1 py-2.5 bg-accent hover:bg-accentH text-black text-xs font-bold tracking-widest uppercase rounded transition">Next: Email Template →</button>
            </div>
          </div>
        )}

        {/* ═══════════ Step 4: Email Template ═══════════ */}
        {step === 4 && (
          <div>
            <h1 className="font-display text-3xl text-text uppercase tracking-wider mb-2">Email Template</h1>
            <p className="text-xs text-muted mb-8">Customize the email sent when certificates are claimed. Leave blank for default.</p>

            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Email Subject Line</label>
                <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Your Certificate for {{EventName}} is Ready!"
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded" />
                <div className="text-[8px] text-muted mt-1 font-mono">Variables: {'{{Name}}'}, {'{{Email}}'}, {'{{EventName}}'}, {'{{CertId}}'}</div>
              </div>
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Email Body</label>
                <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={8}
                  placeholder={`Dear {{Name}},\n\nCongratulations! Your certificate for {{EventName}} has been issued.\n\nCertificate ID: {{CertId}}\nVerify at: {{VerifyLink}}\n\nBest regards,\nThe Team`}
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded resize-none" />
                <div className="text-[8px] text-muted mt-1 font-mono">Variables: {'{{Name}}'}, {'{{Email}}'}, {'{{EventName}}'}, {'{{CertId}}'}, {'{{VerifyLink}}'}</div>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="text-[9px] text-muted uppercase tracking-widest px-3 py-1.5 bg-surface">Email Preview</div>
                <div className="p-4 bg-bg space-y-2">
                  <div className="text-[10px] text-muted"><span className="font-bold">Subject:</span> {emailSubject || `Your Certificate for ${name || 'Event'} is Ready!`}</div>
                  <div className="border-t border-border/30 pt-2 text-xs text-text whitespace-pre-wrap font-mono leading-relaxed">
                    {emailBody || `Dear Recipient,\n\nCongratulations! Your certificate for ${name || 'the event'} has been issued.\n\nYou can verify it anytime using your unique verification link.\n\nBest regards,\nCertXchange`}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-5 py-2.5 border border-border hover:border-borderHigh text-muted text-xs font-bold tracking-widest uppercase rounded transition">← Back</button>
              <button onClick={() => setStep(5)} className="flex-1 py-2.5 bg-accent hover:bg-accentH text-black text-xs font-bold tracking-widest uppercase rounded transition">Review & Create →</button>
            </div>
          </div>
        )}

        {/* ═══════════ Step 5: Review ═══════════ */}
        {step === 5 && (
          <div>
            <h1 className="font-display text-3xl text-text uppercase tracking-wider mb-6">Review & Create</h1>

            {/* Live certificate preview */}
            <div className="mb-8 border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border">
                <div className="text-[9px] text-muted uppercase tracking-widest">Certificate Preview (Dummy Data)</div>
                <div className="text-[9px] text-accent font-mono">{TEMPLATES.find(t => t.id === template)?.name}</div>
              </div>
              <div className="w-full aspect-[960/700]">
                {renderSVGTemplate(template, reviewCert, name || 'Your Event', 'Your Organization', [], signatories.map(s => s.signatureType === 'image' ? s.signatureUrl : null))}
              </div>
            </div>

            {/* Summary list with jump links */}
            <div className="space-y-0 mb-8 border border-border rounded overflow-hidden">
              {[
                { label: 'Event Name',     value: name,                                                        step: 0 },
                { label: 'Date',           value: date,                                                        step: 0 },
                { label: 'Template',       value: TEMPLATES.find((t) => t.id === template)?.name || template,  step: 1 },
                { label: 'Serial Format',  value: serialPrefix ? `${serialPrefix}-001, -002…` : 'ZC-XXXXXX',   step: 0 },
                { label: 'Expires',        value: expiryDate || 'No expiry',                                   step: 0 },
                { label: 'Form Fields',    value: formFields.join(', '),                                       step: 2 },
                { label: 'Signatories',    value: signatories.length > 0 ? signatories.map(s => s.name).join(', ') : 'None', step: 3 },
                { label: 'Partner Logos',  value: `${coLogos.length} logo(s)`,                                 step: 3 },
                { label: 'Custom Email',   value: emailSubject ? '✓ Custom Template' : 'Default',              step: 4 },
              ].map(({ label, value, step: jumpStep }, idx) => (
                <div key={label} className={`flex justify-between items-center py-3 px-4 ${idx % 2 === 0 ? 'bg-bg' : 'bg-surface'}`}>
                  <span className="text-[10px] text-muted uppercase tracking-widest">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-text text-right max-w-xs truncate">{value}</span>
                    <button onClick={() => setStep(jumpStep)} className="text-[9px] text-accent hover:underline font-bold uppercase tracking-wider shrink-0">Edit</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="px-5 py-2.5 border border-border hover:border-borderHigh text-muted text-xs font-bold tracking-widest uppercase rounded transition">← Back</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-2.5 bg-accent hover:bg-accentH disabled:bg-accent/40 text-black text-xs font-bold tracking-widest uppercase rounded transition">
                {loading ? 'Creating Event...' : '✓ Create Event'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
