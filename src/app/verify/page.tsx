'use client';

import { useState } from 'react';
import NavBar from '@/components/layout/NavBar';

export default function VerifyPage() {
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/certs/${encodeURIComponent(certId.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Certificate not found');
      setResult(data.cert);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 flex flex-col items-center px-6 py-16 z-10 max-w-3xl mx-auto w-full">
        <div className="text-accent text-[10px] tracking-widest uppercase mb-2">✦ Public Verification Portal</div>
        <h1 className="font-display text-4xl md:text-5xl text-text mb-2 text-center">VERIFY CERTIFICATE</h1>
        <p className="text-xs text-mutedHigh text-center mb-10">Enter a certificate ID to verify its authenticity and status.</p>

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
          <div className="w-full border border-border bg-surface p-8 rounded space-y-6">
            {/* Status banner */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-1">Certificate Status</div>
                {statusBadge(result.status)}
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted tracking-widest uppercase mb-1">Certificate ID</div>
                <div className="font-mono text-sm text-accent font-bold">{result.cert_id}</div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-1">Issued To</div>
                <div className="font-mono text-sm text-text font-bold">{result.fields?.Name || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-1">Email</div>
                <div className="font-mono text-xs text-mutedHigh">{result.fields?.Email || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-1">Event</div>
                <div className="font-mono text-sm text-text">{result.events?.name || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-1">Organization</div>
                <div className="font-mono text-sm text-text">{result.orgs?.name || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-1">Issued On</div>
                <div className="font-mono text-xs text-mutedHigh">
                  {result.issued_at ? new Date(result.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted tracking-widest uppercase mb-1">Expiry Date</div>
                <div className="font-mono text-xs text-mutedHigh">{result.events?.expiry_date || 'No expiry'}</div>
              </div>
            </div>

            {/* Extra fields */}
            {result.fields && Object.entries(result.fields).filter(([k]: [string, unknown]) => k !== 'Name' && k !== 'Email' && k !== 'Signatories' && k !== 'template' && k !== 'Template').length > 0 && (
              <>
                <hr className="border-border" />
                <div>
                  <div className="text-[10px] text-muted tracking-widest uppercase mb-3">Additional Fields</div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(result.fields)
                      .filter(([k]: [string, unknown]) => k !== 'Name' && k !== 'Email' && k !== 'Signatories' && k !== 'template' && k !== 'Template')
                      .map(([k, v]: [string, unknown]) => (
                        <div key={k}>
                          <div className="text-[9px] text-muted uppercase">{k}</div>
                          <div className="font-mono text-xs text-text">{String(v)}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            <hr className="border-border" />

            {/* Cryptographic details */}
            <div>
              <div className="text-[10px] text-muted tracking-widest uppercase mb-3">Cryptographic Proof</div>
              <div className="bg-bg p-4 border border-border rounded space-y-2">
                <div>
                  <span className="text-[9px] text-muted uppercase mr-2">SHA-256:</span>
                  <span className="font-mono text-[11px] text-mutedHigh break-all">{result.sha256_hash}</span>
                </div>
                <div>
                  <span className="text-[9px] text-muted uppercase mr-2">Bitcoin Anchor:</span>
                  <span className="font-mono text-[11px] text-mutedHigh">
                    {result.btc_proof && result.btc_proof !== 'pending' ? '✓ Anchored' : '⏳ Pending Confirmation'}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatories */}
            {result.events?.signatories && result.events.signatories.length > 0 && (
              <>
                <hr className="border-border" />
                <div>
                  <div className="text-[10px] text-muted tracking-widest uppercase mb-3">Signatories</div>
                  <div className="flex flex-wrap gap-4">
                    {result.events.signatories.map((sig: any, i: number) => (
                      <div key={i} className="bg-bg border border-border p-3 rounded min-w-[140px]">
                        <div className="font-mono text-xs font-bold text-text">{sig.name}</div>
                        <div className="font-mono text-[10px] text-muted italic">{sig.designation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {result.status === 'revoked' && result.revoked_at && (
              <div className="p-4 border border-err/30 bg-err/5 rounded">
                <div className="text-err text-xs font-bold uppercase tracking-wider mb-1">Certificate Revoked</div>
                <div className="text-[10px] text-mutedHigh">
                  Revoked on {new Date(result.revoked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
