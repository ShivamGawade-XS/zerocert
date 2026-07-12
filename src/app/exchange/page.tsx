'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import NavBar from '@/components/layout/NavBar';
import { toast } from '@/lib/toast';

interface ExchangeItem {
  id: string;
  title: string;
  category: string;
  url: string;
  description: string;
  flags: string[];
  resume_value: number;
  time_required: string;
  difficulty: string;
  lifetime_verification: boolean;
  linkedin_worthiness: string;
  recruiter_value: string;
  created_by: string;
  created_at: string;
}

const FLAG_STYLES: Record<string, string> = {
  '🔥 Expires Today': 'bg-orange-500/15 border-orange-500/40 text-orange-400',
  '🆓 Free Today':    'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
  '🎁 Coupon':        'bg-purple-500/15 border-purple-500/40 text-purple-400',
  '🎓 Government':    'bg-blue-500/15 border-blue-500/40 text-blue-400',
};

const DIFF_COLORS: Record<string, string> = {
  Beginner:     'text-emerald-400',
  Intermediate: 'text-yellow-400',
  Advanced:     'text-red-400',
};

const CATEGORIES = [
  { id: 'all', label: 'All Opportunities', emoji: '🌐' },
  { id: 'free-course', label: 'Free Courses', emoji: '🆓' },
  { id: 'premium-coupon', label: 'Premium Coupons', emoji: '🎁' },
  { id: 'government', label: 'Government', emoji: '🎓' },
  { id: 'university-mooc', label: 'University MOOCs', emoji: '🏫' },
  { id: 'webinar', label: 'Webinars', emoji: '🎥' },
  { id: 'internship', label: 'Internships', emoji: '💼' },
  { id: 'scholarship', label: 'Scholarships', emoji: '🏆' },
  { id: 'hackathon', label: 'Hackathons', emoji: '⚡' },
];

function SkeletonCard() {
  return (
    <div className="border border-border bg-surface p-6 rounded-lg animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-4 w-24 bg-border/40 rounded" />
        <div className="h-4 w-16 bg-border/40 rounded" />
      </div>
      <div className="h-5 w-3/4 bg-border/40 rounded mb-2" />
      <div className="h-3 w-full bg-border/30 rounded mb-1" />
      <div className="h-3 w-2/3 bg-border/30 rounded mb-6" />
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-border/30 rounded" />)}
      </div>
      <div className="h-9 bg-border/30 rounded" />
    </div>
  );
}

export default function ExchangePage() {
  const [allItems, setAllItems] = useState<ExchangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'latest' | 'resume_value'>('latest');
  const [showShareModal, setShowShareModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [itemCategory, setItemCategory] = useState('free-course');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [flags, setFlags] = useState<string[]>([]);
  const [resumeValue, setResumeValue] = useState(5);
  const [timeRequired, setTimeRequired] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [linkedinWorthiness, setLinkedinWorthiness] = useState('Medium');
  const [recruiterValue, setRecruiterValue] = useState('Medium');
  const [createdBy, setCreatedBy] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exchange?category=${category}`);
      const data = await res.json();
      if (res.ok) setAllItems(data.items || []);
    } catch {
      toast('Failed to load opportunities', 'error');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Escape key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowShareModal(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Debounce search input
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  };

  // Filter + sort
  const filteredItems = allItems
    .filter((item) => {
      const q = debouncedSearch.toLowerCase();
      return !q || item.title.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'resume_value') return b.resume_value - a.resume_value;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cat.id === 'all'
      ? allItems.length
      : allItems.filter((i) => i.category === cat.id).length;
    return acc;
  }, {} as Record<string, number>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, category: itemCategory, url, description, flags,
          resumeValue, timeRequired, difficulty, linkedinWorthiness,
          recruiterValue, createdBy,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to share opportunity');

      setShowShareModal(false);
      setTitle(''); setUrl(''); setDescription(''); setFlags([]); setCreatedBy('');
      toast('✓ Opportunity shared with the community!', 'success');
      fetchItems();
    } catch (err: any) {
      toast(err.message || 'Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlagToggle = (flag: string) =>
    setFlags((prev) => prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]);

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-7xl mx-auto w-full z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/40 pb-8">
          <div>
            <div className="text-[#1565FE] text-[10px] tracking-widest uppercase mb-2 font-mono">✦ CertXchange catalog</div>
            <h1 className="font-display text-4xl md:text-5xl text-text uppercase tracking-wider mb-2">
              Verified Opportunities
            </h1>
            <p className="text-xs text-mutedHigh font-mono">
              Discover free certificates, coupons, fellowships, and internships — community-rated for real value.
            </p>
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="self-start px-5 py-3 bg-[#1565FE] hover:bg-[#0D47C9] text-white font-mono text-xs font-bold tracking-widest uppercase rounded-lg transition shadow-lg shadow-[#1565FE]/20"
          >
            + Share Opportunity
          </button>
        </div>

        {/* Search + Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">🔍</span>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by title or keyword…"
              className="w-full pl-8 pr-4 py-2.5 bg-surface border border-border focus:border-[#1565FE] text-text text-xs font-mono outline-none rounded-lg transition"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setDebouncedSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text text-sm"
              >✕</button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'latest' | 'resume_value')}
            className="px-4 py-2.5 bg-surface border border-border focus:border-[#1565FE] text-text text-xs font-mono outline-none rounded-lg transition"
          >
            <option value="latest">Sort: Latest</option>
            <option value="resume_value">Sort: Highest Resume Value</option>
          </select>
        </div>

        {/* Category Filters with counts */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border/20 pb-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition ${
                category === cat.id
                  ? 'bg-[#1565FE] text-white font-bold shadow-md shadow-[#1565FE]/20'
                  : 'bg-surface border border-border text-muted hover:text-text hover:border-[#1565FE]/50'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {!loading && (
                <span className={`ml-1 px-1 py-0.5 rounded text-[8px] font-bold ${
                  category === cat.id ? 'bg-white/20 text-white' : 'bg-border/40 text-mutedHigh'
                }`}>
                  {categoryCounts[cat.id] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results Label */}
        {!loading && (
          <div className="text-[10px] text-muted font-mono mb-4 uppercase tracking-widest">
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
            {debouncedSearch && ` for "${debouncedSearch}"`}
          </div>
        )}

        {/* Opportunities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-surface">
            <div className="text-4xl mb-4">🔍</div>
            <div className="text-muted text-xs font-mono uppercase mb-2">No opportunities found</div>
            <p className="text-[10px] text-mutedHigh font-mono">
              {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Be the first to share one!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group border border-border hover:border-[#1565FE]/60 bg-surface p-6 rounded-lg flex flex-col justify-between transition duration-200"
              >
                <div>
                  {/* Category & Time */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] bg-[#1565FE]/10 border border-[#1565FE]/20 px-2 py-0.5 text-[#1565FE] rounded font-mono uppercase tracking-wider">
                      {item.category.replace(/-/g, ' ')}
                    </span>
                    <span className="text-[9px] text-mutedHigh font-mono">⏱ {item.time_required || 'Varies'}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-lg text-text uppercase tracking-wide mb-2 line-clamp-2 group-hover:text-[#1565FE] transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-mutedHigh line-clamp-3 mb-4 leading-relaxed font-mono">
                    {item.description || 'No description provided.'}
                  </p>

                  {/* Flags */}
                  {item.flags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.flags.map((flag) => (
                        <span
                          key={flag}
                          className={`text-[8px] border px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider ${FLAG_STYLES[flag] || 'bg-border/20 border-border text-muted'}`}
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="border-t border-border/30 pt-3 mb-4 space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span className="text-muted">Resume Value</span>
                        <span className="text-text font-bold">{item.resume_value}/10</span>
                      </div>
                      <div className="w-full bg-border/20 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#1565FE] h-full rounded-full transition-all duration-500" style={{ width: `${item.resume_value * 10}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-muted">Difficulty</span>
                      <span className={`font-bold ${DIFF_COLORS[item.difficulty] || 'text-text'}`}>{item.difficulty}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-muted">LinkedIn Worthy</span>
                      <span className="text-text font-bold">{item.linkedin_worthiness}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/exchange/${item.id}`}
                    className="flex-1 py-2.5 bg-surfaceHigh border border-border hover:border-[#1565FE] text-center font-mono text-[10px] font-bold tracking-widest uppercase rounded-lg transition text-text hover:text-[#1565FE]"
                  >
                    Details & Reviews →
                  </a>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-[#1565FE] hover:bg-[#0D47C9] text-white font-mono text-[10px] font-bold tracking-widest uppercase rounded-lg transition"
                  >
                    Apply ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
            <div className="bg-surface border border-border rounded-xl max-w-lg w-full p-6 relative overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-muted hover:text-text text-lg leading-none">✕</button>

              <div className="text-[#1565FE] text-[9px] tracking-widest uppercase mb-1 font-mono">✦ Contribute to the network</div>
              <h2 className="font-display text-2xl text-text uppercase tracking-wider mb-6">Share a Verified Opportunity</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Title / Course Name *</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Google Python Automation Course"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Category *</label>
                    <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg">
                      <option value="free-course">Free Course</option>
                      <option value="premium-coupon">Premium Coupon</option>
                      <option value="government">Government</option>
                      <option value="university-mooc">University MOOC</option>
                      <option value="webinar">Webinar</option>
                      <option value="internship">Virtual Internship</option>
                      <option value="scholarship">Scholarship</option>
                      <option value="hackathon">Hackathon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Direct URL *</label>
                    <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/apply"
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                    placeholder="Curriculum overview, how to claim the certificate, and authenticity notes."
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Time Required</label>
                    <input type="text" value={timeRequired} onChange={(e) => setTimeRequired(e.target.value)}
                      placeholder="e.g. 2 hours, 4 weeks"
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Resume Value (1–10)</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min="1" max="10" value={resumeValue} onChange={(e) => setResumeValue(Number(e.target.value))}
                        className="flex-1 accent-[#1565FE]" />
                      <span className="font-mono text-xs font-bold text-text w-6 text-center">{resumeValue}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Difficulty', value: difficulty, setter: setDifficulty, options: ['Beginner', 'Intermediate', 'Advanced'] },
                    { label: 'LinkedIn Worthy', value: linkedinWorthiness, setter: setLinkedinWorthiness, options: ['Low', 'Medium', 'High'] },
                    { label: 'Recruiter Value', value: recruiterValue, setter: setRecruiterValue, options: ['Low', 'Medium', 'High'] },
                  ].map(({ label, value, setter, options }) => (
                    <div key={label}>
                      <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">{label}</label>
                      <select value={value} onChange={(e) => setter(e.target.value)}
                        className="w-full font-mono text-xs p-2 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg">
                        {options.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Alert Flags */}
                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">Alert Flags</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(FLAG_STYLES).map((flag) => {
                      const active = flags.includes(flag);
                      return (
                        <button key={flag} type="button" onClick={() => handleFlagToggle(flag)}
                          className={`px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-wider border transition ${
                            active ? `${FLAG_STYLES[flag]} font-bold` : 'bg-bg border-border text-muted hover:text-text'
                          }`}>
                          {flag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Your Name / Nickname</label>
                  <input type="text" value={createdBy} onChange={(e) => setCreatedBy(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg" />
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full py-3 bg-[#1565FE] hover:bg-[#0D47C9] disabled:opacity-50 text-white text-xs font-bold tracking-widest uppercase rounded-lg transition mt-2">
                  {submitting ? 'Submitting…' : '✓ Submit to Exchange'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
