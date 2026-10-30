import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { reportsApi } from '../../api/reports';
import { useToast } from '../../context/ToastContext';

interface CreateReportModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({
  projectId,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [reportingPeriod, setReportingPeriod] = useState('Month 1 Progress');
  const [workCompleted, setWorkCompleted] = useState('');
  const [currentChallenges, setCurrentChallenges] = useState('');
  const [plannedNextSteps, setPlannedNextSteps] = useState('');
  const [supportingEvidence, setSupportingEvidence] = useState('');

  const submitMutation = useMutation({
    mutationFn: (payload: any) => reportsApi.createReport(projectId, payload),
    onSuccess: (rep) => {
      queryClient.invalidateQueries({ queryKey: ['project-reports', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['mentor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      showToast('success', 'Report Submitted', `Progress report for "${rep.reporting_period}" (v${rep.version}) submitted.`);
      onClose();
    },
    onError: (err: Error) => {
      showToast('error', 'Submission Failed', err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPeriod.trim() || !workCompleted.trim() || !plannedNextSteps.trim()) {
      showToast('warning', 'Validation Error', 'Reporting period, work completed, and planned next steps are required.');
      return;
    }

    submitMutation.mutate({
      reporting_period: reportingPeriod,
      work_completed: workCompleted,
      current_challenges: currentChallenges,
      planned_next_steps: plannedNextSteps,
      supporting_evidence: supportingEvidence,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Formal Progress Report"
      subtitle="Periodic reporting to faculty mentor & section advisor"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Reporting Period"
          required
          value={reportingPeriod}
          onChange={(e) => setReportingPeriod(e.target.value)}
          placeholder="e.g. Month 1 Progress, Mid-Semester Sprint, Phase 2"
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Work Completed *
          </label>
          <textarea
            required
            rows={3}
            value={workCompleted}
            onChange={(e) => setWorkCompleted(e.target.value)}
            placeholder="Detailed description of technical implementation and achieved milestones..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Technical Obstacles / Current Challenges
          </label>
          <textarea
            rows={2}
            value={currentChallenges}
            onChange={(e) => setCurrentChallenges(e.target.value)}
            placeholder="Any blockers, hardware limitations, or conceptual deficits..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Planned Next Steps *
          </label>
          <textarea
            required
            rows={2}
            value={plannedNextSteps}
            onChange={(e) => setPlannedNextSteps(e.target.value)}
            placeholder="Deliverables scheduled for completion during the upcoming reporting window..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <Input
          label="Supporting Evidence / Artifact URL"
          value={supportingEvidence}
          onChange={(e) => setSupportingEvidence(e.target.value)}
          placeholder="e.g. Git repository URL, documentation folder, demo link"
        />

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitMutation.isPending}>
            Submit Formal Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};
