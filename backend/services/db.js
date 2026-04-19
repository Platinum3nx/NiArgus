import { createClient } from "@supabase/supabase-js";

let _supabase;

export function supabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _supabase;
}

// ── Installations ───────────────────────────────────────────────────────

export async function getInstallation(githubInstallationId) {
  const { data, error } = await supabase()
    .from("installations")
    .select("*")
    .eq("github_installation_id", githubInstallationId)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data;
}

export async function createInstallation({
  githubInstallationId,
  githubAccountLogin,
  githubAccountType,
}) {
  const { data, error } = await supabase()
    .from("installations")
    .insert({
      github_installation_id: githubInstallationId,
      github_account_login: githubAccountLogin,
      github_account_type: githubAccountType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
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

export async function createRepo({ installationId, githubRepoId, fullName }) {
  const { data, error } = await supabase()
    .from("repos")
    .insert({
      installation_id: installationId,
      github_repo_id: githubRepoId,
      full_name: fullName,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

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

export async function deleteRepoByGithubId(githubRepoId) {
  const { error } = await supabase()
    .from("repos")
    .delete()
    .eq("github_repo_id", githubRepoId);

  if (error) throw error;
}

// ── Reviews ─────────────────────────────────────────────────────────────

export async function saveReview({
  repoId,
  prNumber,
  prTitle,
  prAuthor,
  reviewBody,
  filesChanged,
  contextFilesUsed,
  githubCommentId,
}) {
  const { data, error } = await supabase()
    .from("reviews")
    .insert({
      repo_id: repoId,
      pr_number: prNumber,
      pr_title: prTitle,
      pr_author: prAuthor,
      review_body: reviewBody,
      files_changed: filesChanged,
      context_files_used: contextFilesUsed,
      github_comment_id: githubCommentId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReviewsByInstallation(githubInstallationId) {
  const { data, error } = await supabase()
    .from("reviews")
    .select("*, repos!inner(*, installations!inner(*))")
    .eq("repos.installations.github_installation_id", githubInstallationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}
