import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import { analyticsApi } from '../../api/analytics';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, HealthBadge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';

export const MentorDashboard: React.FC = () => {
  const [selectedCohort, setSelectedCohort] = React.useState<string>('ALL');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['mentor-analytics'],
    queryFn: () => analyticsApi.getMentorAnalytics(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Failed to load mentor supervision dashboard</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {error instanceof Error ? error.message : 'Could not retrieve data from the backend.'}
        </p>
        <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  // Filter projects by selected cohort group
  const cohortGroups = data.projects_by_year_and_section || [];
  const filteredProjects = selectedCohort === 'ALL'
    ? data.assigned_projects
    : data.assigned_projects.filter((p) => {
        const [yCode, sCode] = selectedCohort.split('::');
        return p.academic_year_code === yCode && p.section_code === sCode;
      });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">Department of Computer Science & Engineering</span>
            <span>/</span>
            <span className="text-indigo-600 font-medium">Faculty Mentorship & Supervision</span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Mentor Supervision</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Mentor View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervising <strong className="text-slate-800">{data.assigned_projects_count}</strong> research projects across <strong className="text-slate-800">{cohortGroups.length}</strong> academic cohorts.
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
          <Link to="/projects">
            <Button size="sm" icon={<FolderKanban className="w-3.5 h-3.5" />}>
              My Assigned Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Assigned Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.assigned_projects_count}</div>
          <span className="text-[11px] text-slate-500">Mentored cohorts</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pending Reviews</span>
            <FileCheck2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{data.pending_reviews_count}</div>
          <span className="text-[11px] text-slate-500">Reports submitted</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">At Risk</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{data.at_risk_count}</div>
          <span className="text-[11px] text-slate-500">Needs guidance</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{data.completed_count}</div>
          <span className="text-[11px] text-slate-500">Finalized projects</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Average Progress</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{data.average_progress}%</div>
          <span className="text-[11px] text-slate-500">Across supervised teams</span>
        </div>
      </div>

      {/* Review Queue & Deliverables Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Reports for Review */}
        <Card 
          title="Student Reports Awaiting Evaluation" 
          subtitle="Submitted progress reports requiring your feedback"
          action={
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {data.pending_reports.length} Pending
            </span>
          }
        >
          {data.pending_reports.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              All submitted progress reports have been reviewed.
            </div>
          ) : (
            <div className="space-y-3">
              {data.pending_reports.map((report) => (
                <div key={report.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-indigo-600">{report.project_code}</span>
                      <span className="font-semibold text-slate-800">{report.reporting_period}</span>
                    </div>
                    <p className="text-slate-500 truncate max-w-sm">{report.project_title}</p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Submitted by: <span className="text-slate-700">{report.submitted_by}</span>
                    </div>
                  </div>
                  <Link to={`/projects/${report.id}`}>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Overdue Tasks Across Projects */}
        <Card 
          title="Overdue Tasks Across Supervised Teams" 
          subtitle="Tasks that have crossed due dates without completion"
          action={
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {data.overdue_tasks.length} Overdue
            </span>
          }
        >
          {data.overdue_tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              No overdue tasks in your supervised projects portfolio.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {data.overdue_tasks.map((task) => (
                <div key={task.id} className="p-3 rounded-lg border border-rose-100 bg-rose-50/30 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-slate-800">{task.title}</span>
                      <span className="text-[10px] text-indigo-600 font-bold">{task.project_code}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Assignee: {task.assignee} • Priority: <span className="font-semibold">{task.priority}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-rose-600 text-[11px] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Supervised Project Portfolio Grid */}
      <Card 
        title="Supervised Project Portfolio" 
        subtitle="Grouped by Academic Year and Section with live progress and health tracking"
        action={
          cohortGroups.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedCohort('ALL')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  selectedCohort === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Cohorts ({data.assigned_projects_count})
              </button>
              {cohortGroups.map((grp: any, idx: number) => {
                const key = `${grp.year_code}::${grp.section_code}`;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedCohort(key)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      selectedCohort === key
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {grp.year_code} - Sec {grp.section_code} ({grp.projects_count})
                  </button>
                );
              })}
            </div>
          )
        }
      >
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No projects found in this academic cohort.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((proj) => (
              <div key={proj.id} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-600">{proj.code}</span>
                    <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {proj.academic_year_code || 'AY'} • Sec {proj.section_code}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1" title={proj.title}>
                    {proj.title}
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">Lead: {proj.team_lead_name}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <StatusBadge status={proj.status} />
                    <HealthBadge health={proj.health_status as any} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Progress</span>
                    <span className="font-bold text-slate-800">{proj.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div 
                      className="h-full bg-indigo-600 rounded-full" 
                      style={{ width: `${Math.min(proj.progress_percentage, 100)}%` }} 
                    />
                  </div>
                  <Link to={`/projects/${proj.id}`}>
                    <Button size="sm" variant="outline" className="w-full text-xs" icon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                      Open Project Workspace
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
