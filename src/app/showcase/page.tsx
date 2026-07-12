'use client';

import { useEffect, useState } from 'react';
import NavBar from '@/components/layout/NavBar';

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

export default function ShowcasePage() {
  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShowcase, setSelectedShowcase] = useState<Showcase | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState('portfolio');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Comment states
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const fetchShowcases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/showcase');
      const data = await res.json();
      if (res.ok) {
        setShowcases(data.showcases);
      }
    } catch {
      // err
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowcases();
  }, []);

  const fetchComments = async (id: string) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/showcase/${id}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments);
      }
    } catch {
      // err
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSelectShowcase = (showcase: Showcase) => {
    setSelectedShowcase(showcase);
    fetchComments(showcase.id);
  };

  const handleSubmitShowcase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, url, description, creatorName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit showcase');

      setShowModal(false);
      setTitle('');
      setUrl('');
      setDescription('');
      setCreatorName('');
      fetchShowcases();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShowcase || !authorName.trim() || !commentText.trim()) return;
    setCommentError(null);

    try {
      const res = await fetch(`/api/showcase/${selectedShowcase.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName, comment: commentText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post comment');

      setCommentText('');
      setAuthorName('');
      fetchComments(selectedShowcase.id);
    } catch (err: any) {
      setCommentError(err.message);
    }
  };

  const handleUpvote = async (showcase: Showcase) => {
    try {
      const res = await fetch('/api/showcase', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: showcase.id, upvotes: showcase.upvotes + 1 }),
      });

      if (res.ok) {
        setShowcases(
          showcases.map((s) => (s.id === showcase.id ? { ...s, upvotes: s.upvotes + 1 } : s))
        );
        if (selectedShowcase && selectedShowcase.id === showcase.id) {
          setSelectedShowcase({ ...selectedShowcase, upvotes: selectedShowcase.upvotes + 1 });
        }
      }
    } catch {
      // err
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-7xl mx-auto w-full z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-border/40 pb-8">
          <div>
            <div className="text-accent text-[10px] tracking-widest uppercase mb-2">✦ CertXchange network</div>
            <h1 className="font-display text-4xl md:text-5xl text-text uppercase tracking-wider mb-2">
              PORTFOLIO SHOWCASE
            </h1>
            <p className="text-xs text-mutedHigh">
              Share your new certifications, resumes, and portfolio links for community feedback and code verification.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="self-start px-5 py-3 bg-accent hover:bg-accentH text-black font-mono text-xs font-bold tracking-widest uppercase rounded-lg transition"
          >
            + Post Showcase
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Showcase Feed */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <div className="text-center py-20 font-mono text-xs text-muted">Loading showcases…</div>
            ) : showcases.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-lg bg-surface">
                <div className="text-muted text-xs font-mono uppercase">No showcases posted yet</div>
              </div>
            ) : (
              showcases.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectShowcase(s)}
                  className={`border p-5 rounded-lg bg-surface hover:bg-surfaceHigh transition cursor-pointer flex flex-col justify-between ${
                    selectedShowcase?.id === s.id ? 'border-accent' : 'border-border'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] bg-accent/10 border border-accent/20 px-2 py-0.5 text-accent rounded font-mono uppercase tracking-wider">
                        {s.type}
                      </span>
                      <span className="text-[9px] text-muted font-mono">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-display text-lg text-text uppercase tracking-wide mb-2 line-clamp-1">
                      {s.title}
                    </h3>
                    <p className="text-xs text-mutedHigh font-mono line-clamp-2 mb-4 leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-border/30 pt-3 mt-2">
                    <span className="text-[10px] text-muted">Posted by: <span className="text-text font-bold font-mono">{s.creator_name}</span></span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpvote(s);
                      }}
                      className="px-3 py-1 border border-border hover:border-accent bg-bg text-[10px] font-mono text-text hover:text-accent rounded transition"
                    >
                      ▲ Upvote ({s.upvotes})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right panel: Comment thread details */}
          <div className="lg:col-span-5">
            {selectedShowcase ? (
              <div className="border border-border bg-surface p-6 rounded-lg sticky top-24 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] bg-accent/10 border border-accent/20 px-2 py-0.5 text-accent rounded font-mono uppercase font-bold tracking-wider">
                      {selectedShowcase.type}
                    </span>
                    <button
                      onClick={() => handleUpvote(selectedShowcase)}
                      className="px-2.5 py-1 border border-border hover:border-accent text-[9px] font-mono text-text hover:text-accent rounded transition"
                    >
                      ▲ Upvote ({selectedShowcase.upvotes})
                    </button>
                  </div>
                  <h2 className="font-display text-xl text-text uppercase tracking-wider mb-2">
                    {selectedShowcase.title}
                  </h2>
                  <p className="text-[10px] text-muted mb-4 font-mono">Creator: {selectedShowcase.creator_name}</p>
                  
                  {selectedShowcase.url && (
                    <a
                      href={selectedShowcase.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-block text-center py-2.5 bg-accent hover:bg-accentH text-black font-mono text-xs font-bold tracking-widest uppercase rounded transition mb-4"
                    >
                      Open Link / Portfolio ↗
                    </a>
                  )}

                  <p className="text-xs text-mutedHigh font-mono leading-relaxed bg-bg/50 border border-border/40 p-4 rounded whitespace-pre-wrap">
                    {selectedShowcase.description}
                  </p>
                </div>

                {/* Comment wall list */}
                <div className="border-t border-border/30 pt-4 space-y-4">
                  <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Feedback Wall</div>

                  {commentsLoading ? (
                    <div className="font-mono text-[10px] text-muted animate-pulse">Loading comments…</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-4 text-muted text-[10px] font-mono uppercase">No comments yet. Leave some feedback!</div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {comments.map((comm) => (
                        <div key={comm.id} className="p-3 bg-bg/70 border border-border/30 rounded-lg">
                          <div className="flex justify-between items-center mb-1 text-[9px] text-muted">
                            <span className="font-bold text-text">{comm.author_name}</span>
                            <span>{new Date(comm.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-mutedHigh font-mono leading-relaxed">{comm.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post comment form */}
                <form onSubmit={handlePostComment} className="border-t border-border/30 pt-4 space-y-3">
                  {commentError && <div className="text-err text-[9px] font-mono">⚠ {commentError}</div>}
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Your Name"
                      className="col-span-1 font-mono text-[10px] p-2 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    />
                    <input
                      type="text"
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Leave constructive feedback…"
                      className="col-span-2 font-mono text-[10px] p-2 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-surfaceHigh hover:bg-accent hover:text-black border border-border hover:border-accent text-text font-mono text-[9px] font-bold tracking-widest uppercase rounded transition"
                  >
                    ✓ Send Feedback
                  </button>
                </form>
              </div>
            ) : (
              <div className="border border-border border-dashed bg-surface p-10 rounded-lg text-center sticky top-24 font-mono text-xs text-muted uppercase">
                Select a showcase post to read feedback threads.
              </div>
            )}
          </div>
        </div>

        {/* Post Showcase Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-muted hover:text-text text-lg"
              >
                ✕
              </button>

              <h2 className="font-display text-2xl text-text uppercase tracking-wider mb-6">
                Post Portfolio / Resume
              </h2>

              {error && (
                <div className="mb-4 p-3 border border-err/30 bg-err/5 text-err text-xs font-mono rounded">
                  ⚠ {error}
                </div>
              )}

              <form onSubmit={handleSubmitShowcase} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                    Showcase Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. My Verified Data Science Portfolio"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                      Type *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    >
                      <option value="portfolio">Portfolio website</option>
                      <option value="resume">Resume / CV</option>
                      <option value="linkedin">LinkedIn Profile</option>
                      <option value="certificate">Special Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                      Link / URL
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://myportfolio.com"
                      className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                    Description / Context
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Provide details about your projects, tools used, and what feedback you are looking for."
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-muted tracking-widest uppercase mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="e.g. Shivam Gawade"
                    className="w-full font-mono text-xs p-2.5 bg-bg border border-border focus:border-accent text-text outline-none rounded"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-accent hover:bg-accentH text-black text-xs font-bold tracking-widest uppercase rounded transition mt-4"
                >
                  ✓ Post to Feedback Wall
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
