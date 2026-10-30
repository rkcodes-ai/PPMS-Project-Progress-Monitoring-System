import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { tasksApi } from '../../api/tasks';
import { useToast } from '../../context/ToastContext';
import type { Task } from '../../types';

interface SubmitTaskReviewModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export const SubmitTaskReviewModal: React.FC<SubmitTaskReviewModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [submissionDetails, setSubmissionDetails] = useState('');

  const submitMutation = useMutation({
    mutationFn: (details: string) => tasksApi.submitTaskReview(task.id, details),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', task.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', task.project_id] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-analytics'] });
      showToast('success', 'Submitted for Review', `Task "${updatedTask.title}" has been submitted for faculty verification.`);
      onClose();
    },
    onError: (err: Error) => {
      showToast('error', 'Submission Failed', err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionDetails.trim()) {
      showToast('warning', 'Validation Error', 'Please describe your deliverables or verification evidence.');
      return;
    }
    submitMutation.mutate(submissionDetails);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Task for Faculty Review"
      subtitle={`Task: ${task.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Deliverable & Verification Evidence *
          </label>
          <textarea
            required
            rows={4}
            value={submissionDetails}
            onChange={(e) => setSubmissionDetails(e.target.value)}
            placeholder="Provide link to code commit, pull request, test run logs, or written deliverables demonstrating completion..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Upon submission, completion status will advance to 90% pending formal faculty sign-off.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitMutation.isPending}>
            Submit Deliverable
          </Button>
        </div>
      </form>
    </Modal>
  );
};
