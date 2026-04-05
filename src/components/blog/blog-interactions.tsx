"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { RelativeTime } from "@/components/shared/relative-time";

declare global {
  interface Window {
    __cybernoirFeedbackTimer?: number;
  }
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  canEdit?: boolean;
  likesCount: number;
  reportsCount: number;
  liked: boolean;
  reported: boolean;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

interface BlogInteractionsProps {
  blogId: string;
  initialCounts: { comments: number; likes: number; bookmarks: number };
  initialComments: CommentItem[];
  initialState: { liked: boolean; bookmarked: boolean };
  canInteract: boolean;
}

interface CommentNode extends CommentItem {
  replies: CommentNode[];
}

interface FeedbackState {
  kind: string;
  message: string;
  emoji: string;
}

interface CommentActionButtonProps {
  active?: boolean;
  tone?: "default" | "pink" | "red";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

function CommentActionButton({ active, tone = "default", disabled, onClick, children }: CommentActionButtonProps) {
  const toneClass =
    tone === "pink"
      ? active
        ? "border-pink-400/50 bg-pink-500/10 text-pink-300"
        : "border-border text-white/90 hover:border-pink-400/40 hover:text-pink-200"
      : tone === "red"
        ? active
          ? "border-danger/50 bg-danger/10 text-danger"
          : "border-border text-white/90 hover:border-danger/40 hover:text-danger"
        : active
          ? "border-white/30 bg-white/8 text-white"
          : "border-border text-white/90 hover:border-white/25 hover:text-white";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${active ? "animate-reaction-pulse" : ""} ${toneClass}`}
    >
      {children}
    </button>
  );
}

function buildTree(items: CommentItem[]) {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const item of items) {
    byId.set(item.id, { ...item, replies: [] });
  }

  for (const item of byId.values()) {
    if (item.parentId && byId.has(item.parentId)) {
      byId.get(item.parentId)!.replies.push(item);
    } else {
      roots.push(item);
    }
  }

  return roots;
}

export function BlogInteractions({ blogId, initialCounts, initialComments, initialState, canInteract }: BlogInteractionsProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [liked, setLiked] = useState(initialState.liked);
  const [bookmarked, setBookmarked] = useState(initialState.bookmarked);
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [comment, setComment] = useState("");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isPending, startTransition] = useTransition();
  const commentTree = useMemo(() => buildTree(comments), [comments]);

  function flashFeedback(nextFeedback: FeedbackState) {
    setFeedback(nextFeedback);
    window.clearTimeout(window.__cybernoirFeedbackTimer);
    window.__cybernoirFeedbackTimer = window.setTimeout(() => setFeedback(null), 1800);
  }

  async function toggle(endpoint: "like" | "bookmark") {
    if (!canInteract) {
      window.location.href = "/login";
      return;
    }

    setError("");
    const res = await fetch(`/api/blogs/${blogId}/${endpoint}`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    if (data.disabled) {
      setError(`${endpoint === "like" ? "Likes" : "Bookmarks"} are not enabled in Supabase yet. Run the latest schema.sql update.`);
      return;
    }

    setCounts(data.counts);
    if (endpoint === "like") {
      setLiked(data.liked);
      flashFeedback({ kind: "like", message: data.liked ? "Post liked" : "Like removed", emoji: "\u2764\uFE0F" });
    } else {
      setBookmarked(data.bookmarked);
      flashFeedback({ kind: "bookmark", message: data.bookmarked ? "Saved to bookmarks" : "Bookmark removed", emoji: "\uD83D\DD16" });
    }
  }

  async function submitComment() {
    if (!canInteract) {
      window.location.href = "/login";
      return;
    }

    const value = comment.trim();
    if (!value) return;

    setError("");
    const res = await fetch(`/api/blogs/${blogId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: value, parentCommentId: replyTarget }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to add comment");
      return;
    }

    setComment("");
    setReplyTarget(null);
    setCounts(data.counts);
    setComments((prev) => [...prev, data.comment]);
    flashFeedback({ kind: "comment", message: replyTarget ? "Reply posted" : "Comment posted", emoji: "\uD83D\DCAC" });
  }

  async function saveComment(commentId: string) {
    const value = editingValue.trim();
    if (!value) return;

    const res = await fetch(`/api/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: value }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to update comment");
      return;
    }

    setComments((prev) => prev.map((item) => (item.id === commentId ? { ...item, ...data.comment, liked: item.liked, reported: item.reported } : item)));
    setEditingId(null);
    setEditingValue("");
  }

  async function removeComment(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to delete comment");
      return;
    }

    const removeIds = new Set<string>();
    const queue = [commentId];
    while (queue.length > 0) {
      const current = queue.pop()!;
      removeIds.add(current);
      comments.filter((item) => item.parentId === current).forEach((item) => queue.push(item.id));
    }
    setComments((prev) => prev.filter((item) => !removeIds.has(item.id)));
    setCounts((prev) => ({ ...prev, comments: Math.max(0, prev.comments - removeIds.size) }));
  }

  async function toggleCommentLike(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to like comment");
      return;
    }

    if (data.disabled) {
      setError("Comment likes are not enabled in Supabase yet. Run the latest schema.sql update.");
      return;
    }

    setComments((prev) => prev.map((item) => item.id === commentId ? { ...item, liked: data.liked, likesCount: data.likesCount } : item));
    flashFeedback({ kind: "like", message: data.liked ? "Comment liked" : "Comment like removed", emoji: "\u2764\uFE0F" });
  }

  async function reportComment(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Inappropriate" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to report comment");
      return;
    }

    if (data.disabled) {
      setError("Comment reports are not enabled in Supabase yet. Run the latest schema.sql update.");
      return;
    }

    setComments((prev) => prev.map((item) => item.id === commentId ? { ...item, reported: true, reportsCount: data.reportsCount } : item));
    flashFeedback({ kind: "report", message: "Comment reported for review", emoji: "\u26A0\uFE0F" });
  }

  function renderComment(item: CommentNode, depth = 0): React.ReactNode {
    return (
      <div key={item.id} className={`space-y-3 rounded-xl border border-border bg-surface/60 p-4 ${depth > 0 ? "ml-4 bg-surface-raised/35 sm:ml-8" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-accent/20 bg-accent/10">
              {item.user.avatar ? (
                <Image src={item.user.avatar} alt={item.user.username} fill unoptimized className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-xs text-accent">
                  {item.user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.user.username}</p>
              <p className="font-mono text-[11px] text-muted"><RelativeTime value={item.createdAt} /></p>
            </div>
          </div>
        </div>
        {editingId === item.id ? (
          <div className="space-y-3">
            <textarea rows={3} value={editingValue} onChange={(event) => setEditingValue(event.target.value)} className="input-field resize-y" />
            <div className="flex gap-2">
              <button type="button" onClick={() => startTransition(() => void saveComment(item.id))} className="btn-primary font-mono text-xs">Save</button>
              <button type="button" onClick={() => { setEditingId(null); setEditingValue(""); }} className="btn-outline font-mono text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted">{item.content}</p>
        )}
        <div className="flex flex-wrap gap-2 font-mono text-[11px]">
          <CommentActionButton active={item.liked} tone="pink" onClick={() => startTransition(() => void toggleCommentLike(item.id))}>
            Like {item.likesCount}
          </CommentActionButton>
          <CommentActionButton active={replyTarget === item.id} tone="default" onClick={() => setReplyTarget(item.id)}>
            Reply
          </CommentActionButton>
          {!item.reported ? (
            <CommentActionButton tone="red" onClick={() => startTransition(() => void reportComment(item.id))}>
              Report
            </CommentActionButton>
          ) : (
            <span className="rounded-full border border-warning/30 px-3 py-1 text-warning">Reported</span>
          )}
          {item.canEdit ? (
            <CommentActionButton tone="default" onClick={() => { setEditingId(item.id); setEditingValue(item.content); }}>
              Edit
            </CommentActionButton>
          ) : null}
          {item.canEdit ? (
            <CommentActionButton tone="red" onClick={() => startTransition(() => void removeComment(item.id))}>
              Delete
            </CommentActionButton>
          ) : null}
        </div>
        {item.replies.length > 0 ? <div className="space-y-3 pl-4">{item.replies.map((reply) => renderComment(reply, depth + 1))}</div> : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {feedback ? (
        <div className="animate-feedback-pop rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">{feedback.emoji}</span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{feedback.kind}</p>
              <p className="text-sm font-medium text-foreground">{feedback.message}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => startTransition(() => void toggle("like"))} className={`rounded-xl border px-4 py-4 text-left transition-all ${liked ? "animate-reaction-pulse border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-border-hover hover:text-foreground"}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em]">Reaction</p>
            <span className="text-lg">{liked ? "\u2764\uFE0F" : "\u2661"}</span>
          </div>
          <p className="mt-2 text-lg font-semibold">{liked ? "Liked" : "Like"}</p>
          <p className="mt-1 font-mono text-xs">{counts.likes} total likes</p>
        </button>
        <button type="button" onClick={() => startTransition(() => void toggle("bookmark"))} className={`rounded-xl border px-4 py-4 text-left transition-all ${bookmarked ? "animate-reaction-pulse border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-border-hover hover:text-foreground"}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em]">Save</p>
            <span className="text-lg">{bookmarked ? "\uD83D\uDD16" : "\uD83D\uDCD1"}</span>
          </div>
          <p className="mt-2 text-lg font-semibold">{bookmarked ? "Bookmarked" : "Bookmark"}</p>
          <p className="mt-1 font-mono text-xs">{counts.bookmarks} saved by readers</p>
        </button>
        <div className={`rounded-xl border px-4 py-4 text-left text-muted transition-all ${feedback?.kind === "comment" ? "animate-reaction-pulse border-accent/40 bg-accent/5" : "border-border"}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em]">Discussion</p>
            <span className="text-lg">\uD83D\uDCAC</span>
          </div>
          <p className="mt-2 text-lg font-semibold text-foreground">{counts.comments}</p>
          <p className="mt-1 font-mono text-xs">comments and replies on this post</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex flex-col gap-3">
          {replyTarget ? <p className="font-mono text-xs text-accent">Reply mode is active <button type="button" onClick={() => setReplyTarget(null)} className="ml-2 text-muted">Cancel</button></p> : null}
          <textarea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} placeholder={canInteract ? (replyTarget ? "Write a reply..." : "Write a comment...") : "Login to join the discussion"} disabled={!canInteract || isPending} className="input-field resize-y" />
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-muted">{canInteract ? "Comments and replies appear instantly." : "Sign in to like, bookmark, and comment."}</span>
            <button type="button" onClick={() => startTransition(() => void submitComment())} disabled={!canInteract || isPending || !comment.trim()} className="btn-primary font-mono text-xs disabled:cursor-not-allowed disabled:opacity-50">
              {isPending ? "Working..." : replyTarget ? "Post Reply" : "Post Comment"}
            </button>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </div>

      {commentTree.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Reader discussion</h3>
            <span className="font-mono text-xs text-muted">{comments.length} total messages</span>
          </div>
          {commentTree.map((item) => renderComment(item))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center">
          <p className="font-mono text-sm text-muted">No comments yet.</p>
          <p className="mt-2 text-xs text-muted-foreground">Be the first reader to start the discussion.</p>
        </div>
      )}
    </div>
  );
}
