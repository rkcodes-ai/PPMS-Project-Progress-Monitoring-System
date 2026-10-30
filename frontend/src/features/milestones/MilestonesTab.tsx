import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Milestone as MilestoneIcon, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  MessageSquare, 
  UserCheck,
  Award
} from 'lucide-react';
import { milestonesApi } from '../../api/milestones';
import { certificatesApi } from '../../api/certificates';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { CreateMilestoneModal } from './CreateMilestoneModal';
import { SubmitMilestoneModal } from './SubmitMilestoneModal';
import { ReviewMilestoneModal } from './ReviewMilestoneModal';
import type { ProjectDetail, Milestone } from '../../types';

interface MilestonesTabProps {
  project: ProjectDetail;
}

export const MilestonesTab: React.FC<MilestonesTabProps> = ({ project }) => {
  const { activeRole } = useAuth();
  const { showToast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [milestoneToSubmit, setMilestoneToSubmit] = useState<Milestone | null>(null);
  const [milestoneToReview, setMilestoneToReview] = useState<Milestone | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<number | null>(null);

  const handleDownloadMilestoneCert = async (m: Milestone) => {
    try {
      setDownloadingCertId(m.id);
      await certificatesApi.downloadMilestoneCertificate(m.id, m.title);
      showToast('success', 'Certificate Downloaded', `Achievement Certificate for milestone '${m.title}' generated.`);
    } catch (err) {
      showToast('error', 'Download Failed', err instanceof Error ? err.message : 'Unable to generate milestone certificate.');
    } finally {
      setDownloadingCertId(null);
    }
  };

  const { data: milestones, isLoading, error, refetch } = useQuery({
    queryKey: ['project-milestones', project.id],
    queryFn: () => milestonesApi.getProjectMilestones(project.id),
  });

  const isStudent = activeRole === 'STUDENT';
  const isFacultyOrAdmin = activeRole === 'HOD' || activeRole === 'ADVISOR' || activeRole === 'MENTOR';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">Milestone Stage Gates & Deliverables</h3>
          <p className="text-xs text-slate-500">Major academic progression check-points</p>
        </div>
        {isFacultyOrAdmin && (
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add Milestone
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-rose-700">Failed to load milestones</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : milestones?.length === 0 ? (
        <EmptyState
          icon={<MilestoneIcon className="w-8 h-8 text-slate-400" />}
          title="No milestones scheduled"
          description="Establish formal project stage gates to track scheduled milestone progress."
          actionText={isFacultyOrAdmin ? 'Schedule First Milestone' : undefined}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {milestones?.map((m, index) => {
            const isCompleted = m.status === 'APPROVED' || m.status === 'COMPLETED';
            const isPendingReview = m.status === 'SUBMITTED';

            return (
              <div key={m.id} className="relative group">
                {/* Timeline node */}
                <div 
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-colors ${
                    isCompleted 
                      ? 'border-emerald-500 text-emerald-600' 
                      : isPendingReview
                      ? 'border-indigo-500 text-indigo-600 animate-pulse'
                      : 'border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  )}
                </div>

                {/* Milestone Card */}
                <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.status} />
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {m.submission_status}
                      </span>
                    </div>
                  </div>

                  {m.description && (
                    <p className="text-xs text-slate-600 mb-3">{m.description}</p>
                  )}

                  {m.completion_criteria && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs mb-3">
                      <span className="font-semibold text-slate-700 block text-[11px]">Completion Criteria:</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">{m.completion_criteria}</p>
                    </div>
                  )}

                  {/* Feedback / Reviewer details if reviewed */}
                  {m.reviewer_comments && (
                    <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs mb-3">
                      <div className="flex items-center gap-1.5 font-semibold text-indigo-950 mb-0.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Faculty Evaluation ({m.reviewer_name || 'Reviewer'}):</span>
                      </div>
                      <p className="text-slate-700 italic">"{m.reviewer_comments}"</p>
                    </div>
                  )}

                  {/* Footer & Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Planned Due Date: <strong className="text-slate-700">{new Date(m.planned_due_date).toLocaleDateString()}</strong></span>
                      {m.completed_at && (
                        <span className="text-emerald-700 font-semibold ml-2">
                          • Completed {new Date(m.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Student submission action */}
                      {isStudent && !isCompleted && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setMilestoneToSubmit(m)}
                          icon={<Send className="w-3 h-3 text-indigo-600" />}
                        >
                          Submit Deliverables
                        </Button>
                      )}

                      {/* Milestone Certificate Download Action for approved/completed milestones */}
                      {isCompleted && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                          onClick={() => handleDownloadMilestoneCert(m)}
                          isLoading={downloadingCertId === m.id}
                          icon={<Award className="w-3.5 h-3.5 text-amber-600" />}
                        >
                          Certificate
                        </Button>
                      )}

                      {/* Faculty evaluation action */}
                      {isFacultyOrAdmin && (
                        <Button
                          size="sm"
                          variant={isPendingReview ? 'primary' : 'outline'}
                          onClick={() => setMilestoneToReview(m)}
                          icon={<UserCheck className="w-3.5 h-3.5" />}
                        >
                          {isPendingReview ? 'Evaluate Submission' : 'Review Deliverable'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateMilestoneModal
          projectId={project.id}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {milestoneToSubmit && (
        <SubmitMilestoneModal
          milestone={milestoneToSubmit}
          isOpen={!!milestoneToSubmit}
          onClose={() => setMilestoneToSubmit(null)}
        />
      )}

      {milestoneToReview && (
        <ReviewMilestoneModal
          milestone={milestoneToReview}
          isOpen={!!milestoneToReview}
          onClose={() => setMilestoneToReview(null)}
        />
      )}
    </div>
  );
};
