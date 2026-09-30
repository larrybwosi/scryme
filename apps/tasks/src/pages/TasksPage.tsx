import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Task, TaskStatus, PriorityLevel } from '../lib/types';
import TaskDetailModal from '../components/modals/TaskDetailModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  List,
  Kanban,
  Calendar as CalendarIcon,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ListTodo,
  CheckSquare,
  Layers,
  Clock,
  GripVertical,
  MessageSquare,
  CheckSquare as SubtaskIcon
} from 'lucide-react';

const KANBAN_STATUSES: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'ToDo', label: 'To Do', color: 'border-slate-300 dark:border-slate-700' },
  { id: 'InProgress', label: 'In Progress', color: 'border-amber-400 dark:border-amber-600' },
  { id: 'Review', label: 'In Review', color: 'border-indigo-400 dark:border-indigo-600' },
  { id: 'Completed', label: 'Completed', color: 'border-emerald-400 dark:border-emerald-600' },
  { id: 'Stopped', label: 'Stopped', color: 'border-rose-400 dark:border-rose-600' },
];

function KanbanTaskCard({
  task,
  onSelect,
  isOverlay = false
}: {
  task: Task;
  onSelect?: () => void;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: { task }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1
  };

  const getPriorityBadge = (priority?: PriorityLevel) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <AlertCircle className="h-3 w-3 text-rose-600" />
            Urgent
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            Medium
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Low
          </span>
        );
    }
  };

  const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
  const totalSubtasks = (task.subtasks || []).length;
  const commentsCount = (task.comments || []).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect && onSelect()}
      className={`p-3.5 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-3 hover:border-indigo-500 cursor-pointer transition-all hover:shadow-md ${
        isOverlay ? 'shadow-2xl border-indigo-500 ring-2 ring-indigo-500/20 scale-105' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing p-0.5"
            title="Drag task"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
            {task.name}
          </span>
        </div>
        {getPriorityBadge(task.priority)}
      </div>

      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
        {task.project} • <span className="text-slate-400">{task.client}</span>
      </div>

      {/* Subtasks and comments count */}
      {(totalSubtasks > 0 || commentsCount > 0) && (
        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1">
              <SubtaskIcon className="h-3 w-3" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
          {commentsCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{commentsCount}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex -space-x-1">
          {task.assignees.map((person, idx) => (
            <img
              key={idx}
              src={person.avatar}
              alt={person.name}
              title={person.name}
              className="h-5 w-5 rounded-full ring-1 ring-background object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  onSelectTask,
  onQuickAdd
}: {
  column: { id: TaskStatus; label: string; color: string };
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onQuickAdd: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { status: column.id }
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col min-h-[500px] transition-colors ${
        isOver ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
            {column.label}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onQuickAdd(column.id)}
          className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={`Add task to ${column.label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Task List Container */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 p-1">
          {tasks.length === 0 ? (
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs font-medium">
              Drop task here
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                onSelect={() => onSelectTask(task)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function TasksPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const myTasksOnly = useTaskStore((state) => state.myTasksOnly);
  const [activeTab, setActiveTab] = useState<'list' | 'board' | 'calendar' | 'timeline'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [newTaskGroup, setNewTaskGroup] = useState<'Today' | 'Tomorrow' | 'Feb 16, 2024' | null>(null);
  const [newTaskName, setNewTaskName] = useState('');

  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTaskForDrag, setActiveTaskForDrag] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === 'All' || t.tags.includes(filterTag);
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    const matchesMyTasks = !myTasksOnly;
    return matchesSearch && matchesTag && matchesStatus && matchesPriority && matchesMyTasks;
  });

  const dateGroups: ('Today' | 'Tomorrow' | 'Feb 16, 2024')[] = ['Today', 'Tomorrow', 'Feb 16, 2024'];

  // Stats calculation
  const totalCount = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === 'InProgress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const dueTodayCount = tasks.filter((t) => t.dateGroup === 'Today' && t.status !== 'Completed').length;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const foundTask = tasks.find((t) => t.id === active.id);
    if (foundTask) {
      setActiveTaskForDrag(foundTask);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine target status
    let targetStatus: TaskStatus | null = null;
    const isOverColumn = KANBAN_STATUSES.some((col) => col.id === overId);

    if (isOverColumn) {
      targetStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus && activeTask.status !== targetStatus) {
      taskStore.updateTaskStatus(activeId, targetStatus);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskForDrag(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (activeTask && overTask && activeTask.id !== overTask.id) {
      const oldIndex = tasks.findIndex((t) => t.id === activeId);
      const newIndex = tasks.findIndex((t) => t.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(tasks, oldIndex, newIndex);
        taskStore.reorderTasks(reordered);
      }
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            In Review
          </span>
        );
      case 'InProgress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            In Progress
          </span>
        );
      case 'Stopped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Stopped
          </span>
        );
      case 'ToDo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            To Do
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Completed
          </span>
        );
    }
  };

  const getPriorityBadge = (priority?: PriorityLevel) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <AlertCircle className="h-3 w-3 text-rose-600" />
            Urgent
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            Medium
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Low
          </span>
        );
    }
  };

  const getTagBadge = (tag: string) => {
    switch (tag) {
      case 'Design':
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">Design</span>;
      case 'Frontend':
      case 'Front-End':
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-800/50">Frontend</span>;
      case 'UX Design':
      case 'UX Research':
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">{tag}</span>;
      case 'Development':
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">Development</span>;
      case 'Back-end':
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">Back-end</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">{tag}</span>;
    }
  };

  const handleInlineTaskCreate = async (group: 'Today' | 'Tomorrow' | 'Feb 16, 2024') => {
    if (!newTaskName.trim()) return;
    await taskStore.addTask({
      name: newTaskName.trim(),
      client: 'Workspace Client',
      project: 'Workspace Project',
      status: 'ToDo',
      priority: 'MEDIUM',
      tags: ['Development'],
      estimation: `${group}, 5:00 PM`,
      estimatedHours: 8,
      actualHours: 0,
      dateGroup: group,
      assignees: [],
      subtasks: [],
      comments: [],
      activityLogs: []
    });
    setNewTaskName('');
    setNewTaskGroup(null);
  };

  const handleToggleTaskStatus = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: TaskStatus = task.status === 'Completed' ? 'ToDo' : 'Completed';
    taskStore.updateTask(task.id, { status: newStatus });
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Enterprise Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <ListTodo className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Enterprise Task Management
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track operational workflows, deliverables, sprint allocations, and team execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add New Task</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Work Items</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCount}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">In Active Progress</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{inProgressCount}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Clock3 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Due Today</span>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{dueTodayCount}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed Tasks</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Tab Navigation & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tab View Selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'board'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="h-4 w-4" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Search Input & Select Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks, client, project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="ToDo">To Do</option>
              <option value="InProgress">In Progress</option>
              <option value="Review">In Review</option>
              <option value="Completed">Completed</option>
              <option value="Stopped">Stopped</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              <option value="All">All Tags</option>
              <option value="Design">Design</option>
              <option value="Frontend">Frontend</option>
              <option value="Development">Development</option>
              <option value="Back-end">Back-end</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enterprise Structured List View */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {dateGroups.map((group) => {
            const groupTasks = filteredTasks.filter((t) => t.dateGroup === group || (!t.dateGroup && group === 'Today'));

            return (
              <div
                key={group}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden"
              >
                {/* Group Header */}
                <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {group === 'Today' ? 'Today' : group === 'Tomorrow' ? 'Tomorrow' : 'Feb 16, 2024'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200/60 dark:border-indigo-800/60">
                      {groupTasks.length} {groupTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>

                  <button
                    onClick={() => setNewTaskGroup(group)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Quick Add</span>
                  </button>
                </div>

                {/* Table Layout */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-900/30">
                        <th className="py-3 px-4 w-10"></th>
                        <th className="py-3 px-4 min-w-[240px]">Task Name</th>
                        <th className="py-3 px-4 min-w-[140px]">Project & Client</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Tags</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Assignees</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {groupTasks.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                            No tasks scheduled for {group}.
                          </td>
                        </tr>
                      ) : (
                        groupTasks.map((task) => (
                          <tr
                            key={task.id}
                            onClick={() => setSelectedTaskForModal(task)}
                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          >
                            {/* Complete Checkbox */}
                            <td className="py-3.5 px-4">
                              <button
                                onClick={(e) => handleToggleTaskStatus(task, e)}
                                className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                                  task.status === 'Completed'
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                                }`}
                              >
                                {task.status === 'Completed' && <CheckCircle2 className="h-3 w-3" />}
                              </button>
                            </td>

                            {/* Task Name */}
                            <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                              <span className={task.status === 'Completed' ? 'line-through text-slate-400' : ''}>
                                {task.name}
                              </span>
                            </td>

                            {/* Project & Client */}
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-800 dark:text-slate-200">{task.project}</div>
                              <div className="text-[11px] text-slate-400">{task.client}</div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">{getStatusBadge(task.status)}</td>

                            {/* Priority */}
                            <td className="py-3.5 px-4">{getPriorityBadge(task.priority)}</td>

                            {/* Tags */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {task.tags.map((tag) => (
                                  <React.Fragment key={tag}>{getTagBadge(tag)}</React.Fragment>
                                ))}
                              </div>
                            </td>

                            {/* Due Date */}
                            <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                              {task.estimation}
                            </td>

                            {/* Assignees */}
                            <td className="py-3.5 px-4">
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {task.assignees.map((person, idx) => (
                                  <img
                                    key={idx}
                                    src={person.avatar}
                                    alt={person.name}
                                    title={person.name}
                                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                                  />
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}

                      {/* Inline Add Task Row */}
                      {newTaskGroup === group && (
                        <tr className="bg-indigo-50/30 dark:bg-indigo-950/20 border-t border-indigo-200/50 dark:border-indigo-800/50">
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4" colSpan={7}>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleInlineTaskCreate(group)}
                                placeholder="Enter task title and press Enter..."
                                autoFocus
                                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
                              />
                              <button
                                onClick={() => handleInlineTaskCreate(group)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                              >
                                Save Task
                              </button>
                              <button
                                onClick={() => setNewTaskGroup(null)}
                                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-xl hover:bg-slate-300 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Add Task Action */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setNewTaskGroup(group)}
                    className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add task to {group}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Drag and Drop Kanban Board */}
      {activeTab === 'board' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {KANBAN_STATUSES.map((column) => {
              const columnTasks = filteredTasks.filter((t) => t.status === column.id);
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  onSelectTask={(task) => setSelectedTaskForModal(task)}
                  onQuickAdd={() => setIsCreateModalOpen(true)}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeTaskForDrag ? (
              <KanbanTaskCard task={activeTaskForDrag} isOverlay={true} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Workspace Task Calendar</h3>
            <span className="text-xs text-slate-500 font-medium">{filteredTasks.length} Tasks Scheduled</span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map((_, i) => {
              const day = i + 1;
              const dayTasks = filteredTasks.filter((t) => (day === 15 && t.dateGroup === 'Today') || (day === 16 && t.dateGroup === 'Tomorrow') || (day === 17 && t.dateGroup === 'Feb 16, 2024'));

              return (
                <div key={day} className={`min-h-[90px] p-2 rounded-xl border ${day === 15 ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/80'}`}>
                  <div className="text-[10px] font-bold text-slate-400 mb-1">{day}</div>
                  <div className="space-y-1">
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskForModal(t)}
                        className="p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700 text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:border-indigo-500 shadow-xs"
                        title={t.name}
                      >
                        {t.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline / Gantt View */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Project Gantt Schedule</h3>
            <span className="text-xs text-slate-500">Resource allocation timeline</span>
          </div>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No tasks available for timeline schedule.</p>
            ) : (
              filteredTasks.map((t) => {
                const widthPct = Math.min(100, Math.max(25, ((t.estimatedHours || 8) / 16) * 100));
                return (
                  <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-48 shrink-0 min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{t.project}</div>
                    </div>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-6 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full rounded-lg text-[10px] font-bold text-white px-2 flex items-center justify-between transition-all ${
                          t.status === 'Completed' ? 'bg-emerald-500' : t.status === 'InProgress' ? 'bg-indigo-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      >
                        <span>{t.status}</span>
                        <span>{t.estimatedHours || 8}h</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <TaskDetailModal
        task={selectedTaskForModal}
        onClose={() => setSelectedTaskForModal(null)}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
