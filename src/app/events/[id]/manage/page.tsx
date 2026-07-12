'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import { useAuthStore } from '@/store/auth';

interface EventData {
  id: string;
  name: string;
  date: string;
  description: string | null;
  template: string;
  serial_prefix: string | null;
  expiry_date: string | null;
  cert_count: number;
}

interface CertData {
  id: string;
  cert_id: string;
  fields: Record<string, string>;
  sha256_hash: string;
  status: 'active' | 'revoked' | 'expired';
  issued_at: string;
}

export default function EventManagePage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const { org, setOrg } = useAuthStore();

  const [event, setEvent] = useState<EventData | null>(null);
  const [certs, setCerts] = useState<CertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Authenticate user
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (d.authenticated && d.org) setOrg(d.org);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, [setOrg, router]);

  // Fetch Event & Certs details
  const loadData = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setError(null);
    try {
      const [eventRes, certsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/certs`),
      ]);

      if (!eventRes.ok) throw new Error('Event not found or unauthorized');
      if (!certsRes.ok) throw new Error('Failed to load certificates');

      const eventData = await eventRes.json();
      const certsData = await certsRes.json();

      setEvent(eventData.event);
      setCerts(certsData.certs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, org]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Revoke certificate handler
  const handleRevoke = async (certId: string) => {
    if (!confirm(`Are you sure you want to revoke certificate ${certId}? This action is permanent.`)) {
      return;
    }
    setActionLoading(certId);
    try {
      const res = await fetch(`/api/certs/${encodeURIComponent(certId)}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke certificate');
      
      // Update local state status
      setCerts(certs.map(c => c.cert_id === certId ? { ...c, status: 'revoked' as const } : c));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete event handler
  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? All issued certificates under this event will also be deleted from the system. This cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete event');
      }
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  if (!org || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center text-muted text-xs font-mono z-10">Loading management console…</main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center z-10">
          <div className="text-center p-6 max-w-md border border-err/20 bg-err/5 rounded">
            <div className="text-err text-xs font-bold uppercase tracking-wider mb-2">Management Error</div>
            <p className="text-xs text-mutedHigh mb-4">{error || 'Could not retrieve event information'}</p>
            <Link href="/dashboard" className="text-accent text-[10px] uppercase font-bold tracking-wider hover:underline">← Back to Dashboard</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-6xl mx-auto w-full z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-[10px] text-muted hover:text-accent uppercase tracking-wider transition">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Event Header Panel */}
        <div className="border border-border bg-surface p-6 rounded mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-3xl text-text uppercase leading-none">{event.name}</h1>
              <span className="text-[9px] px-2 py-0.5 border border-accent/20 text-accent uppercase tracking-wider">{event.template}</span>
            </div>
            <div className="font-mono text-[9px] text-muted mt-2 tracking-wider">
              DATE: {event.date} · PREFIX: {event.serial_prefix || 'ZC'} · EXPIRES: {event.expiry_date || 'NO EXPIRY'}
            </div>
          </div>
          <button
            onClick={handleDeleteEvent}
            className="px-4 py-2 border border-err/30 hover:border-err bg-err/5 text-err hover:bg-err/10 text-[9px] font-bold tracking-widest uppercase rounded transition font-mono"
          >
            ✕ Delete Event
          </button>
        </div>

        {/* Certificates Table */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] text-muted tracking-widest uppercase">Issued Certificates ({certs.length})</div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
              alert('Public claim link copied to clipboard!');
            }}
            className="text-[9px] text-accent hover:underline uppercase tracking-wider font-mono font-bold"
          >
            ✦ Copy Public Claim Link
          </button>
        </div>

        {certs.length === 0 ? (
          <div className="text-center py-16 border border-border bg-surface rounded">
            <div className="text-muted text-xs font-mono">No certificates claimed yet for this event.</div>
          </div>
        ) : (
          <div className="border border-border rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono text-left">
                <thead>
                  <tr className="bg-surface border-b border-border text-muted uppercase tracking-wider">
                    <th className="px-4 py-3">Certificate ID</th>
                    <th className="px-4 py-3">Recipient Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Claim Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {certs.map((c) => (
                    <tr key={c.id} className="hover:bg-surfaceHigh/40 transition">
                      <td className="px-4 py-3 text-accent font-bold">{c.cert_id}</td>
                      <td className="px-4 py-3 text-text font-bold">{c.fields?.Name || '—'}</td>
                      <td className="px-4 py-3 text-mutedHigh">{c.fields?.Email || '—'}</td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(c.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 border rounded-sm text-[8px] font-bold tracking-wider ${
                          c.status === 'active' ? 'bg-ok/5 border-ok/30 text-ok' :
                          c.status === 'revoked' ? 'bg-err/5 border-err/30 text-err' :
                          'bg-warn/5 border-warn/30 text-warn'
                        }`}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.status === 'active' && (
                          <button
                            onClick={() => handleRevoke(c.cert_id)}
                            disabled={actionLoading === c.cert_id}
                            className="px-2.5 py-1 border border-err/20 hover:border-err text-err hover:bg-err/5 rounded text-[8px] uppercase tracking-wider font-bold transition disabled:opacity-50"
                          >
                            {actionLoading === c.cert_id ? 'Revoking…' : 'Revoke'}
                          </button>
                        )}
                      </td>
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
