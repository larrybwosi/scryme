"use client";

import { MilestonesTab } from "@/components/project-tabs/MilestonesTab";

export default function StandaloneMilestonesPage() {
  return (
    <div className="flex flex-col w-full pb-16">
      <MilestonesTab />
    </div>
  );
}
