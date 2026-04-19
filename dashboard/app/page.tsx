import Link from "next/link";

const GITHUB_APP_SLUG = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "niargus-review";
const INSTALL_URL = `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`;

const features = [
  {
    title: "Sees the full picture",
    description:
      "Reviews reference files outside the diff. NiArgus knows what patterns exist across your entire codebase before reviewing.",
    icon: "🔭",
  },
  {
    title: "Finds real conflicts",
    description:
      "Identifies clashes with existing patterns, duplicated logic, and architectural inconsistencies — not just lint errors.",
    icon: "🎯",
  },
  {
    title: "Zero configuration",
    description:
      "Install once, works on every PR. No yaml files, no CLI, no API keys to manage. NiArgus starts reviewing immediately.",
    icon: "⚡",
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center">
      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-sm text-zinc-400 mb-8">
          Powered by Nia
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
          Code review that actually{" "}
          <span className="text-emerald-400">read your codebase</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl">
          NiArgus uses Nia to index your full repo before reviewing PRs — not
          just the diff. It finds conflicts with existing patterns, duplicated
          logic, and real issues.
        </p>
        <Link
          href={INSTALL_URL}
          className="mt-10 inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-8 py-3.5 text-lg transition-colors"
        >
          Install on GitHub
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </section>

      {/* Example review */}
      <section className="w-full max-w-3xl mx-auto px-6 pb-16">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 font-mono text-sm leading-relaxed">
          <h3 className="text-base font-semibold font-sans text-zinc-300 mb-4">
            Example review
          </h3>
          <div className="space-y-3 text-zinc-300">
            <p className="font-sans font-semibold text-white text-base">
              ## NiArgus Review
            </p>
            <p>
              <span className="font-semibold">Summary</span>
              <br />
              This PR adds rate limiting middleware to the auth flow. The
              implementation is correct but conflicts with an existing pattern
              used elsewhere.
            </p>
            <p>
              <span className="text-red-400">🔴</span>{" "}
              <span className="font-semibold">
                Conflict with existing pattern
              </span>{" "}
              — <code className="text-emerald-400">middleware/rateLimit.js:23</code>
              <br />
              <span className="text-zinc-400">
                You&apos;re using express-rate-limit here, but middleware/auth.ts
                already implements rate limiting via
                services/redis/rateLimiter.ts. Two rate limiting systems will
                apply to the same endpoints.
              </span>
            </p>
            <p>
              <span className="text-yellow-400">🟡</span>{" "}
              <span className="font-semibold">Missing error handling</span> —{" "}
              <code className="text-emerald-400">routes/auth.js:67</code>
              <br />
              <span className="text-zinc-400">
                The new checkRateLimit() call has no try/catch.
                services/redis/rateLimiter.ts can throw on Redis connection
                failure.
              </span>
            </p>
            <p>
              <span className="text-emerald-400">🟢</span>{" "}
              <span className="font-semibold">Looks good</span>
              <br />
              <span className="text-zinc-400">
                Token expiry logic in utils/jwt.ts is consistent with the
                existing pattern in services/auth/tokenService.ts.
              </span>
            </p>
            <p className="text-zinc-500 text-xs">
              Context used: 12 files from codebase index
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-800 py-8 text-center text-zinc-500 text-sm">
        Powered by <span className="text-zinc-300">Nia</span>
      </footer>
    </main>
  );
}
