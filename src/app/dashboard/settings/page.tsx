'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import { useAuthStore } from '@/store/auth';

export default function SettingsPage() {
  const { org, setOrg } = useAuthStore();
  const router = useRouter();

  // Basic Profile states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Loading / message states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authenticate user & load initial state
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.authenticated && data.org) {
          setOrg(data.org);
          setName(data.org.name);
          setSlug(data.org.slug);
          setLogoUrl(data.org.logo_url);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [setOrg, router]);

  // Handle logo file upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setProfileMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload logo');

      setLogoUrl(data.url);
      setProfileMessage({ text: 'Logo uploaded successfully. Save profile changes to apply.', isError: false });
    } catch (err: any) {
      setProfileMessage({ text: err.message, isError: true });
    } finally {
      setLogoUploading(false);
    }
  };

  // Handle saving basic profile info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const res = await fetch('/api/auth/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, logoUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile settings');

      setOrg(data.org);
      setProfileMessage({ text: 'Profile settings updated successfully!', isError: false });
    } catch (err: any) {
      setProfileMessage({ text: err.message, isError: true });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match', isError: true });
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch('/api/auth/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setPasswordMessage({ text: 'Password changed successfully!', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ text: err.message, isError: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!org) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center text-muted text-xs font-mono z-10">Loading settings console…</main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-4xl mx-auto w-full z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-[10px] text-muted hover:text-accent uppercase tracking-wider transition">
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="font-display text-4xl text-text uppercase tracking-wider mb-8">Organization Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left panel: Profile settings (Col-span 7) */}
          <div className="md:col-span-7 space-y-6">
            <form onSubmit={handleSaveProfile} className="border border-border bg-surface p-6 rounded space-y-5">
              <h2 className="font-display text-lg text-text uppercase tracking-wider mb-4 border-b border-border/40 pb-2">Branding & Profile</h2>
              
              {profileMessage && (
                <div className={`p-3 text-[10px] font-mono border rounded ${
                  profileMessage.isError ? 'border-err/30 bg-err/5 text-err' : 'border-ok/30 bg-ok/5 text-ok'
                }`}>
                  {profileMessage.isError ? '⚠ ' : '✓ '}
                  {profileMessage.text}
                </div>
              )}

              {/* Logo upload block */}
              <div className="flex items-center gap-5">
                <div className="relative w-16 h-16 rounded border border-border bg-bg flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Organization logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[9px] text-muted font-mono uppercase">No Logo</span>
                  )}
                  {logoUploading && (
                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                      <span className="inline-block w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={logoUploading}
                    className="px-3 py-1.5 border border-border hover:border-accent text-text text-[9px] font-mono font-bold tracking-wider uppercase rounded transition"
                  >
                    Upload Logo
                  </button>
                  <div className="text-[8px] text-muted mt-1 font-mono">PNG, JPG, or SVG. Maximum 1MB.</div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Organization Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Organization Slug</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded"
                    required
                  />
                </div>
                <div className="text-[8px] text-muted mt-1 font-mono">Used for verification matching (e.g. {slug || 'your-slug'}.zerocert.app).</div>
              </div>

              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Email Address</label>
                <input
                  type="email"
                  value={org.email}
                  disabled
                  className="w-full font-mono text-xs p-3 bg-bg border border-border text-muted outline-none rounded opacity-60 cursor-not-allowed"
                />
                <div className="text-[8px] text-muted mt-1 font-mono">Primary auth identifier — cannot be changed.</div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-2.5 bg-accent hover:bg-accentH disabled:bg-accent/40 text-black text-xs font-bold tracking-widest uppercase rounded transition font-mono"
              >
                {profileLoading ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Right panel: Password settings (Col-span 5) */}
          <div className="md:col-span-5">
            <form onSubmit={handlePasswordChange} className="border border-border bg-surface p-6 rounded space-y-5">
              <h2 className="font-display text-lg text-text uppercase tracking-wider mb-4 border-b border-border/40 pb-2">Change Password</h2>

              {passwordMessage && (
                <div className={`p-3 text-[10px] font-mono border rounded ${
                  passwordMessage.isError ? 'border-err/30 bg-err/5 text-err' : 'border-ok/30 bg-ok/5 text-ok'
                }`}>
                  {passwordMessage.isError ? '⚠ ' : '✓ '}
                  {passwordMessage.text}
                </div>
              )}

              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none transition rounded"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 bg-accent hover:bg-accentH disabled:bg-accent/40 text-black text-xs font-bold tracking-widest uppercase rounded transition font-mono"
              >
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
