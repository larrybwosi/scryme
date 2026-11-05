"use client";

import React, { use } from "react";
import TaskDetailPage from "../../task-detail/page";

export default function TaskParamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return <TaskDetailPage taskId={resolvedParams.id} />;
}
