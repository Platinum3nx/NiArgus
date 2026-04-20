import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.installationIds.length === 0) {
    return Response.json({ reviews: [], repos: [], installations: [] });
  }

  const { data: installations, error: installationsError } = await supabaseAdmin
    .from("installations")
    .select("id, github_installation_id, github_account_login, github_account_type")
    .in("github_installation_id", session.installationIds);

  if (installationsError) {
    console.error("[api/reviews] Failed to load installations:", installationsError);
    return Response.json(
      { error: "Failed to load installations" },
      { status: 500 },
    );
  }

  if (!installations?.length) {
    return Response.json({ reviews: [], repos: [], installations: [] });
  }

  const installationIds = installations.map((installation) => installation.id);
  const { data: repos, error: reposError } = await supabaseAdmin
    .from("repos")
    .select("*")
    .in("installation_id", installationIds)
    .order("full_name");

  if (reposError) {
    console.error("[api/reviews] Failed to load repos:", reposError);
    return Response.json({ error: "Failed to load repos" }, { status: 500 });
  }

  const repoIds = (repos || []).map((repo) => repo.id);
  let reviews = [];

  if (repoIds.length > 0) {
    const { data, error: reviewsError } = await supabaseAdmin
      .from("reviews")
      .select("*, repos(*)")
      .in("repo_id", repoIds)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(50);

    if (reviewsError) {
      console.error("[api/reviews] Failed to load reviews:", reviewsError);
      return Response.json(
        { error: "Failed to load reviews" },
        { status: 500 },
      );
    }

    reviews = data || [];
  }

  return Response.json({
    reviews,
    repos: repos || [],
    installations,
  });
}
