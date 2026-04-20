import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect(`/api/auth/login?returnTo=${encodeURIComponent("/dashboard")}`);
  }

  return <DashboardClient session={session} />;
}
