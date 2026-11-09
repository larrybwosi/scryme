"use client";

import { useState, type ReactNode } from "react";
import {
  Blocks,
  Workflow,
  Users,
  Rocket,
  FileText,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";

export type SystemCardId =
  | "modules"
  | "workflow"
  | "customer"
  | "pos"
  | "documents";

export type SystemCardItem = {
  id: SystemCardId;
  title: string;
  description: string;
  /** Short status line, e.g. "12 modules" */
  summary?: string;
  /** The panel rendered inside the dialog when the card is opened */
  panel: ReactNode;
};

// Icons live here because functions can't be passed from a server component.
const ICONS: Record<SystemCardId, LucideIcon> = {
  modules: Blocks,
  workflow: Workflow,
  customer: Users,
  pos: Rocket,
  documents: FileText,
};

export function SystemsCards({ items }: { items: SystemCardItem[] }) {
  const [openId, setOpenId] = useState<SystemCardId | null>(null);
  const active = items.find((item) => item.id === openId) ?? null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = ICONS[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenId(item.id)}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-foreground">
                  {item.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {item.summary ? (
                <p className="mt-auto text-xs font-medium text-muted-foreground">
                  {item.summary}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>

      <Dialog
        open={active !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setOpenId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-5xl">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle>{active.title}</DialogTitle>
                <DialogDescription>{active.description}</DialogDescription>
              </DialogHeader>
              {/* Mounted only while open, so each panel loads on demand */}
              <div className="mt-2">{active.panel}</div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
