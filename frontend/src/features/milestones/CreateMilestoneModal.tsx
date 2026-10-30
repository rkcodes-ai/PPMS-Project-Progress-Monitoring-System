import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { milestonesApi } from '../../api/milestones';
import { useToast } from '../../context/ToastContext';

interface CreateMilestoneModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateMilestoneModal: React.FC<CreateMilestoneModalProps> = ({
  projectId,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completionCriteria, setCompletionCriteria] = useState('');
  const [plannedDueDate, setPlannedDueDate] = useState(() =>
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const createMutation = useMutation({
    mutationFn: (payload: any) => milestonesApi.createMilestone(projectId, payload),
    onSuccess: (m) => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['advisor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-analytics'] });
      showToast('success', 'Milestone Created', `Milestone "${m.title}" has been scheduled.`);
      onClose();
    },
    onError: (err: Error) => {
      showToast('error', 'Creation Failed', err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('warning', 'Validation Error', 'Milestone title is required.');
      return;
    }

    createMutation.mutate({
      title,
      description,
      completion_criteria: completionCriteria,
      planned_due_date: new Date(plannedDueDate).toISOString(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Project Milestone"
      subtitle="Establish a major academic stage gate and deliverable deadline"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Milestone Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Phase 1 Architecture & Design Review"
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Scope and deliverables covered by this milestone..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Formal Completion Criteria
          </label>
          <textarea
            rows={2}
            value={completionCriteria}
            onChange={(e) => setCompletionCriteria(e.target.value)}
            placeholder="Specific evidence or demo required for faculty approval..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <Input
          label="Planned Target Date"
          type="date"
          required
          value={plannedDueDate}
          onChange={(e) => setPlannedDueDate(e.target.value)}
        />

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Add Milestone
          </Button>
        </div>
      </form>
    </Modal>
  );
};
