import React, { useState } from 'react';
import {
  useTaskStore,
  taskStore,
} from '../lib/store';
import { Task } from '../lib/types';
import {
  Kanban,
  List,
  Calendar as CalendarIcon,
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  MoreVertical,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskDetailModal from '../components/modals/TaskDetailModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';

const KANBAN_STATUSES = [
  { id: 'ToDo', label: 'To Do', color: 'border-slate-300 bg-slate-100 dark:bg-slate-800' },
  { id: 'InProgress', label: 'In Progress', color: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20' },
  { id: 'Review', label: 'In Review', color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20' },
  { id: 'Completed', label: 'Completed', color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' },
  { id: 'Stopped', label: 'Stopped', color: 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20' },
];

function KanbanTaskCard({ task, isOverlay }: { task: Task; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 space-y-2 cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-all ${
        isOverlay ? 'shadow-lg border-indigo-500 scale-105' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <Badge variant="outline" className="px-1.5 py-0 text-[9px] uppercase">
          {task.project}
        </Badge>
        <span className="font-mono">{task.taskKey || 'TASK'}</span>
      </div>

      <div className="font-bold text-xs text-foreground line-clamp-2 leading-snug">
        {task.name}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border text-[10px]">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{task.estimation}</span>
        </div>

        <div className="flex -space-x-1">
          {task.assignees.map((person, idx) => (
            <Avatar key={idx} className="h-5 w-5 border border-background">
              <AvatarImage src={person.avatar} />
              <AvatarFallback className="text-[8px]">
                {person.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    </Card>
  );
}

function KanbanColumn({
  column,
  tasks,
  onSelectTask,
  onQuickAdd,
}: {
  column: { id: string; label: string; color: string };
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onQuickAdd: () => void;
}) {
  return (
    <div className="flex flex-col rounded-xl bg-muted/40 border border-border p-3 gap-3 min-h-[500px]">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
          <h3 className="font-bold text-xs text-foreground">{column.label}</h3>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={onQuickAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {tasks.map((task) => (
            <div key={task.id} onClick={() => onSelectTask(task)}>
              <KanbanTaskCard task={task} />
            </div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function TasksPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const [activeTab, setActiveTab] = useState<'list' | 'board' | 'calendar' | 'timeline'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('ALL');
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTaskGroup, setNewTaskGroup] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');

  const [activeTaskForDrag, setActiveTaskForDrag] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = filterProject === 'ALL' || task.project === filterProject;
    return matchesSearch && matchesProject;
  });

  const dateGroups = Array.from(new Set(filteredTasks.map((t) => t.dateGroup)));

  const handleInlineTaskCreate = (dateGroup: string) => {
    if (!newTaskName.trim()) return;
    taskStore.addTask({
      name: newTaskName,
      client: 'Internal Workspace',
      project: filterProject === 'ALL' ? 'AI-Powered Learning Platform' : filterProject,
      status: 'ToDo',
      tags: ['Frontend'],
      priority: 'MEDIUM',
      estimation: 'Today',
      dateGroup: dateGroup as any,
      assignees: [
        {
          id: 'usr-1',
          name: 'Sarah Jenkins',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        },
      ],
      estimatedHours: 4,
    });
    setNewTaskName('');
    setNewTaskGroup(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const foundTask = tasks.find((t) => t.id === active.id);
    if (foundTask) setActiveTaskForDrag(foundTask);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const targetColumn = KANBAN_STATUSES.find((col) => col.id === overId);
    if (targetColumn && activeTask.status !== targetColumn.id) {
      taskStore.updateTask(String(activeId), { status: targetColumn.id as any });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskForDrag(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Workspace Tasks
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage engineering subtasks, review milestones, and track Kanban boards.
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 text-xs shadow-xs">
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Filter and View Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-muted/40 rounded-xl border border-border">
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          <Button
            variant={activeTab === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('list')}
            className="gap-1.5 text-xs h-8"
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </Button>

          <Button
            variant={activeTab === 'board' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('board')}
            className="gap-1.5 text-xs h-8"
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Board</span>
          </Button>

          <Button
            variant={activeTab === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('calendar')}
            className="gap-1.5 text-xs h-8"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Calendar</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 text-xs h-8 bg-background"
            />
          </div>
        </div>
      </div>

      {/* Task List View */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {dateGroups.map((group) => {
            const groupTasks = filteredTasks.filter((t) => t.dateGroup === group);

            return (
              <Card key={group} className="p-0 overflow-hidden border-border">
                <div className="p-3 bg-muted/50 border-b border-border flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">{group}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {groupTasks.length} Tasks
                  </Badge>
                </div>

                <div className="divide-y divide-border">
                  {groupTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskForModal(task)}
                      className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase shrink-0 ${
                            task.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}
                        >
                          {task.status}
                        </Badge>

                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{task.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{task.project}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex -space-x-1.5">
                          {task.assignees.map((person, idx) => (
                            <Avatar key={idx} className="h-5 w-5 border border-background">
                              <AvatarImage src={person.avatar} />
                              <AvatarFallback className="text-[8px]">
                                {person.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Kanban Board View */}
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
