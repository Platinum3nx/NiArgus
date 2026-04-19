import { App } from "@octokit/app";

const MAX_DIFF_LINES = 500;

/**
 * Create an authenticated Octokit instance for a GitHub App installation.
 *
 * @param {number} installationId - The GitHub App installation ID.
 * @returns {Promise<import("@octokit/rest").Octokit>} Authenticated Octokit client.
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
 *
 * @param {import("@octokit/rest").Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {number} prNumber
 * @returns {Promise<{title: string, author: string, body: string, files: Array<{filename: string, patch: string, status: string}>, fullDiff: string}>}
 */
export async function getPRDiff(octokit, owner, repo, prNumber) {
  const [{ data: pr }, { data: files }] = await Promise.all([
    octokit.rest.pulls.get({ owner, repo, pull_number: prNumber }),
    octokit.rest.pulls.listFiles({ owner, repo, pull_number: prNumber }),
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
 *
 * @param {import("@octokit/rest").Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {number} prNumber
 * @param {string} reviewBody
 * @returns {Promise<number>} The created comment ID.
 */
export async function postReview(octokit, owner, repo, prNumber, reviewBody) {
  const { data: comment } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: reviewBody,
  });

  return comment.id;
}

/**
 * Get the default branch name for a repository.
 *
 * @param {import("@octokit/rest").Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<string>} Default branch name (e.g. "main").
 */
export async function getRepoDefaultBranch(octokit, owner, repo) {
  const { data: repository } = await octokit.rest.repos.get({ owner, repo });
  return repository.default_branch;
}
