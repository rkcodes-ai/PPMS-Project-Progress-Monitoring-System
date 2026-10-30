import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Clock, 
  Download, 
  RefreshCw, 
  FolderKanban, 
  Users, 
  Layers, 
  Search,
  AlertCircle,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { analyticsApi } from '../../api/analytics';
import { projectsApi } from '../../api/projects';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge, HealthBadge, PriorityBadge } from '../../components/ui/Badge';
import { CardSkeleton, TableSkeleton } from '../../components/ui/LoadingSkeleton';

export const StudentAnalyticsView: React.FC = () => {
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('ALL');

  // Fetch Student Analytics summary
  const { 
    data: studentData, 
    isLoading: isStudentLoading, 
    error: studentError, 
    refetch: refetchStudent,
    isFetching: isFetchingStudent
  } = useQuery({
    queryKey: ['student-analytics'],
    queryFn: () => analyticsApi.getStudentAnalytics(),
  });

  const primaryProject = studentData?.authorized_projects?.[0];
  const projectId = primaryProject?.id;

  // Fetch Full Project Detail for rich task effort, milestones, and review data
  const {
    data: projectDetail,
    isLoading: isDetailLoading,
    error: detailError,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: () => projectsApi.getProject(projectId!),
    enabled: !!projectId,
  });

  const isLoading = isStudentLoading || (!!projectId && isDetailLoading);
  const error = studentError || detailError;

  const handleRefresh = () => {
    refetchStudent();
    if (projectId) refetchDetail();
  };

  // Export Analytics CSV
  const handleExportCsv = () => {
    if (!projectDetail) return;

    const rows: string[] = [];
    rows.push(`Project Code,${projectDetail.code}`);
    rows.push(`Project Title,${projectDetail.title}`);
    rows.push(`Category,${projectDetail.category}`);
    rows.push(`Academic Year,${projectDetail.academic_year_name || ''}`);
    rows.push(`Section,${projectDetail.section_code || ''}`);
    rows.push(`Mentor,${projectDetail.mentor?.full_name || 'Unassigned'}`);
    rows.push(`Overall Progress,${projectDetail.progress_percentage.toFixed(2)}%`);
    rows.push(`Health Status,${projectDetail.health_status}`);
    rows.push('');

    // Tasks table
    rows.push('--- TASKS & EFFORT MATRIX ---');
    rows.push('Task Title,Priority,Weight (Hrs),Completion (%),Status,Due Date');
    (projectDetail.tasks || []).forEach((t) => {
      rows.push(
        `"${t.title.replace(/"/g, '""')}",${t.priority},${t.weight || 0},${((t.completion_fraction || 0) * 100).toFixed(0)}%,${t.status},${t.due_date ? new Date(t.due_date).toLocaleDateString() : ''}`
      );
    });
    rows.push('');

    // Milestones table
    rows.push('--- MILESTONES ROADMAP ---');
    rows.push('Milestone Title,Status,Target Date');
    (projectDetail.milestones || []).forEach((m) => {
      rows.push(`"${m.title.replace(/"/g, '""')}",${m.status},${m.target_date ? new Date(m.target_date).toLocaleDateString() : ''}`);
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_analytics_${projectDetail.code || 'export'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (error || !primaryProject) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Unable to load project analytics</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {error instanceof Error ? error.message : 'No authorized academic project found for your student account.'}
        </p>
        <Button size="sm" variant="outline" className="mt-4" onClick={handleRefresh} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Analytics Sync
        </Button>
      </div>
    );
  }

  const tasks = projectDetail?.tasks || [];
  const milestones = projectDetail?.milestones || [];
  const teamMembers = projectDetail?.members || [];
  const reports = projectDetail?.reports || [];

  // Compute key analytics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED' || t.status === 'CHANGES_REQUESTED').length;

  const totalEffortPlanned = tasks.reduce((acc, t) => acc + (t.weight || 0), 0);
  const earnedEffort = tasks.reduce((acc, t) => acc + (t.weight || 0) * (t.completion_fraction || 0), 0);
  const remainingEffort = Math.max(0, totalEffortPlanned - earnedEffort);

  const completedMilestones = milestones.filter((m) => m.status === 'APPROVED' || m.status === 'COMPLETED').length;

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = taskStatusFilter === 'ALL' || t.status === taskStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          {/* Hierarchy Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-700">Department of CSE</span>
            <span>/</span>
            <span>{primaryProject.academic_year_name || 'Academic Year'}</span>
            <span>/</span>
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
              Section {primaryProject.section_code || 'N/A'}
            </span>
            <span>/</span>
            <span className="font-mono text-slate-800">{primaryProject.code}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Performance & Analytics</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Deliverables & Velocity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative mathematical progress, effort allocation weights, and milestone compliance audit.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            isLoading={isFetchingStudent}
            icon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
          >
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCsv}
            icon={<Download className="w-3.5 h-3.5 text-slate-600" />}
          >
            Export CSV
          </Button>
          <Link to={`/projects/${primaryProject.id}`}>
            <Button size="sm" icon={<FolderKanban className="w-3.5 h-3.5" />}>
              Project Workspace
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 Analytical KPI Cards (Zero-Charts Compliant) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Authoritative Progress Score */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress Score</span>
            <HealthBadge health={primaryProject.health_status as any} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {primaryProject.progress_percentage.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">Weighted Earned</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, primaryProject.progress_percentage))}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Formula: 100 × Σ(wᵢ × cᵢ) / Σ(wᵢ)</span>
            <span className="font-semibold text-slate-700">{totalTasks} Tasks Tracked</span>
          </div>
        </Card>

        {/* KPI 2: Effort Weight Allocation */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Effort Allocation</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {earnedEffort.toFixed(0)} <span className="text-sm font-semibold text-slate-500">/ {totalEffortPlanned.toFixed(0)}h</span>
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: totalEffortPlanned > 0 ? `${(earnedEffort / totalEffortPlanned) * 100}%` : '0%' }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="text-emerald-700 font-medium">Earned: {totalEffortPlanned > 0 ? ((earnedEffort / totalEffortPlanned) * 100).toFixed(0) : 0}%</span>
            <span className="text-slate-500">Remaining: {remainingEffort.toFixed(0)}h</span>
          </div>
        </Card>

        {/* KPI 3: Task Execution Velocity */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Velocity</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {completedTasks} <span className="text-sm font-semibold text-slate-500">of {totalTasks} Done</span>
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 text-[11px] font-semibold text-center">
            <div className="bg-emerald-50 text-emerald-800 rounded py-1 border border-emerald-200/60">
              {completedTasks} Complete
            </div>
            <div className="bg-teal-50 text-teal-800 rounded py-1 border border-teal-200/60">
              {inProgressTasks} Active
            </div>
            <div className="bg-amber-50 text-amber-800 rounded py-1 border border-amber-200/60">
              {blockedTasks} Blocked
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 text-center">
            Execution Velocity: {totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0}% throughput
          </div>
        </Card>

        {/* KPI 4: Milestone Stage Gate Health */}
        <Card className="p-4 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage-Gate Audit</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {completedMilestones} <span className="text-sm font-semibold text-slate-500">/ {milestones.length} Stages</span>
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: milestones.length > 0 ? `${(completedMilestones / milestones.length) * 100}%` : '0%' }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Faculty Mentor: <strong className="text-slate-800">{primaryProject.mentor_name}</strong></span>
            <span className="text-emerald-700 font-semibold">{reports.length} Reports Filed</span>
          </div>
        </Card>
      </div>

      {/* SECTION 1: DETAILED TASK EFFORT & WEIGHT MATRIX */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Task Effort & Weight Allocation Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact mathematical weight factors, completion fractions, and execution status.
            </p>
          </div>

          {/* Filter & Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
              />
            </div>
            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="TO_DO">To Do</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Task Deliverable</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Effort (Weight)</th>
                <th className="py-2.5 px-3">Completion Fraction</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Target Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No tasks match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const weightPct = totalEffortPlanned > 0 ? ((task.weight || 0) / totalEffortPlanned) * 100 : 0;
                  const completionPct = ((task.completion_fraction || 0) * 100).toFixed(0);
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED';

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{task.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          ID: #{task.id} • {task.assignee?.full_name ? `Assigned: ${task.assignee.full_name}` : 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <PriorityBadge priority={task.priority as any} />
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {task.weight?.toFixed(1) || '0.0'} hrs
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {weightPct.toFixed(1)}% of project
                        </span>
                      </td>
                      <td className="py-3 px-3 min-w-[140px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 text-[11px]">{completionPct}%</span>
                          <span className="text-[10px] text-slate-400 font-mono">({task.completion_fraction?.toFixed(2)} fraction)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`font-mono text-[11px] ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                        </span>
                        {isOverdue && (
                          <span className="ml-1.5 text-[9px] uppercase px-1 py-0.2 rounded bg-rose-100 text-rose-800 font-bold">
                            Overdue
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 2: MILESTONES & TEAM WORKLOAD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestone Stage Gates */}
        <Card className="p-5 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Milestone Stage-Gate Roadmap
              </h3>
              <p className="text-[11px] text-slate-500">Academic checkpoints and formal stage approvals.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {completedMilestones} of {milestones.length} Completed
            </span>
          </div>

          <div className="space-y-3">
            {milestones.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No milestones established for this project.</p>
            ) : (
              milestones.map((m, idx) => (
                <div 
                  key={m.id} 
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    m.status === 'APPROVED' || m.status === 'COMPLETED'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : m.status === 'SUBMITTED'
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      m.status === 'APPROVED' || m.status === 'COMPLETED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-xs">{m.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{m.description || 'Stage review requirements.'}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                        <span>Target: {m.target_date ? new Date(m.target_date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={m.status} />
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Team Contribution & Workload Allocation */}
        <Card className="p-5 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Team Workload & Role Contribution
              </h3>
              <p className="text-[11px] text-slate-500">Task ownership and collaborative deliverables breakdown.</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {teamMembers.length} Members
            </span>
          </div>

          <div className="space-y-3">
            {teamMembers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No team members assigned.</p>
            ) : (
              teamMembers.map((member, idx) => {
                const memberUser = (member.user || {}) as any;
                const memberName = member.full_name || memberUser.full_name || member.name || `Team Member ${idx + 1}`;
                const memberRole = member.role_in_team || member.role || (idx === 0 ? 'Leader' : 'Member');
                const memberTasks = tasks.filter((t) => t.assignee_id === member.user_id || t.assignee?.id === member.user_id);
                const memberCompleted = memberTasks.filter((t) => t.status === 'COMPLETED').length;

                return (
                  <div key={member.id || idx} className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          {memberName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{memberName}</span>
                          <span className="text-[10px] text-indigo-600 font-semibold block">{memberRole}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800">
                          {memberCompleted} / {memberTasks.length || 0} Tasks Done
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {memberTasks.length > 0 ? ((memberCompleted / memberTasks.length) * 100).toFixed(0) : 0}% velocity
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
