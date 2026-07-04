import { requireSession } from "@/app/lib/session";
export default async function DashboardPage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = await params;
  await requireSession(orgSlug);
  return <h2>Dashboard</h2>;
}