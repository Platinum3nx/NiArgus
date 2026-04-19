import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find installation for this user
  const { data: installation } = await supabaseAdmin
    .from("installations")
    .select("id, github_installation_id")
    .eq("github_account_login", session.login)
    .single();

  if (!installation) {
    return Response.json({ reviews: [], repos: [] });
  }

  // Get repos for this installation
  const { data: repos } = await supabaseAdmin
    .from("repos")
    .select("*")
    .eq("installation_id", installation.id)
    .order("full_name");

  // Get recent reviews
  const { data: reviews } = await supabaseAdmin
    .from("reviews")
    .select("*, repos!inner(*)")
    .eq("repos.installation_id", installation.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return Response.json({
    reviews: reviews || [],
    repos: repos || [],
    installationId: installation.github_installation_id,
  });
}
