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
    <main className="min-h-screen bg-[#171717] text-[#f5f1e8]">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
        <div className="overflow-hidden rounded-[30px] border border-[#2f2f2f] bg-[#191919] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between border-b border-[#2f2f2f] px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-[#ff6728]" />
              <div className="h-3 w-3 rounded-full bg-[#2a2a2a]" />
              <div className="h-3 w-3 rounded-full bg-[#2a2a2a]" />
            </div>
            <div className="text-[12px] uppercase tracking-[0.28em] text-[#6f6b65]">
              NiArgus
            </div>
          </div>

          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,103,40,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(38,203,186,0.08),transparent_35%)]" />

            <section className="relative border-b border-[#2b2b2b] px-6 pb-16 pt-18 sm:px-10 lg:px-14 lg:pb-20 lg:pt-24">
              <div className="mx-auto max-w-4xl text-center">
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#343434] bg-[#242424] px-4 py-2 text-[12px] uppercase tracking-[0.28em] text-[#88847d]">
                  Powered by Nia (not affiliated)
                </div>
                <h1 className="text-5xl leading-[1.02] tracking-[-0.055em] text-[#f4efe7] sm:text-6xl lg:text-7xl">
                  Code review that actually{" "}
                  <span className="text-[#26cbb8]">read your codebase</span>
                </h1>
                <p className="mx-auto mt-8 max-w-3xl text-[18px] leading-9 text-[#918d86] sm:text-[20px]">
                  NiArgus uses Nia (not affiliated) to index your full repo before
                  reviewing PRs — not just the diff. It finds conflicts with
                  existing patterns, duplicated logic, and real issues.
                </p>
                <div className="mt-12">
                  <Link
                    href={INSTALL_URL}
                    className="inline-flex items-center gap-3 rounded-[16px] border border-[#3c3c3c] bg-[#222222] px-7 py-4 text-[17px] font-medium text-[#f5f1e8] transition-colors hover:border-[#575757] hover:bg-[#2a2a2a]"
                  >
                    Install on GitHub
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>

            <section className="relative border-b border-[#2b2b2b] px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
              <div className="mx-auto max-w-4xl rounded-[24px] border border-[#303030] bg-[#1b1b1b] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.015)_inset] sm:p-8">
                <div className="mb-6 flex items-center gap-4 text-[12px] uppercase tracking-[0.3em] text-[#706c66]">
                  <span className="rounded-lg bg-[#232323] px-3 py-2 text-[#8d8882]">
                    Example review
                  </span>
                  <div className="h-px flex-1 bg-[#2d2d2d]" />
                </div>
                <div className="space-y-4 text-[15px] leading-8 text-[#b8b2a8] sm:text-[16px]">
                  <p className="text-[17px] font-medium text-[#f5f1e8]">
                    ## NiArgus Review
                  </p>
                  <p>
                    <span className="font-medium text-[#f0eade]">Summary</span>
                    <br />
                    This PR adds rate limiting middleware to the auth flow. The
                    implementation is correct but conflicts with an existing
                    pattern used elsewhere.
                  </p>
                  <p>
                    <span className="text-[#f56d6d]">🔴</span>{" "}
                    <span className="font-medium text-[#f0eade]">
                      Conflict with existing pattern
                    </span>{" "}
                    —{" "}
                    <code className="rounded-md bg-[#222222] px-2 py-1 text-[#26cbb8]">
                      middleware/rateLimit.js:23
                    </code>
                    <br />
                    <span className="text-[#8f8a84]">
                      You&apos;re using express-rate-limit here, but
                      middleware/auth.ts already implements rate limiting via
                      services/redis/rateLimiter.ts. Two rate limiting systems
                      will apply to the same endpoints.
                    </span>
                  </p>
                  <p>
                    <span className="text-[#e1c168]">🟡</span>{" "}
                    <span className="font-medium text-[#f0eade]">
                      Missing error handling
                    </span>{" "}
                    —{" "}
                    <code className="rounded-md bg-[#222222] px-2 py-1 text-[#26cbb8]">
                      routes/auth.js:67
                    </code>
                    <br />
                    <span className="text-[#8f8a84]">
                      The new checkRateLimit() call has no try/catch.
                      services/redis/rateLimiter.ts can throw on Redis
                      connection failure.
                    </span>
                  </p>
                  <p>
                    <span className="text-[#7fd6ad]">🟢</span>{" "}
                    <span className="font-medium text-[#f0eade]">Looks good</span>
                    <br />
                    <span className="text-[#8f8a84]">
                      Token expiry logic in utils/jwt.ts is consistent with the
                      existing pattern in services/auth/tokenService.ts.
                    </span>
                  </p>
                  <p className="text-[13px] uppercase tracking-[0.22em] text-[#66625d]">
                    Context used: 12 files from codebase index
                  </p>
                </div>
              </div>
            </section>

            <section className="relative px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
              <div className="mx-auto max-w-6xl">
                <div className="grid gap-6 md:grid-cols-3">
                  {features.map((f) => (
                    <div
                      key={f.title}
                      className="rounded-[24px] border border-[#303030] bg-[#1b1b1b] p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.015)_inset]"
                    >
                      <div className="mb-5 text-3xl">{f.icon}</div>
                      <h3 className="text-[22px] tracking-[-0.04em] text-[#f3eee6]">
                        {f.title}
                      </h3>
                      <p className="mt-4 text-[15px] leading-8 text-[#8f8b84]">
                        {f.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="px-4 py-8 text-center text-[13px] uppercase tracking-[0.22em] text-[#726e68]">
          Powered by <span className="text-[#d0c8bd]">Nia (not affiliated)</span>
        </footer>
      </div>
    </main>
  );
}
