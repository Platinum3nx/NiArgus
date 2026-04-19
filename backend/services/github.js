import { App } from "@octokit/app";

const MAX_DIFF_LINES = 500;

/**
 * Create an authenticated Octokit instance for a GitHub App installation.
 */
export async function getInstallationClient(installationId) {
  const app = new App({
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });

  return app.getInstallationOctokit(installationId);
}

/**
 * Fetch the diff and metadata for a pull request.
 */
export async function getPRDiff(octokit, owner, repo, prNumber) {
  const [{ data: pr }, { data: files }] = await Promise.all([
    octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner, repo, pull_number: prNumber,
    }),
    octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
      owner, repo, pull_number: prNumber,
    }),
  ]);

  const truncatedFiles = files.map((file) => {
    let patch = file.patch ?? "";
    const lines = patch.split("\n");
    if (lines.length > MAX_DIFF_LINES) {
      patch =
        lines.slice(0, MAX_DIFF_LINES).join("\n") +
        `\n... (truncated ${lines.length - MAX_DIFF_LINES} lines)`;
    }
    return {
      filename: file.filename,
      patch,
      status: file.status,
    };
  });

  const fullDiff = truncatedFiles
    .map((f) => `--- ${f.filename} (${f.status})\n${f.patch}`)
    .join("\n\n");

  return {
    title: pr.title,
    author: pr.user?.login ?? "unknown",
    body: pr.body ?? "",
    files: truncatedFiles,
    fullDiff,
  };
}

/**
 * Post a review comment on a pull request as an issue comment.
 */
export async function postReview(octokit, owner, repo, prNumber, reviewBody) {
  const { data: comment } = await octokit.request(
    "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
    { owner, repo, issue_number: prNumber, body: reviewBody }
  );
  return comment.id;
}

/**
 * Edit an existing comment.
 */
export async function editComment(octokit, owner, repo, commentId, body) {
  await octokit.request(
    "PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}",
    { owner, repo, comment_id: commentId, body }
  );
}

/**
 * Get the default branch name for a repository.
 */
export async function getRepoDefaultBranch(octokit, owner, repo) {
  const { data: repository } = await octokit.request(
    "GET /repos/{owner}/{repo}",
    { owner, repo }
  );
  return repository.default_branch;
}
