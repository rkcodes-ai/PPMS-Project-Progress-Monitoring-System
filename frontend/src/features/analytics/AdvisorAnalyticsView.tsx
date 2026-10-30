import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Download, 
  RefreshCw, 
  FolderKanban, 
  Search, 
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { analyticsApi } from '../../api/analytics';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, HealthBadge } from '../../components/ui/Badge';
import { CardSkeleton, TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';

export const AdvisorAnalyticsView: React.FC = () => {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['advisor-analytics', selectedSectionId],
    queryFn: () => analyticsApi.getAdvisorAnalytics(selectedSectionId),
  });

  const handleExport = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      await analyticsApi.exportSectionCsv(data.section_id, data.section_code);
      showToast('success', 'Export Ready', `Section ${data.section_code} analytics CSV downloaded.`);
    } catch (err) {
      showToast('error', 'Export Failed', err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
        <CardSkeleton count={4} />
        <TableSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Unable to load section analytics</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {error instanceof Error ? error.message : 'Could not retrieve data from the backend.'}
        </p>
        <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const projects = data.projects || [];
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.team_lead && p.team_lead.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = data.total_projects || projects.length;
  const completed = data.completed_projects || 0;
  const atRisk = data.at_risk_projects || 0;
  const avgProg = data.section_average_progress || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-700">Department of CSE</span>
            <span>/</span>
            <span className="text-indigo-600 font-medium">{data.academic_year_name || 'Academic Year'}</span>
            <span>/</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              Section {data.section_code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Section Cohort Analytics & Delivery Velocity
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Section {data.section_code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cohort: <span className="font-medium text-slate-700">{data.section_name}</span> • Total Tracked Deliverables: <strong className="text-slate-800">{total} Projects</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
            onClick={handleExport}
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

      {/* Top 4 Section KPI Cards (Zero-Charts Compliant) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Section Average Velocity */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cohort Velocity</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {avgProg.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">Weighted Mean</span>
          </div>
          <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, avgProg))}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="text-emerald-700 font-semibold">{completed} Finalized</span>
            <span className="text-slate-600">{total} Cohort Projects</span>
          </div>
        </Card>

        {/* KPI 2: Section Risk Exposure */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">At-Risk Projects</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
              {atRisk}
            </span>
            <span className="text-xs text-slate-500 font-medium">of {total} Teams</span>
          </div>
          <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (atRisk / total) * 100 : 0}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="text-amber-700 font-semibold">{total > 0 ? Math.round((atRisk / total) * 100) : 0}% Need Help</span>
            <span className="text-slate-500">Milestone Deadlines</span>
          </div>
        </Card>

        {/* KPI 3: Overdue Deliverables */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Deliverables</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
              {data.overdue_tasks_count}
            </span>
            <span className="text-xs text-slate-400 font-mono">Missed Target</span>
          </div>
          <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, data.overdue_tasks_count * 10)}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Action Required</span>
            <span className="text-rose-700 font-semibold">Immediate Follow-up</span>
          </div>
        </Card>

        {/* KPI 4: Pending Reviews */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Faculty Reviews</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {data.pending_reviews_count}
            </span>
            <span className="text-xs text-slate-400 font-mono">In Queue</span>
          </div>
          <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(20, data.pending_reviews_count * 15))}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Stage-Gate Verification</span>
            <span className="text-emerald-700 font-semibold">Ready for Mentor</span>
          </div>
        </Card>
      </div>

      {/* SECTION MATRIX: PROJECTS AUDIT & VELOCITY TABLE */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Section Project Velocity & Stage-Gate Audit Table
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Team deliverable progress, health status, and student leader tracking.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Project Details</th>
                <th className="py-2.5 px-3">Team Lead</th>
                <th className="py-2.5 px-3 min-w-[160px]">Authoritative Progress</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Health</th>
                <th className="py-2.5 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No projects match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block text-sm">{p.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        Code: {p.code} • Category: {p.category || 'Academic Project'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{p.team_lead || 'Team Member'}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 text-xs">{p.progress_percentage}%</span>
                        <span className="text-[10px] text-slate-400 font-mono">Weighted</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, p.progress_percentage)}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="py-3 px-3">
                      <HealthBadge health={p.health_status as any} />
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Link 
                        to={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <span>Workspace</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
