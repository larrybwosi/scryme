import React, { useState, useEffect } from 'react';
import { Task, TaskAssessment } from '../../lib/types';
import { useTaskStore, taskStore } from '../../lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Star, AlertTriangle, CheckCircle, ShieldAlert, Sparkles, Clock, Award } from 'lucide-react';
import { Badge } from '@repo/ui/components/ui/badge';

interface TaskAssessmentModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskAssessmentModal({ task, isOpen, onClose }: TaskAssessmentModalProps) {
  const existingAssessment = useTaskStore((state) => (task ? state.taskAssessments[task.id] : undefined));

  const [complexity, setComplexity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [qualityScore, setQualityScore] = useState<number>(4);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [estimatedHours, setEstimatedHours] = useState<number>(task?.estimatedHours || 8);
  const [actualHours, setActualHours] = useState<number>(task?.actualHours || 6);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      if (existingAssessment) {
        setComplexity(existingAssessment.complexity);
        setQualityScore(existingAssessment.qualityScore);
        setRiskLevel(existingAssessment.riskLevel);
        setEstimatedHours(existingAssessment.estimatedHours);
        setActualHours(existingAssessment.actualHours);
        setNotes(existingAssessment.notes || '');
      } else {
        setComplexity(task.priority === 'URGENT' ? 'CRITICAL' : task.priority === 'HIGH' ? 'HIGH' : 'MEDIUM');
        setQualityScore(4);
        setRiskLevel('LOW');
        setEstimatedHours(task.estimatedHours || 8);
        setActualHours(task.actualHours || 0);
        setNotes('');
      }
    }
  }, [task, existingAssessment]);

  if (!task || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const assessment: TaskAssessment = {
      taskId: task.id,
      complexity,
      qualityScore,
      riskLevel,
      estimatedHours: Number(estimatedHours),
      actualHours: Number(actualHours),
      notes: notes.trim(),
      assessedAt: new Date().toISOString(),
      assessedBy: 'Current Reviewer',
    };

    await taskStore.saveTaskAssessment(assessment);
    setIsSubmitting(false);
    onClose();
  };

  const efficiencyRatio = estimatedHours > 0 ? Math.round((actualHours / estimatedHours) * 100) : 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Award className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold">Task Assessment & Review</DialogTitle>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              {task.taskKey || 'TASK'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Evaluating performance, effort estimation, complexity, and risk factor for <span className="font-semibold text-foreground">{task.name}</span>.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Quality Score / Rating */}
          <div className="space-y-1.5 p-3 rounded-lg border border-border bg-muted/30">
            <Label className="text-xs font-semibold">Quality & Delivery Score</Label>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setQualityScore(star)}
                  className="p-1 hover:scale-110 transition-transform focus:outline-hidden"
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= qualityScore
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-foreground ml-2">{qualityScore} / 5 Stars</span>
            </div>
          </div>

          {/* Complexity & Risk Level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Technical Complexity</Label>
              <select
                value={complexity}
                onChange={(e) => setComplexity(e.target.value as any)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-hidden focus:ring-2 focus:ring-ring"
              >
                <option value="LOW">Low Complexity</option>
                <option value="MEDIUM">Medium Complexity</option>
                <option value="HIGH">High Complexity</option>
                <option value="CRITICAL">Critical / Architectural</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Delivery Risk Level</Label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as any)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-hidden focus:ring-2 focus:ring-ring"
              >
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High / At Risk</option>
              </select>
            </div>
          </div>

          {/* Estimated vs Actual Hours */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-card">
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3 text-indigo-500" />
                Estimated Effort (Hours)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3 text-emerald-500" />
                Actual Spent (Hours)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={actualHours}
                onChange={(e) => setActualHours(Number(e.target.value))}
                className="text-xs"
                required
              />
            </div>

            <div className="col-span-2 pt-1 border-t border-border flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Estimation Variance:</span>
              <span className={`font-bold ${efficiencyRatio > 110 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {efficiencyRatio}% of estimate ({actualHours - estimatedHours >= 0 ? `+${actualHours - estimatedHours}h over` : `${estimatedHours - actualHours}h under`})
              </span>
            </div>
          </div>

          {/* Assessment Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Assessment Notes & Retrospective</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record takeaways, bottlenecks, code quality feedback, or risk mitigation steps..."
              className="text-xs min-h-[80px]"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" className="text-xs gap-1.5" disabled={isSubmitting}>
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Save Assessment</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
