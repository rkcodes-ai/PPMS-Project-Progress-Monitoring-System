import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  FolderKanban, 
  Layers,
  ArrowUpRight,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import { analyticsApi } from '../../api/analytics';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, HealthBadge } from '../../components/ui/Badge';
import { CardSkeleton, TableSkeleton } from '../../components/ui/LoadingSkeleton';

export const MentorAnalyticsView: React.FC = () => {
  const [selectedCohort, setSelectedCohort] = useState<string>('ALL');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['mentor-analytics'],
    queryFn: () => analyticsApi.getMentorAnalytics(),
  });

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
        <h3 className="text-base font-semibold text-slate-800">Unable to load mentorship analytics</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {error instanceof Error ? error.message : 'Could not retrieve data from the backend.'}
        </p>
        <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const assignedProjects = data.assigned_projects || [];
  const cohortGroups = data.projects_by_year_and_section || [];

  const filteredProjects = assignedProjects.filter((p) => {
    if (selectedCohort === 'ALL') return true;
    return p.section_code === selectedCohort;
  });

  const totalAssigned = data.assigned_projects_count || assignedProjects.length;
  const pendingReviews = data.pending_reviews_count || 0;
  const atRisk = data.at_risk_count || 0;
  const completed = data.completed_count || 0;
  const avgProg = data.average_progress || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-700">Department of CSE</span>
            <span>/</span>
            <span className="text-amber-700 font-medium">Faculty Mentorship</span>
            <span>/</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              Supervision Analytics
            </span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Mentorship Portfolio Analytics & Review Velocity
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Faculty Mentor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervising <strong className="text-slate-800">{totalAssigned} research projects</strong> across <strong className="text-slate-800">{cohortGroups.length} academic cohorts</strong>.
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
              Assigned Projects ({totalAssigned})
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Cards (Zero-Charts Compliant) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Supervised Average Progress */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supervised Velocity</span>
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
            <span className="text-slate-600">{totalAssigned} Supervised</span>
          </div>
        </Card>

        {/* KPI 2: Pending Evaluations */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluation Backlog</span>
            <FileCheck2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
              {pendingReviews}
            </span>
            <span className="text-xs text-slate-400 font-mono">Reports & Stages</span>
          </div>
          <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, pendingReviews * 12))}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Feedback Queue</span>
            <span className="text-amber-700 font-semibold">Immediate Action</span>
          </div>
        </Card>

        {/* KPI 3: Teams Requiring Guidance */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">At Risk Teams</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
              {atRisk}
            </span>
            <span className="text-xs text-slate-500 font-medium">of {totalAssigned} Projects</span>
          </div>
          <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalAssigned > 0 ? (atRisk / totalAssigned) * 100 : 0}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Intervention Required</span>
            <span className="text-rose-700 font-semibold">Overdue Tasks</span>
          </div>
        </Card>

        {/* KPI 4: Final Sign-off Approvals */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Viva & Archive</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {completed}
            </span>
            <span className="text-xs text-slate-400 font-mono">Certified</span>
          </div>
          <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Pass Rate</span>
            <span className="text-emerald-700 font-semibold">Ready for Certificate</span>
          </div>
        </Card>
      </div>

      {/* SUPERVISED PROJECTS VELOCITY & RISK TABLE */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              Supervised Projects Velocity & Health Tracking
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual team progress, cohort section assignment, and deliverable status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Assigned Cohorts</option>
              {cohortGroups.map((cg) => (
                <option key={cg.section_code} value={cg.section_code}>
                  {cg.year_name || cg.academic_year_name} • Section {cg.section_code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Research Project</th>
                <th className="py-2.5 px-3">Cohort Section</th>
                <th className="py-2.5 px-3 min-w-[160px]">Authoritative Progress</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Health</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No projects match the selected cohort.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block text-sm">{p.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        Code: {p.code} • Lead: {p.team_lead_name || p.team_lead || 'Student Lead'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {p.section_code}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 text-xs">{p.progress_percentage}%</span>
                        <span className="text-[10px] text-slate-400 font-mono">Earned</span>
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
                        <span>Inspect</span>
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
