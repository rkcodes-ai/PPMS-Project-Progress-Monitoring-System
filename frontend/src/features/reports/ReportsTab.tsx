import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Plus, 
  AlertCircle, 
  MessageSquare, 
  UserCheck, 
  ExternalLink
} from 'lucide-react';
import { reportsApi } from '../../api/reports';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { CreateReportModal } from './CreateReportModal';
import { ReviewReportModal } from './ReviewReportModal';
import type { ProjectDetail, ProgressReport } from '../../types';

interface ReportsTabProps {
  project: ProjectDetail;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ project }) => {
  const { activeRole } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reportToReview, setReportToReview] = useState<ProgressReport | null>(null);

  const { data: reports, isLoading, error, refetch } = useQuery({
    queryKey: ['project-reports', project.id],
    queryFn: () => reportsApi.getProjectReports(project.id),
  });

  const isFacultyOrAdmin = activeRole === 'HOD' || activeRole === 'ADVISOR' || activeRole === 'MENTOR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">Periodic Academic Progress Reports</h3>
          <p className="text-xs text-slate-500">Official written documentation and faculty review audit trail</p>
        </div>

        {/* Both student teams and faculty can submit or request reports */}
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Submit Progress Report
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-rose-700">Failed to load progress reports</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : reports?.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-slate-400" />}
          title="No progress reports submitted yet"
          description="Document your team's implementation milestones, challenges, and scheduled next steps."
          actionText="Submit First Report"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {reports?.map((rep) => (
            <div key={rep.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-200">
                    v{rep.version}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{rep.reporting_period}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={rep.status} />
                  {isFacultyOrAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => setReportToReview(rep)}
                      icon={<UserCheck className="w-3.5 h-3.5" />}
                    >
                      Evaluate Report
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-1">Work Completed:</span>
                  <p className="text-slate-600 whitespace-pre-wrap">{rep.work_completed}</p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-1">Planned Next Steps:</span>
                  <p className="text-slate-600 whitespace-pre-wrap">{rep.planned_next_steps}</p>
                </div>
              </div>

              {rep.current_challenges && (
                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 text-xs text-amber-900 mb-3">
                  <span className="font-semibold block mb-0.5">Reported Challenges:</span>
                  <p className="text-amber-800">{rep.current_challenges}</p>
                </div>
              )}

              {rep.supporting_evidence && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 mb-3">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-slate-700">Evidence Link:</span>
                  <span className="font-mono text-indigo-600 truncate">{rep.supporting_evidence}</span>
                </div>
              )}

              {/* Review History */}
              {rep.reviews.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Faculty Evaluation History
                  </span>
                  {rep.reviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{rev.reviewer_name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({new Date(rev.reviewed_at).toLocaleDateString()})
                          </span>
                        </div>
                        <StatusBadge status={rev.status} />
                      </div>
                      <p className="text-slate-700 italic">"{rev.comments}"</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Metadata Footer */}
              <div className="mt-3 pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-50">
                <span>Submitted by: <strong className="text-slate-600">{rep.submitted_by_name}</strong></span>
                <span>
                  {rep.submitted_at ? new Date(rep.submitted_at).toLocaleString() : 'Draft'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateReportModal
          projectId={project.id}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {reportToReview && (
        <ReviewReportModal
          report={reportToReview}
          isOpen={!!reportToReview}
          onClose={() => setReportToReview(null)}
        />
      )}
    </div>
  );
};
