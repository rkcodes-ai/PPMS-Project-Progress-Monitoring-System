import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Layers,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Download,
  GraduationCap,
  School,
  ChevronRight,
  ArrowLeft,
  Search,
  UserCheck
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { analyticsApi } from '../../api/analytics';
import { projectsApi } from '../../api/projects';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';
import type { AcademicYearDetail, SectionSummary, ProjectStatusEnum } from '../../types';

export const HODDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [isExportingDept, setIsExportingDept] = useState(false);
  const [isExportingMentor, setIsExportingMentor] = useState(false);

  // Hierarchy drill-down state: null = Department Overview, object = Year Dashboard or Section View
  const [selectedYear, setSelectedYear] = useState<AcademicYearDetail | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionSummary | null>(null);

  // Section-level search, filter, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatusEnum | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['hod-analytics'],
    queryFn: () => analyticsApi.getHODAnalytics(),
  });

  // Query section-specific projects when a section is selected
  const { 
    data: sectionProjectsData, 
    isLoading: isLoadingSectionProjects 
  } = useQuery({
    queryKey: ['section-projects', selectedSection?.id, searchQuery, statusFilter, page],
    queryFn: () => projectsApi.getProjects({
      section_id: selectedSection?.id,
      search: searchQuery || undefined,
      status: (statusFilter as ProjectStatusEnum) || undefined,
      page,
      size: 10
    }),
    enabled: !!selectedSection
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <CardSkeleton count={6} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Failed to load department analytics</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {error instanceof Error ? error.message : 'Could not retrieve data from the backend.'}
        </p>
        <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const yearsSummary: AcademicYearDetail[] = data.years_summary || [];

  // =========================================================================
  // VIEW LEVEL 3: SECTION PROJECT LIST
  // =========================================================================
  if (selectedSection && selectedYear) {
    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <button 
            type="button" 
            onClick={() => { setSelectedSection(null); setSelectedYear(null); }}
            className="hover:text-indigo-600 font-medium transition-colors"
          >
            Department Overview
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button 
            type="button" 
            onClick={() => setSelectedSection(null)}
            className="hover:text-indigo-600 font-medium transition-colors"
          >
            {selectedYear.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">
            Section {selectedSection.name} ({selectedSection.code})
          </span>
        </nav>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedSection(null)}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back to {selectedYear.name}
              </Button>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Section {selectedSection.name} Projects
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                {selectedSection.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Class Section Cohort • Assigned Advisor: <strong className="text-slate-800">{selectedSection.assigned_advisor_name || 'Unassigned'}</strong> • Total Projects: <strong className="text-indigo-600 font-bold">{selectedSection.total_projects}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  await analyticsApi.exportSectionCsv(selectedSection.id, selectedSection.code);
                  showToast('success', 'Export Ready', `Section ${selectedSection.code} CSV downloaded.`);
                } catch (err: unknown) {
                  showToast('error', 'Export Failed', err instanceof Error ? err.message : 'Export failed.');
                }
              }}
              icon={<Download className="w-3.5 h-3.5 text-slate-500" />}
            >
              Export Section CSV
            </Button>
          </div>
        </div>

        {/* Section KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Section Total</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{selectedSection.total_projects}</div>
            <span className="text-[11px] text-slate-500">Target minimum: 25</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{selectedSection.active_projects}</div>
            <span className="text-[11px] text-slate-500">In development</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{selectedSection.completed_projects}</div>
            <span className="text-[11px] text-slate-500">Evaluated & approved</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Average Progress</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{selectedSection.average_progress}%</div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full" 
                style={{ width: `${Math.min(selectedSection.average_progress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by project title or code..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as ProjectStatusEnum | ''); setPage(1); }}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUBMITTED_FOR_FINAL_REVIEW">Final Review</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>

        {/* Projects Table */}
        <Card title={`Projects in Section ${selectedSection.name}`} subtitle={`Displaying ${sectionProjectsData?.items.length || 0} of ${sectionProjectsData?.total || 0} projects`}>
          {isLoadingSectionProjects ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading section projects...</div>
          ) : !sectionProjectsData || sectionProjectsData.items.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No projects match the current search or status filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                    <th className="py-2.5 px-3 font-semibold">Code</th>
                    <th className="py-2.5 px-3 font-semibold">Project Title</th>
                    <th className="py-2.5 px-3 font-semibold">Team Lead</th>
                    <th className="py-2.5 px-3 font-semibold">Faculty Mentor</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Progress</th>
                    <th className="py-2.5 px-3 font-semibold">Due Date</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sectionProjectsData.items.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 whitespace-nowrap">
                        {proj.code}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate" title={proj.title}>
                        {proj.title}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {proj.team_lead_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {proj.mentor_name || 'Unassigned'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={proj.status} />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full" 
                              style={{ width: `${Math.min(proj.progress_percentage, 100)}%` }} 
                            />
                          </div>
                          <span className="font-semibold text-slate-700">{proj.progress_percentage}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(proj.planned_completion_date).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <Link to={`/projects/${proj.id}`}>
                          <Button size="sm" variant="outline" className="text-xs" icon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                            Workspace
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {sectionProjectsData.total_pages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Page {page} of {sectionProjectsData.total_pages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    >
                      Previous
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={page >= sectionProjectsData.total_pages}
                      onClick={() => setPage((p) => Math.min(p + 1, sectionProjectsData.total_pages))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // =========================================================================
  // VIEW LEVEL 2: ACADEMIC YEAR DASHBOARD
  // =========================================================================
  if (selectedYear) {
    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <button 
            type="button" 
            onClick={() => setSelectedYear(null)}
            className="hover:text-indigo-600 font-medium transition-colors"
          >
            Department Overview
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">{selectedYear.name} Cohort</span>
        </nav>

        {/* Year Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedYear(null)}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back to Department
              </Button>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {selectedYear.name} Academic Dashboard
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Year {selectedYear.year_number}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Class Section Tracking • {selectedYear.sections_count} Sections • Total Projects: <strong className="text-indigo-600 font-bold">{selectedYear.total_projects}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/projects?academic_year_id=${selectedYear.id || selectedYear.year_number}`}>
              <Button size="sm" variant="outline" icon={<FolderKanban className="w-3.5 h-3.5" />}>
                All {selectedYear.name} Projects
              </Button>
            </Link>
          </div>
        </div>

        {/* Year KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Projects</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{selectedYear.total_projects}</div>
            <span className="text-[11px] text-slate-500">Across {selectedYear.sections_count} sections</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sections</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{selectedYear.sections_count}</div>
            <span className="text-[11px] text-slate-500">Active cohorts</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">In Progress</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{selectedYear.active_projects}</div>
            <span className="text-[11px] text-slate-500">Development phase</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{selectedYear.completed_projects}</div>
            <span className="text-[11px] text-slate-500">Evaluated & archived</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">At Risk</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{selectedYear.at_risk_projects}</div>
            <span className="text-[11px] text-slate-500">Requires attention</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Avg Progress</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{selectedYear.average_progress}%</div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full" 
                style={{ width: `${Math.min(selectedYear.average_progress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Section Cards for this Year */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {selectedYear.name} Sections & Classes
              </h2>
              <p className="text-xs text-slate-500">
                Click on any section to inspect its projects, tasks, and advisor assignments.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              {selectedYear.sections.length} Sections Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {selectedYear.sections.map((sec) => (
              <div 
                key={sec.id}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                onClick={() => setSelectedSection(sec)}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                      {sec.code}
                    </span>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                      {sec.total_projects} Projects
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Section {sec.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 mb-4">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Advisor: <strong className="text-slate-700">{sec.assigned_advisor_name || 'Unassigned'}</strong></span>
                  </div>

                  {/* Section Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Active</span>
                      <p className="text-xs font-bold text-indigo-600">{sec.active_projects}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Completed</span>
                      <p className="text-xs font-bold text-emerald-600">{sec.completed_projects}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">At Risk</span>
                      <p className="text-xs font-bold text-amber-600">{sec.at_risk_projects}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Cohort Progress</span>
                    <span className="font-bold text-slate-800">{sec.average_progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(sec.average_progress, 100)}%` }}
                    />
                  </div>

                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => { e.stopPropagation(); setSelectedSection(sec); }}
                    className="w-full text-xs group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors"
                    icon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    View Section Projects ({sec.total_projects})
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW LEVEL 1: DEPARTMENT OVERVIEW (DEFAULT)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HOD Department Overview</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              Department Level
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Academic Hierarchy: Computer Science & Engineering • 3 Academic Years • 13 Sections • <strong className="text-indigo-600 font-bold">{data.total_projects} Total Projects</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              setIsExportingDept(true);
              try {
                await analyticsApi.exportDepartmentCsv();
                showToast('success', 'Export Ready', 'Department analytics CSV downloaded.');
              } catch (err: unknown) {
                showToast('error', 'Export Failed', err instanceof Error ? err.message : 'Export failed.');
              } finally {
                setIsExportingDept(false);
              }
            }}
            isLoading={isExportingDept}
            icon={<Download className="w-3.5 h-3.5 text-slate-500" />}
          >
            Export Dept CSV
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              setIsExportingMentor(true);
              try {
                await analyticsApi.exportMentorWorkloadCsv();
                showToast('success', 'Export Ready', 'Mentor workload CSV downloaded.');
              } catch (err: unknown) {
                showToast('error', 'Export Failed', err instanceof Error ? err.message : 'Export failed.');
              } finally {
                setIsExportingMentor(false);
              }
            }}
            isLoading={isExportingMentor}
            icon={<Download className="w-3.5 h-3.5 text-slate-500" />}
          >
            Export Mentors CSV
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

          <Link to="/projects">
            <Button size="sm" icon={<FolderKanban className="w-3.5 h-3.5" />}>
              All Projects ({data.total_projects})
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Department-Wide KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Years</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{data.total_academic_years || 3}</div>
          <span className="text-[10px] text-slate-500">2nd, 3rd, 4th Year</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Sections</span>
            <School className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{data.total_sections || 13}</div>
          <span className="text-[10px] text-slate-500">All 13 Sections</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Dept Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-600">{data.total_projects}</div>
          <span className="text-[10px] text-slate-500">Min 25 / section</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">In Progress</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-teal-700">{data.in_progress_count}</div>
          <span className="text-[10px] text-slate-500">Active development</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600">{data.completed_count}</div>
          <span className="text-[10px] text-slate-500">Approved projects</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">At Risk / Delay</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600">{data.at_risk_count}</div>
          <span className="text-[10px] text-slate-500">Needs intervention</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Avg Progress</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{data.average_progress}%</div>
          <span className="text-[10px] text-slate-500">{data.pending_reviews_count} reviews</span>
        </div>
      </div>

      {/* Academic Year Cards Section (Hierarchy Navigation) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Academic Year Comparison</h2>
            <p className="text-xs text-slate-500">
              Select an academic year to inspect its sections, project counts, and advisor assignments.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">
            Department Total: {data.total_projects} Projects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {yearsSummary.map((year) => (
            <div 
              key={year.id || year.year_number}
              className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group"
              onClick={() => setSelectedYear(year)}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                    Year {year.year_number}
                  </span>
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {year.total_projects} Projects
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {year.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">
                  {year.sections_count} Sections • Minimum {year.sections_count * 25} Projects Required
                </p>

                {/* Micro Metric Matrix */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center mb-4">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Active</span>
                    <p className="text-sm font-bold text-indigo-600 mt-0.5">{year.active_projects}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Completed</span>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">{year.completed_projects}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">At Risk</span>
                    <p className="text-sm font-bold text-amber-600 mt-0.5">{year.at_risk_projects}</p>
                  </div>
                </div>

                {/* Sections List Preview */}
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Sections ({year.sections_count})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {year.sections.map((s) => (
                      <span 
                        key={s.id} 
                        className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {s.name} ({s.total_projects})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-medium">Cohort Progress</span>
                  <span className="font-bold text-slate-800">{year.average_progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(year.average_progress, 100)}%` }}
                  />
                </div>

                <Button 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); setSelectedYear(year); }}
                  className="w-full text-xs font-semibold group-hover:bg-indigo-700" 
                  icon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Explore {year.name} Dashboard
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Breakdown & Lifecycle Metrics (Information-Dense Text & Badges, No Pie Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card 
          title="Project Lifecycle Distribution" 
          subtitle="Status breakdown across all 325 department projects" 
          className="lg:col-span-1"
        >
          <div className="space-y-2.5">
            {Object.entries(data.projects_by_status).map(([st, count]) => {
              const pct = data.total_projects > 0 ? Math.round((count / data.total_projects) * 100) : 0;
              return (
                <div key={st} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={st as any} />
                    <span className="font-semibold text-slate-800">{st.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{count}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Section Comparison Matrix (Information-Dense Accessible Table, No Bar Chart) */}
        <Card 
          title="Department Section Benchmark (13 Sections)" 
          subtitle="Verified project counts, completion metrics, and advisor assignments"
          className="lg:col-span-2"
        >
          <div className="overflow-x-auto max-h-80 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                  <th className="py-2 px-2.5 font-semibold">Section</th>
                  <th className="py-2 px-2.5 font-semibold">Code</th>
                  <th className="py-2 px-2.5 font-semibold text-center">Projects</th>
                  <th className="py-2 px-2.5 font-semibold text-center">Active</th>
                  <th className="py-2 px-2.5 font-semibold text-center">Completed</th>
                  <th className="py-2 px-2.5 font-semibold text-center">At Risk</th>
                  <th className="py-2 px-2.5 font-semibold">Progress</th>
                  <th className="py-2 px-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.section_comparisons.map((sec) => (
                  <tr key={sec.section_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-2.5 font-medium text-slate-900 whitespace-nowrap">
                      {sec.section_name}
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[11px] text-indigo-600 font-semibold whitespace-nowrap">
                      {sec.section_code}
                    </td>
                    <td className="py-2 px-2.5 text-center font-bold text-slate-800">
                      {sec.total_projects}
                    </td>
                    <td className="py-2 px-2.5 text-center text-indigo-600 font-medium">
                      {sec.total_projects - sec.completed_projects - sec.at_risk_projects}
                    </td>
                    <td className="py-2 px-2.5 text-center text-emerald-600 font-medium">
                      {sec.completed_projects}
                    </td>
                    <td className="py-2 px-2.5 text-center text-amber-600 font-medium">
                      {sec.at_risk_projects}
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full" 
                            style={{ width: `${Math.min(sec.avg_progress, 100)}%` }} 
                          />
                        </div>
                        <span className="font-semibold text-slate-700 text-[11px]">{sec.avg_progress}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          // Find corresponding year
                          const matchedYear = yearsSummary.find((y) => y.sections.some((s) => s.id === sec.section_id));
                          const matchedSection = matchedYear?.sections.find((s) => s.id === sec.section_id);
                          if (matchedYear && matchedSection) {
                            setSelectedYear(matchedYear);
                            setSelectedSection(matchedSection);
                          }
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Faculty Mentor Supervision Workload */}
      <Card 
        title="Faculty Mentor Supervision Distribution" 
        subtitle="Department faculty project allocations and average supervised progress"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.mentor_workload.map((mentor) => (
            <div key={mentor.mentor_id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-slate-900">{mentor.mentor_name}</h4>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {mentor.project_count} Projects
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{mentor.email}</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">Average Progress</span>
                  <span className="font-bold text-slate-800">{mentor.average_progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full" 
                    style={{ width: `${Math.min(mentor.average_progress, 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
