"use client";

import { Fragment, useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import Skeleton from "@/components/Skeleton";

interface ProjectRequest {
  id: number;
  project_name: string;
  description: string;
  tech_stack: string;
  status: string;
  created_at: string;
  rating?: number | null;
  review_content?: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  accepted: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  testing: "bg-purple-500/10 text-purple-400",
  completed: "bg-cyan-500/10 text-cyan-400",
  delivered: "bg-emerald-500/10 text-emerald-400",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  in_progress: "In Progress",
  testing: "Testing",
  completed: "Completed",
  delivered: "Delivered",
};

interface ReviewModalProps {
  request: ProjectRequest;
  onClose: () => void;
  onSuccess: (rating: number, content: string) => void;
}

function ReviewModal({ request, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(request.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState(request.review_content || "");
  const [isEditing, setIsEditing] = useState(!request.rating);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRating(request.rating || 0);
    setContent(request.review_content || "");
    setIsEditing(!request.rating);
  }, [request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating");
      return;
    }
    if (!content.trim()) {
      setError("Please write a review comment");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/project-requests/${request.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, content }),
      });
      if (res.ok) {
        onSuccess(rating, content);
        setIsEditing(false);
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit review");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div 
        className="glass-strong w-full max-w-md rounded-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {request.rating ? "Project Review" : "Add Project Review"}
          </h3>
          <button 
            onClick={onClose} 
            className="text-zinc-500 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-zinc-300">{request.project_name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Please rate your experience with this delivered project.</p>
            </div>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => {
                const starVal = i + 1;
                const isActive = starVal <= (hoveredRating || rating);
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoveredRating(starVal)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-zinc-600 transition-colors hover:text-cyan-400 focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 transition-all ${
                        isActive ? "fill-cyan-400 text-cyan-400 scale-110" : "text-zinc-600"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Your Feedback</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="How was the project? What did you like about the developer's work?"
                className="glass w-full resize-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              {request.rating && (
                <button
                  type="button"
                  onClick={() => {
                    setRating(request.rating || 0);
                    setContent(request.review_content || "");
                    setIsEditing(false);
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saving..." : request.rating ? "Save Changes" : "Submit Review"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-zinc-300">{request.project_name}</p>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < (request.rating || 0)
                      ? "fill-cyan-400 text-cyan-400"
                      : "text-zinc-700"
                  }`}
                />
              ))}
            </div>

            <div>
              <p className="text-xs text-zinc-500">Your Feedback</p>
              <p className="mt-1.5 text-xs text-zinc-300 italic leading-relaxed bg-white/2 rounded-xl p-4 border border-white/5 whitespace-pre-wrap">
                &ldquo;{request.review_content}&rdquo;
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
              >
                Edit Review
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DetailsModalProps {
  request: ProjectRequest;
  onClose: () => void;
}

function DetailsModal({ request, onClose }: DetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div 
        className="glass-strong w-full max-w-md rounded-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Project Details</h3>
          <button 
            onClick={onClose} 
            className="text-zinc-500 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-500">Project Name</p>
            <p className="mt-1 text-sm font-semibold text-white">{request.project_name}</p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">Description</p>
            <p className="mt-1.5 text-xs text-zinc-300 whitespace-pre-wrap bg-white/2 rounded-xl p-4 border border-white/5 leading-relaxed">
              {request.description}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">Tech Stack</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {request.tech_stack
                ? request.tech_stack.split(",").map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400"
                    >
                      {t.trim()}
                    </span>
                  ))
                : <span className="text-xs text-zinc-500">-</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div>
              <p className="text-xs text-zinc-500">Submitted Date</p>
              <p className="mt-1 text-xs text-white">
                {new Date(request.created_at + "Z").toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Current Status</p>
              <p className="mt-1">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                  statusColors[request.status] || "bg-zinc-500/10 text-zinc-400"
                }`}>
                  {statusLabels[request.status] || request.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientProjectRequests() {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewRequest, setActiveReviewRequest] = useState<ProjectRequest | null>(null);
  const [activeDetailsRequest, setActiveDetailsRequest] = useState<ProjectRequest | null>(null);

  useEffect(() => {
    fetch("/api/project-requests")
      .then((r) => r.json())
      .then((d) => { setRequests(d.requests); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="px-6 py-24">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="mt-8">
          <div className="glass rounded-2xl border border-white/5 p-5 space-y-4">
            <div className="flex gap-8 border-b border-white/5 pb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-8">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-24">
      <div>
        <h1 className="text-2xl font-bold text-white">My Project Requests</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Track the status of your submitted project requests.
        </p>
      </div>

      <div className="mt-8">
        {requests.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 glass rounded-2xl">
            <p>You haven&apos;t submitted any project requests yet.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Start a conversation with the developer and use the file icon to submit a request.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl glass border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Tech Stack</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                {requests.map((req) => {
                  const techList = req.tech_stack
                    ? req.tech_stack.split(",").map((t) => t.trim())
                    : [];
                  return (
                    <tr 
                      key={req.id}
                      className="hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setActiveDetailsRequest(req)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{req.project_name}</div>
                        <div className="text-xs text-zinc-500 line-clamp-1 max-w-xs">{req.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        {techList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {techList.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {new Date(req.created_at + "Z").toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusColors[req.status] || "bg-zinc-500/10 text-zinc-400"}`}>
                          {statusLabels[req.status] || req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === "delivered" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReviewRequest(req);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            {req.rating ? "View Review" : "Write Review"}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDetailsRequest(req);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeReviewRequest && (
        <ReviewModal
          request={activeReviewRequest}
          onClose={() => setActiveReviewRequest(null)}
          onSuccess={(rating, content) => {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === activeReviewRequest.id
                  ? { ...r, rating, review_content: content }
                  : r
              )
            );
            setActiveReviewRequest((prev) => prev ? { ...prev, rating, review_content: content } : null);
          }}
        />
      )}

      {activeDetailsRequest && (
        <DetailsModal
          request={activeDetailsRequest}
          onClose={() => setActiveDetailsRequest(null)}
        />
      )}
    </div>
  );
}
