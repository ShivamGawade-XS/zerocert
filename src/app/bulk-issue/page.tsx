'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import { useAuthStore } from '@/store/auth';

interface ParsedRow {
  [key: string]: string;
}

export default function BulkIssuePage() {
  const { org, setOrg } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [csvText, setCsvText] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [results, setResults] = useState<{ cert_id: string; email: string; status: string }[]>([]);
  const [progress, setProgress] = useState(0);

  // Auth guard
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (d.authenticated && d.org) setOrg(d.org); else router.push('/login'); })
      .catch(() => router.push('/login'));
  }, [setOrg, router]);

  // Fetch events
  useEffect(() => {
    if (!org) return;
    fetch('/api/events').then((r) => r.json()).then((d) => {
      const evList = d.events?.map((e: any) => ({ id: e.id, name: e.name })) || [];
      setEvents(evList);
      if (evList.length > 0) setSelectedEvent(evList[0].id);
    });
  }, [org]);

  const parseCSV = (text: string) => {
    setParseError(null);
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) { setParseError('CSV must have a header row and at least one data row.'); return; }
    const hdrs = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    if (!hdrs.includes('Name') || !hdrs.includes('Email')) {
      setParseError('CSV must include "Name" and "Email" columns.');
      return;
    }
    const parsed = lines.slice(1).map((line) => {
      const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      return Object.fromEntries(hdrs.map((h, i) => [h, vals[i] || '']));
    });
    setHeaders(hdrs);
    setRows(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleIssue = async () => {
    if (!selectedEvent || rows.length === 0) return;
    setIssuing(true);
    setResults([]);
    setProgress(0);

    const issued: typeof results = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const res = await fetch('/api/certs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: selectedEvent, fields: row }),
        });
        const data = await res.json();
        issued.push({
          cert_id: data.cert?.cert_id || '—',
          email: row.Email,
          status: res.ok ? 'issued' : 'failed',
        });
      } catch {
        issued.push({ cert_id: '—', email: row.Email, status: 'error' });
      }
      setProgress(Math.round(((i + 1) / rows.length) * 100));
      setResults([...issued]);
    }
    setIssuing(false);
  };

  const downloadSampleCSV = () => {
    const sample = 'Name,Email,Roll No\nAlice Kumar,alice@iitb.ac.in,23B0001\nBob Sharma,bob@iitb.ac.in,23B0002';
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'zerocert_bulk_sample.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const issuedCount = results.filter((r) => r.status === 'issued').length;
  const failedCount = results.filter((r) => r.status !== 'issued').length;

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-5xl mx-auto w-full z-10">
        <div className="text-accent text-[10px] tracking-widest uppercase mb-2">✦ Admin · Bulk Operations</div>
        <h1 className="font-display text-4xl md:text-5xl text-text uppercase tracking-wider mb-2">Bulk Issue</h1>
        <p className="text-xs text-mutedHigh mb-10">Upload a CSV to issue certificates to multiple recipients at once.</p>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Left: Setup */}
          <div className="space-y-6">
            {/* Event selector */}
            <div>
              <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Select Event</label>
              <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded appearance-none"
                aria-label="Select event for bulk issuance">
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>

            {/* CSV upload */}
            <div>
              <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Upload CSV</label>
              <div className="border-2 border-dashed border-border hover:border-accent transition rounded p-8 text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string;
                    setCsvText(text);
                    parseCSV(text);
                  };
                  reader.readAsText(file);
                }}>
                <div className="text-muted text-3xl mb-2">↑</div>
                <div className="text-xs text-muted">Drop CSV or click to upload</div>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} aria-label="Upload CSV file" />
              </div>
              <button onClick={downloadSampleCSV}
                className="mt-2 text-[9px] text-accent hover:underline tracking-wider uppercase">
                ↓ Download Sample CSV
              </button>
            </div>

            {/* Paste CSV */}
            <div>
              <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Or Paste CSV</label>
              <textarea rows={5} value={csvText}
                onChange={(e) => { setCsvText(e.target.value); parseCSV(e.target.value); }}
                placeholder={'Name,Email,Roll No\nAlice,alice@org.com,001'}
                className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded resize-y" />
            </div>
          </div>

          {/* Right: Preview */}
          <div>
            <div className="text-[10px] text-muted tracking-widest uppercase mb-3">Preview ({rows.length} rows)</div>
            {parseError && <div className="p-3 border border-err/30 bg-err/5 text-err text-xs font-mono rounded mb-3">{parseError}</div>}
            {rows.length > 0 && (
              <div className="overflow-x-auto border border-border rounded">
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      {headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 6).map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-bg' : 'bg-surface'}>
                        {headers.map((h) => (
                          <td key={h} className="px-3 py-2 text-text truncate max-w-[120px]">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                    {rows.length > 6 && (
                      <tr><td colSpan={headers.length} className="px-3 py-2 text-muted text-center">+{rows.length - 6} more rows</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Issue button + progress */}
        {rows.length > 0 && !issuing && results.length === 0 && (
          <button onClick={handleIssue}
            className="w-full py-4 bg-accent hover:bg-accentH text-black font-bold text-xs tracking-widest uppercase rounded transition mb-8">
            Issue {rows.length} Certificate{rows.length !== 1 ? 's' : ''} →
          </button>
        )}

        {issuing && (
          <div className="mb-8">
            <div className="flex justify-between text-[10px] text-muted mb-2">
              <span>Issuing certificates…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-border rounded overflow-hidden">
              <div className="h-full bg-accent transition-all duration-200 rounded" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && !issuing && (
          <div>
            <div className="flex gap-6 mb-5">
              <div className="text-ok font-mono text-sm">✓ {issuedCount} issued</div>
              {failedCount > 0 && <div className="text-err font-mono text-sm">✕ {failedCount} failed</div>}
            </div>
            <div className="border border-border rounded overflow-hidden">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr className="bg-surface border-b border-border">
                    <th className="px-4 py-3 text-left text-muted uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-muted uppercase tracking-wider">Certificate ID</th>
                    <th className="px-4 py-3 text-left text-muted uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className={`${i % 2 === 0 ? 'bg-bg' : 'bg-surface'} border-b border-border/30 last:border-0`}>
                      <td className="px-4 py-2.5 text-text">{r.email}</td>
                      <td className="px-4 py-2.5 text-accent">{r.cert_id}</td>
                      <td className={`px-4 py-2.5 font-bold uppercase ${r.status === 'issued' ? 'text-ok' : 'text-err'}`}>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
