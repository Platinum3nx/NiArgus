import { Router } from 'express';
import crypto from 'crypto';
import { getInstallationClient, getPRDiff, postReview, editComment } from '../services/github.js';
import { indexRepo, buildContextForDiff } from '../services/nia.js';
import { generateReview } from '../services/reviewer.js';
import {
  getInstallation,
  createInstallation,
  getRepoByFullName,
  createRepo,
  updateRepoNiaSource,
  deleteRepoByGithubId,
  reserveReviewSlot,
  finalizeReview,
  releaseReviewSlot,
} from '../services/db.js';

export const webhookRouter = Router();

// ── Signature verification ──────────────────────────────────────────────

function verifySignature(payload, signature) {
  if (!signature) return false;
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ── Webhook handler ─────────────────────────────────────────────────────

webhookRouter.post('/', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = req.body; // raw Buffer thanks to express.raw()

  if (!verifySignature(payload, signature)) {
    console.log('[webhook] Invalid signature — rejecting');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'];
  const body = JSON.parse(payload.toString());
  const action = body.action;

  console.log(`[webhook] ${event}.${action}`);

  // Respond immediately — processing happens async
  res.status(200).json({ ok: true });

  try {
    if (event === 'pull_request' && (action === 'opened' || action === 'synchronize')) {
      await handlePullRequest(body);
    } else if (event === 'installation' && action === 'created') {
      await handleInstallationCreated(body);
    } else if (event === 'installation_repositories') {
      await handleInstallationRepos(body);
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event}.${action}:`, err);
  }
});

// ── Pull request review flow ────────────────────────────────────────────

async function handlePullRequest(body) {
  const installationId = body.installation.id;
  const repoFullName = body.repository.full_name;
  const prNumber = body.pull_request.number;
  const [owner, repo] = repoFullName.split('/');

  console.log(`[review] PR #${prNumber} on ${repoFullName}`);

  // Look up repo in DB
  let dbRepo = await getRepoByFullName(repoFullName);
  if (!dbRepo || !dbRepo.is_enabled) {
    console.log(`[review] Repo ${repoFullName} not found or disabled — skipping`);
    return;
  }

  // Reserve a review slot (atomic check-and-insert to prevent race conditions)
  const reservation = await reserveReviewSlot({
    repoId: dbRepo.id,
    prNumber,
    installationId: dbRepo.installation_id,
  });

  if (!reservation.allowed) {
    console.log(`[review] Rate limited for installation ${dbRepo.installation_id}: ${reservation.reason}`);
    const octokit = await getInstallationClient(installationId);
    await postReview(octokit, owner, repo, prNumber,
      `⏳ **NiArgus** — ${reservation.reason}`
    );
    return;
  }
  console.log(`[review] Slot reserved — monthly: ${reservation.monthlyUsed}/50, hourly: ${reservation.hourlyUsed}/10`);

  let octokit;
  let placeholderCommentId;

  try {
    // Get authenticated GitHub client
    octokit = await getInstallationClient(installationId);

    // Post placeholder comment
    placeholderCommentId = await postReview(
      octokit, owner, repo, prNumber,
      '🔍 **NiArgus** is reviewing this PR...'
    );

    // Get PR diff
    const diff = await getPRDiff(octokit, owner, repo, prNumber);
    console.log(`[review] Got diff: ${diff.files.length} files changed`);

    // Get or create Nia source
    let sourceId = dbRepo.nia_source_id;
    if (!sourceId) {
      console.log(`[review] Indexing ${repoFullName} in Nia...`);
      sourceId = await indexRepo(repoFullName);
      await updateRepoNiaSource(dbRepo.id, sourceId);
      console.log(`[review] Indexed — source ID: ${sourceId}`);
    }

    // Get relevant context
    console.log('[review] Building context from codebase...');
    const contextChunks = await buildContextForDiff(sourceId, diff.fullDiff);
    console.log(`[review] Got ${contextChunks.length} context chunks`);

    // Generate review
    console.log('[review] Generating review with Claude...');
    const reviewBody = await generateReview(
      diff.fullDiff, contextChunks, diff.title, diff.author
    );

    // Edit placeholder with real review
    await editComment(octokit, owner, repo, placeholderCommentId, reviewBody);
    console.log(`[review] Posted review on PR #${prNumber}`);

    // Finalize the reserved slot with actual review data
    await finalizeReview(reservation.reservationId, {
      prTitle: diff.title,
      prAuthor: diff.author,
      reviewBody,
      filesChanged: diff.files.length,
      contextFilesUsed: contextChunks.length,
      githubCommentId: placeholderCommentId,
    });
  } catch (err) {
    console.error(`[review] Error reviewing PR #${prNumber}:`, err);
    // Release the reserved slot so it doesn't count toward limits
    await releaseReviewSlot(reservation.reservationId).catch(() => {});
    // Edit placeholder to show error (if we managed to post one)
    if (octokit && placeholderCommentId) {
      await editComment(
        octokit, owner, repo, placeholderCommentId,
        '⚠️ **NiArgus** encountered an error reviewing this PR. The team has been notified.',
      ).catch(() => {});
    }
  }
}

// ── Installation created ────────────────────────────────────────────────

async function handleInstallationCreated(body) {
  const inst = body.installation;
  console.log(`[install] New installation from ${inst.account.login}`);

  const dbInstallation = await createInstallation({
    githubInstallationId: inst.id,
    githubAccountLogin: inst.account.login,
    githubAccountType: inst.account.type,
  });

  // Create repo rows for each repo in the installation
  const repos = body.repositories || [];
  for (const repo of repos) {
    const dbRepo = await createRepo({
      installationId: dbInstallation.id,
      githubRepoId: repo.id,
      fullName: repo.full_name,
    });

    // Start indexing in background (non-blocking)
    indexRepo(repo.full_name)
      .then((sourceId) => updateRepoNiaSource(dbRepo.id, sourceId))
      .then(() => console.log(`[install] Indexed ${repo.full_name}`))
      .catch((err) => console.error(`[install] Failed to index ${repo.full_name}:`, err));
  }
}

// ── Installation repos added/removed ────────────────────────────────────

async function handleInstallationRepos(body) {
  const installationId = body.installation.id;
  const dbInstallation = await getInstallation(installationId);

  if (!dbInstallation) {
    console.log(`[repos] Installation ${installationId} not found in DB`);
    return;
  }

  // Handle added repos
  const added = body.repositories_added || [];
  for (const repo of added) {
    console.log(`[repos] Adding ${repo.full_name}`);
    const dbRepo = await createRepo({
      installationId: dbInstallation.id,
      githubRepoId: repo.id,
      fullName: repo.full_name,
    });
    // Index in background
    indexRepo(repo.full_name)
      .then((sourceId) => updateRepoNiaSource(dbRepo.id, sourceId))
      .catch((err) => console.error(`[repos] Failed to index ${repo.full_name}:`, err));
  }

  // Handle removed repos
  const removed = body.repositories_removed || [];
  for (const repo of removed) {
    console.log(`[repos] Removing ${repo.full_name}`);
    await deleteRepoByGithubId(repo.id);
  }
}
