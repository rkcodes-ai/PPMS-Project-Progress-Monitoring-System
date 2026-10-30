import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { tasksApi } from '../../api/tasks';
import { useToast } from '../../context/ToastContext';
import type { ProjectMemberItem, TaskPriorityEnum } from '../../types';

interface CreateTaskModalProps {
  projectId: number;
  members: ProjectMemberItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  projectId,
  members,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | undefined>(
    members.length > 0 ? members[0].user_id : undefined
  );
  const [priority, setPriority] = useState<TaskPriorityEnum>('MEDIUM');
  const [estimatedEffort, setEstimatedEffort] = useState<number>(2.0);
  const [dueDate, setDueDate] = useState(() =>
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );

  const createMutation = useMutation({
    mutationFn: (payload: any) => tasksApi.createTask(projectId, payload),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-analytics'] });
      showToast('success', 'Task Created', `Task "${task.title}" has been created with effort weight ${task.estimated_effort}.`);
      onClose();
    },
    onError: (err: Error) => {
      showToast('error', 'Creation Failed', err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('warning', 'Validation Error', 'Task title is required.');
      return;
    }
    if (estimatedEffort <= 0) {
      showToast('warning', 'Validation Error', 'Effort weight must be greater than zero.');
      return;
    }

    createMutation.mutate({
      title,
      description,
      assignee_id: assigneeId ? Number(assigneeId) : undefined,
      priority,
      estimated_effort: Number(estimatedEffort),
      due_date: new Date(dueDate).toISOString(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Project Task"
      subtitle="Define a work package with effort weighting for progress tracking"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Implement Transformer Attention Layer"
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Task Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed technical specifications or acceptance criteria..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Assigned Team Member"
            value={assigneeId || ''}
            onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
            options={[
              { value: '', label: 'Unassigned' },
              ...members.map((m) => ({
                value: m.user_id,
                label: `${m.full_name} (${m.role_in_team})`,
              })),
            ]}
          />

          <Select
            label="Task Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriorityEnum)}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Effort Weight (wᵢ > 0)"
            type="number"
            step="0.5"
            min="0.5"
            required
            value={estimatedEffort}
            onChange={(e) => setEstimatedEffort(Number(e.target.value))}
            helperText="Relative contribution to overall project progress (P = 100 × Σ(wᵢcᵢ)/Σwᵢ)"
          />

          <Input
            label="Due Date"
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Add Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
