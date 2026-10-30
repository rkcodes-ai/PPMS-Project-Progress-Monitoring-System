import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Edit3, 
  Calendar, 
  User, 
  GraduationCap, 
  Layers, 
  AlertCircle,
  Users,
  CheckSquare,
  Milestone as MilestoneIcon,
  FileText,
  MessageSquare,
  Award
} from 'lucide-react';
import { projectsApi } from '../../api/projects';
import { certificatesApi } from '../../api/certificates';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { StatusBadge, HealthBadge, PriorityBadge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { TasksTab } from '../tasks/TasksTab';
import { MilestonesTab } from '../milestones/MilestonesTab';
import { ReportsTab } from '../reports/ReportsTab';
import { DocumentsTab } from '../documents/DocumentsTab';
import { DiscussionsTab } from '../discussions/DiscussionsTab';
import { EditProjectModal } from './EditProjectModal';


export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeRole } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'tasks' | 'milestones' | 'reports' | 'documents' | 'discussions'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCertDownloading, setIsCertDownloading] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectComments, setRejectComments] = useState('');

  const pId = Number(projectId);

  const handleDownloadCertificate = async () => {
    if (!project) return;
    try {
      setIsCertDownloading(true);
      await certificatesApi.downloadProjectCertificate(project.id, project.code);
      showToast('success', 'Certificate Downloaded', `Official Completion Certificate for ${project.code} generated successfully.`);
    } catch (err) {
      showToast('error', 'Certificate Download Failed', err instanceof Error ? err.message : 'Unable to generate completion certificate.');
    } finally {
      setIsCertDownloading(false);
    }
  };

  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ['project', pId],
    queryFn: () => projectsApi.getProject(pId),
    enabled: !isNaN(pId),
  });

  // Lifecycle Mutations
  const submitMutation = useMutation({
    mutationFn: () => projectsApi.submitProject(pId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['project', pId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('success', 'Proposal Submitted', `Project ${updated.code} has been submitted for formal review.`);
    },
    onError: (err: Error) => showToast('error', 'Submission Failed', err.message),
  });

  const approveMutation = useMutation({
    mutationFn: () => projectsApi.approveProject(pId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['project', pId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hod-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-analytics'] });
      showToast('success', 'Project Approved', `Project ${updated.code} state transitioned to ${updated.status}.`);
    },
    onError: (err: Error) => showToast('error', 'Approval Failed', err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (comments: string) => projectsApi.rejectProject(pId, comments),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['project', pId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('warning', 'Project Rejected', `Proposal returned: ${updated.status}.`);
      setIsRejectModalOpen(false);
      setRejectComments('');
    },
    onError: (err: Error) => showToast('error', 'Rejection Failed', err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-44 bg-slate-200 rounded-xl animate-pulse"></div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Unable to load project workspace</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {error instanceof Error ? error.message : 'You may not have authorized permissions to view this project.'}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Link to="/projects">
            <Button size="sm" variant="outline">
              Back to Projects
            </Button>
          </Link>
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Lifecycle action permissions
  const isFacultyOrAdmin = activeRole === 'HOD' || activeRole === 'ADVISOR';
  const canSubmit = (project.status === 'DRAFT') && (activeRole === 'STUDENT' || isFacultyOrAdmin);
  const canApprove = (project.status === 'SUBMITTED' || project.status === 'UNDER_REVIEW' || project.status === 'SUBMITTED_FOR_FINAL_REVIEW') && isFacultyOrAdmin;
  const canReject = (project.status === 'SUBMITTED' || project.status === 'UNDER_REVIEW') && isFacultyOrAdmin;
  const canEdit = isFacultyOrAdmin || (activeRole === 'STUDENT' && project.status === 'DRAFT');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
    { id: 'members', label: 'Team Members', count: project.members.length, icon: <Users className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', count: project.task_count, icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'milestones', label: 'Milestones', count: project.milestone_count, icon: <MilestoneIcon className="w-4 h-4" /> },
    { id: 'reports', label: 'Progress Reports', count: project.report_count, icon: <FileText className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4 text-indigo-500" /> },
    { id: 'discussions', label: 'Discussions', icon: <MessageSquare className="w-4 h-4 text-indigo-500" /> },
  ];


  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/projects" className="hover:text-indigo-600 flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Projects
        </Link>
        <span>/</span>
        <span className="font-mono font-semibold text-slate-800">{project.code}</span>
      </div>

      {/* Project Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {project.code}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Section {project.section_code} • {project.academic_year_name}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {project.category}
              </span>
              <PriorityBadge priority={project.priority} />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
              {project.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Team Lead: <strong className="text-slate-800">{project.team_lead_name}</strong>
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                Mentor: <strong className="text-slate-800">{project.mentor_name || 'Unassigned'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Target: <strong className="text-slate-800">{new Date(project.planned_completion_date).toLocaleDateString()}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={project.status} />
              <HealthBadge health={project.health_status} />
            </div>
          </div>

          {/* Right: Progress Meter & Lifecycle Controls */}
          <div className="w-full lg:w-72 flex flex-col justify-between pt-4 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-slate-200">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Authoritative Progress</span>
                <span className="font-bold text-indigo-600 text-sm">{project.progress_percentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full" 
                  style={{ width: `${Math.min(project.progress_percentage, 100)}%` }} 
                />
              </div>
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="space-y-2">
              {canSubmit && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => submitMutation.mutate()}
                  isLoading={submitMutation.isPending}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Submit Proposal for Review
                </Button>
              )}

              {canApprove && (
                <Button
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                  onClick={() => approveMutation.mutate()}
                  isLoading={approveMutation.isPending}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  {project.status === 'SUBMITTED_FOR_FINAL_REVIEW' ? 'Approve Final & Complete' : 'Approve Proposal'}
                </Button>
              )}

              {canReject && (
                <Button
                  size="sm"
                  variant="danger"
                  className="w-full"
                  onClick={() => setIsRejectModalOpen(true)}
                  icon={<XCircle className="w-3.5 h-3.5" />}
                >
                  Reject Proposal
                </Button>
              )}

              {project.status === 'COMPLETED' && (
                <Button
                  size="sm"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                  onClick={handleDownloadCertificate}
                  isLoading={isCertDownloading}
                  icon={<Award className="w-4 h-4 text-amber-100" />}
                >
                  Download Completion Certificate
                </Button>
              )}

              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => setIsEditModalOpen(true)}
                  icon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Edit Project Parameters
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card title="Project Scope & Objectives" subtitle="Academic problem statement and expected outcomes">
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                  Description
                </h4>
                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>

              {project.objectives && (
                <div>
                  <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                    Deliverable Objectives
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                    {project.objectives}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Total Tasks
              </span>
              <span className="text-xl font-bold text-slate-800">{project.task_count}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Weighted deliverables</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Milestones
              </span>
              <span className="text-xl font-bold text-slate-800">{project.milestone_count}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Formal stage gates</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Progress Reports
              </span>
              <span className="text-xl font-bold text-slate-800">{project.report_count}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Periodic documentation</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <Card title="Team Composition" subtitle="Student investigators and designated leadership">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/60">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Role in Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {project.members.map((m) => {
                  const memberName = m.full_name || m.name || 'Member';
                  return (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {memberName.charAt(0)}
                      </div>
                      <span>{memberName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{m.email || ''}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                        m.role_in_team === 'Leader'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {m.role_in_team}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'tasks' && <TasksTab project={project} />}

      {activeTab === 'milestones' && <MilestonesTab project={project} />}

      {activeTab === 'reports' && <ReportsTab project={project} />}

      {activeTab === 'documents' && <DocumentsTab project={project} />}

      {activeTab === 'discussions' && <DiscussionsTab project={project} />}


      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditProjectModal
          project={project}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject Project Proposal"
          subtitle="Provide formal revision instructions for the student team"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Rejection Rationale / Feedback *
              </label>
              <textarea
                rows={4}
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
                placeholder="Explain deficiencies in scope, feasibility, or technical architecture..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate(rejectComments)}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
