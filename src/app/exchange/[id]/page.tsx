'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  verified: boolean;
  created_at: string;
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [item, setItem] = useState<ExchangeItem | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review form states
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
        fetch(`/api/exchange`),
        fetch(`/api/exchange/${itemId}/reviews`),
      ]);

      const itemData = await itemRes.json();
      const reviewsData = await reviewsRes.json();

      if (itemRes.ok && reviewsRes.ok) {
        const found = itemData.items.find((i: ExchangeItem) => i.id === itemId);
        if (!found) {
          setError('Opportunity not found');
        } else {
          setItem(found);
          setReviews(reviewsData.reviews || []);
        }
      }
    } catch {
      setError('Failed to retrieve opportunity detail data');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/exchange/${itemId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName,
          rating,
          comment,
          verified,
        }),
      });

      if (res.ok) {
        setReviewerName('');
        setComment('');
        setVerified(false);
        loadData();
      }
    } catch {
      // error
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center font-mono text-xs text-muted">Loading detail console…</main>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-6 border border-err/20 bg-err/5 rounded max-w-sm">
            <div className="text-err text-xs font-bold uppercase tracking-wider mb-2">Error</div>
            <p className="text-xs text-mutedHigh mb-4">{error || 'Could not load opportunity'}</p>
            <button onClick={() => router.push('/exchange')} className="text-accent text-[10px] uppercase font-bold tracking-wider hover:underline">
              ← Back to Exchange
            </button>
          </div>
        </main>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-5xl mx-auto w-full z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button onClick={() => router.push('/exchange')} className="text-[10px] text-muted hover:text-accent uppercase tracking-wider transition">
            ← Back to Exchange Catalog
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Details & Ratings */}
          <div className="lg:col-span-7 space-y-6">
            <div className="border border-border bg-surface p-6 rounded-lg">
              <span className="text-[9px] bg-accent/10 border border-accent/20 px-2 py-0.5 text-accent rounded font-mono uppercase tracking-wider inline-block mb-3">
                {item.category.replace('-', ' ')}
              </span>
              <h1 className="font-display text-2xl md:text-3xl text-text uppercase tracking-wider mb-4">
                {item.title}
              </h1>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {item.flags?.map((flag) => (
                  <span
                    key={flag}
                    className="text-[8px] bg-err/15 border border-err/35 text-err px-2.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider"
                  >
                    {flag}
                  </span>
                ))}
                {item.lifetime_verification && (
                  <span className="text-[8px] bg-ok/10 border border-ok/35 text-ok px-2.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider">
                    ✓ Lifetime Verification
                  </span>
                )}
              </div>

              <p className="text-xs text-mutedHigh whitespace-pre-wrap leading-relaxed mb-6 font-mono border-t border-border/20 pt-4">
                {item.description || 'No description provided.'}
              </p>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-block text-center py-3 bg-accent hover:bg-accentH text-black font-mono text-xs font-bold tracking-widest uppercase rounded transition"
              >
                Claim This Certificate / Apply ↗
              </a>
            </div>

            {/* Reviews Section */}
            <div className="border border-border bg-surface p-6 rounded-lg space-y-6">
              <div className="flex justify-between items-center border-b border-border/40 pb-3">
                <h2 className="font-display text-lg text-text uppercase tracking-wider">
                  Community Reviews ({reviews.length})
                </h2>
                <div className="font-mono text-xs text-accent">
                  Avg Rating: <span className="font-bold">{averageRating} ⭐</span>
                </div>
              </div>

              {/* Add review form */}
              <form onSubmit={handlePostReview} className="p-4 bg-bg border border-border/50 rounded-lg space-y-4">
                <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Write a Review</div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g. Shivam"
                      className="w-full font-mono text-xs p-2 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">Rating *</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full font-mono text-xs p-2 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value="4">⭐⭐⭐⭐☆ (4/5)</option>
                      <option value="3">⭐⭐⭐☆☆ (3/5)</option>
                      <option value="2">⭐⭐☆☆☆ (2/5)</option>
                      <option value="1">⭐☆☆☆☆ (1/5)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-muted tracking-widest uppercase mb-1">Feedback Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Is this certificate worth the time? Is it verified?"
                    className="w-full font-mono text-xs p-2 bg-bg border border-border focus:border-accent text-text outline-none rounded resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="verified-chk"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <label htmlFor="verified-chk" className="text-[10px] text-muted tracking-wider uppercase cursor-pointer select-none">
                    Confirm I completed & verified authenticity
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-surface border border-border hover:border-accent text-text hover:text-accent font-mono text-[10px] font-bold tracking-widest uppercase rounded transition"
                >
                  {submitting ? 'Submitting…' : '✓ Submit Review'}
                </button>
              </form>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-6 text-muted text-xs font-mono uppercase">No reviews yet</div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-bg border border-border/30 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-mono text-xs font-bold text-text">{rev.reviewer_name}</div>
                        <div className="font-mono text-xs text-accent">{'⭐'.repeat(rev.rating)}</div>
                      </div>
                      {rev.comment && <p className="text-xs text-mutedHigh font-mono mb-2">{rev.comment}</p>}
                      <div className="flex justify-between items-center text-[9px] text-muted">
                        <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                        {rev.verified && (
                          <span className="text-ok font-bold uppercase tracking-wider bg-ok/5 border border-ok/20 px-1.5 py-0.5 rounded">
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

          {/* Right Column: Dynamic Value Metric Card */}
          <div className="lg:col-span-5">
            <div className="border border-border bg-surface p-6 rounded-lg sticky top-24 space-y-6">
              <h2 className="font-display text-lg text-text uppercase tracking-wider border-b border-border/40 pb-2">
                Opportunity Metrics
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-muted">Resume Value</span>
                    <span className="text-text font-bold">{item.resume_value} / 10</span>
                  </div>
                  <div className="w-full bg-border/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-accent h-full" style={{ width: `${item.resume_value * 10}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-muted">LinkedIn Worthiness</span>
                    <span className="text-text font-bold">{item.linkedin_worthiness}</span>
                  </div>
                  <div className="w-full bg-border/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-accent h-full" style={{ width: item.linkedin_worthiness === 'High' ? '100%' : item.linkedin_worthiness === 'Medium' ? '65%' : '30%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-muted">Recruiter Value</span>
                    <span className="text-text font-bold">{item.recruiter_value}</span>
                  </div>
                  <div className="w-full bg-border/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-accent h-full" style={{ width: item.recruiter_value === 'High' ? '100%' : item.recruiter_value === 'Medium' ? '65%' : '30%' }} />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/30 pt-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Estimated Duration:</span>
                  <span className="text-text font-bold">{item.time_required || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Level / Difficulty:</span>
                  <span className="text-text font-bold">{item.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Lifetime Verification:</span>
                  <span className="text-ok font-bold">{item.lifetime_verification ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Shared By:</span>
                  <span className="text-text font-bold">{item.created_by}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
