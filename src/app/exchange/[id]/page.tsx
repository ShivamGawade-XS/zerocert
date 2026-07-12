'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  verified: boolean;
  created_at: string;
}

function StarSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-xl transition-transform hover:scale-110 focus:outline-none"
        >
          {star <= (hovered || value) ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}

const FLAG_STYLES: Record<string, string> = {
  '🔥 Expires Today': 'bg-orange-500/15 border-orange-500/40 text-orange-400',
  '🆓 Free Today':    'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
  '🎁 Coupon':        'bg-purple-500/15 border-purple-500/40 text-purple-400',
  '🎓 Government':    'bg-blue-500/15 border-blue-500/40 text-blue-400',
};

const WORTHINESS_WIDTH: Record<string, string> = { High: '100%', Medium: '60%', Low: '28%' };

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [item, setItem] = useState<ExchangeItem | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemRes, reviewsRes] = await Promise.all([
        fetch(`/api/exchange/${itemId}`),
        fetch(`/api/exchange/${itemId}/reviews`),
      ]);

      const itemData = await itemRes.json();
      const reviewsData = await reviewsRes.json();

      if (!itemRes.ok) {
        setError(itemData.error || 'Opportunity not found');
      } else {
        setItem(itemData.item);
        setReviews(reviewsData.reviews || []);
      }
    } catch {
      setError('Failed to retrieve opportunity data');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') router.push('/exchange'); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exchange/${itemId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerName, rating, comment, verified }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      setReviewerName(''); setComment(''); setVerified(false); setRating(5);
      toast('✓ Review submitted — thank you!', 'success');
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full z-10">
          <div className="h-4 w-32 bg-border/40 rounded mb-6 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              {[140, 80, 200, 40, 300].map((h, i) => (
                <div key={i} className={`h-${Math.floor(h/4)} bg-border/30 rounded animate-pulse`} style={{ height: h }} />
              ))}
            </div>
            <div className="lg:col-span-5">
              <div className="h-64 bg-border/30 rounded animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center p-8 border border-red-500/20 bg-red-500/5 rounded-xl max-w-sm">
            <div className="text-4xl mb-4">⚠️</div>
            <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Not Found</div>
            <p className="text-xs text-mutedHigh mb-6 font-mono">{error || 'Could not load opportunity'}</p>
            <button onClick={() => router.push('/exchange')}
              className="px-5 py-2 bg-[#1565FE] text-white font-mono text-xs uppercase font-bold rounded-lg">
              ← Back to Exchange
            </button>
          </div>
        </main>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const verifiedCount = reviews.filter((r) => r.verified).length;

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-5xl mx-auto w-full z-10">

        <button onClick={() => router.push('/exchange')}
          className="flex items-center gap-1 text-[10px] text-muted hover:text-[#1565FE] uppercase tracking-wider transition mb-6 font-mono">
          ← Back to Exchange Catalog
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: Details + Reviews */}
          <div className="lg:col-span-7 space-y-6">

            {/* Main card */}
            <div className="border border-border bg-surface p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[9px] bg-[#1565FE]/10 border border-[#1565FE]/20 px-2 py-0.5 text-[#1565FE] rounded font-mono uppercase tracking-wider">
                  {item.category.replace(/-/g, ' ')}
                </span>
                {item.lifetime_verification && (
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wider">
                    ✓ Lifetime Verified
                  </span>
                )}
              </div>

              <h1 className="font-display text-2xl md:text-3xl text-text uppercase tracking-wider mb-4">{item.title}</h1>

              {item.flags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.flags.map((flag) => (
                    <span key={flag}
                      className={`text-[8px] border px-2.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider ${FLAG_STYLES[flag] || 'bg-border/20 border-border text-muted'}`}>
                      {flag}
                    </span>
                  ))}
                </div>
              )}

              {avgRating && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-[#1565FE]/5 border border-[#1565FE]/20 rounded-lg">
                  <span className="text-lg">⭐</span>
                  <span className="font-display text-2xl text-[#1565FE]">{avgRating}</span>
                  <span className="text-xs text-muted font-mono">/ 5 from {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  {verifiedCount > 0 && (
                    <span className="ml-auto text-[9px] text-emerald-400 font-mono font-bold">
                      ✓ {verifiedCount} verified completion{verifiedCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs text-mutedHigh whitespace-pre-wrap leading-relaxed mb-6 font-mono border-t border-border/20 pt-4">
                {item.description || 'No description provided.'}
              </p>

              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="w-full inline-block text-center py-3 bg-[#1565FE] hover:bg-[#0D47C9] text-white font-mono text-xs font-bold tracking-widest uppercase rounded-lg transition shadow-lg shadow-[#1565FE]/20">
                Claim This Certificate / Apply ↗
              </a>
            </div>

            {/* Reviews Section */}
            <div className="border border-border bg-surface p-6 rounded-xl space-y-6">
              <div className="flex justify-between items-center border-b border-border/40 pb-3">
                <h2 className="font-display text-lg text-text uppercase tracking-wider">
                  Community Reviews ({reviews.length})
                </h2>
              </div>

              {/* Submit review */}
              <form onSubmit={handlePostReview} className="p-4 bg-bg border border-border/40 rounded-lg space-y-4">
                <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Write a Review</div>

                <div>
                  <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">Your Name *</label>
                  <input type="text" required value={reviewerName} onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="e.g. Shivam"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg" />
                </div>

                <div>
                  <label className="block text-[9px] text-muted tracking-widest uppercase mb-2">Your Rating *</label>
                  <StarSelector value={rating} onChange={setRating} />
                </div>

                <div>
                  <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">Feedback Comment</label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                    placeholder="Is this certificate worth the time? Is it recognized by recruiters?"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg resize-none" />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <div
                    onClick={() => setVerified(!verified)}
                    className={`w-4 h-4 border rounded flex items-center justify-center transition ${verified ? 'bg-[#1565FE] border-[#1565FE]' : 'border-border group-hover:border-[#1565FE]'}`}
                  >
                    {verified && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-[10px] text-muted tracking-wider uppercase font-mono group-hover:text-text transition">
                    I completed & verified authenticity
                  </span>
                </label>

                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-surface border border-border hover:border-[#1565FE] text-text hover:text-[#1565FE] font-mono text-[10px] font-bold tracking-widest uppercase rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Submitting…' : '✓ Submit Review'}
                </button>
              </form>

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-muted text-xs font-mono uppercase">
                  No reviews yet — be the first!
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-bg border border-border/30 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-mono text-xs font-bold text-text">{rev.reviewer_name}</div>
                        <div className="font-mono text-sm">{'⭐'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                      </div>
                      {rev.comment && <p className="text-xs text-mutedHigh font-mono mb-2 leading-relaxed">{rev.comment}</p>}
                      <div className="flex justify-between items-center text-[9px] text-muted font-mono">
                        <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                        {rev.verified && (
                          <span className="text-emerald-400 font-bold uppercase tracking-wider bg-emerald-400/5 border border-emerald-400/20 px-1.5 py-0.5 rounded">
                            ✓ Verified Completion
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Metrics Card */}
          <div className="lg:col-span-5">
            <div className="border border-border bg-surface p-6 rounded-xl sticky top-24 space-y-5">
              <h2 className="font-display text-lg text-text uppercase tracking-wider border-b border-border/40 pb-3">
                Opportunity Metrics
              </h2>

              {/* Resume Value bar */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-muted">Resume Value</span>
                  <span className="text-text font-bold">{item.resume_value} / 10</span>
                </div>
                <div className="w-full bg-border/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#1565FE] h-full rounded-full transition-all duration-700" style={{ width: `${item.resume_value * 10}%` }} />
                </div>
              </div>

              {/* LinkedIn Worthiness bar */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-muted">LinkedIn Worthiness</span>
                  <span className="text-text font-bold">{item.linkedin_worthiness}</span>
                </div>
                <div className="w-full bg-border/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#1565FE] h-full rounded-full" style={{ width: WORTHINESS_WIDTH[item.linkedin_worthiness] || '50%' }} />
                </div>
              </div>

              {/* Recruiter Value bar */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-muted">Recruiter Value</span>
                  <span className="text-text font-bold">{item.recruiter_value}</span>
                </div>
                <div className="w-full bg-border/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#1565FE] h-full rounded-full" style={{ width: WORTHINESS_WIDTH[item.recruiter_value] || '50%' }} />
                </div>
              </div>

              {/* Stats table */}
              <div className="border-t border-border/30 pt-4 space-y-3 font-mono text-xs">
                {[
                  ['Estimated Duration', item.time_required || 'N/A'],
                  ['Difficulty Level', item.difficulty],
                  ['Lifetime Verification', item.lifetime_verification ? '✓ Yes' : '✗ No'],
                  ['Shared By', item.created_by || 'Anonymous'],
                  ['Added On', new Date(item.created_at).toLocaleDateString()],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-muted">{label}:</span>
                    <span className="text-text font-bold text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
