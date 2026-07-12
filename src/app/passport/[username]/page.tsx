'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';

interface Passport {
  username: string;
  email: string;
  full_name: string;
  bio: string | null;
  skills: string[];
  badges: string[];
}

interface Credential {
  cert_id: string;
  sha256_hash: string;
  issued_at: string;
  fields: Record<string, string>;
  events?: {
    name: string;
    date: string;
    template: string;
  };
}

interface SkillGraphNode {
  skill: string;
  level: number;
}

export default function LearnerPassportPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [passport, setPassport] = useState<Passport | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [skillGraph, setSkillGraph] = useState<SkillGraphNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [recruiterMode, setRecruiterMode] = useState(false);

  // Profile creation states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [skillsCsv, setSkillsCsv] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadPassport = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/passport/${username}`);
      const data = await res.json();
      
      if (res.status === 404) {
        setNotFound(true);
      } else if (res.ok) {
        setPassport(data.passport);
        setCredentials(data.credentials || []);
        setSkillGraph(data.skillGraph || []);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadPassport();
  }, [loadPassport]);

  const handleCreatePassport = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      const skillsArray = skillsCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/passport/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          bio,
          skills: skillsArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create passport');

      loadPassport();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center font-mono text-xs text-muted">Retrieving passport credentials…</main>
      </div>
    );
  }

  // Not Found: render Passport creation form
  if (notFound || !passport) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 px-6 py-16 max-w-lg mx-auto w-full z-10">
          <div className="border border-border bg-surface p-8 rounded shadow-lg">
            <div className="text-accent text-[9px] font-mono tracking-widest uppercase mb-2">✦ CertXchange Profile Claim</div>
            <h1 className="font-display text-2xl text-text uppercase tracking-wider mb-2">Claim Passport URL</h1>
            <p className="text-xs text-mutedHigh mb-6">
              Create your profile at <span className="text-accent font-mono">certxchange.in/passport/{username}</span> and aggregate all your verified credentials.
            </p>

            {createError && (
              <div className="mb-4 p-3 border border-err/30 bg-err/5 text-err text-xs font-mono rounded">
                ⚠ {createError}
              </div>
            )}

            <form onSubmit={handleCreatePassport} className="space-y-4">
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Shivam Gawade"
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter the email you use to claim certificates"
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                />
                <span className="text-[8px] text-mutedHigh block mt-1">This aggregates all certificates claimed with this email.</span>
              </div>
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Professional Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Share your learning interests and career goals"
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none rounded resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Core Skills (Comma separated)</label>
                <input
                  type="text"
                  value={skillsCsv}
                  onChange={(e) => setSkillsCsv(e.target.value)}
                  placeholder="e.g. Python, SQL, Networking, Linux"
                  className="w-full font-mono text-xs p-3 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-accent hover:bg-accentH text-black text-xs font-bold tracking-widest uppercase rounded transition"
              >
                {creating ? 'Claiming Profile…' : 'Claim My Passport →'}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className={`flex-1 px-6 md:px-10 py-10 max-w-5xl mx-auto w-full z-10 transition-all ${recruiterMode ? 'bg-white text-black font-sans' : 'bg-bg text-text'}`}>
        
        {/* Recruiter / normal mode toggle */}
        <div className="flex justify-between items-center mb-8 border-b border-border/20 pb-4">
          <div className="font-mono text-xs text-muted">
            Profile URL: <span className="text-accent">certxchange.in/passport/{username}</span>
          </div>
          <button
            onClick={() => setRecruiterMode(!recruiterMode)}
            className={`px-4 py-2 border font-mono text-[10px] uppercase font-bold tracking-wider rounded transition ${
              recruiterMode
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border text-muted hover:text-text hover:border-accent'
            }`}
          >
            {recruiterMode ? '⚡ Exit Recruiter View' : '💼 Recruiter View (Clean resume & QR)'}
          </button>
        </div>

        {recruiterMode ? (
          /* Recruiter layout - Printable layout with high contrast */
          <div className="p-8 border border-gray-300 rounded-lg space-y-8 bg-white text-black shadow-lg">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-gray-300 pb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{passport.full_name}</h1>
                <p className="text-sm text-gray-500 font-mono mt-1">{passport.email}</p>
                {passport.bio && <p className="text-sm text-gray-700 mt-3 max-w-xl">{passport.bio}</p>}
              </div>

              {/* Mock QR code representing the portfolio verification passport */}
              <div className="text-center flex flex-col items-center">
                <div className="w-20 h-20 border-2 border-black flex items-center justify-center p-1 bg-white">
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-[8px] text-white text-center font-mono">
                    <span>QR</span>
                    <span className="font-bold">VERIFIED</span>
                  </div>
                </div>
                <span className="text-[9px] text-gray-500 font-mono mt-1">Scan to Verify</span>
              </div>
            </div>

            {/* Skills summary */}
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-l-4 border-black pl-3 mb-3">
                Verified Skill Set
              </h2>
              <div className="flex flex-wrap gap-2">
                {passport.skills?.map((s) => (
                  <span key={s} className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs font-mono font-bold text-gray-800 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Credentials summary */}
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-l-4 border-black pl-3 mb-4">
                Verified Learning Credentials ({credentials.length})
              </h2>
              <div className="space-y-4">
                {credentials.map((c) => (
                  <div key={c.cert_id} className="border-b border-gray-200 pb-3">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-bold text-gray-900">{c.events?.name || 'Achievement Course'}</h3>
                      <span className="text-xs text-gray-500 font-mono">ID: {c.cert_id}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Issued: {new Date(c.issued_at).toLocaleDateString()}</span>
                      <span className="text-[10px] text-gray-500 font-mono">Hash: {c.sha256_hash.slice(0, 32)}…</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Normal Interactive Portfolio Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left side: Profile, skill graphs, and badges */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Profile Card */}
              <div className="border border-border bg-surface p-6 rounded-lg">
                <h1 className="font-display text-3xl text-text uppercase tracking-wider mb-2">
                  {passport.full_name}
                </h1>
                <p className="text-[10px] text-accent font-mono mb-4">{passport.email}</p>
                {passport.bio && (
                  <p className="text-xs text-mutedHigh leading-relaxed font-mono bg-bg/50 border border-border/40 p-3 rounded">
                    {passport.bio}
                  </p>
                )}
              </div>

              {/* Achievement Badges */}
              <div className="border border-border bg-surface p-6 rounded-lg">
                <h2 className="font-display text-lg text-text uppercase tracking-wider mb-4 border-b border-border/40 pb-2">
                  Achievements
                </h2>
                <div className="flex flex-wrap gap-2">
                  {passport.badges?.map((badge) => (
                    <span
                      key={badge}
                      className="px-3 py-1.5 bg-surfaceHigh border border-border hover:border-accent text-text text-[10px] font-mono rounded-full font-bold uppercase tracking-wider transition duration-150"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skill Graph */}
              <div className="border border-border bg-surface p-6 rounded-lg">
                <h2 className="font-display text-lg text-text uppercase tracking-wider mb-4 border-b border-border/40 pb-2">
                  Verified Skill Graph
                </h2>
                <div className="space-y-4">
                  {skillGraph.length === 0 ? (
                    <div className="text-center text-muted text-xs font-mono uppercase">Claim certificates to map skills</div>
                  ) : (
                    skillGraph.map((s) => (
                      <div key={s.skill}>
                        <div className="flex justify-between text-[10px] font-mono mb-1">
                          <span className="text-muted">{s.skill}</span>
                          <span className="text-text font-bold">{s.level}%</span>
                        </div>
                        <div className="w-full bg-bg h-2 rounded-full overflow-hidden border border-border/50">
                          <div className="bg-accent h-full" style={{ width: `${s.level}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Credentials Timeline */}
            <div className="lg:col-span-7">
              <div className="border border-border bg-surface p-6 rounded-lg">
                <h2 className="font-display text-xl text-text uppercase tracking-wider mb-6 border-b border-border/40 pb-3">
                  Credential Timeline ({credentials.length})
                </h2>

                {credentials.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded text-muted text-xs font-mono uppercase">
                    No verified achievements collected yet.
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60">
                    {credentials.map((c) => (
                      <div key={c.cert_id} className="relative pl-8 group">
                        
                        {/* Timeline dot */}
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-bg border-2 border-accent" />
                        
                        <div className="border border-border bg-surfaceHigh/30 hover:border-accent p-4 rounded-lg transition duration-150">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <h3 className="font-mono text-xs font-bold text-text uppercase tracking-wider">
                              {c.events?.name || 'Credential Course'}
                            </h3>
                            <a
                              href={`/verify?id=${c.cert_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-mono text-accent hover:underline shrink-0"
                            >
                              Verify ↗
                            </a>
                          </div>
                          
                          <div className="flex flex-wrap justify-between text-[9px] text-muted font-mono mt-3 border-t border-border/20 pt-2 gap-y-1">
                            <span>Claimed: {new Date(c.issued_at).toLocaleDateString()}</span>
                            <span className="text-[8px]">ID: {c.cert_id}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
