"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
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
import { CapacityWarningModal } from "@/components/CapacityWarningModal";
import { toast } from "sonner";

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
  onTaskCreated?: (task: Task) => void;
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
  onTaskCreated,
}: CreateTaskModalProps) {
  const { data: projects = [] } = useProjects();
  const { data: allTasks = [] } = useTasks();
  const { data: members = [] } = useMembers();
  const { data: staffShifts = [] } = useStaffShifts();
  const { data: serviceBookings = [] } = useServiceBookings();
  const { data: batches = [] } = useProductionBatches();

  // Basic Details
  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>(defaultStatus);
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("4");
  const [parentTaskId, setParentTaskId] = useState("");

  // Integrations & Iteration
  const [milestoneId, setMilestoneId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [batchId, setBatchId] = useState("");

  // Labels
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  // Assignees: multi-member assignment with primary lead & allocated hours
  const [assignedMembers, setAssignedMembers] = useState<{
    memberId: string;
    isPrimary: boolean;
    allocatedHours?: number;
  }[]>([]);

  // Active project selection defaults
  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [defaultProjectId, projects]);

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

  // Project-dependent data
  const { data: milestones = [] } = useMilestones(projectId);
  const { data: sprints = [] } = useSprints(projectId);
  const { data: labels = [] } = useTaskLabels(projectId);

  const createTaskMutation = useCreateTask(projectId);

  // Capacity Warning Modal State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<CreateTaskInput | null>(null);
  const [warningMemberName, setWarningMemberName] = useState("");
  const [warningAssignedHours, setWarningAssignedHours] = useState(0);
  const [warningAdditionalHours, setWarningAdditionalHours] = useState(0);
  const [warningCapacityHours, setWarningCapacityHours] = useState(40);

  // Filter possible parent tasks within project
  const candidateParentTasks = useMemo(() => {
    return allTasks.filter((t) => t.projectId === projectId);
  }, [allTasks, projectId]);

  const checkMemberCapacity = (memberId: string, hoursToAdd: number) => {
    const memberTasks = allTasks.filter(
      (t) =>
        (t.status === "TODO" || t.status === "IN_PROGRESS" || t.status === "IN_REVIEW") &&
        t.assignees?.some((a) => a.member?.id === memberId)
    );
    const currentHours = memberTasks.reduce(
      (acc, curr) => acc + (Number(curr.estimatedHours) || 2),
      0
    );

    const memberShifts = staffShifts.filter((s) => s.memberId === memberId && s.isActive);
    let shiftHours = 0;
    for (const s of memberShifts) {
      const [h1, m1] = s.startTime.split(":").map(Number);
      const [h2, m2] = s.endTime.split(":").map(Number);
      const diffM = h2 * 60 + m2 - (h1 * 60 + m1);
      if (diffM > 0) shiftHours += diffM / 60;
    }
    const totalCapacity = shiftHours > 0 ? shiftHours : 40;

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
      } else {
        const isFirst = prev.length === 0;
        const totalEst = parseFloat(estimatedHours) || 4;
        const newShare = Math.round((totalEst / (prev.length + 1)) * 10) / 10;
        return [
          ...prev,
          {
            memberId,
            isPrimary: isFirst,
            allocatedHours: newShare,
          },
        ];
      }
    });
  };

  const handleSetPrimary = (memberId: string) => {
    setAssignedMembers((prev) =>
      prev.map((a) => ({
        ...a,
        isPrimary: a.memberId === memberId,
      }))
    );
  };

  const handleUpdateAllocatedHours = (memberId: string, hours: number) => {
    setAssignedMembers((prev) =>
      prev.map((a) => (a.memberId === memberId ? { ...a, allocatedHours: hours } : a))
    );
  };

  const handleToggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) {
      toast.error("Please enter a task title and select a project");
      return;
    }

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
      const primaryAssignee = assignedMembers.find((a) => a.isPrimary) || assignedMembers[0];
      const member = members.find((m) => m.id === primaryAssignee.memberId);
      const share = primaryAssignee.allocatedHours || estHours / assignedMembers.length;
      const { currentHours, totalCapacity, isOverloaded } = checkMemberCapacity(
        primaryAssignee.memberId,
        share
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
      toast.success(`Task ${created.taskKey || ""} created successfully`);
      if (onTaskCreated) onTaskCreated(created);
      onClose();
      // Reset form
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
      setWarningModalOpen(false);
      setPendingPayload(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create task");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-6 rounded-xl bg-surface-container-low border border-outline-variant/40 p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span>Create Issue / Task</span>
            </h2>
            <p className="text-body-sm text-outline mt-0.5">
              Configure cross-system work item, enterprise integrations, and team member assignments.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Section 1: Core Task Identity */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-label-badge uppercase tracking-wider text-on-surface mb-1 font-semibold">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement STOMP WebSocket sync buffer"
                className="w-full h-9 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
              />
            </div>

            <div>
              <label className="block text-[11px] font-label-badge uppercase tracking-wider text-outline mb-1 font-semibold">
                Scope / Detailed Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Technical specifications, acceptance criteria, reproduction steps..."
                className="w-full p-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-label-badge uppercase text-outline mb-1 flex items-center gap-1">
                  <Folder className="h-3 w-3 text-primary" />
                  <span>Project *</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-label-badge uppercase text-outline mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Task["status"])}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELED">Canceled</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-label-badge uppercase text-outline mb-1 flex items-center gap-1">
                  <Flame className="h-3 w-3 text-amber-400" />
                  <span>Priority</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Task["priority"])}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary"
                >
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-label-badge uppercase text-outline mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-outline" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-label-badge uppercase text-outline mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span>Due Date</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-label-badge uppercase text-outline mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-secondary" />
                  <span>Estimated Hours</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Parent Task Link */}
            <div>
              <label className="block text-[11px] font-label-badge uppercase text-outline mb-1">
                Parent Task / Hierarchy Link (Optional)
              </label>
              <select
                value={parentTaskId}
                onChange={(e) => setParentTaskId(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary"
              >
                <option value="">No Parent Task (Root Issue)</option>
                {candidateParentTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.taskKey || t.id.slice(-6).toUpperCase()}] {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Cross-System Integrations */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
              <Link2 className="h-4 w-4 text-primary" />
              <span className="font-headline-sm text-body-md text-on-surface font-semibold">
                Enterprise & Lifecycle Integrations
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Customer Service Booking Link */}
              <div>
                <label className="block text-[11px] font-label-badge uppercase text-outline mb-1 flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  <span>Customer Service Booking</span>
                </label>
                <select
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary"
                >
                  <option value="">No Booking Linked</option>
                  {serviceBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.serviceName} ({b.customer?.name || "Guest"}) - {b.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manufacturing / Production Batch Link */}
              <div>
                <label className="block text-[11px] font-label-badge uppercase text-outline mb-1 flex items-center gap-1.5">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-amber-400" />
                  <span>Production Batch Link</span>
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary"
                >
                  <option value="">No Batch Linked</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batchNumber} - {batch.recipeName || batch.runType} ({batch.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Milestone Link */}
              <div>
                <label className="block text-[11px] font-label-badge uppercase text-outline mb-1 flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-purple-400" />
                  <span>Project Milestone</span>
                </label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary"
                >
                  <option value="">No Milestone Linked</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sprint / Cycle Link */}
              <div>
                <label className="block text-[11px] font-label-badge uppercase text-outline mb-1 flex items-center gap-1.5">
                  <RotateCw className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Sprint / Iteration Cycle</span>
                </label>
                <select
                  value={sprintId}
                  onChange={(e) => setSprintId(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary"
                >
                  <option value="">No Sprint Linked</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Labels & Tags */}
          {labels.length > 0 && (
            <div>
              <label className="block text-[11px] font-label-badge uppercase text-outline mb-1.5 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-outline" />
                <span>Task Labels / Tags</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((lbl) => {
                  const isSelected = selectedLabelIds.includes(lbl.id);
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => handleToggleLabel(lbl.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? "bg-primary-container text-on-primary-container border-primary"
                          : "bg-surface-container text-outline hover:text-on-surface border-outline-variant/30"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: lbl.color || "#6B7280" }}
                      />
                      <span>{lbl.name}</span>
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: Squad & Member Assignment with Capacity Planning */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-headline-sm text-body-md text-on-surface font-semibold">
                  Member Assignments & Workload Allocation
                </span>
              </div>
              <span className="text-[11px] font-label-code text-outline">
                {assignedMembers.length} Selected
              </span>
            </div>

            {/* Member Pill Selector */}
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => {
                const assigned = assignedMembers.find((a) => a.memberId === m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleToggleMember(m.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                      assigned
                        ? "bg-surface-container-high text-on-surface border-primary"
                        : "bg-surface-container text-outline hover:text-on-surface border-outline-variant/30"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <span>{m.name}</span>
                    {assigned?.isPrimary && (
                      <span
                        title="Primary Lead"
                        className="px-1 py-0.2 rounded bg-primary-container text-on-primary-container text-[9px] font-bold flex items-center gap-0.5"
                      >
                        <Crown className="h-2.5 w-2.5" />
                        Lead
                      </span>
                    )}
                    {assigned && !assigned.isPrimary && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Detailed Assignee Table: Lead selection & allocated hours */}
            {assignedMembers.length > 0 && (
              <div className="mt-2 divide-y divide-outline-variant/20 rounded-lg border border-outline-variant/20 bg-surface-container overflow-hidden">
                <div className="px-3 py-2 bg-surface-container-high/50 flex items-center justify-between text-[11px] font-label-badge uppercase text-outline">
                  <span>Assignee</span>
                  <div className="flex items-center gap-6">
                    <span className="w-24 text-center">Role</span>
                    <span className="w-28 text-right">Allocated Hours</span>
                  </div>
                </div>

                {assignedMembers.map((assigned) => {
                  const member = members.find((m) => m.id === assigned.memberId);
                  return (
                    <div
                      key={assigned.memberId}
                      className="px-3 py-2.5 flex items-center justify-between hover:bg-surface-container-high/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-container/30 text-primary flex items-center justify-center text-[11px] font-semibold">
                          {member?.name.charAt(0) || "U"}
                        </div>
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
                          className={`w-24 px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1 border ${
                            assigned.isPrimary
                              ? "bg-primary-container text-on-primary-container border-primary"
                              : "bg-surface-container-high text-outline hover:text-on-surface border-outline-variant/30"
                          }`}
                        >
                          <Crown className="h-3 w-3" />
                          <span>{assigned.isPrimary ? "Lead" : "Contributor"}</span>
                        </button>

                        <div className="w-28 flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={assigned.allocatedHours || ""}
                            onChange={(e) =>
                              handleUpdateAllocatedHours(
                                assigned.memberId,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="Hours"
                            className="w-16 h-7 px-2 text-right rounded bg-surface-container-low border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary"
                          />
                          <span className="text-[11px] text-outline">hrs</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
            <span className="text-[11px] text-outline font-label-code">
              Cross-system event synchronizer enabled
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-body-sm text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="px-5 py-2 bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded-lg font-headline-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>{createTaskMutation.isPending ? "Creating..." : "Create Task"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Capacity Warning Soft Modal */}
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
    </div>
  );
}
