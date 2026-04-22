# NiArgus — AI PR Review Agent
### Codebase-aware code review powered by Nia

---

## What This Is

NiArgus is a GitHub App that posts intelligent, codebase-aware code reviews on every pull request. Unlike existing tools (CodeRabbit, Copilot review) that only read the diff, NiArgus uses Nia to index the full codebase and understand how the changed code relates to the rest of the system.

The result: reviews that say "this conflicts with the auth pattern in middleware/auth.ts line 47" instead of "looks good."

**Installation for any team:** Click "Install" on the GitHub App page, select repos, done. No yaml files, no CLI, no configuration. NiArgus starts reviewing PRs immediately.

**The bold claim:** "Code review that actually read your codebase."

---

## Why This Is Differentiated

Every existing AI review tool has the same flaw: it only sees the diff. It has no idea what patterns exist in the rest of the codebase, what architectural decisions were made, or how the changed code interacts with surrounding systems.

Nia fixes this. Before reviewing a PR, NiArgus indexes the full repo via Nia and searches for relevant context — similar files, patterns, related logic — then passes that context to Claude alongside the diff. The review is grounded in the actual codebase, not just the 50 lines that changed.

---

## Tech Stack

- **GitHub App:** Receives PR webhooks, posts review comments via GitHub API
- **Backend:** Node.js + Express, deployed on Railway
- **Context layer:** Nia API — indexes repos and retrieves relevant context per PR
- **AI:** Claude Sonnet via Anthropic API — generates the review
- **Database:** Supabase — stores repo configs, review history, indexed repo state
- **Dashboard:** Next.js deployed on Vercel — teams can see review history and configure settings
- **Auth:** GitHub OAuth — teams log in with GitHub to manage their installations

---

## User Experience

### Installing NiArgus (team perspective)

1. Go to the **Vercel dashboard URL** (set after deployment)
2. Click **"Install on GitHub"**
3. GitHub OAuth — authorize NiArgus
4. Select which repos to enable
5. Done — NiArgus starts reviewing PRs immediately

No yaml. No CLI. No API keys to manage. The team never touches a config file.

### What a PR review looks like

When a PR is opened, NiArgus posts a single structured review comment:

```
## NiArgus Review

**Summary**
This PR adds rate limiting middleware to the auth flow. 
The implementation is correct but conflicts with an existing 
pattern used elsewhere.

**Issues Found**

🔴 **Conflict with existing pattern** — `middleware/rateLimit.js:23`
You're using `express-rate-limit` here, but `middleware/auth.ts` 
already implements rate limiting via `services/redis/rateLimiter.ts`. 
Two rate limiting systems will apply to the same endpoints, and the 
Redis implementation has more granular per-user controls. Consider 
extending the existing implementation instead.

🟡 **Missing error handling** — `routes/auth.js:67`
The new `checkRateLimit()` call has no try/catch. 
`services/redis/rateLimiter.ts` can throw on Redis connection 
failure — this will propagate as a 500 to the client.

🟢 **Looks good**
Token expiry logic in `utils/jwt.ts` is consistent with the 
existing pattern in `services/auth/tokenService.ts`.

**Context used:** 12 files from codebase index
*Powered by [NiArgus](YOUR_VERCEL_URL) + Nia*
```

### Dashboard

Teams visit the Vercel dashboard URL to:
- See review history for all PRs across their repos
- Toggle NiArgus on/off per repo
- See which files are indexed
- View cost/usage stats

---

## Environment Variables

```
# GitHub App credentials
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Nia
NIA_API_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Set these after Railway and Vercel deploy
NEXT_PUBLIC_APP_URL=           # Your Vercel URL e.g. https://niargus.vercel.app
BACKEND_URL=                   # Your Railway URL e.g. https://niargus-backend.railway.app
```

---

## Repository Structure

```
argus/
├── PRD.md                          # This file
├── .env.example
├── .env
├── .gitignore
│
├── backend/                        # Node.js + Express server
│   ├── package.json
│   ├── server.js                   # Express entry point
│   ├── routes/
│   │   ├── webhook.js              # Handles GitHub PR webhooks
│   │   └── oauth.js                # GitHub OAuth flow
│   ├── services/
│   │   ├── github.js               # GitHub API client (Octokit)
│   │   ├── nia.js                  # Nia API client — index and search
│   │   ├── reviewer.js             # Calls Claude with diff + context
│   │   └── db.js                   # Supabase writes
│   └── lib/
│       └── prompts.js              # Review prompt templates
│
├── dashboard/                      # Next.js frontend
│   ├── package.json
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Team dashboard (auth required)
│   │   ├── install/
│   │   │   └── page.tsx            # Post-install success page
│   │   └── api/
│   │       ├── auth/
│   │       │   └── route.ts        # GitHub OAuth callback
│   │       └── reviews/
│   │           └── route.ts        # Fetch review history
│   └── components/
│       ├── InstallButton.tsx       # "Install on GitHub" CTA
│       ├── ReviewCard.tsx          # Single PR review display
│       └── RepoList.tsx            # List of enabled repos
│
└── github-app/
    └── manifest.json               # GitHub App manifest for easy creation
```

---

## Phase 1 — Database Setup

**Agent does this entirely.**

### Step 1.1 — Create tables via Supabase CLI

```sql
-- Installations: tracks which GitHub accounts have installed NiArgus
create table installations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  github_installation_id bigint unique not null,
  github_account_login text not null,
  github_account_type text not null -- 'User' or 'Organization'
);

-- Repos: tracks which repos are enabled and their Nia source ID
create table repos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  installation_id uuid references installations(id),
  github_repo_id bigint unique not null,
  full_name text not null, -- e.g. "Platinum3nx/NiaBench"
  nia_source_id text,      -- Nia source ID once indexed
  is_enabled boolean default true,
  last_indexed_at timestamptz
);

-- Reviews: stores every PR review NiArgus has posted
create table reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  repo_id uuid references repos(id),
  pr_number int not null,
  pr_title text,
  pr_author text,
  review_body text not null,
  files_changed int,
  context_files_used int,
  github_comment_id bigint,
  model_used text default 'claude-sonnet-4-5'
);

create index on reviews (repo_id, created_at desc);
create index on installations (github_installation_id);
create index on repos (github_repo_id);
```

Save as `supabase/migrations/001_initial_schema.sql`

```bash
supabase db push
```

### Step 1.2 — Verify

```bash
supabase db diff
```

---

## Phase 2 — GitHub App Setup

**Agent creates the manifest. Human clicks through GitHub UI to create the app.**

### Step 2.1 — github-app/manifest.json

```json
{
  "name": "NiArgus Review",
  "url": "YOUR_VERCEL_URL",
  "hook_attributes": {
    "url": "YOUR_RAILWAY_URL/webhook"
  },
  "redirect_url": "YOUR_VERCEL_URL/install",
  "callback_urls": [
    "YOUR_VERCEL_URL/api/auth/callback"
  ],
  "description": "Codebase-aware AI code review powered by Nia",
  "public": true,
  "default_permissions": {
    "pull_requests": "write",
    "contents": "read",
    "metadata": "read"
  },
  "default_events": [
    "pull_request"
  ]
}
```

**Note:** Fill in YOUR_VERCEL_URL and YOUR_RAILWAY_URL after deployment in Phase 8 and 9. For local development and Phase 6 testing, use your smee.io channel URL as the webhook URL.

### Step 2.2 — Human creates the GitHub App

1. Go to github.com/settings/apps/new
2. Fill in the fields from manifest.json
3. Create the app
4. Download the private key (.pem file)
5. Copy App ID, Client ID, Client Secret, Webhook Secret into `.env`
6. Convert the private key to a single-line string for the env var:
```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private-key.pem
```

This is the only step the human does in this phase.

### Step 2.3 — Verify app exists

```bash
curl -H "Authorization: Bearer YOUR_JWT" https://api.github.com/app
```

Should return app metadata.

---

## Phase 3 — Nia Service

**Agent builds this entirely.**

### Step 3.1 — backend/services/nia.js

This module handles all Nia API interactions.

Implementation requirements:
- Base URL: `https://apigcp.trynia.ai`
- Auth header: `Authorization: Bearer {NIA_API_KEY}`
- Export these functions:

**`indexRepo(repoFullName)`**
- Check if repo is already indexed via `GET /sources?search={repoFullName}`
- If not indexed: `POST /sources` with `{ type: 'repository', identifier: repoFullName }`
- Poll `GET /sources/{source_id}` until status is `indexed` (max 10 minutes, poll every 30s)
- Return source_id

**`searchRepo(sourceId, query, maxChunks = 8)`**
- `POST /sources/{source_id}/search` with `{ query, limit: maxChunks }`
- Return array of `{ content: string, file_path: string, score: number }`

**`buildContextForDiff(sourceId, diff)`**
- Parse the diff to extract changed file paths and key identifiers (function names, class names, variable names)
- For each unique identifier found in the diff, run a targeted search
- Deduplicate results, rank by relevance score
- Return top 10 context chunks with file paths
- This is the core intelligence function — the quality of context it extracts determines review quality

```javascript
// nia.js exports: indexRepo, searchRepo, buildContextForDiff
```

### Step 3.2 — Verify

```bash
node -e "
import('./backend/services/nia.js').then(async m => {
  const id = await m.indexRepo('Platinum3nx/NiaBench');
  console.log('source id:', id);
  const results = await m.searchRepo(id, 'benchmark evaluation harness');
  console.log('results:', results.length);
});
"
```

---

## Phase 4 — GitHub Service

**Agent builds this entirely.**

### Step 4.1 — backend/services/github.js

This module handles all GitHub API interactions using Octokit.

Installation:
```bash
npm install @octokit/app @octokit/rest
```

Implementation requirements:

**`getInstallationClient(installationId)`**
- Create an authenticated Octokit instance for a specific installation
- Use the GitHub App private key to generate a JWT
- Exchange JWT for installation access token
- Return authenticated Octokit instance

**`getPRDiff(octokit, owner, repo, prNumber)`**
- `GET /repos/{owner}/{repo}/pulls/{prNumber}`
- `GET /repos/{owner}/{repo}/pulls/{prNumber}/files`
- Return: `{ title, author, body, files: [{filename, patch, status}], fullDiff: string }`
- Truncate individual file diffs to 500 lines max to stay within context limits

**`postReview(octokit, owner, repo, prNumber, reviewBody)`**
- `POST /repos/{owner}/{repo}/issues/{prNumber}/comments`
- Post the review as a regular comment (not a formal PR review)
- Return comment ID

**`getRepoDefaultBranch(octokit, owner, repo)`**
- `GET /repos/{owner}/{repo}`
- Return default branch name

```javascript
// github.js exports: getInstallationClient, getPRDiff, postReview, getRepoDefaultBranch
```

### Step 4.2 — Verify

```bash
node -e "
import('./backend/services/github.js').then(async m => {
  const octokit = await m.getInstallationClient(process.env.TEST_INSTALLATION_ID);
  const diff = await m.getPRDiff(octokit, 'Platinum3nx', 'NiaBench', 1);
  console.log('PR title:', diff.title);
  console.log('Files changed:', diff.files.length);
});
"
```

---

## Phase 5 — Reviewer Service

**Agent builds this entirely.**

### Step 5.1 — backend/lib/prompts.js

Contains the system and user prompts for the review.

**System prompt:**
```
You are NiArgus, an expert code reviewer with deep knowledge of the codebase.
You have been given a pull request diff AND relevant context from the full codebase.

Your job is to write a genuinely useful code review. You are not a rubber stamp.

Rules:
- Reference specific files, line numbers, and function names from the context provided
- Identify real conflicts with existing patterns — do not invent conflicts
- Flag missing error handling, edge cases, and security issues
- Note when the PR approach duplicates existing logic elsewhere in the codebase
- Be concise. Each issue gets 2-3 sentences maximum
- Categorize issues as: 🔴 must fix, 🟡 should fix, 🟢 looks good
- If the PR is genuinely clean, say so — do not invent issues
- Never say "looks good to me" without specific reasons

Format your response EXACTLY as follows:
## NiArgus Review

**Summary**
[1-2 sentence summary of what the PR does and your overall assessment]

**Issues Found**
[List each issue with emoji category, bold title, file:line reference, and explanation]
[If no issues, write "No significant issues found."]

**Context used:** {N} files from codebase index
*Powered by [NiArgus](YOUR_VERCEL_URL) + Nia*
```

### Step 5.2 — backend/services/reviewer.js

Implementation requirements:
- Accept: `{ diff, contextChunks, prTitle, prAuthor }`
- Build user prompt combining diff and context chunks
- Format context chunks as:
```
CODEBASE CONTEXT (retrieved via Nia):
--- File: path/to/file.ts ---
{chunk content}
---
```
- Call Claude Sonnet with system prompt from prompts.js
- Temperature: 0
- Max tokens: 1500
- Return the review string
- Log token usage to stdout

```javascript
// reviewer.js exports: generateReview(diff, contextChunks, prTitle, prAuthor)
// Returns: Promise<string>
```

### Step 5.3 — Verify with a real diff

```bash
node -e "
import('./backend/services/reviewer.js').then(async m => {
  const review = await m.generateReview(
    'diff --git a/test.js...',
    [{ content: 'existing code', file_path: 'src/auth.js', score: 0.9 }],
    'Add rate limiting',
    'testuser'
  );
  console.log(review);
});
"
```

---

## Phase 6 — Webhook Handler

**Agent builds this entirely.**

### Step 6.1 — Install backend dependencies

```bash
cd backend
npm install express @octokit/app @octokit/rest @octokit/webhooks dotenv
```

### Step 6.2 — backend/routes/webhook.js

This is the core of the app — it receives GitHub PR events and orchestrates the full review flow.

Implementation requirements:

**Verify webhook signature first** — reject any request that doesn't have a valid `X-Hub-Signature-256` header using the `GITHUB_WEBHOOK_SECRET`. This is a security requirement.

**Handle `pull_request` events where action is `opened` or `synchronize`:**

Flow:
1. Extract `installation.id`, `repository.full_name`, `pull_request.number`
2. Look up repo in Supabase — if not found or `is_enabled = false`, skip
3. Get authenticated GitHub client via `github.getInstallationClient(installationId)`
4. Post a placeholder comment immediately: "🔍 NiArgus is reviewing this PR..." — save the comment ID
5. Get the PR diff via `github.getPRDiff()`
6. Get or create the Nia source for this repo via `nia.indexRepo()` — if first time, this takes a few minutes
7. Get relevant context via `nia.buildContextForDiff(sourceId, diff)`
8. Generate review via `reviewer.generateReview()`
9. Edit the placeholder comment with the real review via GitHub API
10. Save review to Supabase `reviews` table
11. If any step fails, edit the placeholder comment to say "NiArgus encountered an error reviewing this PR."

**Handle `installation` events where action is `created`:**
- Insert new row into `installations` table
- Insert rows into `repos` table for each repo in the installation
- Start indexing each repo via Nia in the background (non-blocking)

**Handle `installation_repositories` events:**
- Add/remove repo rows from `repos` table as repos are added/removed from the installation

### Step 6.3 — backend/server.js

```javascript
import express from 'express';
import { webhookRouter } from './routes/webhook.js';
import { oauthRouter } from './routes/oauth.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use('/webhook', webhookRouter);
app.use('/auth', oauthRouter);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`NiArgus backend running on port ${PORT}`));
```

### Step 6.4 — Test webhook locally with smee.io

```bash
npm install -g smee-client
smee --url https://smee.io/YOUR_CHANNEL --target http://localhost:3001/webhook
```

Open a test PR on a repo with NiArgus installed. Should see the review posted within 2 minutes.

---

## Phase 7 — Dashboard

**Agent builds this entirely.**

### Step 7.1 — Landing page (dashboard/app/page.tsx)

Design requirements — this needs to look like a real product:
- Dark background (`bg-zinc-950`)
- Large hero: "Code review that actually read your codebase"
- Subheading: "NiArgus uses Nia to index your full repo before reviewing PRs — not just the diff"
- Big green "Install on GitHub" button that links to the GitHub App install URL
- Three feature cards below:
  - "Sees the full picture" — reviews reference files outside the diff
  - "Finds real conflicts" — identifies clashes with existing patterns
  - "Zero configuration" — install once, works on every PR
- Example review screenshot (use the example from this PRD)
- Footer: "Powered by Nia"

### Step 7.2 — OAuth callback (dashboard/app/api/auth/route.ts)

- Receive GitHub OAuth callback with `code` parameter
- Exchange code for access token via GitHub API
- Fetch user info via `GET /user`
- Look up installation in Supabase by GitHub account login
- Store session (use a simple JWT cookie)
- Redirect to `/dashboard`

### Step 7.3 — Team dashboard (dashboard/app/dashboard/page.tsx)

Requires auth. Shows:
- List of enabled repos with toggle switches
- Recent reviews table: PR title, repo, date, issues found count
- Clicking a review shows the full review text
- Usage stats: total reviews this month, average issues found per PR

### Step 7.4 — Install success page (dashboard/app/install/page.tsx)

Simple page shown after GitHub App install:
- "NiArgus is installed"
- "We're indexing your repos now — this takes a few minutes for large codebases"
- "Open a PR to see NiArgus in action"
- Link to dashboard

---

## Phase 8 — Railway Deployment (Backend)

**Agent does this via CLI. Human approves.**

### Step 8.1 — railway.json at backend root

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/health"
  }
}
```

### Step 8.2 — Deploy

```bash
cd backend
railway login
railway link
railway up
```

### Step 8.3 — Set all env vars

```bash
railway variables set GITHUB_APP_ID=...
railway variables set GITHUB_APP_PRIVATE_KEY=...
railway variables set GITHUB_WEBHOOK_SECRET=...
railway variables set NIA_API_KEY=...
railway variables set ANTHROPIC_API_KEY=...
railway variables set SUPABASE_SERVICE_ROLE_KEY=...
railway variables set NEXT_PUBLIC_SUPABASE_URL=...
```

### Step 8.4 — Update GitHub App webhook URL

Go to your GitHub App settings and update the webhook URL to the Railway deployment URL.
Railway will give you a URL like `https://niargus-backend.up.railway.app` — use that.

### Step 8.5 — Verify

```bash
curl YOUR_RAILWAY_URL/health
# Should return: {"status":"ok"}
```

---

## Phase 9 — Vercel Deployment (Dashboard)

**Agent does this via CLI.**

```bash
cd dashboard
vercel --prod
```

Vercel will give you a URL like `https://niargus.vercel.app`. Copy it.

Set env vars:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add NEXT_PUBLIC_APP_URL    # paste your Vercel URL here
vercel env add BACKEND_URL            # paste your Railway URL here
```

Redeploy after setting env vars:
```bash
vercel --prod
```

Then update the GitHub App settings:
- Webhook URL → YOUR_RAILWAY_URL/webhook
- OAuth callback URL → YOUR_VERCEL_URL/api/auth/callback
- Homepage URL → YOUR_VERCEL_URL

---

## Phase 10 — End-to-End Test

**Human does this to verify everything works.**

1. Go to YOUR_VERCEL_URL
2. Click "Install on GitHub"
3. Install on a test repo
4. Open a test PR on that repo
5. Within 2 minutes, NiArgus should post a review comment
6. The review should reference files outside the diff

If this works, the product is live.

---

## Phase 11 — README

**Agent writes this.**

```markdown
# NiArgus

AI code review that actually read your codebase.

## Install

[Install NiArgus on GitHub →](YOUR_GITHUB_APP_URL)

## How it works

Most AI review tools only see the diff. NiArgus uses Nia to index your 
full codebase before reviewing — so it can tell you when your PR 
conflicts with a pattern in a file you didn't touch.

## Self-hosting

1. Clone this repo
2. Create a GitHub App (see PRD.md for instructions)
3. Add env vars to .env
4. Deploy backend to Railway, dashboard to Vercel
5. Update GitHub App webhook and OAuth URLs with your Railway and Vercel URLs
```

---

## Build Order

```
Phase 1:  Database         → verify with supabase db diff
Phase 2:  GitHub App       → human creates app, copies credentials to .env
Phase 3:  Nia service      → verify indexRepo and searchRepo work
Phase 4:  GitHub service   → verify getPRDiff returns real diff
Phase 5:  Reviewer         → verify generateReview returns formatted review
Phase 6:  Webhook          → verify end-to-end with smee.io tunnel
Phase 7:  Dashboard        → verify landing page and dashboard render
Phase 8:  Railway deploy   → verify /health endpoint responds
Phase 9:  Vercel deploy    → verify landing page is live
Phase 10: E2E test         → human opens a PR and verifies review is posted
Phase 11: README           → repo is presentable
```

---

## What the Human Needs to Do

1. **Phase 2:** Create the GitHub App on github.com and copy credentials to `.env` — agent cannot do this, it requires clicking through GitHub's UI
2. **Phase 6:** Open a test PR to verify the webhook flow works locally
3. **Phase 8/9:** Approve Railway and Vercel deploys before agent runs them
4. **Phase 10:** Open a real PR to verify the full end-to-end flow
5. **Phase 11:** Approve README copy

Everything else is owned by the coding agent.

---

## Success Criteria

The project is done when:
- [ ] Opening a PR on an enabled repo triggers an NiArgus review comment within 2 minutes
- [ ] The review references at least one file outside the diff
- [ ] The landing page at the Vercel URL has a working "Install on GitHub" button
- [ ] The GitHub App is publicly installable by anyone
- [ ] The dashboard shows review history after logging in
- [ ] The Railway backend stays running after deploy (health check passes)
- [ ] A stranger can install NiArgus on their repo and get a review without contacting you
