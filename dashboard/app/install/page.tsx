import Link from "next/link";
import { getSession } from "@/lib/auth";

type PageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

function getFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function buildReturnTo(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        query.append(key, entry);
      }
      continue;
    }

    if (value) {
      query.set(key, value);
    }
  }

  return query.size > 0 ? `/install?${query.toString()}` : "/install";
}

export default async function InstallSuccessPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const session = await getSession();
  const params = await searchParams;
  const returnTo = buildReturnTo(params);
  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  const installationId = Number(getFirstValue(params.installation_id));
  const hasInstallationId =
    Number.isInteger(installationId) && installationId > 0;
  const canAccessInstallation =
    hasInstallationId && !!session?.installationIds.includes(installationId);

  const title = !session
    ? "Finish with GitHub sign-in"
    : canAccessInstallation || !hasInstallationId
      ? "NiArgus is installed"
      : "Refresh GitHub access";
  const description = !session
    ? "Your GitHub App install is ready. Sign in with the same GitHub account to open the dashboard and confirm which installs you can access."
    : canAccessInstallation || !hasInstallationId
      ? "We're indexing your repos now — this takes a few minutes for large codebases."
      : "You're signed in, but this installation is not in your current GitHub access list yet. Re-authorize with GitHub if you just installed for an organization.";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-6">{session ? "🎉" : "🔐"}</div>
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p className="text-zinc-400 mb-3">{description}</p>
        <p className="text-zinc-400 mb-8">
          {session
            ? "Open a PR to see NiArgus in action."
            : "You only need to do this once per browser session."}
        </p>
        {session && (
          <p className="text-zinc-500 text-sm mb-8">Signed in as {session.login}</p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={session ? "/dashboard" : loginHref}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-6 py-3 transition-colors"
          >
            {session ? "Go to Dashboard" : "Sign in with GitHub"}
          </Link>
          {session && hasInstallationId && !canAccessInstallation && (
            <Link
              href={loginHref}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
            >
              Refresh Access
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
