import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FolderKanban, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  ArrowUpRight, 
  Calendar,
  User,
  GraduationCap,
  Download
} from 'lucide-react';
import { projectsApi } from '../../api/projects';
import { academicApi } from '../../api/academic';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

import { StatusBadge, HealthBadge, PriorityBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { CreateProjectModal } from './CreateProjectModal';
import type { ProjectStatusEnum } from '../../types';

export const ProjectListPage: React.FC = () => {
  const { activeRole } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || '');
  const [selectedYear, setSelectedYear] = useState<string>(searchParams.get('academic_year_id') || '');
  const [selectedSection, setSelectedSection] = useState<string>(searchParams.get('section_id') || '');
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load Academic Years
  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => academicApi.getYears(),
  });

  // Load Sections (filtered by selected year if chosen)
  const { data: availableSections } = useQuery({
    queryKey: ['academic-sections', selectedYear],
    queryFn: () => academicApi.getSections(selectedYear ? Number(selectedYear) : undefined),
  });

  const pageSize = 10;

  const queryParams = {
    page: currentPage,
    size: pageSize,
    ...(searchTerm ? { search: searchTerm } : {}),
    ...(selectedStatus ? { status: selectedStatus as ProjectStatusEnum } : {}),
    ...(selectedYear ? { academic_year_id: Number(selectedYear) } : {}),
    ...(selectedSection ? { section_id: Number(selectedSection) } : {}),
  };

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['projects', queryParams],
    queryFn: () => projectsApi.getProjects(queryParams),
  });

  const handleYearChange = (yearId: string) => {
    setSelectedYear(yearId);
    setSelectedSection(''); // Reset section when academic year changes
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    const newParams = new URLSearchParams();
    if (searchTerm) newParams.set('search', searchTerm);
    if (selectedStatus) newParams.set('status', selectedStatus);
    if (selectedYear) newParams.set('academic_year_id', selectedYear);
    if (selectedSection) newParams.set('section_id', selectedSection);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedYear('');
    setSelectedSection('');
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  };

  const canCreate = activeRole === 'HOD' || activeRole === 'ADVISOR' || activeRole === 'STUDENT';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Projects</h1>
            {data && (
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {data.total} Available
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scoped to your authorized permissions as <span className="font-semibold text-slate-700">{activeRole}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              setIsExporting(true);
              try {
                await projectsApi.exportProjectsCsv();
                showToast('success', 'Export Ready', 'Projects CSV report generated and downloaded.');
              } catch (err: unknown) {
                showToast('error', 'Export Failed', err instanceof Error ? err.message : 'Failed to export projects.');
              } finally {
                setIsExporting(false);
              }
            }}
            isLoading={isExporting}
            icon={<Download className="w-3.5 h-3.5 text-slate-500" />}
          >
            Export CSV
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

          {canCreate && (
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Initiate Project
            </Button>
          )}
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className={`relative ${activeRole === 'STUDENT' ? 'lg:col-span-3 sm:col-span-2' : 'lg:col-span-2'}`}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by code, title, or keywords..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Status Filter */}
            <div className={activeRole === 'STUDENT' ? 'lg:col-span-2' : ''}>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SUBMITTED_FOR_FINAL_REVIEW">Submitted Final</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Academic Year Filter (Faculty / Leadership roles) */}
            {activeRole !== 'STUDENT' && (
              <div>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="">All Academic Years</option>
                  {academicYears && academicYears.length > 0 ? (
                    academicYears.map((ay) => (
                      <option key={ay.id} value={String(ay.id)}>
                        {ay.name} ({ay.code || `Y${ay.year_number}`})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="2">Second Year (Y2)</option>
                      <option value="3">Third Year (Y3)</option>
                      <option value="4">Fourth Year (Y4)</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Section Filter (scoped to selected year, Faculty / Leadership roles) */}
            {activeRole !== 'STUDENT' && (
              <div>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="">
                    {selectedYear ? 'All Year Sections' : 'All Sections'}
                  </option>
                  {availableSections?.map((sec) => (
                    <option key={sec.id} value={String(sec.id)}>
                      Section {sec.code} ({sec.total_projects} projects)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit / Reset Actions */}
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" className="flex-1" icon={<Filter className="w-3.5 h-3.5" />}>
                Filter
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                Clear
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Projects Table / List */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
          <p className="text-sm font-semibold text-rose-700">Failed to load projects</p>
          <p className="text-xs text-slate-500 mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-8 h-8 text-slate-400" />}
          title="No projects match criteria"
          description="Try broadening your search query or removing active status and cohort filters."
          actionText="Reset All Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/60">
                  <th className="py-3.5 px-4">Code & Category</th>
                  <th className="py-3.5 px-4">Project Title</th>
                  <th className="py-3.5 px-4">Section & Cohort</th>
                  <th className="py-3.5 px-4">Supervision</th>
                  <th className="py-3.5 px-4">Status & Health</th>
                  <th className="py-3.5 px-4 text-right">Computed Progress</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code & Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-indigo-600 block">{proj.code}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{proj.category}</span>
                    </td>

                    {/* Title & Priority */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 max-w-sm truncate" title={proj.title}>
                        {proj.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <PriorityBadge priority={proj.priority} />
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Target: {new Date(proj.planned_completion_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    {/* Section & Cohort */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">Section {proj.section_code}</span>
                      <span className="text-[10px] text-slate-500">{proj.academic_year_name}</span>
                    </td>

                    {/* Team Lead & Mentor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-[11px] text-slate-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">Lead:</span> {proj.team_lead_name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3 h-3 text-slate-400" />
                        <span>Mentor:</span> {proj.mentor_name || 'Unassigned'}
                      </div>
                    </td>

                    {/* Status & Health */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={proj.status} />
                        <HealthBadge health={proj.health_status} />
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="font-bold text-slate-800 mb-1">{proj.progress_percentage}%</div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-auto">
                        <div 
                          className="h-full bg-indigo-600 rounded-full" 
                          style={{ width: `${Math.min(proj.progress_percentage, 100)}%` }} 
                        />
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
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
          </div>

          {/* Pagination */}
          {data && (
            <Pagination
              currentPage={data.page}
              totalPages={data.total_pages}
              totalItems={data.total}
              pageSize={data.size}
              onPageChange={(p) => {
                setCurrentPage(p);
                const nextParams = new URLSearchParams(searchParams);
                nextParams.set('page', String(p));
                setSearchParams(nextParams);
              }}
            />
          )}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
};
