import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  MessageSquare, 
  RefreshCw,
  AlertCircle,
  Activity,
  FileText
} from 'lucide-react';
import { analyticsApi } from '../../api/analytics';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, HealthBadge, PriorityBadge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';

export const StudentDashboard: React.FC = () => {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['student-analytics'],
    queryFn: () => analyticsApi.getStudentAnalytics(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Failed to load student project workspace</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {error instanceof Error ? error.message : 'Could not retrieve data from the backend.'}
        </p>
        <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const primaryProject = data.authorized_projects[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Project Hub</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Student Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personal deliverables, team milestone roadmap, and faculty feedback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            isLoading={isFetching}
            icon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
          >
            Refresh
          </Button>
          {primaryProject && (
            <Link to={`/projects/${primaryProject.id}`}>
              <Button size="sm" icon={<FolderKanban className="w-3.5 h-3.5" />}>
                Project Workspace
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Primary Project Hero Banner (if student belongs to a project) */}
      {primaryProject ? (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            {/* Academic Hierarchy Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 mb-3">
              <span className="text-slate-300 font-semibold">Department of CSE</span>
              <span>/</span>
              <span className="text-indigo-200 font-medium">
                {primaryProject.academic_year_name || 'Academic Year'} ({primaryProject.academic_year_code || 'AY'})
              </span>
              <span>/</span>
              <span className="font-bold text-white bg-indigo-800/80 px-2 py-0.5 rounded text-[11px]">
                Section {primaryProject.section_code || 'N/A'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="text-xs font-mono font-bold tracking-wider text-indigo-300 uppercase bg-indigo-900/60 px-2.5 py-1 rounded-md border border-indigo-700/50">
                {primaryProject.code} • {primaryProject.category}
              </span>
              <div className="flex items-center gap-2">
                <StatusBadge status={primaryProject.status} />
                <HealthBadge health={primaryProject.health_status as any} />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              {primaryProject.title}
            </h2>
            <p className="text-xs text-slate-300 mb-4 max-w-2xl">
              Faculty Mentor: <span className="font-semibold text-white">{primaryProject.mentor_name}</span> • Target Delivery: <span className="font-semibold text-white">{new Date(primaryProject.planned_completion_date).toLocaleDateString()}</span>
            </p>

            {/* Team Members List */}
            {primaryProject.team_members && primaryProject.team_members.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs text-indigo-200 font-medium">Team Members:</span>
                {primaryProject.team_members.map((member: any, mIdx: number) => {
                  const mName = typeof member === 'string' ? member : (member.name || member.full_name || 'Member');
                  const mRole = typeof member === 'string' 
                    ? (mIdx === 0 ? 'Leader' : 'Member') 
                    : (member.role || member.role_in_team || (mIdx === 0 ? 'Leader' : 'Member'));
                  return (
                    <span 
                      key={member.id || mIdx} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-xs text-white border border-white/10"
                    >
                      <span className="font-semibold">{mName}</span>
                      <span className="text-[10px] text-indigo-300 font-mono">({mRole})</span>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="space-y-1.5 max-w-xl">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Authoritative Computed Progress</span>
                <span className="text-indigo-300 font-bold">{primaryProject.progress_percentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(primaryProject.progress_percentage, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Progress formula: 100 × Σ(wᵢ × cᵢ) / Σ(wᵢ) based on verified task effort weights.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Card title="No Team Project Assigned" subtitle="Awaiting project allocation">
          <p className="text-xs text-slate-500">
            You are not currently designated on an active academic project. Contact your section advisor.
          </p>
        </Card>
      )}

      {/* Overdue Task Warnings (if any) */}
      {data.overdue_tasks.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-rose-900">Overdue Deliverables Warning</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              You have {data.overdue_tasks.length} task(s) past their scheduled target completion date. Submit for review immediately.
            </p>
            <div className="mt-2 space-y-1">
              {data.overdue_tasks.map((ot, idx) => (
                <div key={idx} className="text-xs font-medium text-rose-800 flex items-center gap-2">
                  <span>• {ot.title}</span>
                  <span className="text-[10px] text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                    Due: {new Date(ot.due_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid: My Assigned Tasks & Milestone Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Assigned Tasks */}
        <Card 
          title="My Assigned Tasks" 
          subtitle="Work items assigned to you"
          action={
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {data.assigned_tasks.length} Tasks
            </span>
          }
        >
          {data.assigned_tasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No individual tasks assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {data.assigned_tasks.map((task) => (
                <div key={task.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-900 truncate max-w-[200px]" title={task.title}>
                      {task.title}
                    </span>
                    <PriorityBadge priority={task.priority as any} />
                  </div>
                  
                  <div className="flex items-center justify-between text-slate-500 text-[11px] mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                    <StatusBadge status={task.status} />
                  </div>

                  {/* Completion Fraction */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                      <span>Task Completion</span>
                      <span className="font-semibold">{Math.round(task.completion_fraction * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full" 
                        style={{ width: `${Math.round(task.completion_fraction * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Project Milestones Roadmap */}
        <Card 
          title="Milestone Roadmap" 
          subtitle="Key stage gates and deliverables"
        >
          {data.project_milestones.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No milestones established for this project.</p>
          ) : (
            <div className="space-y-3">
              {data.project_milestones.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-900">{m.title}</h4>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Target: {new Date(m.planned_due_date).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                      {m.submission_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Progress Reports Status & Faculty Feedback */}
      <Card 
        title="Faculty Review Feedback & Report Submissions" 
        subtitle="Recent progress evaluations by supervisory faculty"
      >
        {data.report_review_status.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">No progress reports filed yet.</p>
        ) : (
          <div className="space-y-3">
            {data.report_review_status.map((rep) => (
              <div key={rep.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900">{rep.reporting_period}</span>
                  </div>
                  <StatusBadge status={rep.status} />
                </div>
                {rep.feedback ? (
                  <div className="mt-2 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-slate-700">
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-900 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Feedback from {rep.reviewer || 'Faculty Reviewer'}:</span>
                    </div>
                    <p className="text-slate-700 italic">"{rep.feedback}"</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic mt-1">Pending faculty review comments.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Activity Stream */}
      {data.recent_activity.length > 0 && (
        <Card title="Recent Project Activity" subtitle="Audit trail and actions taken on your team project">
          <div className="space-y-2.5">
            {data.recent_activity.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs py-1.5 border-b border-slate-100 last:border-0">
                <Activity className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-slate-800">{act.description}</p>
                  <span className="text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
