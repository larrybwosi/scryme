"use client";

import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { DatePicker } from "@repo/ui/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { format } from "date-fns";
import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  useCreateProject,
  useCreateTask,
} from "@/lib/hooks/use-projects";
import { Task, CreateTaskInput } from "@/lib/api";
import { CapacityWarningModal } from "@/components/CapacityWarningModal";
import {
  Folder,
  CheckSquare,
  ArrowLeft,
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
  Check,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

function NewProjectOrTaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType =
    searchParams.get("type")?.toUpperCase() === "PROJECT" ? "PROJECT" : "TASK";

  const { data: projects = [] } = useProjects();
  const { data: allTasks = [] } = useTasks();
  const { data: members = [] } = useMembers();
  const { data: staffShifts = [] } = useStaffShifts();
  const { data: serviceBookings = [] } = useServiceBookings();
  const { data: batches = [] } = useProductionBatches();

  const createProject = useCreateProject();
  const createTask = useCreateTask();

  const [type, setType] = useState<"PROJECT" | "TASK">(initialType);

  useEffect(() => {
    const paramType = searchParams.get("type")?.toUpperCase();
    if (paramType === "PROJECT" || paramType === "TASK") {
      setType(paramType);
    }
  }, [searchParams]);

  // Project state
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectPriority, setProjectPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");

  // Task state
  const [projectId, setProjectId] = useState(
    searchParams.get("projectId") || (projects.length > 0 ? projects[0].id : "")
  );

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("HIGH");
  const [status, setStatus] = useState<Task["status"]>("TODO");
  const [estimatedHours, setEstimatedHours] = useState("4");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [parentTaskId, setParentTaskId] = useState("");

  // Integrations state
  const [milestoneId, setMilestoneId] = useState(searchParams.get("milestoneId") || "");
  const [sprintId, setSprintId] = useState(searchParams.get("sprintId") || "");
  const [bookingId, setBookingId] = useState(searchParams.get("bookingId") || "");
  const [batchId, setBatchId] = useState(searchParams.get("batchId") || "");

  // Labels
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  // Assignees: multi-member assignment
  const [assignedMembers, setAssignedMembers] = useState<{
    memberId: string;
    isPrimary: boolean;
    allocatedHours?: number;
  }[]>([]);

  // Project-dependent data
  const { data: milestones = [] } = useMilestones(projectId);
  const { data: sprints = [] } = useSprints(projectId);
  const { data: labels = [] } = useTaskLabels(projectId);

  // Capacity Warning Modal State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<CreateTaskInput | null>(null);
  const [warningMemberName, setWarningMemberName] = useState("");
  const [warningAssignedHours, setWarningAssignedHours] = useState(0);
  const [warningAdditionalHours, setWarningAdditionalHours] = useState(0);
  const [warningCapacityHours, setWarningCapacityHours] = useState(40);

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

    if (type === "PROJECT") {
      if (!projectName.trim()) return;
      createProject.mutate(
        {
          name: projectName,
          key: projectKey.trim() || undefined,
          description: projectDescription,
          priority: projectPriority,
        },
        {
          onSuccess: () => {
            toast.success("Project created successfully");
            router.push("/projects");
          },
          onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to create project");
          },
        }
      );
    } else {
      if (!title.trim() || !projectId) {
        toast.error("Please provide a title and select a project");
        return;
      }

      const estHours = parseFloat(estimatedHours) || 4;

      const payload: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        projectId,
        priority,
        status,
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
        const primary = assignedMembers.find((a) => a.isPrimary) || assignedMembers[0];
        const member = members.find((m) => m.id === primary.memberId);
        const share = primary.allocatedHours || estHours / assignedMembers.length;
        const { currentHours, totalCapacity, isOverloaded } = checkMemberCapacity(
          primary.memberId,
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

      await executeCreateTask(payload);
    }
  };

  const executeCreateTask = async (payload: CreateTaskInput) => {
    try {
      await createTask.mutateAsync(payload);
      toast.success("Task created successfully");
      router.push("/tasks");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create task");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <Link
            href="/projects"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Workspace</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            {type === "PROJECT" ? (
              <Folder className="h-5 w-5 text-primary" />
            ) : (
              <CheckSquare className="h-5 w-5 text-primary" />
            )}
            <span>Create New {type === "PROJECT" ? "Project" : "Task / Work Item"}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Add a new initiative or execution task to your Scryme workspace with all integrations.
          </p>
        </div>

        {/* Type Switcher */}
        <div className="flex items-center gap-1 bg-[#12141A] p-1 rounded-md border border-[#2E3039] text-xs">
          <button
            type="button"
            onClick={() => setType("TASK")}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              type === "TASK"
                ? "bg-[#5E6AD2] text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Task</span>
          </button>
          <button
            type="button"
            onClick={() => setType("PROJECT")}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              type === "PROJECT"
                ? "bg-[#5E6AD2] text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>Project</span>
          </button>
        </div>
      </div>

      {/* Creation Form */}
      <form onSubmit={handleSubmit} className="bg-[#12141A] border border-[#2E3039] rounded-xl p-6 space-y-6">
        {type === "PROJECT" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Project Name *
                </label>
                <Input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Nexus 2.0 Redesign"
                  className="w-full bg-[#171922] border-[#2E3039] text-xs text-slate-200 placeholder:text-slate-500 focus-visible:border-[#5E6AD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Project Key (Optional)
                </label>
                <Input
                  type="text"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                  placeholder="e.g. NEX"
                  maxLength={6}
                  className="w-full bg-[#171922] border-[#2E3039] text-xs text-slate-200 placeholder:text-slate-500 focus-visible:border-[#5E6AD2] uppercase font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Description / Purpose
              </label>
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={4}
                placeholder="High level initiative goals and roadmap milestones..."
                className="w-full bg-[#171922] border-[#2E3039] p-3 text-xs text-slate-200 placeholder:text-slate-500 focus-visible:border-[#5E6AD2]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Priority</span>
              </label>
              <Select value={projectPriority} onValueChange={(val) => setProjectPriority(val as any)}>
                <SelectTrigger className="w-full sm:w-60 bg-[#171922] border-[#2E3039] text-xs text-slate-200">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-[#171922] border-[#2E3039] text-slate-200">
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Core Task Info */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Task Title *
                </label>
                <Input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement WebGL streaming buffer"
                  className="w-full bg-[#171922] border-[#2E3039] text-xs text-slate-200 placeholder:text-slate-500 focus-visible:border-[#5E6AD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Description / Technical Scope
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Technical details, acceptance criteria, or specification links..."
                  className="w-full bg-[#171922] border-[#2E3039] p-3 text-xs text-slate-200 placeholder:text-slate-500 focus-visible:border-[#5E6AD2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                    <Folder className="h-3.5 w-3.5 text-primary" />
                    <span>Project *</span>
                  </label>
                  <Select value={projectId} onValueChange={(val) => setProjectId(val)}>
                    <SelectTrigger className="w-full bg-[#171922] border-[#2E3039] text-xs text-slate-200">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171922] border-[#2E3039] text-slate-200">
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.key})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Status
                  </label>
                  <Select value={status} onValueChange={(val) => setStatus(val as Task["status"])}>
                    <SelectTrigger className="w-full bg-[#171922] border-[#2E3039] text-xs text-slate-200">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171922] border-[#2E3039] text-slate-200">
                      <SelectItem value="BACKLOG">Backlog</SelectItem>
                      <SelectItem value="TODO">Todo</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="IN_REVIEW">In Review</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                      <SelectItem value="CANCELED">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    <span>Priority</span>
                  </label>
                  <Select value={priority} onValueChange={(val) => setPriority(val as Task["priority"])}>
                    <SelectTrigger className="w-full bg-[#171922] border-[#2E3039] text-xs text-slate-200">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171922] border-[#2E3039] text-slate-200">
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Start Date</span>
                  </label>
                  <DatePicker
                    value={startDate ? new Date(startDate) : undefined}
                    onChange={(d) => setStartDate(d ? format(d, "yyyy-MM-dd") : "")}
                    placeholder="Select start date"
                    className="w-full bg-[#171922] border-[#2E3039] text-xs text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>Due Date</span>
                  </label>
                  <DatePicker
                    value={dueDate ? new Date(dueDate) : undefined}
                    onChange={(d) => setDueDate(d ? format(d, "yyyy-MM-dd") : "")}
                    placeholder="Select due date"
                    className="w-full bg-[#171922] border-[#2E3039] text-xs text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-secondary" />
                    <span>Estimated Hours</span>
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-full bg-[#171922] border-[#2E3039] text-xs text-slate-200 focus-visible:border-[#5E6AD2]"
                  />
                </div>
              </div>

              {/* Parent Task Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Parent Task Link (Optional)
                </label>
                <Select value={parentTaskId || "NONE"} onValueChange={(val) => setParentTaskId(val === "NONE" ? "" : val)}>
                  <SelectTrigger className="w-full bg-[#171922] border-[#2E3039] text-xs text-slate-200">
                    <SelectValue placeholder="No Parent (Root Issue)" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#171922] border-[#2E3039] text-slate-200">
                    <SelectItem value="NONE">No Parent (Root Issue)</SelectItem>
                    {allTasks
                      .filter((t) => t.projectId === projectId)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          [{t.taskKey || t.id.slice(-6).toUpperCase()}] {t.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Integrations Section */}
            <div className="p-4 rounded-lg bg-[#171922] border border-[#2E3039] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#2E3039]">
                <Link2 className="h-4 w-4 text-[#5E6AD2]" />
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Cross-System Integrations
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    <span>Customer Service Booking</span>
                  </label>
                  <Select value={bookingId || "NONE"} onValueChange={(val) => setBookingId(val === "NONE" ? "" : val)}>
                    <SelectTrigger className="w-full bg-[#12141A] border-[#2E3039] text-xs text-slate-200">
                      <SelectValue placeholder="No Booking Linked" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12141A] border-[#2E3039] text-slate-200">
                      <SelectItem value="NONE">No Booking Linked</SelectItem>
                      {serviceBookings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.serviceName} ({b.customer?.name || "Guest"}) - {b.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-amber-400" />
                    <span>Production Batch Link</span>
                  </label>
                  <Select value={batchId || "NONE"} onValueChange={(val) => setBatchId(val === "NONE" ? "" : val)}>
                    <SelectTrigger className="w-full bg-[#12141A] border-[#2E3039] text-xs text-slate-200">
                      <SelectValue placeholder="No Batch Linked" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12141A] border-[#2E3039] text-slate-200">
                      <SelectItem value="NONE">No Batch Linked</SelectItem>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batchNumber} - {batch.recipeName || batch.runType} ({batch.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5 text-purple-400" />
                    <span>Project Milestone</span>
                  </label>
                  <Select value={milestoneId || "NONE"} onValueChange={(val) => setMilestoneId(val === "NONE" ? "" : val)}>
                    <SelectTrigger className="w-full bg-[#12141A] border-[#2E3039] text-xs text-slate-200">
                      <SelectValue placeholder="No Milestone Linked" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12141A] border-[#2E3039] text-slate-200">
                      <SelectItem value="NONE">No Milestone Linked</SelectItem>
                      {milestones.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.title} ({m.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                    <RotateCw className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Sprint / Iteration Cycle</span>
                  </label>
                  <Select value={sprintId || "NONE"} onValueChange={(val) => setSprintId(val === "NONE" ? "" : val)}>
                    <SelectTrigger className="w-full bg-[#12141A] border-[#2E3039] text-xs text-slate-200">
                      <SelectValue placeholder="No Sprint Linked" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12141A] border-[#2E3039] text-slate-200">
                      <SelectItem value="NONE">No Sprint Linked</SelectItem>
                      {sprints.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Labels Section */}
            {labels.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
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
                        className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? "bg-[#5E6AD2] text-white border-[#5E6AD2]"
                            : "bg-[#171922] text-slate-400 hover:text-slate-200 border-[#2E3039]"
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

            {/* Member Assignments & Workload */}
            <div className="p-4 rounded-lg bg-[#171922] border border-[#2E3039] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#2E3039]">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#5E6AD2]" />
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Member Assignments & Workload Allocation
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {assignedMembers.length} Selected
                </span>
              </div>

              {/* Members Pill Selector */}
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const assigned = assignedMembers.find((a) => a.memberId === m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleToggleMember(m.id)}
                      className={`px-3 py-1.5 rounded-md border text-xs flex items-center gap-2 transition-all ${
                        assigned
                          ? "bg-[#1E212D] text-slate-100 border-[#5E6AD2]"
                          : "bg-[#12141A] text-slate-400 hover:text-slate-200 border-[#2E3039]"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-[#5E6AD2]/20 text-[#5E6AD2] flex items-center justify-center text-[10px] font-bold">
                        {m.name.charAt(0)}
                      </div>
                      <span>{m.name}</span>
                      {assigned?.isPrimary && (
                        <span
                          title="Primary Lead"
                          className="px-1.5 py-0.2 rounded bg-[#5E6AD2] text-white text-[9px] font-bold flex items-center gap-0.5"
                        >
                          <Crown className="h-2.5 w-2.5" />
                          Lead
                        </span>
                      )}
                      {assigned && !assigned.isPrimary && (
                        <Check className="h-3 w-3 text-[#5E6AD2]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Assignee Details Table */}
              {assignedMembers.length > 0 && (
                <div className="divide-y divide-[#2E3039] rounded-md border border-[#2E3039] bg-[#12141A] overflow-hidden mt-3">
                  <div className="px-3 py-2 bg-[#171922] flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase">
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
                        className="px-3 py-2.5 flex items-center justify-between hover:bg-[#171922]/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#5E6AD2]/20 text-[#5E6AD2] flex items-center justify-center text-[11px] font-bold">
                            {member?.name.charAt(0) || "U"}
                          </div>
                          <div>
                            <span className="text-xs font-medium text-slate-200">
                              {member?.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {member?.role}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(assigned.memberId)}
                            className={`w-24 px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1 border ${
                              assigned.isPrimary
                                ? "bg-[#5E6AD2] text-white border-[#5E6AD2]"
                                : "bg-[#171922] text-slate-400 hover:text-slate-200 border-[#2E3039]"
                            }`}
                          >
                            <Crown className="h-3 w-3" />
                            <span>{assigned.isPrimary ? "Lead" : "Contributor"}</span>
                          </button>

                          <div className="w-28 flex items-center justify-end gap-1">
                            <Input
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
                              className="w-16 h-7 px-2 text-right bg-[#171922] border-[#2E3039] text-slate-200 text-xs focus-visible:border-[#5E6AD2]"
                            />
                            <span className="text-[11px] text-slate-400">hrs</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#2E3039]/50 flex items-center justify-end gap-3">
          <Link
            href="/projects"
            className="px-4 py-2 bg-[#171922] hover:bg-[#1f1f23] border border-[#2E3039] text-slate-300 rounded-md text-xs font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createTask.isPending || createProject.isPending}
            className="px-5 py-2 bg-[#5E6AD2] hover:bg-[#717DE3] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>
              {createTask.isPending || createProject.isPending
                ? "Creating..."
                : `Create ${type === "PROJECT" ? "Project" : "Task"}`}
            </span>
          </button>
        </div>
      </form>

      {/* Capacity Warning Soft Modal */}
      <CapacityWarningModal
        isOpen={warningModalOpen}
        memberName={warningMemberName}
        currentAssignedHours={warningAssignedHours}
        additionalHours={warningAdditionalHours}
        totalCapacityHours={warningCapacityHours}
        onConfirm={() => {
          if (pendingPayload) executeCreateTask(pendingPayload);
        }}
        onCancel={() => {
          setWarningModalOpen(false);
          setPendingPayload(null);
        }}
      />
    </div>
  );
}

export default function NewProjectOrTaskPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto pt-8 text-center text-xs text-slate-400">
          Loading form...
        </div>
      }
    >
      <NewProjectOrTaskForm />
    </Suspense>
  );
}
