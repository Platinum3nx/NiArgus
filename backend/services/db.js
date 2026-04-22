import { createClient } from "@supabase/supabase-js";

const REVIEW_LEASE_SECONDS = 15 * 60;
const MAX_REVIEW_ATTEMPTS = 3;

let _supabase;

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function supabase() {
  if (!_supabase) {
    _supabase = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _supabase;
}

function asSingleRow(data) {
  return Array.isArray(data) ? data[0] ?? null : data ?? null;
}

function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1000).toISOString();
}

function getRetryDelayMinutes(attemptCount) {
  return Math.min(2 ** Math.max(attemptCount - 1, 0), 30);
}

// ── Installations ───────────────────────────────────────────────────────

export async function getInstallation(githubInstallationId) {
  const { data, error } = await supabase()
    .from("installations")
    .select("*")
    .eq("github_installation_id", githubInstallationId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function upsertInstallation({
  githubInstallationId,
  githubAccountLogin,
  githubAccountType,
}) {
  const { data, error } = await supabase()
    .from("installations")
    .upsert(
      {
        github_installation_id: githubInstallationId,
        github_account_login: githubAccountLogin,
        github_account_type: githubAccountType,
      },
      { onConflict: "github_installation_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const createInstallation = upsertInstallation;

export async function listInstallationIds() {
  const { data, error } = await supabase()
    .from("installations")
    .select("id");

  if (error) throw error;
  return (data || []).map((installation) => installation.id);
}

// ── Repos ───────────────────────────────────────────────────────────────

export async function getRepoByGithubId(githubRepoId) {
  const { data, error } = await supabase()
    .from("repos")
    .select("*")
    .eq("github_repo_id", githubRepoId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getRepoByFullName(fullName) {
  const { data, error } = await supabase()
    .from("repos")
    .select("*")
    .eq("full_name", fullName)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function upsertRepo({
  installationId,
  githubRepoId,
  fullName,
  isEnabled,
}) {
  const payload = {
    installation_id: installationId,
    github_repo_id: githubRepoId,
    full_name: fullName,
  };

  if (typeof isEnabled === "boolean") {
    payload.is_enabled = isEnabled;
  }

  const { data, error } = await supabase()
    .from("repos")
    .upsert(payload, { onConflict: "github_repo_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const createRepo = upsertRepo;

export async function updateRepoNiaSource(repoId, niaSourceId) {
  const { data, error } = await supabase()
    .from("repos")
    .update({
      nia_source_id: niaSourceId,
      last_indexed_at: new Date().toISOString(),
    })
    .eq("id", repoId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setRepoEnabledByGithubId(githubRepoId, isEnabled, fullName) {
  const updates = {
    is_enabled: isEnabled,
  };

  if (fullName) {
    updates.full_name = fullName;
  }

  const { data, error } = await supabase()
    .from("repos")
    .update(updates)
    .eq("github_repo_id", githubRepoId)
    .select()
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// ── Review Jobs ─────────────────────────────────────────────────────────

export async function enqueueReviewJob({
  repoId,
  prNumber,
  headSha,
  prTitle,
  prAuthor,
}) {
  const { data, error } = await supabase().rpc("enqueue_review_job", {
    p_repo_id: repoId,
    p_pr_number: prNumber,
    p_head_sha: headSha,
    p_pr_title: prTitle,
    p_pr_author: prAuthor,
  });

  if (error) throw error;

  const row = asSingleRow(data);
  if (!row) {
    throw new Error(`Failed to enqueue review job for repo ${repoId} PR #${prNumber}`);
  }

  return {
    reviewId: row.review_id,
    status: row.status,
    wasInserted: row.was_inserted,
    supersededCount: Number(row.superseded_count ?? 0),
  };
}

export async function claimNextReviewJob(installationId) {
  const { data, error } = await supabase().rpc("claim_next_review_job", {
    p_installation_id: installationId,
    p_lease_seconds: REVIEW_LEASE_SECONDS,
  });

  if (error) throw error;

  const row = asSingleRow(data);
  if (!row) {
    return null;
  }

  if (!row.review_id) {
    return {
      reviewId: null,
      installationId: row.installation_id,
      reason: row.reason,
      monthlyUsed: Number(row.monthly_used ?? 0),
      hourlyUsed: Number(row.hourly_used ?? 0),
    };
  }

  return {
    reviewId: row.review_id,
    installationId: row.installation_id,
    repoId: row.repo_id,
    githubRepoId: Number(row.github_repo_id),
    repoFullName: row.repo_full_name,
    niaSourceId: row.nia_source_id,
    githubInstallationId: Number(row.github_installation_id),
    prNumber: row.pr_number,
    headSha: row.head_sha,
    githubCommentId: row.github_comment_id ? Number(row.github_comment_id) : null,
    attemptCount: Number(row.attempt_count ?? 0),
    monthlyUsed: Number(row.monthly_used ?? 0),
    hourlyUsed: Number(row.hourly_used ?? 0),
    reason: row.reason,
  };
}

export async function getReviewJobById(reviewId) {
  const { data, error } = await supabase()
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function setReviewCommentId(reviewId, githubCommentId) {
  const { data, error } = await supabase()
    .from("reviews")
    .update({
      github_comment_id: githubCommentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function renewReviewJobLease(reviewId, leaseSeconds = REVIEW_LEASE_SECONDS) {
  const { data, error } = await supabase()
    .from("reviews")
    .update({
      lease_expires_at: addSeconds(new Date(), leaseSeconds),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("status", "processing")
    .select()
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function completeReviewJob(
  reviewId,
  {
    prTitle,
    prAuthor,
    reviewBody,
    filesChanged,
    contextFilesUsed,
    githubCommentId,
  }
) {
  const now = new Date().toISOString();
  const { data, error } = await supabase()
    .from("reviews")
    .update({
      pr_title: prTitle,
      pr_author: prAuthor,
      review_body: reviewBody,
      files_changed: filesChanged,
      context_files_used: contextFilesUsed,
      github_comment_id: githubCommentId,
      status: "completed",
      completed_at: now,
      lease_expires_at: null,
      last_error: null,
      failed_at: null,
      next_attempt_at: null,
      updated_at: now,
    })
    .eq("id", reviewId)
    .eq("status", "processing")
    .select()
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

export async function markReviewJobErrored(
  reviewId,
  errorMessage,
  maxAttempts = MAX_REVIEW_ATTEMPTS
) {
  const current = await getReviewJobById(reviewId);
  if (!current) {
    return null;
  }

  if (current.status !== "processing") {
    return current;
  }

  const attemptCount = Number(current.attempt_count ?? 0);
  const now = new Date();
  const retryable = attemptCount < maxAttempts;
  const updates = retryable
    ? {
        status: "queued",
        last_error: errorMessage,
        next_attempt_at: new Date(
          now.getTime() + getRetryDelayMinutes(attemptCount) * 60 * 1000
        ).toISOString(),
        lease_expires_at: null,
        failed_at: null,
        updated_at: now.toISOString(),
      }
    : {
        status: "failed",
        last_error: errorMessage,
        next_attempt_at: null,
        lease_expires_at: null,
        failed_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

  const { data, error } = await supabase()
    .from("reviews")
    .update(updates)
    .eq("id", reviewId)
    .eq("status", "processing")
    .select()
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ?? getReviewJobById(reviewId);
}

export async function markReviewJobSuperseded(reviewId, reason) {
  const { data, error } = await supabase()
    .from("reviews")
    .update({
      status: "superseded",
      superseded_at: new Date().toISOString(),
      lease_expires_at: null,
      next_attempt_at: null,
      last_error: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .in("status", ["queued", "processing", "failed"])
    .select()
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ?? getReviewJobById(reviewId);
}

// ── Reporting ───────────────────────────────────────────────────────────

export async function getReviewsByInstallation(githubInstallationId) {
  const { data, error } = await supabase()
    .from("reviews")
    .select("*, repos!inner(*, installations!inner(*))")
    .eq("repos.installations.github_installation_id", githubInstallationId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}
