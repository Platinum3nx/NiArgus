import Link from "next/link";

export default function InstallSuccessPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold mb-4">NiArgus is installed</h1>
        <p className="text-zinc-400 mb-3">
          We&apos;re indexing your repos now — this takes a few minutes for large
          codebases.
        </p>
        <p className="text-zinc-400 mb-8">
          Open a PR to see NiArgus in action.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-6 py-3 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
