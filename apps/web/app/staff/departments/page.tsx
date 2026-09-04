import { Metadata } from "next";
import React, { Suspense } from "react";
import { getDepartments, getDepartmentStats } from "../../actions/department";
import { DepartmentsClient } from "./departments-client";

export const metadata: Metadata = {
  title: "Departments",
  description: "Organize staff members into functional operational departments.",
};


interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function DepartmentsPage({ searchParams }: Props) {
  const { search } = await searchParams;
  const [deptResult, statsResult] = await Promise.all([
    getDepartments(search),
    getDepartmentStats()
  ]);

  const departments = (deptResult.success ? deptResult.data : []) || [];
  const stats = statsResult.success ? statsResult.data : { totalDepartments: 0, totalMembers: 0, totalBudget: 0 };

  return (
    <Suspense>
      <DepartmentsClient initialDepartments={departments as any} stats={stats} />
    </Suspense>
  );
}
