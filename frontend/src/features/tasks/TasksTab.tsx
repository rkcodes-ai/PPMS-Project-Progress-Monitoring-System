import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  User, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Scale
} from 'lucide-react';
import { tasksApi } from '../../api/tasks';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { CreateTaskModal } from './CreateTaskModal';
import { SubmitTaskReviewModal } from './SubmitTaskReviewModal';
import { ReviewTaskModal } from './ReviewTaskModal';
import type { ProjectDetail, Task } from '../../types';

interface TasksTabProps {
  project: ProjectDetail;
}

export const TasksTab: React.FC<TasksTabProps> = ({ project }) => {
  const { activeRole } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToSubmit, setTaskToSubmit] = useState<Task | null>(null);
  const [taskToReview, setTaskToReview] = useState<Task | null>(null);

  const { data: tasks, isLoading, error, refetch } = useQuery({
    queryKey: ['project-tasks', project.id],
    queryFn: () => tasksApi.getProjectTasks(project.id),
  });

  const isStudent = activeRole === 'STUDENT';
  const isFacultyOrAdmin = activeRole === 'HOD' || activeRole === 'ADVISOR' || activeRole === 'MENTOR';

  // Math calculation verification: P = 100 * sum(w_i * c_i) / sum(w_i)
  const totalEffort = tasks?.reduce((acc, t) => acc + t.estimated_effort, 0) || 0;
  const weightedCompletion = tasks?.reduce((acc, t) => acc + t.estimated_effort * t.completion_fraction, 0) || 0;
  const computedProgress = totalEffort > 0 ? Math.round((weightedCompletion / totalEffort) * 10000) / 100 : 0;

  return (
    <div className="space-y-6">
      {/* Formula & Progress Verification Box */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300">
                Authoritative Backend Progress Math
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Formula: <span className="font-mono text-indigo-300">P = 100 × Σ(wᵢ × cᵢ) / Σ(wᵢ)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
              <span>Total Effort (Σwᵢ): <span className="font-bold text-white">{totalEffort.toFixed(1)}</span></span>
              <span>Weighted Completion (Σwᵢcᵢ): <span className="font-bold text-white">{weightedCompletion.toFixed(2)}</span></span>
              <span>Calculated Percentage: <span className="font-bold text-emerald-400">{computedProgress}%</span></span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Task List Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-rose-700">Failed to load project tasks</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : tasks?.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-slate-400" />}
          title="No tasks defined yet"
          description="Break down this project into measurable deliverables with positive effort weights."
          actionText="Add Initial Task"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/60">
                  <th className="py-3 px-4">Task Title & Details</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Weight (wᵢ)</th>
                  <th className="py-3 px-4">Status & Review</th>
                  <th className="py-3 px-4 text-right">Completion (cᵢ)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks?.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Title & Desc */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{task.title}</div>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{task.assignee_name || 'Unassigned'}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={task.priority} />
                    </td>

                    {/* Weight (w_i) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800">{task.estimated_effort}</span>
                    </td>

                    {/* Status & Review */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={task.status} />
                        {task.review_status && (
                          <span className="text-[10px] text-slate-500 italic">
                            Review: {task.review_status}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Completion Fraction (c_i) */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="font-bold text-slate-800 mb-1">
                        {Math.round(task.completion_fraction * 100)}%
                      </div>
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-auto">
                        <div 
                          className="h-full bg-indigo-600 rounded-full" 
                          style={{ width: `${Math.round(task.completion_fraction * 100)}%` }} 
                        />
                      </div>
                    </td>

                    {/* Contextual Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Student action: Submit for review if not completed */}
                        {isStudent && task.status !== 'COMPLETED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[11px] py-1 px-2"
                            onClick={() => setTaskToSubmit(task)}
                            icon={<Send className="w-3 h-3 text-indigo-600" />}
                          >
                            Submit
                          </Button>
                        )}

                        {/* Faculty action: Review pending task */}
                        {isFacultyOrAdmin && task.status === 'SUBMITTED_FOR_REVIEW' && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="text-[11px] py-1 px-2.5 bg-indigo-600"
                            onClick={() => setTaskToReview(task)}
                            icon={<CheckCircle2 className="w-3 h-3" />}
                          >
                            Review
                          </Button>
                        )}

                        {/* Faculty direct complete option */}
                        {isFacultyOrAdmin && task.status !== 'COMPLETED' && task.status !== 'SUBMITTED_FOR_REVIEW' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[11px] py-1 px-2 text-slate-500"
                            onClick={() => setTaskToReview(task)}
                          >
                            Evaluate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTaskModal
          projectId={project.id}
          members={project.members}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {taskToSubmit && (
        <SubmitTaskReviewModal
          task={taskToSubmit}
          isOpen={!!taskToSubmit}
          onClose={() => setTaskToSubmit(null)}
        />
      )}

      {taskToReview && (
        <ReviewTaskModal
          task={taskToReview}
          isOpen={!!taskToReview}
          onClose={() => setTaskToReview(null)}
        />
      )}
    </div>
  );
};
