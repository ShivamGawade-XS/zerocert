'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import { useAuthStore } from '@/store/auth';

interface AnalyticsData {
  totalCerts: number;
  totalEvents: number;
  certsThisMonth: number;
  activeClaimLinks: number;
  topEvents: { name: string; cert_count: number }[];
  dailyCerts: { date: string; count: number }[];
}

const BAR_MAX_HEIGHT = 64;

export default function AnalyticsPage() {
  const { org, setOrg } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (d.authenticated && d.org) setOrg(d.org); else router.push('/login'); })
      .catch(() => router.push('/login'));
  }, [setOrg, router]);

  useEffect(() => {
    if (!org) return;
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [org]);

  if (!org || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center text-muted text-xs font-mono z-10">Loading analytics…</main>
      </div>
    );
  }

  const maxBar = data?.dailyCerts ? Math.max(...data.dailyCerts.map((d) => d.count), 1) : 1;

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-6xl mx-auto w-full z-10">
        <div className="text-accent text-[10px] tracking-widest uppercase mb-2">✦ Admin · Analytics</div>
        <h1 className="font-display text-4xl md:text-5xl text-text uppercase tracking-wider mb-10">Analytics</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-border mb-10">
          {[
            { label: 'Total Certificates', value: data?.totalCerts ?? '—', color: 'text-accent', icon: '◆' },
            { label: 'Total Events', value: data?.totalEvents ?? '—', color: 'text-ok', icon: '⬡' },
            { label: 'Certs This Month', value: data?.certsThisMonth ?? '—', color: 'text-info', icon: '▲' },
            { label: 'Active Claim Links', value: data?.activeClaimLinks ?? '—', color: 'text-purple', icon: '●' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-surface p-6 relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-10px] font-display text-7xl opacity-5 pointer-events-none">{kpi.icon}</div>
              <div className="text-[9px] text-muted uppercase tracking-widest mb-3">{kpi.label}</div>
              <div className={`font-display text-4xl ${kpi.color}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Daily Certs bar chart */}
          <div className="border border-border bg-surface p-6 rounded">
            <div className="text-[10px] text-muted tracking-widest uppercase mb-6">Certificates Issued (Last 30 Days)</div>
            {data?.dailyCerts && data.dailyCerts.length > 0 ? (
              <div className="flex items-end gap-1 h-20">
                {data.dailyCerts.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative" title={`${d.date}: ${d.count}`}>
                    <div className="absolute bottom-full mb-1 bg-surface border border-border text-[8px] font-mono text-accent px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                      {d.count}
                    </div>
                    <div
                      className="w-full bg-accent/20 hover:bg-accent/60 transition rounded-t"
                      style={{ height: `${(d.count / maxBar) * BAR_MAX_HEIGHT}px`, minHeight: d.count > 0 ? '3px' : '1px' }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted text-center py-8">No data yet</div>
            )}
          </div>

          {/* Top events */}
          <div className="border border-border bg-surface p-6 rounded">
            <div className="text-[10px] text-muted tracking-widest uppercase mb-6">Top Events by Certificate Count</div>
            {data?.topEvents && data.topEvents.length > 0 ? (
              <div className="space-y-3">
                {data.topEvents.map((ev, i) => {
                  const pct = Math.max(5, Math.round((ev.cert_count / Math.max(...data.topEvents.map((x) => x.cert_count), 1)) * 100));
                  return (
                    <div key={ev.name}>
                      <div className="flex justify-between text-[10px] mb-1.5">
                        <span className="text-text font-mono truncate mr-3">{ev.name}</span>
                        <span className="text-accent font-bold shrink-0">{ev.cert_count}</span>
                      </div>
                      <div className="h-1 bg-border rounded overflow-hidden">
                        <div className="h-full bg-accent rounded transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-muted text-center py-8">No events yet</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
