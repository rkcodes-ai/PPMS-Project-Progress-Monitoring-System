import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { milestonesApi } from '../../api/milestones';
import { useToast } from '../../context/ToastContext';
import type { Milestone } from '../../types';

interface SubmitMilestoneModalProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
}

export const SubmitMilestoneModal: React.FC<SubmitMilestoneModalProps> = ({
  milestone,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [notes, setNotes] = useState('');

  const submitMutation = useMutation({
    mutationFn: () => milestonesApi.submitMilestone(milestone.id, notes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', milestone.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', milestone.project_id] });
      queryClient.invalidateQueries({ queryKey: ['mentor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      showToast('success', 'Milestone Submitted', `Deliverable for "${updated.title}" submitted for evaluation.`);
      onClose();
    },
    onError: (err: Error) => {
      showToast('error', 'Submission Failed', err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Milestone Deliverables"
      subtitle={`Milestone: ${milestone.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {milestone.completion_criteria && (
          <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs">
            <span className="font-semibold text-indigo-900 block mb-0.5">Completion Criteria:</span>
            <p className="text-slate-700">{milestone.completion_criteria}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Submission Notes & Deliverable Links
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document repository links, demo video, or verification checklist..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitMutation.isPending}>
            Confirm Submission
          </Button>
        </div>
      </form>
    </Modal>
  );
};
