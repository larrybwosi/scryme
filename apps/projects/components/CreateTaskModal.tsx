"use client";

import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { DatePicker } from "@repo/ui/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { format } from "date-fns";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Flame,
  Clock,
  Calendar,
  Layers,
  Users,
  Link2,
  CalendarDays,
  UtensilsCrossed,
  Flag,
  RotateCw,
  Tag,
  Folder,
  Check,
  Crown,
  Sparkles,
} from "lucide-react";
import {
  useProjects,
  useTasks,
  useMembers,
  useStaffShifts,
  useMilestones,
  useSprints,
  useTaskLabels,
  useServiceBookings,
  useProductionBatches,
  useCreateTask,
} from "@/lib/hooks/use-projects";
import { Task, CreateTaskInput } from "@/lib/api";
import { effectiveWeeklyCapacity } from "@/lib/metrics";
import { CapacityWarningModal } from "@/components/CapacityWarningModal";
import { Dialog } from "@/components/Dialog";
import { FieldError } from "@/components/PageState";
import { fieldErrorsFrom, notifyError, notifySuccess } from "@/lib/feedback";
import {
  hasErrors,
  validateTaskForm,
  type TaskFormErrors,
} from "@/lib/task-form";
import { FOCUS_RING } from "@/lib/navigation";

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultStatus?: Task["status"];
  defaultBookingId?: string;
  defaultBatchId?: string;
  defaultParentTaskId?: string;
  defaultSprintId?: string;
  defaultMilestoneId?: string;
  defaultStartDate?: string;
  defaultDueDate?: string;
  onTaskCreated?: (task: Task) => void;
}

const FIELD_CLASS =
  "w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary";
const LABEL_CLASS =
  "mb-1 flex items-center gap-1 text-[11px] font-label-badge uppercase tracking-wider text-outline font-semibold";

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-outline-variant/60 bg-surface-container-lowest p-4">
      <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-2">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="font-headline-sm text-body-sm font-semibold text-on-surface">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

export function CreateTaskModal({
  isOpen,
  onClose,
  defaultProjectId,
  defaultStatus = "TODO",
  defaultBookingId,
  defaultBatchId,
  defaultParentTaskId,
  defaultSprintId,
  defaultMilestoneId,
  defaultStartDate,
  defaultDueDate,
  onTaskCreated,
}: CreateTaskModalProps) {
  const { data: projects = [] } = useProjects();
  const { data: allTasks = [] } = useTasks();
  const { data: members = [] } = useMembers();
  const { data: staffShifts = [] } = useStaffShifts();
  const { data: serviceBookings = [] } = useServiceBookings();
  const { data: batches = [] } = useProductionBatches();

  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>(defaultStatus);
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [startDate, setStartDate] = useState(defaultStartDate || "");
  const [dueDate, setDueDate] = useState(defaultDueDate || "");
  const [estimatedHours, setEstimatedHours] = useState("4");
  const [parentTaskId, setParentTaskId] = useState("");

  const [integrationMode, setIntegrationMode] = useState<
    "all" | "crm" | "manufacturing" | "milestone" | "sprint"
  >("all");
  const [milestoneId, setMilestoneId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [batchId, setBatchId] = useState("");

  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<
    { memberId: string; isPrimary: boolean; allocatedHours?: number }[]
  >([]);

  const [errors, setErrors] = useState<TaskFormErrors>({});

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [defaultProjectId, projects, projectId]);

  useEffect(() => {
    if (defaultStatus) setStatus(defaultStatus);
  }, [defaultStatus]);

  useEffect(() => {
    if (defaultBookingId) setBookingId(defaultBookingId);
  }, [defaultBookingId]);

  useEffect(() => {
    if (defaultBatchId) setBatchId(defaultBatchId);
  }, [defaultBatchId]);

  useEffect(() => {
    if (defaultParentTaskId) setParentTaskId(defaultParentTaskId);
  }, [defaultParentTaskId]);

  useEffect(() => {
    if (defaultSprintId) setSprintId(defaultSprintId);
  }, [defaultSprintId]);

  useEffect(() => {
    if (defaultMilestoneId) setMilestoneId(defaultMilestoneId);
  }, [defaultMilestoneId]);

  useEffect(() => {
    if (defaultStartDate) setStartDate(defaultStartDate);
  }, [defaultStartDate]);

  useEffect(() => {
    if (defaultDueDate) setDueDate(defaultDueDate);
  }, [defaultDueDate]);

  const { data: milestones = [] } = useMilestones(projectId);
  const { data: sprints = [] } = useSprints(projectId);
  const { data: labels = [] } = useTaskLabels(projectId);

  const createTaskMutation = useCreateTask(projectId);

  const selectedBooking = useMemo(
    () => serviceBookings.find((b) => b.id === bookingId),
    [serviceBookings, bookingId],
  );

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === batchId),
    [batches, batchId],
  );

  const selectedMilestone = useMemo(
    () => milestones.find((m) => m.id === milestoneId),
    [milestones, milestoneId],
  );

  const selectedSprint = useMemo(
    () => sprints.find((s) => s.id === sprintId),
    [sprints, sprintId],
  );

  const handleApplyCrossSystemAutofill = (
    type: "booking" | "batch" | "milestone",
  ) => {
    if (type === "booking" && selectedBooking) {
      if (!title) {
        setTitle(
          `Execute: ${selectedBooking.serviceName} (${selectedBooking.customer?.name || "Client"})`,
        );
      }
      if (!description && selectedBooking.scheduledStartTime) {
        setDescription(
          `Linked to customer service booking #${selectedBooking.id.slice(-6).toUpperCase()}\nCustomer: ${selectedBooking.customer?.name || "Guest"}\nPhone: ${selectedBooking.customer?.phone || "N/A"}\nScheduled Start: ${selectedBooking.scheduledStartTime}`,
        );
      }
      if (!dueDate && selectedBooking.scheduledStartTime) {
        setDueDate(selectedBooking.scheduledStartTime.split("T")[0]);
      }
      notifySuccess("Details filled from booking");
    } else if (type === "batch" && selectedBatch) {
      if (!title) {
        setTitle(
          `Production Run: ${selectedBatch.batchNumber} (${selectedBatch.recipeName || selectedBatch.runType})`,
        );
      }
      if (!description) {
        setDescription(
          `Linked to manufacturing batch ${selectedBatch.batchNumber}\nStatus: ${selectedBatch.status}\nRun Type: ${selectedBatch.runType}\nOrder Ref: ${selectedBatch.orderReference || "None"}`,
        );
      }
      notifySuccess("Details filled from batch");
    } else if (type === "milestone" && selectedMilestone) {
      if (!title) {
        setTitle(`Deliverable: ${selectedMilestone.title}`);
      }
      if (!dueDate && selectedMilestone.dueDate) {
        setDueDate(selectedMilestone.dueDate.split("T")[0]);
      }
      notifySuccess("Details filled from milestone");
    }
  };

  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<CreateTaskInput | null>(null);
  const [warningMemberName, setWarningMemberName] = useState("");
  const [warningAssignedHours, setWarningAssignedHours] = useState(0);
  const [warningAdditionalHours, setWarningAdditionalHours] = useState(0);
  const [warningCapacityHours, setWarningCapacityHours] = useState(40);

  const candidateParentTasks = useMemo(
    () => allTasks.filter((t) => t.projectId === projectId),
    [allTasks, projectId],
  );

  const checkMemberCapacity = (memberId: string, hoursToAdd: number) => {
    const memberTasks = allTasks.filter(
      (t) =>
        (t.status === "TODO" || t.status === "IN_PROGRESS" || t.status === "IN_REVIEW") &&
        t.assignees?.some((a) => a.member?.id === memberId),
    );
    const currentHours = memberTasks.reduce(
      (acc, curr) => acc + (Number(curr.estimatedHours) || 2),
      0,
    );

    const memberShifts = staffShifts.filter((s) => s.memberId === memberId && s.isActive);
    const totalCapacity = effectiveWeeklyCapacity(memberShifts);

    return {
      currentHours,
      totalCapacity,
      isOverloaded: currentHours + hoursToAdd > totalCapacity,
    };
  };

  const handleToggleMember = (memberId: string) => {
    setAssignedMembers((prev) => {
      const exists = prev.some((a) => a.memberId === memberId);
      if (exists) {
        const remaining = prev.filter((a) => a.memberId !== memberId);
        if (remaining.length > 0 && !remaining.some((a) => a.isPrimary)) {
          remaining[0].isPrimary = true;
        }
        return remaining;
      }
      const isFirst = prev.length === 0;
      const totalEst = parseFloat(estimatedHours) || 4;
      const newShare = Math.round((totalEst / (prev.length + 1)) * 10) / 10;
      return [...prev, { memberId, isPrimary: isFirst, allocatedHours: newShare }];
    });
  };

  const handleSetPrimary = (memberId: string) => {
    setAssignedMembers((prev) =>
      prev.map((a) => ({ ...a, isPrimary: a.memberId === memberId })),
    );
  };

  const handleUpdateAllocatedHours = (memberId: string, hours: number) => {
    setAssignedMembers((prev) =>
      prev.map((a) => (a.memberId === memberId ? { ...a, allocatedHours: hours } : a)),
    );
  };

  const handleToggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateTaskForm({
      title,
      projectId,
      startDate,
      dueDate,
      estimatedHours,
      allocatedHours: assignedMembers.map((a) => a.allocatedHours ?? 0),
    });

    if (hasErrors(validation)) {
      setErrors(validation);
      return;
    }
    setErrors({});

    const estHours = parseFloat(estimatedHours) || 4;

    const payload: CreateTaskInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      projectId,
      status,
      priority,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      estimatedHours: estHours,
      parentTaskId: parentTaskId || undefined,
      milestoneId: milestoneId || undefined,
      sprintId: sprintId || undefined,
      bookingId: bookingId || undefined,
      batchId: batchId || undefined,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      assignees:
        assignedMembers.length > 0
          ? assignedMembers.map((a) => ({
              memberId: a.memberId,
              isPrimary: a.isPrimary,
              allocatedHours: a.allocatedHours || estHours / assignedMembers.length,
            }))
          : undefined,
    };

    if (assignedMembers.length > 0) {
      const primaryAssignee =
        assignedMembers.find((a) => a.isPrimary) || assignedMembers[0];
      const member = members.find((m) => m.id === primaryAssignee.memberId);
      const share = primaryAssignee.allocatedHours || estHours / assignedMembers.length;
      const { currentHours, totalCapacity, isOverloaded } = checkMemberCapacity(
        primaryAssignee.memberId,
        share,
      );

      if (isOverloaded) {
        setPendingPayload(payload);
        setWarningMemberName(member?.name || "Assignee");
        setWarningAssignedHours(currentHours);
        setWarningAdditionalHours(share);
        setWarningCapacityHours(totalCapacity);
        setWarningModalOpen(true);
        return;
      }
    }

    await executeCreate(payload);
  };

  const executeCreate = async (payload: CreateTaskInput) => {
    try {
      const created = await createTaskMutation.mutateAsync(payload);
      notifySuccess("Task created");
      if (onTaskCreated) onTaskCreated(created);
      onClose();
      setTitle("");
      setDescription("");
      setAssignedMembers([]);
      setSelectedLabelIds([]);
      setBookingId("");
      setBatchId("");
      setMilestoneId("");
      setSprintId("");
      setParentTaskId("");
      setDueDate("");
      setStartDate("");
      setErrors({});
      setWarningModalOpen(false);
      setPendingPayload(null);
    } catch (err) {
      const fieldErrors = fieldErrorsFrom(err);
      if (hasErrors(fieldErrors)) setErrors(fieldErrors);
      notifyError(err, "Could not create task");
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        title="Create Issue / Task"
        description="Configure the work item, cross system links, and team assignments."
        className="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-4">
          <Section title="Details" icon={Layers}>
            <div>
              <label htmlFor="task-title" className={LABEL_CLASS}>
                Task title *
              </label>
              <Input
                id="task-title"
                type="text"
                value={title}
                maxLength={200}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "task-title-error" : undefined}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement STOMP WebSocket sync buffer"
                className={FIELD_CLASS}
              />
              <FieldError id="task-title-error" message={errors.title} />
            </div>

            <div>
              <label htmlFor="task-description" className={LABEL_CLASS}>
                Scope / detailed description
              </label>
              <Textarea
                id="task-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Technical specifications, acceptance criteria, reproduction steps..."
                className="w-full bg-surface-container border-outline-variant p-3 text-body-sm text-on-surface focus-visible:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="task-project" className={LABEL_CLASS}>
                  <Folder className="h-3 w-3 text-primary" aria-hidden />
                  <span>Project *</span>
                </label>
                <Select
                  value={projectId}
                  onValueChange={(val) => {
                    setProjectId(val);
                    setErrors((prev) => ({ ...prev, projectId: "" }));
                  }}
                >
                  <SelectTrigger
                    id="task-project"
                    aria-invalid={Boolean(errors.projectId)}
                    className={FIELD_CLASS}
                  >
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.projectId} />
              </div>

              <div>
                <label htmlFor="task-status" className={LABEL_CLASS}>
                  Status
                </label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as Task["status"])}
                >
                  <SelectTrigger id="task-status" className={FIELD_CLASS}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                    <SelectItem value="BACKLOG">Backlog</SelectItem>
                    <SelectItem value="TODO">Todo</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                    <SelectItem value="CANCELED">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="task-priority" className={LABEL_CLASS}>
                  <Flame className="h-3 w-3 text-status-warning" aria-hidden />
                  <span>Priority</span>
                </label>
                <Select
                  value={priority}
                  onValueChange={(val) => setPriority(val as Task["priority"])}
                >
                  <SelectTrigger id="task-priority" className={FIELD_CLASS}>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={LABEL_CLASS}>
                  <Calendar className="h-3 w-3 text-outline" aria-hidden />
                  <span>Start date</span>
                </label>
                <DatePicker
                  value={startDate ? new Date(startDate) : undefined}
                  onChange={(d) => setStartDate(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="Select start date"
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  <Calendar className="h-3 w-3 text-primary" aria-hidden />
                  <span>Due date</span>
                </label>
                <DatePicker
                  value={dueDate ? new Date(dueDate) : undefined}
                  onChange={(d) => setDueDate(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="Select due date"
                  className={FIELD_CLASS}
                />
                <FieldError message={errors.dueDate} />
              </div>

              <div>
                <label htmlFor="task-estimated" className={LABEL_CLASS}>
                  <Clock className="h-3 w-3 text-secondary" aria-hidden />
                  <span>Estimated hours</span>
                </label>
                <Input
                  id="task-estimated"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={estimatedHours}
                  aria-invalid={Boolean(errors.estimatedHours)}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className={FIELD_CLASS}
                />
                <FieldError message={errors.estimatedHours} />
              </div>
            </div>

            {labels.length > 0 && (
              <div>
                <label className={LABEL_CLASS}>
                  <Tag className="h-3.5 w-3.5" aria-hidden />
                  <span>Task labels / tags</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((lbl) => {
                    const isSelected = selectedLabelIds.includes(lbl.id);
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleToggleLabel(lbl.id)}
                        className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-medium transition-all ${FOCUS_RING} ${
                          isSelected
                            ? "border-primary bg-primary-container text-on-primary-container"
                            : "border-outline-variant/60 bg-surface-container text-outline hover:text-on-surface"
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: lbl.color || "var(--color-outline)" }}
                        />
                        <span>{lbl.name}</span>
                        {isSelected && <Check className="h-3 w-3" aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>

          <Section title="Hierarchy" icon={Layers}>
            <div>
              <label htmlFor="task-parent" className={LABEL_CLASS}>
                Parent task / hierarchy link
              </label>
              <Select
                value={parentTaskId || "NONE"}
                onValueChange={(val) => setParentTaskId(val === "NONE" ? "" : val)}
              >
                <SelectTrigger id="task-parent" className={FIELD_CLASS}>
                  <SelectValue placeholder="No parent task (root issue)" />
                </SelectTrigger>
                <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                  <SelectItem value="NONE">No parent task (root issue)</SelectItem>
                  {candidateParentTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      [{t.taskKey || t.id.slice(-6).toUpperCase()}] {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Section title="Cross system links" icon={Link2}>
            <div className="flex flex-wrap items-center gap-1 rounded-sm border border-outline-variant/60 bg-surface-container p-0.5 text-xs">
              {[
                { id: "all", label: "All" },
                { id: "crm", label: "CRM booking" },
                { id: "manufacturing", label: "Production" },
                { id: "milestone", label: "Milestone" },
                { id: "sprint", label: "Sprint" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={integrationMode === tab.id}
                  onClick={() =>
                    setIntegrationMode(
                      tab.id as "all" | "crm" | "manufacturing" | "milestone" | "sprint",
                    )
                  }
                  className={`rounded-sm px-2 py-1 text-[11px] font-medium transition-all ${FOCUS_RING} ${
                    integrationMode === tab.id
                      ? "bg-surface-container-highest text-primary shadow-xs"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(integrationMode === "all" || integrationMode === "crm") && (
                <div className="flex flex-col gap-1.5 rounded-sm border border-outline-variant/40 bg-surface-container/40 p-2.5">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_CLASS}>
                      <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden />
                      <span>Customer service booking</span>
                    </label>
                    {selectedBooking && (
                      <button
                        type="button"
                        onClick={() => handleApplyCrossSystemAutofill("booking")}
                        className={`flex items-center gap-0.5 text-[10px] text-primary hover:underline ${FOCUS_RING}`}
                      >
                        <Sparkles className="h-2.5 w-2.5" aria-hidden />
                        <span>Autofill</span>
                      </button>
                    )}
                  </div>
                  <Select
                    value={bookingId || "NONE"}
                    onValueChange={(val) => setBookingId(val === "NONE" ? "" : val)}
                  >
                    <SelectTrigger className={FIELD_CLASS}>
                      <SelectValue placeholder="No booking linked" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                      <SelectItem value="NONE">No booking linked</SelectItem>
                      {serviceBookings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.serviceName} ({b.customer?.name || "Guest"}) - {b.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBooking && (
                    <div className="mt-1 flex flex-col gap-1 rounded-sm border border-primary/20 bg-surface-container-high/60 p-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-on-surface">
                          {selectedBooking.serviceName}
                        </span>
                        <span className="rounded-sm bg-primary/20 px-1.5 py-0.5 font-label-code text-[10px] text-primary">
                          {selectedBooking.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-outline">
                        <span>Client: {selectedBooking.customer?.name || "Guest"}</span>
                        <span>
                          {selectedBooking.scheduledStartTime
                            ? new Date(selectedBooking.scheduledStartTime).toLocaleDateString()
                            : "--"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(integrationMode === "all" || integrationMode === "manufacturing") && (
                <div className="flex flex-col gap-1.5 rounded-sm border border-outline-variant/40 bg-surface-container/40 p-2.5">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_CLASS}>
                      <UtensilsCrossed className="h-3.5 w-3.5 text-status-warning" aria-hidden />
                      <span>Production batch link</span>
                    </label>
                    {selectedBatch && (
                      <button
                        type="button"
                        onClick={() => handleApplyCrossSystemAutofill("batch")}
                        className={`flex items-center gap-0.5 text-[10px] text-status-warning hover:underline ${FOCUS_RING}`}
                      >
                        <Sparkles className="h-2.5 w-2.5" aria-hidden />
                        <span>Autofill</span>
                      </button>
                    )}
                  </div>
                  <Select
                    value={batchId || "NONE"}
                    onValueChange={(val) => setBatchId(val === "NONE" ? "" : val)}
                  >
                    <SelectTrigger className={FIELD_CLASS}>
                      <SelectValue placeholder="No batch linked" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                      <SelectItem value="NONE">No batch linked</SelectItem>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batchNumber} - {batch.recipeName || batch.runType} ({batch.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBatch && (
                    <div className="mt-1 flex flex-col gap-1 rounded-sm border border-status-warning/20 bg-surface-container-high/60 p-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-on-surface">
                          {selectedBatch.batchNumber}
                        </span>
                        <span className="rounded-sm bg-status-warning/20 px-1.5 py-0.5 font-label-code text-[10px] text-status-warning">
                          {selectedBatch.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-outline">
                        <span>Run: {selectedBatch.runType}</span>
                        <span>
                          {selectedBatch.recipeName ||
                            selectedBatch.orderReference ||
                            "Standard run"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(integrationMode === "all" || integrationMode === "milestone") && (
                <div className="flex flex-col gap-1.5 rounded-sm border border-outline-variant/40 bg-surface-container/40 p-2.5">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_CLASS}>
                      <Flag className="h-3.5 w-3.5 text-status-info" aria-hidden />
                      <span>Project milestone</span>
                    </label>
                    {selectedMilestone && (
                      <button
                        type="button"
                        onClick={() => handleApplyCrossSystemAutofill("milestone")}
                        className={`flex items-center gap-0.5 text-[10px] text-status-info hover:underline ${FOCUS_RING}`}
                      >
                        <Sparkles className="h-2.5 w-2.5" aria-hidden />
                        <span>Autofill</span>
                      </button>
                    )}
                  </div>
                  <Select
                    value={milestoneId || "NONE"}
                    onValueChange={(val) => setMilestoneId(val === "NONE" ? "" : val)}
                  >
                    <SelectTrigger className={FIELD_CLASS}>
                      <SelectValue placeholder="No milestone linked" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                      <SelectItem value="NONE">No milestone linked</SelectItem>
                      {milestones.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.title} ({m.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedMilestone && (
                    <div className="mt-1 flex flex-col gap-1 rounded-sm border border-status-info/20 bg-surface-container-high/60 p-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-on-surface">
                          {selectedMilestone.title}
                        </span>
                        <span className="rounded-sm bg-status-info/20 px-1.5 py-0.5 font-label-code text-[10px] text-status-info">
                          {selectedMilestone.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-outline">
                        <span>
                          Target:{" "}
                          {selectedMilestone.dueDate
                            ? new Date(selectedMilestone.dueDate).toLocaleDateString()
                            : "No date"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(integrationMode === "all" || integrationMode === "sprint") && (
                <div className="flex flex-col gap-1.5 rounded-sm border border-outline-variant/40 bg-surface-container/40 p-2.5">
                  <label className={LABEL_CLASS}>
                    <RotateCw className="h-3.5 w-3.5 text-secondary" aria-hidden />
                    <span>Sprint / iteration cycle</span>
                  </label>
                  <Select
                    value={sprintId || "NONE"}
                    onValueChange={(val) => setSprintId(val === "NONE" ? "" : val)}
                  >
                    <SelectTrigger className={FIELD_CLASS}>
                      <SelectValue placeholder="No sprint linked" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                      <SelectItem value="NONE">No sprint linked</SelectItem>
                      {sprints.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSprint && (
                    <div className="mt-1 flex flex-col gap-1 rounded-sm border border-secondary/20 bg-surface-container-high/60 p-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-on-surface">
                          {selectedSprint.name}
                        </span>
                        <span className="rounded-sm bg-secondary/20 px-1.5 py-0.5 font-label-code text-[10px] text-secondary">
                          {selectedSprint.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-outline">
                        <span>
                          {selectedSprint.startDate
                            ? new Date(selectedSprint.startDate).toLocaleDateString()
                            : ""}{" "}
                          -{" "}
                          {selectedSprint.endDate
                            ? new Date(selectedSprint.endDate).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>

          <Section title="Assignments" icon={Users}>
            <div className="flex items-center justify-between">
              <p className="font-body-sm text-[11px] text-outline">
                Choose members, then set the lead role and allocated hours.
              </p>
              <span className="font-label-code text-[11px] text-outline">
                {assignedMembers.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => {
                const assigned = assignedMembers.find((a) => a.memberId === m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={Boolean(assigned)}
                    onClick={() => handleToggleMember(m.id)}
                    className={`flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-xs transition-all ${FOCUS_RING} ${
                      assigned
                        ? "border-primary bg-surface-container-high text-on-surface"
                        : "border-outline-variant/60 bg-surface-container text-outline hover:text-on-surface"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                      {m.name.charAt(0)}
                    </span>
                    <span>{m.name}</span>
                    {assigned?.isPrimary && (
                      <span
                        title="Primary lead"
                        className="flex items-center gap-0.5 rounded-sm bg-primary-container px-1 py-0.5 text-[9px] font-bold text-on-primary-container"
                      >
                        <Crown className="h-2.5 w-2.5" aria-hidden />
                        Lead
                      </span>
                    )}
                    {assigned && !assigned.isPrimary && (
                      <Check className="h-3 w-3 text-primary" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>

            {assignedMembers.length > 0 && (
              <div className="mt-2 divide-y divide-outline-variant/40 overflow-hidden rounded-sm border border-outline-variant/40 bg-surface-container">
                <div className="flex items-center justify-between bg-surface-container-high/50 px-3 py-2 font-label-badge text-[11px] uppercase text-outline">
                  <span>Assignee</span>
                  <div className="flex items-center gap-6">
                    <span className="w-24 text-center">Role</span>
                    <span className="w-28 text-right">Allocated hours</span>
                  </div>
                </div>

                {assignedMembers.map((assigned, index) => {
                  const member = members.find((m) => m.id === assigned.memberId);
                  return (
                    <div
                      key={assigned.memberId}
                      className="flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-surface-container-high/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-container/30 text-[11px] font-semibold text-primary">
                          {member?.name.charAt(0) || "U"}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-on-surface">
                            {member?.name || "Member"}
                          </span>
                          <span className="text-[10px] text-outline">{member?.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(assigned.memberId)}
                          className={`flex w-24 items-center justify-center gap-1 rounded-sm border px-2 py-1 text-[11px] font-medium transition-colors ${FOCUS_RING} ${
                            assigned.isPrimary
                              ? "border-primary bg-primary-container text-on-primary-container"
                              : "border-outline-variant/60 bg-surface-container-high text-outline hover:text-on-surface"
                          }`}
                        >
                          <Crown className="h-3 w-3" aria-hidden />
                          <span>{assigned.isPrimary ? "Lead" : "Contributor"}</span>
                        </button>

                        <div className="flex w-28 items-center justify-end gap-1">
                          <Input
                            type="number"
                            step="0.5"
                            min="0.5"
                            aria-label={`Allocated hours for ${member?.name || "member"}`}
                            aria-invalid={Boolean(
                              errors[`assignees.${index}.allocatedHours`],
                            )}
                            value={assigned.allocatedHours || ""}
                            onChange={(e) =>
                              handleUpdateAllocatedHours(
                                assigned.memberId,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="Hours"
                            className="h-7 w-16 border-outline-variant bg-surface-container-low px-2 text-right text-xs text-on-surface focus-visible:border-primary"
                          />
                          <span className="text-[11px] text-outline">hrs</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <FieldError message={errors["assignees.0.allocatedHours"]} />
          </Section>

          <div className="flex items-center justify-end gap-2 border-t border-outline-variant/60 pt-3">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-sm px-4 py-2 font-body-sm text-body-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface ${FOCUS_RING}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTaskMutation.isPending}
              className={`flex items-center gap-1.5 rounded-sm bg-primary-container px-5 py-2 font-headline-sm text-body-sm text-on-primary-container shadow-sm transition-all hover:bg-primary-container/90 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span>{createTaskMutation.isPending ? "Creating..." : "Create Task"}</span>
            </button>
          </div>
        </form>
      </Dialog>

      <CapacityWarningModal
        isOpen={warningModalOpen}
        memberName={warningMemberName}
        currentAssignedHours={warningAssignedHours}
        additionalHours={warningAdditionalHours}
        totalCapacityHours={warningCapacityHours}
        onConfirm={() => {
          if (pendingPayload) executeCreate(pendingPayload);
        }}
        onCancel={() => {
          setWarningModalOpen(false);
          setPendingPayload(null);
        }}
      />
    </>
  );
}
