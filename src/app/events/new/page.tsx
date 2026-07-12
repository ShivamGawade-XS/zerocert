'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import { extractThemeFromImage } from '@/lib/colorExtractor';

const TEMPLATES = [
  { id: 'classic',  name: 'Classic Gold',    tag: 'FORMAL',    accent: '#B8922A' },
  { id: 'dark',     name: 'Dark Prestige',   tag: 'MODERN',    accent: '#E8FF00' },
  { id: 'neon',     name: 'Neon Cyber',      tag: 'HACKATHON', accent: '#00FFFF' },
  { id: 'minimal',  name: 'Pure Minimal',    tag: 'ELEGANT',   accent: '#000000' },
  { id: 'brutal',   name: 'Brutalist',       tag: 'EDGY',      accent: '#F5F500' },
  { id: 'retro',    name: 'RetroWave',       tag: 'FUN',       accent: '#FF88FF' },
  { id: 'corp',     name: 'Corporate Blue',  tag: 'CORPORATE', accent: '#1E4DA1' },
  { id: 'midnight', name: 'Midnight Violet', tag: 'PREMIUM',   accent: '#9B5CFF' },
  { id: 'vintage',  name: 'Vintage Sepia',   tag: 'CLASSIC',   accent: '#A0714F' },
  { id: 'custom',   name: '✦ Custom / AI',   tag: 'YOUR DESIGN', accent: '#FF3355' },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('classic');
  const [serialPrefix, setSerialPrefix] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [formFields, setFormFields] = useState(['Name', 'Email']);
  const [newField, setNewField] = useState('');

  // Custom template state
  const [customBgColor, setCustomBgColor] = useState('#FFFFFF');
  const [customTextColor, setCustomTextColor] = useState('#111111');
  const [customAccentColor, setCustomAccentColor] = useState('#B8922A');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [customBgPreview, setCustomBgPreview] = useState<string | null>(null);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiStyleName, setAiStyleName] = useState<string | null>(null);

  const aiFileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const steps = ['Details', 'Template', 'Fields', 'Review'];

  const addField = () => {
    const trimmed = newField.trim();
    if (trimmed && !formFields.includes(trimmed)) {
      setFormFields([...formFields, trimmed]);
      setNewField('');
    }
  };

  const removeField = (f: string) => {
    if (f === 'Name' || f === 'Email') return;
    setFormFields(formFields.filter((x) => x !== f));
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle background image upload
  const handleBgUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setCustomBgImage(base64);
    setCustomBgPreview(base64);
  }, []);

  // AI Theme Extraction handler
  const handleAIExtract = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiExtracting(true);
    setAiStyleName(null);
    setError(null);

    try {
      const base64 = await fileToBase64(file);

      // Also set as background image preview
      setCustomBgImage(base64);
      setCustomBgPreview(base64);

      // Try server-side Gemini AI extraction first
      let theme: { bgColor: string; textColor: string; accentColor: string; styleName: string } | null = null;

      try {
        const res = await fetch('/api/ai/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await res.json();

        if (data.success && data.theme) {
          theme = data.theme;
        }
      } catch {
        // Server-side extraction failed or unavailable, will fallback
      }

      // Fallback: Client-side canvas color extraction
      if (!theme) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = base64;
        });
        theme = extractThemeFromImage(img);
      }

      // Apply extracted theme
      if (theme) {
        setCustomBgColor(theme.bgColor);
        setCustomTextColor(theme.textColor);
        setCustomAccentColor(theme.accentColor);
        setAiStyleName(theme.styleName || 'AI-Generated Theme');
      }
    } catch (err: any) {
      setError('AI extraction failed: ' + (err.message || 'Unknown error'));
    } finally {
      setAiExtracting(false);
    }
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        name,
        date,
        description,
        template,
        serialPrefix,
        expiryDate,
        formFields,
        coLogos: [],
        signatories: [],
      };

      // Include custom theme data when using the custom template
      if (template === 'custom') {
        payload.bgColor = customBgColor;
        payload.textColor = customTextColor;
        payload.accentColor = customAccentColor;
        payload.bgImage = customBgImage;
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full z-10">
        {/* Step indicators */}
        <div className="flex gap-0 mb-10">
          {steps.map((s, i) => (
            <div key={s} className={`flex-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all
              ${i <= step ? 'border-accent text-accent' : 'border-border text-muted'}`}>
              <span className="opacity-50 mr-1">{String(i).padStart(2, '0')}</span>{s}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 border border-err/40 bg-err/10 rounded text-err text-xs font-mono" role="alert">
            ⚠ {error}
          </div>
        )}

        {/* Step 0: Details */}
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

        {/* Step 1: Template */}
        {step === 1 && (
          <div>
            <h1 className="font-display text-3xl text-text uppercase tracking-wider mb-6">Choose Template</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-border mb-8">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className={`bg-surface p-5 text-left hover:bg-surfaceHigh transition border-2 ${template === t.id ? 'border-accent' : 'border-transparent'}`}
                  aria-pressed={template === t.id} aria-label={`Select ${t.name} template`}>
                  <div className="w-full h-16 rounded mb-3 flex items-center justify-center text-xs font-bold"
                    style={{ background: t.accent + '22', border: `1px solid ${t.accent}55`, color: t.accent }}>
                    {t.name}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-text">{t.name}</div>
                  <div className="inline-block text-[8px] px-1.5 py-0.5 border mt-1" style={{ borderColor: t.accent + '44', color: t.accent }}>{t.tag}</div>
                </button>
              ))}
            </div>

            {/* Custom Template Configuration Panel */}
            {template === 'custom' && (
              <div className="mb-8 p-6 bg-surface border border-border rounded-lg space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-accent text-lg">✦</span>
                  <h2 className="font-display text-lg text-text uppercase tracking-wider">Custom Template Designer</h2>
                </div>

                {/* AI Theme Extraction */}
                <div className="p-4 bg-bg border border-accent/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-accent">🤖</span>
                    <span className="font-mono text-xs font-bold text-text uppercase tracking-wider">AI Theme Extractor</span>
                    {aiStyleName && (
                      <span className="ml-auto text-[9px] px-2 py-0.5 bg-accent/20 text-accent rounded-full font-mono">
                        {aiStyleName}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted mb-3">
                    Upload your event banner, logo, or brand card. AI will auto-extract colors and create a matching certificate theme.
                  </p>
                  <input
                    type="file"
                    ref={aiFileRef}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAIExtract}
                    className="hidden"
                  />
                  <button
                    onClick={() => aiFileRef.current?.click()}
                    disabled={aiExtracting}
                    className="w-full py-3 border-2 border-dashed border-accent/40 hover:border-accent bg-accent/5 hover:bg-accent/10
                      text-accent text-xs font-bold tracking-widest uppercase rounded-lg transition disabled:opacity-50 disabled:cursor-wait"
                  >
                    {aiExtracting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        Analyzing with AI…
                      </span>
                    ) : (
                      '✦ Upload Image & Auto-Extract Theme'
                    )}
                  </button>
                </div>

                {/* Background Image Upload */}
                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Background Image (Optional)</label>
                  <input
                    type="file"
                    ref={bgFileRef}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleBgUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => bgFileRef.current?.click()}
                    className="w-full py-3 border border-dashed border-border hover:border-accent bg-bg hover:bg-surface
                      text-muted hover:text-text text-xs font-bold tracking-widest uppercase rounded transition"
                  >
                    {customBgPreview ? '✓ Image Uploaded — Click to Replace' : '↑ Upload Background Image'}
                  </button>
                  {customBgPreview && (
                    <div className="mt-3 relative rounded overflow-hidden border border-border">
                      <img src={customBgPreview} alt="Background preview" className="w-full h-32 object-cover" />
                      <button
                        onClick={() => { setCustomBgImage(null); setCustomBgPreview(null); }}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/70 text-white text-xs rounded-full flex items-center justify-center hover:bg-err transition"
                        aria-label="Remove background image"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Background</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={customBgColor} onChange={(e) => setCustomBgColor(e.target.value)}
                        className="w-8 h-8 rounded border border-border cursor-pointer" />
                      <input type="text" value={customBgColor} onChange={(e) => setCustomBgColor(e.target.value)}
                        className="flex-1 font-mono text-[10px] p-2 bg-bg border border-border text-text outline-none rounded" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Text</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={customTextColor} onChange={(e) => setCustomTextColor(e.target.value)}
                        className="w-8 h-8 rounded border border-border cursor-pointer" />
                      <input type="text" value={customTextColor} onChange={(e) => setCustomTextColor(e.target.value)}
                        className="flex-1 font-mono text-[10px] p-2 bg-bg border border-border text-text outline-none rounded" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Accent</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={customAccentColor} onChange={(e) => setCustomAccentColor(e.target.value)}
                        className="w-8 h-8 rounded border border-border cursor-pointer" />
                      <input type="text" value={customAccentColor} onChange={(e) => setCustomAccentColor(e.target.value)}
                        className="flex-1 font-mono text-[10px] p-2 bg-bg border border-border text-text outline-none rounded" />
                    </div>
                  </div>
                </div>

                {/* Live Preview Swatch */}
                <div className="rounded-lg overflow-hidden border border-border">
                  <div className="text-[9px] text-muted uppercase tracking-widest px-3 py-1.5 bg-surface">Live Preview</div>
                  <div className="relative h-28 flex items-center justify-center"
                    style={{ backgroundColor: customBgColor }}>
                    {customBgPreview && (
                      <img src={customBgPreview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    )}
                    <div className="relative z-10 text-center">
                      <div style={{ color: customAccentColor }} className="text-[9px] font-bold uppercase tracking-widest mb-1">Certificate of Completion</div>
                      <div style={{ color: customTextColor }} className="text-lg font-bold font-serif">John Doe</div>
                      <div style={{ color: customTextColor, opacity: 0.6 }} className="text-[9px] font-mono">for {name || 'Your Event Name'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="px-5 py-2.5 border border-border hover:border-borderHigh text-muted text-xs font-bold tracking-widest uppercase rounded transition">← Back</button>
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 bg-accent hover:bg-accentH text-black text-xs font-bold tracking-widest uppercase rounded transition">Next: Form Fields →</button>
            </div>
          </div>
        )}

        {/* Step 2: Form Fields */}
        {step === 2 && (
          <div>
            <h1 className="font-display text-3xl text-text uppercase tracking-wider mb-6">Claim Form Fields</h1>
            <div className="space-y-2 mb-6">
              {formFields.map((f) => (
                <div key={f} className="flex items-center justify-between px-4 py-2.5 bg-surface border border-border rounded">
                  <span className="font-mono text-xs text-text">{f}</span>
                  {f !== 'Name' && f !== 'Email' ? (
                    <button onClick={() => removeField(f)} aria-label={`Remove field ${f}`}
                      className="text-muted hover:text-err text-xs transition">✕</button>
                  ) : (
                    <span className="text-[9px] text-muted uppercase tracking-wider">Required</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mb-8">
              <input type="text" value={newField} onChange={(e) => setNewField(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addField()}
                placeholder="Add custom field (e.g. Roll No, Grade…)"
                className="flex-1 font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded" />
              <button onClick={addField} className="px-5 py-2 bg-surface border border-border hover:border-accent text-text text-xs font-bold tracking-widest uppercase rounded transition">Add</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-border hover:border-borderHigh text-muted text-xs font-bold tracking-widest uppercase rounded transition">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 bg-accent hover:bg-accentH text-black text-xs font-bold tracking-widest uppercase rounded transition">Review & Create →</button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h1 className="font-display text-3xl text-text uppercase tracking-wider mb-6">Review & Create</h1>
            <div className="space-y-4 mb-8">
              {[
                { label: 'Event Name', value: name },
                { label: 'Date', value: date },
                { label: 'Template', value: TEMPLATES.find((t) => t.id === template)?.name || template },
                { label: 'Serial Format', value: serialPrefix ? `${serialPrefix}-001, -002…` : 'ZC-XXXXXX' },
                { label: 'Expires', value: expiryDate || 'No expiry' },
                { label: 'Form Fields', value: formFields.join(', ') },
                ...(template === 'custom' ? [
                  { label: 'Background Color', value: customBgColor },
                  { label: 'Text Color', value: customTextColor },
                  { label: 'Accent Color', value: customAccentColor },
                  { label: 'Background Image', value: customBgImage ? '✓ Uploaded' : 'None' },
                  ...(aiStyleName ? [{ label: 'AI Style', value: aiStyleName }] : []),
                ] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-[10px] text-muted uppercase tracking-widest">{label}</span>
                  <span className="font-mono text-xs text-text text-right max-w-xs">{value}</span>
                </div>
              ))}
            </div>

            {/* Custom template preview in review */}
            {template === 'custom' && (
              <div className="mb-8 rounded-lg overflow-hidden border border-border">
                <div className="text-[9px] text-muted uppercase tracking-widest px-3 py-1.5 bg-surface">Certificate Preview</div>
                <div className="relative h-36 flex items-center justify-center"
                  style={{ backgroundColor: customBgColor }}>
                  {customBgPreview && (
                    <img src={customBgPreview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  )}
                  <div className="relative z-10 text-center">
                    <div style={{ color: customAccentColor }} className="text-[9px] font-bold uppercase tracking-widest mb-1">Certificate of Completion</div>
                    <div style={{ color: customTextColor }} className="text-xl font-bold font-serif">Recipient Name</div>
                    <div style={{ color: customTextColor, opacity: 0.6 }} className="text-[10px] font-mono mt-1">for {name}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-border hover:border-borderHigh text-muted text-xs font-bold tracking-widest uppercase rounded transition">← Back</button>
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
