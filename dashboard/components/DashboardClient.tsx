"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/lib/auth";

interface Repo {
  id: string;
  full_name: string;
  is_enabled: boolean;
  nia_source_id: string | null;
  last_indexed_at: string | null;
}

interface Review {
  id: string;
  created_at: string;
  pr_number: number;
  pr_title: string;
  pr_author: string;
  review_body: string;
  files_changed: number;
  context_files_used: number;
  repos: Repo;
}

export default function DashboardClient({ session }: { session: Session }) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        setRepos(data.repos || []);
        setReviews(data.reviews || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalReviews = reviews.length;
  const avgIssues =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => {
            const matches = r.review_body.match(/🔴|🟡/g);
            return sum + (matches?.length || 0);
          }, 0) / reviews.length
        ).toFixed(1)
      : "0";

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold">NiArgus Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Logged in as {session.login}
          </p>
        </div>
        {session.avatar && (
          <img
            src={session.avatar}
            alt={session.login}
            className="w-10 h-10 rounded-full border border-zinc-700"
          />
        )}
      </div>

      {loading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="text-2xl font-bold">{totalReviews}</div>
              <div className="text-zinc-400 text-sm">Total reviews</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="text-2xl font-bold">{repos.length}</div>
              <div className="text-zinc-400 text-sm">Repos connected</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="text-2xl font-bold">{avgIssues}</div>
              <div className="text-zinc-400 text-sm">Avg issues per PR</div>
            </div>
          </div>

          {/* Repos */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Repos</h2>
            {repos.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No repos connected yet. Install NiArgus on GitHub to get
                started.
              </p>
            ) : (
              <div className="space-y-2">
                {repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3"
                  >
                    <div>
                      <span className="font-medium">{repo.full_name}</span>
                      {repo.nia_source_id && (
                        <span className="ml-2 text-xs text-emerald-400">
                          indexed
                        </span>
                      )}
                      {!repo.nia_source_id && (
                        <span className="ml-2 text-xs text-yellow-400">
                          indexing...
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        repo.is_enabled ? "bg-emerald-400" : "bg-zinc-600"
                      }`}
                      title={repo.is_enabled ? "Enabled" : "Disabled"}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Recent Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No reviews yet. Open a PR on a connected repo to trigger a
                review.
              </p>
            ) : (
              <div className="space-y-2">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/30"
                  >
                    <button
                      onClick={() =>
                        setExpandedReview(
                          expandedReview === review.id ? null : review.id
                        )
                      }
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">
                          {review.pr_title}
                        </span>
                        <span className="text-zinc-400 text-sm">
                          {review.repos?.full_name} #{review.pr_number} by{" "}
                          {review.pr_author}
                        </span>
                      </div>
                      <div className="text-zinc-500 text-sm ml-4 shrink-0">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </button>
                    {expandedReview === review.id && (
                      <div className="px-4 pb-4 border-t border-zinc-800">
                        <pre className="mt-3 text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                          {review.review_body}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
