'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';

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

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, description, template, serialPrefix, expiryDate, formFields, coLogos: [], signatories: [] }),
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
            <button key={s} onClick={() => i < step && setStep(i)}
              className={`flex-1 py-2.5 text-[9px] font-bold tracking-widest uppercase border-b-2 transition ${
                i === step ? 'border-accent text-accent' : i < step ? 'border-ok text-ok cursor-pointer' : 'border-border text-muted cursor-default'
              }`}>
              {i < step ? '✓ ' : `${i + 1}. `}{s}
            </button>
          ))}
        </div>

        {error && <div className="mb-6 p-3 border border-err/30 bg-err/5 text-err text-xs font-mono rounded">{error}</div>}

        {/* Step 0: Details */}
        {step === 0 && (
          <div className="space-y-5">
            <h1 className="font-display text-3xl text-text uppercase tracking-wider mb-6">Event Details</h1>
            {[
              { label: 'Event Name', val: name, set: setName, ph: 'Hackathon 2026 Certificate', req: true },
              { label: 'Event Date', val: date, set: setDate, ph: '', req: true, type: 'date' },
            ].map(({ label, val, set, ph, req, type }) => (
              <div key={label}>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">{label}{req && <span className="text-accent"> *</span>}</label>
                <input type={type || 'text'} required={req} value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded" />
              </div>
            ))}
            <div>
              <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional event description..."
                className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded resize-y" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Serial Prefix</label>
                <input type="text" value={serialPrefix} onChange={(e) => setSerialPrefix(e.target.value.toUpperCase())} placeholder="IITB/CSE/2026"
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
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-[10px] text-muted uppercase tracking-widest">{label}</span>
                  <span className="font-mono text-xs text-text text-right max-w-xs">{value}</span>
                </div>
              ))}
            </div>
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
