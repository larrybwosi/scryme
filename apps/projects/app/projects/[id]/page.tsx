import { redirect } from "next/navigation";

const TAB_ROUTES = new Set(["overview", "issues", "cycles", "milestones", "docs", "team", "analytics"]);

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const target = tab && TAB_ROUTES.has(tab) ? tab : "overview";
  redirect(`/projects/${id}/${target}`);
}
