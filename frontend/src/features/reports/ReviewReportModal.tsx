import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { reportsApi } from '../../api/reports';
import { useToast } from '../../context/ToastContext';
import type { ProgressReport, ReportStatusEnum } from '../../types';

interface ReviewReportModalProps {
  report: ProgressReport;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewReportModal: React.FC<ReviewReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [status, setStatus] = useState<ReportStatusEnum>('APPROVED');
  const [comments, setComments] = useState('');

  const reviewMutation = useMutation({
    mutationFn: () => reportsApi.reviewReport(report.id, { status, comments }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['project-reports', report.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', report.project_id] });
      queryClient.invalidateQueries({ queryKey: ['mentor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      showToast('success', 'Report Evaluated', `Progress report marked as ${updated.status}.`);
      onClose();
    },
    onError: (err: Error) => {
      showToast('error', 'Evaluation Failed', err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      showToast('warning', 'Validation Error', 'Faculty review comments are required.');
      return;
    }
    reviewMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evaluate Progress Report"
      subtitle={`Report: ${report.reporting_period} (v${report.version})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Formal Review Decision *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus('APPROVED')}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                status === 'APPROVED'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => setStatus('NEEDS_REVISION')}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                status === 'NEEDS_REVISION'
                  ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Needs Revision
            </button>
            <button
              type="button"
              onClick={() => setStatus('REJECTED')}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                status === 'REJECTED'
                  ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Reject
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Faculty Evaluation Comments & Feedback *
          </label>
          <textarea
            required
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Provide specific feedback on student work, milestones achieved, and next steps..."
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
            variant={status === 'APPROVED' ? 'primary' : status === 'NEEDS_REVISION' ? 'outline' : 'danger'}
          >
            Submit Report Evaluation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
