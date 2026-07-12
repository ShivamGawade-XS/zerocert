'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setOrg = useAuthStore((state) => state.setOrg);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setOrg(data.org);
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
      <main className="flex-1 flex items-center justify-center px-6 py-12 z-10">
        <div className="w-full max-w-sm border border-border bg-surface p-8 rounded shadow-lg shadow-black/40">
          <div className="text-accent text-[10px] tracking-widest uppercase mb-2">✦ Partner Portal</div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-text mb-6">Admin Login</h1>

          {error && (
            <div className="mb-6 p-3 border border-err/30 bg-err/5 text-err text-xs font-mono rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">
                Email Address <span className="text-accent">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@organization.com"
                className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition duration-150 rounded"
              />
            </div>

            <div>
              <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">
                Secret Password <span className="text-accent">*</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition duration-150 rounded"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent hover:bg-accentH disabled:bg-accent/40 text-black text-xs font-bold tracking-widest uppercase rounded transition duration-150"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center text-[10px] text-muted tracking-wide font-mono">
            New organization?{' '}
            <Link href="/register" className="text-accent hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
