import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { milestonesApi } from '../../api/milestones';
import { useToast } from '../../context/ToastContext';
import type { Milestone } from '../../types';

interface ReviewMilestoneModalProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewMilestoneModal: React.FC<ReviewMilestoneModalProps> = ({
  milestone,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [decision, setDecision] = useState<'Approved' | 'Revision Requested'>('Approved');
  const [comments, setComments] = useState('');

  const reviewMutation = useMutation({
    mutationFn: () => milestonesApi.reviewMilestone(milestone.id, decision, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', milestone.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', milestone.project_id] });
      queryClient.invalidateQueries({ queryKey: ['mentor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      showToast('success', 'Milestone Evaluated', `Milestone decision "${decision}" recorded.`);
      onClose();
    },
    onError: (err: Error) => {
      showToast('error', 'Evaluation Failed', err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evaluate Milestone Deliverables"
      subtitle={`Milestone: ${milestone.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Evaluation Decision
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('Approved')}
              className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                decision === 'Approved'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Approve Milestone Deliverables
            </button>
            <button
              type="button"
              onClick={() => setDecision('Revision Requested')}
              className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                decision === 'Revision Requested'
                  ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Request Revisions
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Faculty Evaluation Notes
          </label>
          <textarea
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Feedback on deliverable quality, adherence to specifications..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            isLoading={reviewMutation.isPending}
            variant={decision === 'Approved' ? 'primary' : 'danger'}
          >
            Submit Milestone Evaluation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
