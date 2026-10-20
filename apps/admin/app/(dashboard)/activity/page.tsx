import { getActivityFilterOptions, getUserActivityLogs } from "@/app/actions/activity";
import { ActivityClient } from "@/components/activity/activity-client";

export default async function UserActivityPage() {
  const [filterOptions, initialData] = await Promise.all([
    getActivityFilterOptions(),
    getUserActivityLogs({ page: 1, limit: 20 }),
  ]);

  return <ActivityClient filterOptions={filterOptions} initialData={initialData} />;
}
