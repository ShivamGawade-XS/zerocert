'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';

interface EventData {
  id: string;
  name: string;
  date: string;
  description: string | null;
  template: string;
  serial_prefix: string | null;
  form_fields: string[];
  co_logos: string[];
  expiry_date: string | null;
  cert_count: number;
  orgs?: { name: string };
}

interface ClaimedCert {
  cert_id: string;
  sha256_hash: string;
  issued_at: string;
  fields: Record<string, string>;
}

export default function ClaimPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [cert, setCert] = useState<ClaimedCert | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject('not found')))
      .then((data) => {
        setEvent(data.event);
        // Initialize form
        const init: Record<string, string> = {};
        data.event.form_fields?.forEach((f: string) => { init[f] = ''; });
        setFormData(init);
      })
      .catch(() => setError('Event not found or has been removed.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/certs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, fields: formData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim certificate');
      setCert(data.cert);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyVerifyLink = () => {
    if (!cert) return;
    navigator.clipboard.writeText(`${window.location.origin}/verify?id=${cert.cert_id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center text-muted text-xs font-mono z-10">Loading event…</main>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="text-err text-xs font-bold tracking-widest uppercase mb-2">Event Not Found</div>
            <p className="text-xs text-mutedHigh">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (cert) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 z-10 max-w-xl mx-auto w-full">
          <div className="text-ok text-4xl mb-4">✓</div>
          <h1 className="font-display text-4xl text-text uppercase tracking-wider text-center mb-2">Certificate Issued!</h1>
          <p className="text-xs text-mutedHigh text-center mb-8">
            Your certificate has been issued and an email has been sent to <span className="text-accent">{cert.fields?.Email}</span>. 
            A copy is also on its way to the Bitcoin blockchain for permanent proof.
          </p>

          <div className="w-full border border-border bg-surface p-6 rounded space-y-4 mb-8">
            <div className="flex justify-between">
              <span className="text-[9px] text-muted uppercase tracking-wider">Certificate ID</span>
              <span className="font-mono text-xs text-accent font-bold">{cert.cert_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[9px] text-muted uppercase tracking-wider">Issued To</span>
              <span className="font-mono text-xs text-text">{cert.fields?.Name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[9px] text-muted uppercase tracking-wider">SHA-256</span>
              <span className="font-mono text-[10px] text-mutedHigh truncate ml-4 max-w-[200px]">{cert.sha256_hash.slice(0, 24)}…</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button onClick={copyVerifyLink}
              className="flex-1 py-3 border border-border hover:border-accent text-text hover:text-accent font-mono text-[10px] font-bold tracking-widest uppercase rounded transition">
              {copied ? '✓ Copied!' : 'Copy Verify Link'}
            </button>
            <a href={`/verify?id=${cert.cert_id}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 py-3 bg-accent hover:bg-accentH text-black font-mono text-[10px] font-bold tracking-widest uppercase rounded transition text-center">
              View Certificate →
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 flex flex-col items-center px-6 py-16 z-10 max-w-lg mx-auto w-full">
        {/* Event Header */}
        <div className="w-full text-center mb-10">
          <div className="text-[10px] text-muted uppercase tracking-widest mb-2">{event?.orgs?.name}</div>
          <h1 className="font-display text-3xl md:text-4xl text-text uppercase tracking-wider mb-2">{event?.name}</h1>
          <div className="text-[11px] text-mutedHigh">{event?.date}</div>
          {event?.description && <p className="text-xs text-mutedHigh mt-3 max-w-md mx-auto">{event.description}</p>}
        </div>

        {/* Claim Form */}
        <div className="w-full border border-border bg-surface p-8 rounded shadow-lg shadow-black/20">
          <div className="text-[10px] text-muted tracking-widest uppercase mb-6">Claim Your Certificate</div>

          {error && <div className="mb-5 p-3 border border-err/30 bg-err/5 text-err text-xs font-mono rounded">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Certificate claim form">
            {event?.form_fields?.map((field) => (
              <div key={field}>
                <label htmlFor={`field-${field}`} className="block text-[10px] text-muted tracking-widest uppercase mb-2">
                  {field} <span className="text-accent">*</span>
                </label>
                <input
                  id={`field-${field}`}
                  type={field.toLowerCase() === 'email' ? 'email' : 'text'}
                  required
                  value={formData[field] || ''}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  placeholder={field.toLowerCase() === 'email' ? 'your@email.com' : `Enter your ${field.toLowerCase()}`}
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded"
                />
              </div>
            ))}
            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-accent hover:bg-accentH disabled:bg-accent/40 text-black text-xs font-bold tracking-widest uppercase rounded transition">
              {submitting ? 'Issuing Certificate…' : 'Claim Certificate →'}
            </button>
          </form>
          <p className="text-[9px] text-muted text-center mt-5 leading-relaxed">
            Your certificate will be cryptographically signed, SHA-256 fingerprinted, and anchored to the Bitcoin blockchain.
          </p>
        </div>
      </main>
    </div>
  );
}
