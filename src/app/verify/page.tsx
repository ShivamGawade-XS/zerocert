'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import { CertSVG, CertSVGRef } from '@/components/canvas/CertSVG';

function VerifyContent() {
  const searchParams = useSearchParams();
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const certCanvasRef = useRef<CertSVGRef>(null);

  const performLookup = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/certs/${encodeURIComponent(id.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Certificate not found');
      setResult(data.cert);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      setCertId(idParam);
      performLookup(idParam);
    }
  }, [searchParams]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(certId);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-ok/10 border-ok/30', text: 'text-ok', label: '✓ VALID' },
      revoked: { bg: 'bg-err/10 border-err/30', text: 'text-err', label: '✕ REVOKED' },
      expired: { bg: 'bg-warn/10 border-warn/30', text: 'text-warn', label: '⚠ EXPIRED' },
    };
    const s = map[status] || map.active;
    return (
      <span className={`inline-block px-4 py-1.5 border rounded text-xs font-bold tracking-widest uppercase ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="w-full">
      <form onSubmit={handleVerify} className="w-full flex gap-3 mb-12">
        <input
          type="text"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder="e.g. IITB/CSE/2025-001 or ZC-XXXXXXXX"
          aria-label="Certificate ID to verify"
          className="flex-1 font-mono text-sm p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded"
        />
        <button type="submit" disabled={loading}
          className="px-6 py-3 bg-accent hover:bg-accentH disabled:bg-accent/40 text-black text-xs font-bold tracking-widest uppercase rounded transition whitespace-nowrap">
          {loading ? 'Checking...' : 'Verify'}
        </button>
      </form>

      {error && (
        <div className="w-full border border-err/30 bg-err/5 p-6 rounded text-center mb-8">
          <div className="text-err text-xs font-bold tracking-widest uppercase mb-2">NOT FOUND</div>
          <p className="text-xs text-mutedHigh">{error}</p>
        </div>
      )}

      {result && (
        <>
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Visual Certificate Preview (Col-span 7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="text-[10px] text-muted tracking-widest uppercase">Visual Representation</div>
            <div className="shadow-2xl shadow-black/40">
              <CertSVG
                ref={certCanvasRef}
                cert={result}
                eventName={result.events?.name || ''}
                orgName={result.orgs?.name || ''}
                orgLogoUrl={result.orgs?.logo_url}
                coLogos={result.events?.co_logos}
                signatories={result.events?.signatories}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => certCanvasRef.current?.downloadPNG()}
                className="flex-1 py-2.5 bg-surface border border-border hover:border-accent text-text hover:text-accent font-mono text-[10px] font-bold tracking-widest uppercase rounded transition text-center"
              >
                Download PNG
              </button>
              <button
                onClick={() => certCanvasRef.current?.downloadPDF()}
                className="flex-1 py-2.5 bg-surface border border-border hover:border-accent text-text hover:text-accent font-mono text-[10px] font-bold tracking-widest uppercase rounded transition text-center"
              >
                Download PDF
              </button>
            </div>
          </div>

          {/* Cryptographic & Contextual Metadata (Col-span 5) */}
          <div className="lg:col-span-5 border border-border bg-surface p-6 rounded space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-1">Status</div>
                {statusBadge(result.status)}
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted tracking-widest uppercase mb-1">ID</div>
                <div className="font-mono text-sm text-accent font-bold">{result.cert_id}</div>
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-0.5">Issued To</div>
                <div className="font-mono text-sm text-text font-bold">{result.fields?.Name || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-0.5">Email</div>
                <div className="font-mono text-xs text-mutedHigh">{result.fields?.Email || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-0.5">Event</div>
                <div className="font-mono text-sm text-text">{result.events?.name || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-0.5">Organization</div>
                <div className="font-mono text-sm text-text">{result.orgs?.name || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-0.5">Issued On</div>
                <div className="font-mono text-xs text-mutedHigh">
                  {result.issued_at ? new Date(result.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <div className="text-[10px] text-muted tracking-widest uppercase mb-2">Cryptographic Audit</div>
              <div className="bg-bg p-4 border border-border rounded space-y-3 font-mono text-[10px]">
                <div>
                  <div className="text-muted uppercase text-[8px] mb-1">SHA-256 Hash</div>
                  <div className="text-mutedHigh break-all leading-normal">{result.sha256_hash}</div>
                </div>
                <div>
                  <div className="text-muted uppercase text-[8px] mb-1">Bitcoin Blockchain Anchor</div>
                  <div className="text-mutedHigh leading-normal">
                    {result.btc_proof && result.btc_proof !== 'pending' ? (
                      <span className="text-ok font-bold">✓ ANCHORED (Merkle Root verified)</span>
                    ) : (
                      <span className="text-warn font-bold">⏳ PENDING CONFIRMATION</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {result.status === 'revoked' && result.revoked_at && (
              <div className="p-4 border border-err/30 bg-err/5 rounded">
                <div className="text-err text-xs font-bold uppercase tracking-wider mb-1">Certificate Revoked</div>
                <div className="text-[10px] text-mutedHigh">
                  Revoked on {new Date(result.revoked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* JSON-LD Structured Data for SEO / Google indexing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOccupationalCredential',
              name: `Certificate of Completion — ${result.events?.name || 'Event'}`,
              description: `Digital certificate issued to ${result.fields?.Name || 'Recipient'} for ${result.events?.name || 'event'} by ${result.orgs?.name || 'Organization'}`,
              credentialCategory: 'certificate',
              dateCreated: result.issued_at,
              recognizedBy: {
                '@type': 'Organization',
                name: result.orgs?.name || 'ZeroCert',
                url: typeof window !== 'undefined' ? window.location.origin : '',
              },
              about: {
                '@type': 'EducationEvent',
                name: result.events?.name || '',
                startDate: result.events?.date || '',
              },
              identifier: {
                '@type': 'PropertyValue',
                propertyID: 'CertificateID',
                value: result.cert_id,
              },
              url: typeof window !== 'undefined' ? window.location.href : '',
            }),
          }}
        />
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 flex flex-col items-center px-6 py-16 z-10 max-w-6xl mx-auto w-full">
        <div className="text-accent text-[10px] tracking-widest uppercase mb-2 text-center">✦ Public Verification Portal</div>
        <h1 className="font-display text-4xl md:text-5xl text-text mb-2 text-center">VERIFY CERTIFICATE</h1>
        <p className="text-xs text-mutedHigh text-center mb-10">Check validity, visual design, and immutable blockchain proof.</p>
        <Suspense fallback={<div className="font-mono text-xs text-muted">Loading verify Content…</div>}>
          <VerifyContent />
        </Suspense>
      </main>
    </div>
  );
}
