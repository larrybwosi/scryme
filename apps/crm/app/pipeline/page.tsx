import { Metadata } from "next";
import { KanbanBoardView } from "./_components/kanban-board-view";

export const metadata: Metadata = {
  title: "Deal Pipeline",
  description:
    "Manage sales stages, track deal progress, and update opportunities visually using the Kanban board.",
  alternates: {
    canonical: "/pipeline",
  },
};

export default async function PipelinePage() {
  return <KanbanBoardView />;
}
