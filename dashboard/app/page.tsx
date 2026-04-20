import type { ReactNode } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";

const GITHUB_APP_SLUG = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "niargus-review";
const INSTALL_URL = `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`;
const DASHBOARD_LOGIN_URL = `/api/auth/login?returnTo=${encodeURIComponent(
  "/dashboard"
)}`;

type IconProps = { className?: string };

function makeIcon(path: ReactNode, className?: string) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      className={className}
    >
      {path}
    </svg>
  );
}

const icons = {
  home: ({ className }: IconProps) =>
    makeIcon(
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V20h13V10.5" />
        <path d="M9.5 20v-5.5h5V20" />
      </>,
      className
    ),
  vault: ({ className }: IconProps) =>
    makeIcon(
      <>
        <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
        <path d="M8 8.5h8" />
        <path d="M8 12h3" />
        <path d="m14.5 14 1.75 1.75L19 13" />
      </>,
      className
    ),
  bars: ({ className }: IconProps) =>
    makeIcon(
      <>
        <path d="M6 19V9" />
        <path d="M12 19V5" />
        <path d="M18 19v-7" />
      </>,
      className
    ),
  activity: ({ className }: IconProps) =>
    makeIcon(<path d="M3.5 12h4l2.5-6 4 12 2.5-6h4" />, className),
  compass: ({ className }: IconProps) =>
    makeIcon(
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m10 10 5-2-2 5-5 2 2-5Z" />
      </>,
      className
    ),
  context: ({ className }: IconProps) =>
    makeIcon(
      <path d="M6.5 18.5A2.5 2.5 0 0 1 4 16V8a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 8v8a2.5 2.5 0 0 1-2.5 2.5H10l-4 3v-3Z" />,
      className
    ),
  research: ({ className }: IconProps) =>
    makeIcon(
      <>
        <path d="M6 7.5 12 12m0 0 6-4.5M12 12l-6 4.5M12 12l6 4.5" />
        <circle cx="6" cy="7.5" r="2" />
        <circle cx="18" cy="7.5" r="2" />
        <circle cx="6" cy="16.5" r="2" />
        <circle cx="18" cy="16.5" r="2" />
      </>,
      className
    ),
  search: ({ className }: IconProps) =>
    makeIcon(
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </>,
      className
    ),
  document: ({ className }: IconProps) =>
    makeIcon(
      <>
        <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" />
        <path d="M14 3.5V8h4" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </>,
      className
    ),
  database: ({ className }: IconProps) =>
    makeIcon(
      <>
        <ellipse cx="12" cy="6.5" rx="7" ry="3" />
        <path d="M5 6.5v11c0 1.66 3.13 3 7 3s7-1.34 7-3v-11" />
        <path d="M5 12.5c0 1.66 3.13 3 7 3s7-1.34 7-3" />
      </>,
      className
    ),
  key: ({ className }: IconProps) =>
    makeIcon(
      <>
        <circle cx="7.5" cy="16.5" r="3.5" />
        <path d="M11 13h8v3h-2.5v2H14v2h-3" />
      </>,
      className
    ),
  external: ({ className }: IconProps) =>
    makeIcon(
      <>
        <path d="M14 5h5v5" />
        <path d="M19 5 9 15" />
        <path d="M5 9.5V18a1.5 1.5 0 0 0 1.5 1.5H15" />
      </>,
      className
    ),
  billing: ({ className }: IconProps) =>
    makeIcon(
      <>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
        <path d="M3.5 9.5h17" />
      </>,
      className
    ),
  integrations: ({ className }: IconProps) =>
    makeIcon(
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" />
      </>,
      className
    ),
  cpu: ({ className }: IconProps) =>
    makeIcon(
      <>
        <rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M10 1.5v3M14 1.5v3M10 19.5v3M14 19.5v3M1.5 10h3M1.5 14h3M19.5 10h3M19.5 14h3" />
      </>,
      className
    ),
  sync: ({ className }: IconProps) =>
    makeIcon(
      <>
        <path d="M4 12a7.5 7.5 0 0 1 13-5.1" />
        <path d="M17 3.5v4.5h-4.5" />
        <path d="M20 12a7.5 7.5 0 0 1-13 5.1" />
        <path d="M7 20.5V16h4.5" />
      </>,
      className
    ),
  transfer: ({ className }: IconProps) =>
    makeIcon(
      <>
        <path d="M4 7h12" />
        <path d="m12 3 4 4-4 4" />
        <path d="M20 17H8" />
        <path d="m12 13-4 4 4 4" />
      </>,
      className
    ),
  discord: ({ className }: IconProps) =>
    makeIcon(
      <>
        <path d="M7 7.5c3.6-1.8 6.4-1.8 10 0 .9 2 1.6 4.1 2 6.2-1.6 1.3-3.3 2.2-5.1 2.8l-1-1.5c.8-.2 1.6-.6 2.3-1.1-.7.4-1.5.7-2.4.8-1 .2-2 .2-2.9 0-.9-.1-1.7-.4-2.4-.8.7.5 1.5.9 2.3 1.1l-1 1.5A13.3 13.3 0 0 1 5 13.7c.4-2.1 1.1-4.2 2-6.2Z" />
        <circle cx="9.5" cy="12" r="1" />
        <circle cx="14.5" cy="12" r="1" />
      </>,
      className
    ),
  feedback: ({ className }: IconProps) =>
    makeIcon(
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.5 15.5c2.2 1.5 4.8 1.5 7 0" />
        <path d="M9 10.5h.01M15 10.5h.01" />
      </>,
      className
    ),
  person: ({ className }: IconProps) =>
    makeIcon(
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
      </>,
      className
    ),
};

type IconName = keyof typeof icons;

const sidebarSections: Array<{
  label?: string;
  items: Array<{
    label: string;
    icon: IconName;
    active?: boolean;
    external?: boolean;
  }>;
}> = [
  {
    items: [{ label: "Home", icon: "home", active: true }],
  },
  {
    label: "Knowledge",
    items: [{ label: "Review Graph", icon: "vault" }],
  },
  {
    label: "Overview",
    items: [
      { label: "Overview", icon: "bars" },
      { label: "Activity", icon: "activity" },
      { label: "Explore", icon: "compass" },
      { label: "Contexts", icon: "context" },
    ],
  },
  {
    label: "Playground",
    items: [
      { label: "Research", icon: "research" },
      { label: "Search", icon: "search" },
      { label: "Patterns", icon: "document" },
      { label: "Datasets", icon: "database" },
    ],
  },
  {
    label: "GitHub",
    items: [
      { label: "API Keys", icon: "key" },
      { label: "Docs", icon: "external", external: true },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Integrations", icon: "integrations" },
      { label: "Answer Model", icon: "cpu" },
      { label: "Local Sync", icon: "sync" },
      { label: "Context Transfer", icon: "transfer" },
    ],
  },
];

const shortcuts: Array<{
  title: string;
  description: string;
  icon: IconName;
}> = [
  {
    title: "/pull-requests",
    description: "Review queue with repo context and change history.",
    icon: "research",
  },
  {
    title: "/search",
    description: "Search across comments, patterns, and prior findings.",
    icon: "search",
  },
  {
    title: "/docs",
    description: "Reference the exact conventions NiArgus uses in review.",
    icon: "document",
  },
  {
    title: "/repositories",
    description: "Track which repos are indexed and ready for full-context review.",
    icon: "database",
  },
  {
    title: "/overview",
    description: "Usage, install status, and finding volume at a glance.",
    icon: "bars",
  },
  {
    title: "/explore",
    description: "Surface the patterns a new pull request might conflict with.",
    icon: "compass",
  },
];

function SidebarItem({
  icon,
  label,
  active,
  external,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  external?: boolean;
}) {
  const Icon = icons[icon];

  return (
    <div
      className={`flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] transition-colors ${
        active
          ? "bg-[#2c2c2c] text-[#f4efe8]"
          : "text-[#9d9992] hover:bg-[#202020] hover:text-[#e6e1d8]"
      }`}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <span className="truncate">{label}</span>
      {external ? <span className="ml-auto text-[13px] text-[#72706b]">↗</span> : null}
    </div>
  );
}

function ShortcutCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: IconName;
}) {
  const Icon = icons[icon];

  return (
    <div className="rounded-[20px] border border-[#303030] bg-[#181818] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.01)_inset]">
      <div className="flex items-center gap-4">
        <Icon className="h-8 w-8 text-[#9d9992]" />
        <div className="text-[17px] font-medium tracking-[-0.03em] text-[#f3efe7]">{title}</div>
      </div>
      <p className="mt-4 max-w-[28ch] text-[15px] leading-8 text-[#8f8b84]">{description}</p>
    </div>
  );
}

function CoverageChart() {
  return (
    <div className="mt-6">
      <svg viewBox="0 0 360 188" className="h-auto w-full overflow-visible">
        {[24, 66, 108, 150].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="360"
            y2={y}
            stroke="rgba(255,255,255,0.1)"
            strokeDasharray="4 7"
          />
        ))}
        <line
          x1="0"
          y1="142"
          x2="360"
          y2="142"
          stroke="rgba(255,255,255,0.24)"
          strokeDasharray="6 7"
        />
        <path
          d="M0 182H132C155 182 164 181 171 164L205 80C213 61 224 44 236 44C249 44 257 60 264 84L281 132C287 149 295 158 307 158C323 158 339 153 360 182H0Z"
          fill="rgba(38, 203, 186, 0.12)"
        />
        <path
          d="M0 182H132C155 182 164 181 171 164L205 80C213 61 224 44 236 44C249 44 257 60 264 84L281 132C287 149 295 158 307 158C323 158 339 153 360 182"
          stroke="#26cbb8"
          strokeWidth="3"
          fill="none"
        />
      </svg>
      <div className="mt-4 grid grid-cols-7 text-[14px] text-[#79756f]">
        {["Apr 13", "Apr 14", "Apr 15", "Apr 16", "Apr 17", "Apr 18", "Apr 19"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const session = await getSession();
  const userLabel = session?.login || "Guest";
  const userInitial = userLabel[0]?.toUpperCase() || "N";
  const dashboardHref = session ? "/dashboard" : DASHBOARD_LOGIN_URL;
  const accountTone = session ? "Signed in and ready to review." : "Install once, review every PR.";
  const PersonIcon = icons.person;
  const TransferIcon = icons.transfer;

  return (
    <main className="min-h-screen bg-[#171717] text-[#f5f1e8]">
      <div className="lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="border-b border-[#313131] bg-[#1a1a1a] lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col px-4 pb-4 pt-5 lg:sticky lg:top-0 lg:max-h-screen">
            <div className="flex items-center gap-4 px-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6728] text-[20px] text-white">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] uppercase tracking-[0.2em] text-[#7d7973]">
                  Personal account
                </div>
                <div className="mt-1 flex items-center gap-3 text-[17px] text-[#ded8ce]">
                  <span className="truncate">{userLabel}</span>
                  <span className="text-[#75716b]">⌄</span>
                </div>
              </div>
            </div>

            <nav className="mt-8 space-y-7 overflow-y-auto pb-6 pr-1">
              {sidebarSections.map((section) => (
                <div key={section.label || "home"}>
                  {section.label ? (
                    <div className="px-4 pb-3 text-[12px] uppercase tracking-[0.28em] text-[#696661]">
                      {section.label}
                    </div>
                  ) : null}
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <SidebarItem key={item.label} {...item} />
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <div className="space-y-1">
                  <SidebarItem label="Discord" icon="discord" external />
                  <SidebarItem label="Feedback" icon="feedback" />
                </div>
              </div>
            </nav>

            <div className="mt-auto border-t border-[#3a3a3a] pt-5">
              <div className="flex items-center justify-between px-3 text-[15px] text-[#8e8983]">
                <span>Theme</span>
                <span className="text-[22px] text-[#f4d74d]">☼</span>
              </div>
              <div className="mt-5 flex items-center gap-4 px-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff6728] text-[24px] text-white">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[17px] text-[#efe9df]">{userLabel}</div>
                  <div className="truncate text-[13px] text-[#7a766f]">{accountTone}</div>
                </div>
                <div className="rounded-xl border border-[#3a3a3a] bg-[#262626] p-3 text-[#d8d1c6]">
                  <TransferIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="flex items-center justify-between border-b border-[#313131] px-6 py-7 lg:px-12">
            <div className="text-[16px] text-[#9a958e]">Workspace</div>
            <div className="flex items-center gap-6 text-[15px] text-[#efebe3]">
              <span>Command Menu</span>
              <span className="text-[#8b8781]">⌘K</span>
            </div>
          </header>

          <section className="px-6 pb-10 pt-12 lg:px-12 lg:pb-16 lg:pt-20">
            <div className="mx-auto max-w-[1440px]">
              <div className="mb-12">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <h1 className="text-[44px] leading-none tracking-[-0.05em] text-[#f7f3eb] sm:text-[56px]">
                    NiArgus
                  </h1>
                  <div className="flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#3a3a3a] bg-[#2a2a2a] px-5 py-3 text-[15px] text-[#a9a49d]">
                      <PersonIcon className="h-5 w-5" />
                      <span>GitHub App</span>
                    </div>
                    <div className="rounded-full border border-[#3a3a3a] bg-[#2a2a2a] px-5 py-3 text-[15px] text-[#8d8882]">
                      Nia (not affiliated) Context
                    </div>
                  </div>
                </div>
                <p className="mt-5 text-[18px] leading-9 text-[#8d8881]">
                  PR review that reads beyond the diff.
                </p>
              </div>

              <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_360px]">
                <div className="xl:col-span-2">
                  <div className="overflow-hidden rounded-[22px] border border-[#303030] bg-[#1a1a1a] shadow-[0_0_0_1px_rgba(255,255,255,0.01)_inset]">
                    <div className="flex flex-col xl:flex-row">
                      <div className="flex-1 p-8 lg:p-10">
                        <div className="mb-7 flex items-center gap-5 text-[13px] uppercase tracking-[0.28em] text-[#66625d]">
                          <span className="rounded-lg bg-[#222222] px-4 py-2 text-[#8a857f]">
                            Welcome
                          </span>
                          <span>1/6</span>
                        </div>
                        <h2 className="text-[28px] tracking-[-0.04em] text-[#f6f2e9] sm:text-[34px]">
                          NiArgus is context-first
                        </h2>
                        <p className="mt-4 max-w-[38ch] text-[17px] leading-9 text-[#8b8780]">
                          NiArgus indexes reference files outside the diff, learns the repo&apos;s
                          existing patterns, and comments with the same context your strongest
                          reviewer would gather manually.
                        </p>
                        <div className="mt-8 flex items-center gap-3">
                          <div className="h-2.5 w-10 rounded-full bg-[#95918a]" />
                          {[1, 2, 3, 4, 5].map((dot) => (
                            <div key={dot} className="h-2.5 w-6 rounded-full bg-[#2f2f2f]" />
                          ))}
                        </div>
                      </div>
                      <div className="flex min-w-[260px] items-center justify-between gap-4 border-t border-[#303030] px-8 py-8 text-[18px] text-[#d3cec6] xl:border-l xl:border-t-0">
                        <span>Docs →</span>
                        <div className="flex items-center gap-7 text-[#5f5b56]">
                          <span>‹</span>
                          <span>›</span>
                          <span>×</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="rounded-[22px] border border-[#303030] bg-[#1a1a1a] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.01)_inset]">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <div className="text-[17px] text-[#9a958e]">GitHub App</div>
                        <div className="mt-4 rounded-xl bg-[#242424] px-5 py-4 text-[18px] text-[#d8d3ca]">
                          {GITHUB_APP_SLUG.slice(0, 14)}...
                        </div>
                      </div>
                      <span className="pt-1 text-[15px] text-[#6e6a64]">View all</span>
                    </div>
                    <p className="mt-5 max-w-[26ch] text-[15px] leading-8 text-[#84807a]">
                      Install on a personal account or org and route every PR through the same
                      review surface.
                    </p>
                  </div>

                  <div className="mt-8 rounded-[22px] border border-[#303030] bg-[#1a1a1a] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.01)_inset]">
                    <div className="flex items-start justify-between gap-5">
                      <div className="text-[17px] text-[#d5d0c7]">Review Volume · 7 days</div>
                      <span className="text-[15px] text-[#6e6a64]">View all</span>
                    </div>
                    <CoverageChart />
                  </div>
                </div>

                <div>
                  <div className="rounded-[22px] border border-[#303030] bg-[#1a1a1a] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.01)_inset]">
                    <div className="text-[32px] leading-none text-[#cfc9c0]">&gt;_</div>
                    <h3 className="mt-4 text-[34px] tracking-[-0.04em] text-[#f5f1e8]">
                      Install NiArgus
                    </h3>
                    <p className="mt-4 max-w-[34ch] text-[17px] leading-9 text-[#8b8780]">
                      Install the GitHub App, connect your repos, and let NiArgus comment with
                      full-codebase context instead of only diff-local heuristics.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-8 border-b border-[#2e2e2e] pb-4 text-[17px]">
                      <span className="border-b-4 border-[#ece7df] pb-3 text-[#f4efe7]">
                        GitHub App
                      </span>
                      <span className="pb-3 text-[#716c66]">Dashboard</span>
                      <span className="pb-3 text-[#716c66]">API</span>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      {["personal", "org", "enterprise"].map((segment, index) => (
                        <div
                          key={segment}
                          className={`rounded-xl px-4 py-2 text-[15px] ${
                            index === 0
                              ? "bg-[#2f2f2f] text-[#f0ebe2]"
                              : "text-[#8d8882]"
                          }`}
                        >
                          {segment}
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 rounded-[18px] border border-[#353535] bg-[#252525] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[20px] text-[#ddd7ce]">
                          github.com/apps/{GITHUB_APP_SLUG}
                        </div>
                        <a
                          href={INSTALL_URL}
                          className="inline-flex items-center justify-center rounded-xl border border-[#3e3e3e] bg-[#202020] px-5 py-3 text-[15px] text-[#efebe3] transition-colors hover:border-[#555] hover:bg-[#2a2a2a]"
                        >
                          Install ↗
                        </a>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={dashboardHref}
                        className="inline-flex items-center rounded-xl border border-[#363636] bg-[#252525] px-5 py-3 text-[15px] text-[#f4efe7] transition-colors hover:border-[#545454] hover:bg-[#2b2b2b]"
                      >
                        {session ? "Open Dashboard" : "Sign in with GitHub"}
                      </Link>
                      <Link
                        href="/install"
                        className="inline-flex items-center rounded-xl px-5 py-3 text-[15px] text-[#8d8882] transition-colors hover:bg-[#202020] hover:text-[#e5e0d7]"
                      >
                        See install flow
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2 xl:col-span-2 xl:grid-cols-3">
                  {shortcuts.map((shortcut) => (
                    <ShortcutCard key={shortcut.title} {...shortcut} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
