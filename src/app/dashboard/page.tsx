'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import { useAuthStore } from '@/store/auth';

interface EventSummary {
  id: string;
  name: string;
  date: string;
  template: string;
  cert_count: number;
  created_at: string;
}

export default function DashboardPage() {
  const { org, setOrg, isLoading } = useAuthStore();
  const router = useRouter();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [fetching, setFetching] = useState(true);

  // Ensure authenticated
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : Promise.reject('unauth')))
      .then((data) => {
        if (data.authenticated && data.org) setOrg(data.org);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, [setOrg, router]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events || []);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (org) fetchEvents();
  }, [org, fetchEvents]);

  if (isLoading || !org) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center text-muted text-xs font-mono z-10">Loading dashboard…</main>
      </div>
    );
  }

  const totalCerts = events.reduce((s, e) => s + (e.cert_count || 0), 0);

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-6xl mx-auto w-full z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="font-display text-4xl md:text-5xl text-text leading-none">{org.name.toUpperCase()}</div>
            <div className="font-mono text-[9px] text-muted mt-2 tracking-wider">ORG: {org.slug} · {org.email}</div>
          </div>
          <div className="flex gap-3">
            <Link href="/bulk-issue"
              className="px-5 py-2.5 border border-border hover:border-borderHigh bg-surface text-text font-mono text-[10px] font-bold tracking-widest uppercase rounded transition">
              Bulk Issue
            </Link>
            <Link href="/events/new"
              className="px-5 py-2.5 bg-accent hover:bg-accentH text-black font-mono text-[10px] font-bold tracking-widest uppercase rounded transition">
              + New Event
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-border mb-10">
          {[
            { label: 'Events', value: events.length, icon: '⬡', color: 'text-accent' },
            { label: 'Certificates', value: totalCerts, icon: '◆', color: 'text-ok' },
            { label: 'Templates', value: new Set(events.map((e) => e.template)).size, icon: '▣', color: 'text-info' },
            { label: 'Active', value: events.filter((e) => e.cert_count > 0).length, icon: '●', color: 'text-purple' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface p-5 relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-10px] font-display text-7xl opacity-5 pointer-events-none">{stat.icon}</div>
              <div className="text-[9px] text-muted tracking-widest uppercase mb-2">{stat.label}</div>
              <div className={`font-display text-4xl ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Events list */}
        <div className="text-[10px] text-muted tracking-widest uppercase mb-4">Your Events</div>
        {fetching ? (
          <div className="text-xs text-muted text-center py-12">Loading events…</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 border border-border bg-surface rounded">
            <div className="text-muted text-xs mb-4">No events yet. Create your first event to start issuing certificates.</div>
            <Link href="/events/new"
              className="inline-block px-6 py-2.5 bg-accent hover:bg-accentH text-black font-mono text-[10px] font-bold tracking-widest uppercase rounded transition">
              + Create Event
            </Link>
          </div>
        ) : (
          <div className="space-y-[1px] bg-border border border-border">
            {events.map((ev) => (
              <div key={ev.id} className="bg-surface p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-surfaceHigh transition">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-bold text-text truncate">{ev.name}</div>
                  <div className="flex gap-4 mt-1 flex-wrap">
                    <span className="text-[9px] text-muted tracking-wider uppercase">{ev.date}</span>
                    <span className="text-[9px] px-2 py-0.5 border border-accent/20 text-accent uppercase tracking-wider">{ev.template}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="font-display text-2xl text-accent">{ev.cert_count}</div>
                    <div className="text-[8px] text-muted uppercase tracking-wider">Certs</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/events/${ev.id}`); }}
                      className="px-3 py-1.5 border border-border hover:border-borderHigh text-muted hover:text-text text-[9px] font-bold tracking-widest uppercase rounded transition"
                      aria-label={`Copy claim link for ${ev.name}`}>
                      Copy Link
                    </button>
                    <Link href={`/events/${ev.id}/manage`}
                      className="px-3 py-1.5 border border-border hover:border-accent text-muted hover:text-accent text-[9px] font-bold tracking-widest uppercase rounded transition">
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
