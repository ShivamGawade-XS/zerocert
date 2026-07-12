'use client';

import { useEffect, useState, useRef } from 'react';
import NavBar from '@/components/layout/NavBar';
import { toast } from '@/lib/toast';

interface Showcase {
  id: string;
  title: string;
  type: string;
  url: string;
  description: string;
  creator_name: string;
  upvotes: number;
  created_at: string;
}

interface Comment {
  id: string;
  showcase_id: string;
  author_name: string;
  comment: string;
  created_at: string;
}

const TYPE_EMOJIS: Record<string, string> = {
  portfolio: '🌐',
  resume: '📄',
  linkedin: '💼',
  certificate: '🎓',
};

const MAX_COMMENT_CHARS = 280;

function SkeletonCard() {
  return (
    <div className="border border-border bg-surface p-5 rounded-xl animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-4 w-20 bg-border/40 rounded" />
        <div className="h-4 w-16 bg-border/30 rounded" />
      </div>
      <div className="h-5 w-3/4 bg-border/40 rounded mb-2" />
      <div className="h-3 w-full bg-border/30 rounded mb-1" />
      <div className="h-3 w-2/3 bg-border/30 rounded" />
    </div>
  );
}

export default function ShowcasePage() {
  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShowcase, setSelectedShowcase] = useState<Showcase | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Track upvoted showcase IDs in localStorage
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState('portfolio');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [creatorName, setCreatorName] = useState('');

  // Comment states
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const commentEndRef = useRef<HTMLDivElement>(null);

  // Load upvoted IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cx_upvoted');
      if (stored) setUpvotedIds(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  // Escape key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowModal(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fetchShowcases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/showcase');
      const data = await res.json();
      if (res.ok) setShowcases(data.showcases || []);
    } catch {
      toast('Failed to load showcases', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShowcases(); }, []);

  const fetchComments = async (id: string) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/showcase/${id}/comments`);
      const data = await res.json();
      if (res.ok) setComments(data.comments || []);
    } catch { /* ignore */ } finally {
      setCommentsLoading(false);
    }
  };

  const handleSelectShowcase = (showcase: Showcase) => {
    setSelectedShowcase(showcase);
    fetchComments(showcase.id);
  };

  const handleSubmitShowcase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, url, description, creatorName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setShowModal(false);
      setTitle(''); setUrl(''); setDescription(''); setCreatorName('');
      toast('✓ Your showcase is live! The community can now review it.', 'success');
      fetchShowcases();
    } catch (err: any) {
      toast(err.message || 'Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShowcase || !authorName.trim() || !commentText.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/showcase/${selectedShowcase.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName, comment: commentText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post');
      setCommentText(''); setAuthorName('');
      toast('✓ Feedback posted!', 'success');
      fetchComments(selectedShowcase.id);
      // Scroll to bottom of comments
      setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      toast(err.message || 'Failed to post comment', 'error');
    } finally {
      setPostingComment(false);
    }
  };

  const handleUpvote = async (showcase: Showcase) => {
    if (upvotedIds.has(showcase.id)) {
      toast('You already upvoted this post!', 'info');
      return;
    }
    // Optimistic update — use Array.from() to avoid Set spread TS error
    const newArr = Array.from(upvotedIds).concat(showcase.id);
    const newUpvoted = new Set(newArr);
    setUpvotedIds(newUpvoted);
    localStorage.setItem('cx_upvoted', JSON.stringify(newArr));
    setShowcases((prev) => prev.map((s) => s.id === showcase.id ? { ...s, upvotes: s.upvotes + 1 } : s));
    if (selectedShowcase?.id === showcase.id) {
      setSelectedShowcase({ ...selectedShowcase, upvotes: selectedShowcase.upvotes + 1 });
    }

    try {
      await fetch('/api/showcase', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: showcase.id, upvotes: showcase.upvotes + 1 }),
      });
    } catch {
      // Revert on failure
      const revertedArr = newArr.filter((id) => id !== showcase.id);
      setUpvotedIds(new Set(revertedArr));
      localStorage.setItem('cx_upvoted', JSON.stringify(revertedArr));
      setShowcases((prev) => prev.map((s) => s.id === showcase.id ? { ...s, upvotes: s.upvotes - 1 } : s));
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-7xl mx-auto w-full z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-border/40 pb-8">
          <div>
            <div className="text-[#1565FE] text-[10px] tracking-widest uppercase mb-2 font-mono">✦ CertXchange network</div>
            <h1 className="font-display text-4xl md:text-5xl text-text uppercase tracking-wider mb-2">Portfolio Showcase</h1>
            <p className="text-xs text-mutedHigh font-mono">
              Share your certifications, resumes, and portfolio links — get community feedback, upvotes, and code reviews.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="self-start px-5 py-3 bg-[#1565FE] hover:bg-[#0D47C9] text-white font-mono text-xs font-bold tracking-widest uppercase rounded-lg transition shadow-lg shadow-[#1565FE]/20"
          >
            + Post Showcase
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: Showcase Feed */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            ) : showcases.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-xl bg-surface">
                <div className="text-4xl mb-4">🏆</div>
                <div className="text-muted text-xs font-mono uppercase mb-2">No showcases yet</div>
                <p className="text-[10px] text-mutedHigh font-mono">Post your portfolio and get community feedback!</p>
              </div>
            ) : (
              showcases.map((s) => {
                const alreadyUpvoted = upvotedIds.has(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectShowcase(s)}
                    className={`border p-5 rounded-xl bg-surface hover:bg-surfaceHigh transition cursor-pointer flex flex-col justify-between ${
                      selectedShowcase?.id === s.id ? 'border-[#1565FE] shadow-lg shadow-[#1565FE]/10' : 'border-border'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] bg-[#1565FE]/10 border border-[#1565FE]/20 px-2 py-0.5 text-[#1565FE] rounded font-mono uppercase tracking-wider">
                          {TYPE_EMOJIS[s.type] || '📋'} {s.type}
                        </span>
                        <span className="text-[9px] text-muted font-mono">{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-display text-lg text-text uppercase tracking-wide mb-2 line-clamp-1">{s.title}</h3>
                      <p className="text-xs text-mutedHigh font-mono line-clamp-2 mb-4 leading-relaxed">{s.description}</p>
                    </div>

                    <div className="flex justify-between items-center border-t border-border/30 pt-3 mt-2">
                      <span className="text-[10px] text-muted font-mono">
                        Posted by: <span className="text-text font-bold">{s.creator_name}</span>
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpvote(s); }}
                        className={`flex items-center gap-1.5 px-3 py-1 border font-mono text-[10px] rounded-lg transition ${
                          alreadyUpvoted
                            ? 'border-[#1565FE]/40 bg-[#1565FE]/10 text-[#1565FE] cursor-default'
                            : 'border-border hover:border-[#1565FE] text-muted hover:text-[#1565FE]'
                        }`}
                      >
                        ▲ {s.upvotes}
                        {alreadyUpvoted && <span className="text-[8px]">✓</span>}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Thread Panel */}
          <div className="lg:col-span-5">
            {selectedShowcase ? (
              <div className="border border-border bg-surface p-6 rounded-xl sticky top-24 space-y-5">
                {/* Selected showcase header */}
                <div className="flex justify-between items-start">
                  <span className="text-[9px] bg-[#1565FE]/10 border border-[#1565FE]/20 px-2 py-0.5 text-[#1565FE] rounded font-mono uppercase tracking-wider font-bold">
                    {TYPE_EMOJIS[selectedShowcase.type] || '📋'} {selectedShowcase.type}
                  </span>
                  <button
                    onClick={() => handleUpvote(selectedShowcase)}
                    className={`flex items-center gap-1 px-2.5 py-1 border font-mono text-[9px] rounded-lg transition ${
                      upvotedIds.has(selectedShowcase.id)
                        ? 'border-[#1565FE]/40 bg-[#1565FE]/10 text-[#1565FE] cursor-default'
                        : 'border-border hover:border-[#1565FE] text-muted hover:text-[#1565FE]'
                    }`}
                  >
                    ▲ {selectedShowcase.upvotes}
                  </button>
                </div>

                <h2 className="font-display text-xl text-text uppercase tracking-wider">{selectedShowcase.title}</h2>
                <p className="text-[10px] text-muted font-mono">Creator: <span className="text-text font-bold">{selectedShowcase.creator_name}</span></p>

                {selectedShowcase.url && (
                  <a href={selectedShowcase.url} target="_blank" rel="noopener noreferrer"
                    className="w-full inline-block text-center py-2.5 bg-[#1565FE] hover:bg-[#0D47C9] text-white font-mono text-xs font-bold tracking-widest uppercase rounded-lg transition">
                    Open Portfolio / Link ↗
                  </a>
                )}

                <p className="text-xs text-mutedHigh font-mono leading-relaxed bg-bg/50 border border-border/40 p-3 rounded-lg whitespace-pre-wrap">
                  {selectedShowcase.description || 'No description provided.'}
                </p>

                {/* Comments list */}
                <div className="border-t border-border/30 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Feedback Wall</div>
                    {!commentsLoading && <div className="text-[9px] text-muted font-mono">{comments.length} comment{comments.length !== 1 ? 's' : ''}</div>}
                  </div>

                  {commentsLoading ? (
                    <div className="font-mono text-[10px] text-muted animate-pulse py-4 text-center">Loading comments…</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-4 text-muted text-[10px] font-mono uppercase">
                      No feedback yet — leave the first comment!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {comments.map((c) => (
                        <div key={c.id} className="p-3 bg-bg/70 border border-border/30 rounded-lg">
                          <div className="flex justify-between items-center mb-1.5 text-[9px] text-muted font-mono">
                            <span className="font-bold text-text">{c.author_name}</span>
                            <span>{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-mutedHigh font-mono leading-relaxed">{c.comment}</p>
                        </div>
                      ))}
                      <div ref={commentEndRef} />
                    </div>
                  )}
                </div>

                {/* Post comment form */}
                <form onSubmit={handlePostComment} className="border-t border-border/30 pt-4 space-y-3">
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your name…"
                    className="w-full font-mono text-[10px] p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg"
                  />
                  <div className="relative">
                    <textarea
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value.slice(0, MAX_COMMENT_CHARS))}
                      placeholder="Leave constructive feedback…"
                      rows={3}
                      className="w-full font-mono text-[10px] p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg resize-none"
                    />
                    <div className={`absolute bottom-2 right-3 text-[8px] font-mono ${commentText.length >= MAX_COMMENT_CHARS * 0.9 ? 'text-orange-400' : 'text-muted'}`}>
                      {commentText.length}/{MAX_COMMENT_CHARS}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={postingComment || !authorName.trim() || !commentText.trim()}
                    className="w-full py-2.5 bg-surfaceHigh hover:bg-[#1565FE] hover:text-white border border-border hover:border-[#1565FE] text-text font-mono text-[9px] font-bold tracking-widest uppercase rounded-lg transition disabled:opacity-40"
                  >
                    {postingComment ? 'Posting…' : '✓ Send Feedback'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="border border-dashed border-border bg-surface p-10 rounded-xl text-center sticky top-24">
                <div className="text-4xl mb-4">💬</div>
                <p className="font-mono text-xs text-muted uppercase tracking-wider">
                  Select a showcase post to read feedback and leave a comment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Post Showcase Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-muted hover:text-text text-lg leading-none">✕</button>

              <div className="text-[#1565FE] text-[9px] tracking-widest uppercase mb-1 font-mono">✦ CertXchange network</div>
              <h2 className="font-display text-2xl text-text uppercase tracking-wider mb-6">Post Portfolio / Resume</h2>

              <form onSubmit={handleSubmitShowcase} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Showcase Title *</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. My Verified Data Science Portfolio"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Type *</label>
                    <select value={type} onChange={(e) => setType(e.target.value)}
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg">
                      <option value="portfolio">🌐 Portfolio website</option>
                      <option value="resume">📄 Resume / CV</option>
                      <option value="linkedin">💼 LinkedIn Profile</option>
                      <option value="certificate">🎓 Special Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Link / URL</label>
                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://myportfolio.com"
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Description / Context</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                    placeholder="Projects, tools used, and what feedback you are looking for."
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg resize-none" />
                </div>

                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">Your Name *</label>
                  <input type="text" required value={creatorName} onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="e.g. Shivam Gawade"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-[#1565FE] text-text outline-none rounded-lg" />
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full py-3 bg-[#1565FE] hover:bg-[#0D47C9] disabled:opacity-50 text-white text-xs font-bold tracking-widest uppercase rounded-lg transition mt-2">
                  {submitting ? 'Posting…' : '✓ Post to Feedback Wall'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
