import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  FileCheck,
  Download
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

import { analyticsApi } from '../../api/analytics';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, HealthBadge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';

export const AdvisorDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = React.useState(false);
  const [selectedSectionId, setSelectedSectionId] = React.useState<number | undefined>(undefined);
  const [projectSearch, setProjectSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['advisor-analytics', selectedSectionId],
    queryFn: () => analyticsApi.getAdvisorAnalytics(selectedSectionId),
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
        <h3 className="text-base font-semibold text-slate-800">Failed to load section advisor dashboard</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {error instanceof Error ? error.message : 'Could not retrieve data from the backend.'}
        </p>
        <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  // Filter projects by search and status
  const filteredProjects = (data.projects || []).filter((p) => {
    const matchesSearch = 
      p.code.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
      (p.team_lead && p.team_lead.toLowerCase().includes(projectSearch.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header with Hierarchy Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          {/* Academic Hierarchy Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">Department of CSE</span>
            <span>/</span>
            <span className="text-indigo-600 font-medium">
              {data.academic_year_name || 'Academic Year'}
            </span>
            <span>/</span>
            <span className="font-bold text-slate-900">
              Class {data.section_code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Section Advisor Overview</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Section {data.section_code}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-stone-200/80 text-stone-800 border border-stone-300">
              {data.total_projects} Projects
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cohort: <span className="font-medium text-slate-700">{data.section_name}</span> • Faculty Advisor: <span className="font-medium text-slate-700">{data.advisor_name || 'Assigned Faculty'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Section Switcher if assigned to multiple sections */}
          {data.assigned_sections && data.assigned_sections.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 px-1">Switch:</span>
              {data.assigned_sections.map((sec) => (
                <button
                  key={sec.section_id}
                  onClick={() => setSelectedSectionId(sec.section_id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    (selectedSectionId === sec.section_id || (!selectedSectionId && data.section_id === sec.section_id))
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sec.section_code}
                </button>
              ))}
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              if (!data) return;
              setIsExporting(true);
              try {
                await analyticsApi.exportSectionCsv(data.section_id, data.section_code);
                showToast('success', 'Export Ready', `Section ${data.section_code} projects CSV downloaded.`);
              } catch (err: unknown) {
                showToast('error', 'Export Failed', err instanceof Error ? err.message : 'Export failed.');
              } finally {
                setIsExporting(false);
              }
            }}
            isLoading={isExporting}
            icon={<Download className="w-3.5 h-3.5 text-slate-500" />}
          >
            Export Section CSV
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            isLoading={isFetching}
            icon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
          >
            Refresh
          </Button>
          <Link to={`/projects?section_id=${data.section_id}`}>
            <Button size="sm" icon={<FolderKanban className="w-3.5 h-3.5" />}>
              Section Projects
            </Button>
          </Link>
        </div>
      </div>


      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Section Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.total_projects}</div>
          <span className="text-[11px] text-slate-500">Cohort Total</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Work</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{data.active_projects}</div>
          <span className="text-[11px] text-slate-500">In progress / approved</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{data.completed_projects}</div>
          <span className="text-[11px] text-slate-500">Final evaluation passed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">At Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{data.at_risk_projects}</div>
          <span className="text-[11px] text-slate-500">Needs intervention</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Overdue Tasks</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{data.overdue_tasks_count}</div>
          <span className="text-[11px] text-slate-500">Missed deadlines</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cohort Avg</span>
            <FileCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.section_average_progress}%</div>
          <span className="text-[11px] text-slate-500">{data.pending_reviews_count} pending reviews</span>
        </div>
      </div>

      {/* Grid: Section Projects Portfolio & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <Card 
          title="Section Project Portfolio" 
          subtitle={`Showing ${filteredProjects.length} of ${data.projects.length} projects assigned to cohort ${data.section_code}`}
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search projects..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Title & Domain</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Health</th>
                  <th className="py-3 px-3 text-right">Progress</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                      No projects match the search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-indigo-600 whitespace-nowrap">
                        {proj.code}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900 max-w-[200px] truncate" title={proj.title}>
                          {proj.title}
                        </div>
                        <div className="text-[11px] text-slate-500">Lead: {proj.team_lead}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={proj.status} />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <HealthBadge health={proj.health_status as any} />
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{proj.progress_percentage}%</span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <Link 
                          to={`/projects/${proj.id}`} 
                          className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                        >
                          Inspect <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Upcoming Milestones Sidebar */}
        <div className="space-y-6">
          <Card 
            title="Upcoming Milestones" 
            subtitle="Scheduled deliverables for next 30 days"
          >
            {data.upcoming_deadlines.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No upcoming milestone deadlines.</p>
            ) : (
              <div className="space-y-3">
                {data.upcoming_deadlines.map((d, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xs transition-all text-xs">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-slate-900 line-clamp-1 leading-snug" title={d.title}>
                        {d.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shrink-0">
                        {d.project_code}
                      </span>
                    </div>
                    {d.project_title && (
                      <p className="text-[11px] text-slate-500 truncate mb-2" title={d.project_title}>
                        Project: {d.project_title}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1.5 font-medium text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        Due: {new Date(d.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-full">
                        Deliverable
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Stats on Status */}
          <Card title="Status Breakdown" subtitle="Projects distribution">
            <div className="space-y-2 text-xs">
              {Object.entries(data.projects_by_status).map(([st, cnt]) => (
                <div key={st} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600">{st.replace(/_/g, ' ')}</span>
                  <span className="font-bold text-slate-800">{cnt}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
