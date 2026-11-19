import { redirect } from "next/navigation";

export default async function LegacyTaskDetailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawId = resolved.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (id) {
    redirect(`/tasks/${encodeURIComponent(id)}`);
  }

  redirect("/tasks?notice=missing-task");
}
