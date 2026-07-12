'use client';

import { useEffect, useState } from 'react';
import NavBar from '@/components/layout/NavBar';

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

export default function ExchangePage() {
  const [items, setItems] = useState<ExchangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [itemCategory, setItemCategory] = useState('free-course');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [flags, setFlags] = useState<string[]>([]);
  const [resumeValue, setResumeValue] = useState(5);
  const [timeRequired, setTimeRequired] = useState('2 hours');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [linkedinWorthiness, setLinkedinWorthiness] = useState('Medium');
  const [recruiterValue, setRecruiterValue] = useState('Medium');
  const [createdBy, setCreatedBy] = useState('');

  const fetchItems = async (cat: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exchange?category=${cat}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(category);
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category: itemCategory,
          url,
          description,
          flags,
          resumeValue,
          timeRequired,
          difficulty,
          linkedinWorthiness,
          recruiterValue,
          createdBy,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to share opportunity');

      setShowShareModal(false);
      // Reset form
      setTitle('');
      setUrl('');
      setDescription('');
      setFlags([]);
      setCreatedBy('');
      fetchItems(category);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const categories = [
    { id: 'all', label: 'All Opportunities' },
    { id: 'free-course', label: 'Free Courses' },
    { id: 'premium-coupon', label: 'Premium Coupons' },
    { id: 'government', label: 'Government Certifications' },
    { id: 'university-mooc', label: 'University MOOCs' },
    { id: 'webinar', label: 'Webinars' },
    { id: 'internship', label: 'Virtual Internships' },
    { id: 'scholarship', label: 'Scholarships' },
    { id: 'hackathon', label: 'Hackathons' },
  ];

  const handleFlagToggle = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.filter((f) => f !== flag));
    } else {
      setFlags([...flags, flag]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-7xl mx-auto w-full z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-border/40 pb-8">
          <div>
            <div className="text-accent text-[10px] tracking-widest uppercase mb-2">✦ CertXchange catalog</div>
            <h1 className="font-display text-4xl md:text-5xl text-text uppercase tracking-wider mb-2">
              VERIFIED OPPORTUNITIES
            </h1>
            <p className="text-xs text-mutedHigh">
              Discover free certificate courses, limited-time coupons, fellowships, and internships with trust scores.
            </p>
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="self-start px-5 py-3 bg-accent hover:bg-accentH text-black font-mono text-xs font-bold tracking-widest uppercase rounded-lg transition"
          >
            + Share Opportunity
          </button>
        </div>

        {/* Category Filters Bar */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border/20 pb-5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded font-mono text-[10px] uppercase tracking-wider transition ${
                category === cat.id
                  ? 'bg-accent text-black font-bold'
                  : 'bg-surface border border-border text-muted hover:text-text hover:border-accent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Opportunities Grid */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-muted">Loading opportunities…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-surface">
            <div className="text-muted text-xs font-mono uppercase mb-2">No opportunities found</div>
            <p className="text-[10px] text-mutedHigh">Be the first to share one with the community!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-border hover:border-accent bg-surface p-6 rounded-lg flex flex-col justify-between transition duration-200"
              >
                <div>
                  {/* Category & Badge Row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] bg-accent/10 border border-accent/20 px-2 py-0.5 text-accent rounded font-mono uppercase tracking-wider">
                      {item.category.replace('-', ' ')}
                    </span>
                    <span className="text-[9px] text-mutedHigh font-mono">
                      ⏱ {item.time_required || 'Varies'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display text-lg text-text uppercase tracking-wide mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-mutedHigh line-clamp-3 mb-5 leading-relaxed">
                    {item.description || 'No description provided.'}
                  </p>

                  {/* Flag Alerts */}
                  {item.flags && item.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {item.flags.map((flag) => (
                        <span
                          key={flag}
                          className="text-[8px] bg-err/15 border border-err/35 text-err px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Dynamic value metrics */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/30 pt-4 mb-6">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-muted">Resume Value:</span>
                      <span className="text-text font-bold">{item.resume_value}/10</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-muted">Difficulty:</span>
                      <span className="text-text font-bold">{item.difficulty}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-muted">LinkedIn:</span>
                      <span className="text-text font-bold">{item.linkedin_worthiness}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-muted">Recruiter:</span>
                      <span className="text-text font-bold">{item.recruiter_value}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`/exchange/${item.id}`}
                    className="flex-1 py-2.5 bg-surfaceHigh border border-border hover:border-accent text-center font-mono text-[10px] font-bold tracking-widest uppercase rounded transition text-text hover:text-accent"
                  >
                    View Value Detail →
                  </a>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-accent hover:bg-accentH text-black font-mono text-[10px] font-bold tracking-widest uppercase rounded transition"
                  >
                    Apply ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Share Modal Dialog */}
        {showShareModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 relative overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-muted hover:text-text text-lg"
              >
                ✕
              </button>

              <h2 className="font-display text-2xl text-text uppercase tracking-wider mb-6">
                Share a Verified Opportunity
              </h2>

              {error && (
                <div className="mb-4 p-3 border border-err/30 bg-err/5 text-err text-xs font-mono rounded">
                  ⚠ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                    Title / Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Google Python Automation Course"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                      Category *
                    </label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    >
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
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                      Direct Application URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/apply"
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe content, curriculum, and how to verify authenticity."
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                      Time Required
                    </label>
                    <input
                      type="text"
                      value={timeRequired}
                      onChange={(e) => setTimeRequired(e.target.value)}
                      placeholder="e.g. 2 hours, 4 weeks"
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                      Resume Value (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={resumeValue}
                      onChange={(e) => setResumeValue(Number(e.target.value))}
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full font-mono text-xs p-2 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">
                      LinkedIn Worthy
                    </label>
                    <select
                      value={linkedinWorthiness}
                      onChange={(e) => setLinkedinWorthiness(e.target.value)}
                      className="w-full font-mono text-xs p-2 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">
                      Recruiter Value
                    </label>
                    <select
                      value={recruiterValue}
                      onChange={(e) => setRecruiterValue(e.target.value)}
                      className="w-full font-mono text-xs p-2 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                {/* Flags Alerts checkboxes */}
                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-2">
                    Opportunity Alerts
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['🔥 Expires Today', '🆓 Free Today', '🎁 Coupon', '🎓 Government'].map((flag) => {
                      const isChecked = flags.includes(flag);
                      return (
                        <button
                          key={flag}
                          type="button"
                          onClick={() => handleFlagToggle(flag)}
                          className={`px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-wider transition ${
                            isChecked
                              ? 'bg-err/20 border-2 border-err text-err font-bold'
                              : 'bg-bg border border-border text-muted hover:text-text'
                          }`}
                        >
                          {flag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                    Your Name / Nickname
                  </label>
                  <input
                    type="text"
                    value={createdBy}
                    onChange={(e) => setCreatedBy(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-accent hover:bg-accentH text-black text-xs font-bold tracking-widest uppercase rounded transition mt-4"
                >
                  ✓ Submit Opportunity
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
