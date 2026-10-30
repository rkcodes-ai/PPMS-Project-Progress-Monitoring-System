import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { tasksApi } from '../../api/tasks';
import { useToast } from '../../context/ToastContext';
import type { Task } from '../../types';

interface ReviewTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewTaskModal: React.FC<ReviewTaskModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [decision, setDecision] = useState<'Approved' | 'Changes Requested'>('Approved');
  const [comments, setComments] = useState('');

  const reviewMutation = useMutation({
    mutationFn: () => tasksApi.reviewTask(task.id, decision, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', task.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', task.project_id] });
      queryClient.invalidateQueries({ queryKey: ['mentor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['hod-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      showToast('success', 'Task Reviewed', `Task decision "${decision}" recorded successfully.`);
      onClose();
    },
    onError: (err: Error) => {
      showToast('error', 'Review Failed', err.message);
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
      title="Faculty Task Evaluation"
      subtitle={`Reviewing: ${task.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {task.submission_details && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Student Submission Evidence
            </span>
            <p className="text-xs text-slate-800 whitespace-pre-wrap">{task.submission_details}</p>
          </div>
        )}

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
              Approve & Mark Completed (100%)
            </button>
            <button
              type="button"
              onClick={() => setDecision('Changes Requested')}
              className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                decision === 'Changes Requested'
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
            Faculty Feedback / Instructions
          </label>
          <textarea
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Feedback notes, specific revision instructions, or commendation..."
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
            Submit Evaluation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
