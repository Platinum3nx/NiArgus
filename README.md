# NiArgus

AI code review that actually read your codebase.

## Install

[Install NiArgus on GitHub →](https://github.com/apps/niargus)

## How it works

Most AI review tools only see the diff. NiArgus uses [Nia](https://trynia.ai) to index your full codebase before reviewing — so it can tell you when your PR conflicts with a pattern in a file you didn't touch.

When a PR is opened, NiArgus:

1. Retrieves the diff from GitHub
2. Searches the indexed codebase for relevant context (patterns, related files, similar logic)
3. Sends the diff + context to Claude for review
4. Posts a structured review comment on the PR

## Example review

```
## NiArgus Review

**Summary**
This PR adds rate limiting middleware to the auth flow.
The implementation conflicts with an existing pattern.

🔴 Conflict with existing pattern — middleware/rateLimit.js:23
You're using express-rate-limit here, but middleware/auth.ts
already implements rate limiting via services/redis/rateLimiter.ts.

🟡 Missing error handling — routes/auth.js:67
The new checkRateLimit() call has no try/catch.

🟢 Looks good
Token expiry logic is consistent with the existing pattern
in services/auth/tokenService.ts.

Context used: 12 files from codebase index
```

## Tech stack

- **Backend:** Node.js + Express on Railway
- **Context:** Nia API — indexes repos and retrieves relevant code
- **AI:** Claude Sonnet via Anthropic API
- **Database:** Supabase
- **Dashboard:** Next.js on Vercel
- **Auth:** GitHub OAuth

## Self-hosting

1. Clone this repo
2. Create a GitHub App ([instructions in PRD.md](PRD.md))
3. Copy `.env.example` to `.env` and fill in credentials
4. `cd backend && npm install && node server.js`
5. `cd dashboard && npm install && npm run dev`
6. Deploy backend to Railway, dashboard to Vercel
7. Update GitHub App webhook and OAuth URLs with your deployment URLs
