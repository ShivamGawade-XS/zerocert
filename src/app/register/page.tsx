'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import { useAuthStore } from '@/store/auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setOrg = useAuthStore((s) => s.setOrg);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, slug, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          const errors: Record<string, string> = {};
          Object.keys(data.details).forEach((key) => {
            if (data.details[key]?._errors?.length) {
              errors[key] = data.details[key]._errors[0];
            }
          });
          setFieldErrors(errors);
        }
        throw new Error(data.error || 'Registration failed');
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
        <div className="w-full max-w-md border border-border bg-surface p-8 rounded shadow-lg shadow-black/40">
          <div className="text-accent text-[10px] tracking-widest uppercase mb-2">✦ Create Your Organization</div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-text mb-6">Register</h1>

          {error && (
            <div className="mb-6 p-3 border border-err/30 bg-err/5 text-err text-xs font-mono rounded">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">
                Organization Name <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="IIIT Blockchain Club"
                aria-label="Organization name"
                className={`w-full font-mono text-xs p-3 bg-bg border ${
                  fieldErrors.name ? 'border-err focus:border-err' : 'border-border focus:border-accent'
                } text-text outline-none transition rounded`}
              />
              {fieldErrors.name && (
                <div className="text-[10px] text-err font-mono mt-1.5">{fieldErrors.name}</div>
              )}
            </div>

            <div>
              <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">
                Admin Email <span className="text-accent">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="admin@org.com"
                aria-label="Email address"
                className={`w-full font-mono text-xs p-3 bg-bg border ${
                  fieldErrors.email ? 'border-err focus:border-err' : 'border-border focus:border-accent'
                } text-text outline-none transition rounded`}
              />
              {fieldErrors.email && (
                <div className="text-[10px] text-err font-mono mt-1.5">{fieldErrors.email}</div>
              )}
            </div>

            <div>
              <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">
                URL Slug <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  setFieldErrors((prev) => ({ ...prev, slug: '' }));
                }}
                placeholder="iiit-blockchain"
                aria-label="Organization URL slug"
                className={`w-full font-mono text-xs p-3 bg-bg border ${
                  fieldErrors.slug ? 'border-err focus:border-err' : 'border-border focus:border-accent'
                } text-text outline-none transition rounded`}
              />
              <div className="text-[9px] text-muted mt-1">Only lowercase letters, numbers, and hyphens</div>
              {fieldErrors.slug && (
                <div className="text-[10px] text-err font-mono mt-1.5">{fieldErrors.slug}</div>
              )}
            </div>

            <div>
              <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">
                Password <span className="text-accent">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="Min 8 characters"
                aria-label="Password"
                className={`w-full font-mono text-xs p-3 bg-bg border ${
                  fieldErrors.password ? 'border-err focus:border-err' : 'border-border focus:border-accent'
                } text-text outline-none transition rounded`}
              />
              {fieldErrors.password && (
                <div className="text-[10px] text-err font-mono mt-1.5">{fieldErrors.password}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent hover:bg-accentH disabled:bg-accent/40 text-black text-xs font-bold tracking-widest uppercase rounded transition"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </form>

          <div className="mt-8 text-center text-[10px] text-muted tracking-wide font-mono">
            Already registered?{' '}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
