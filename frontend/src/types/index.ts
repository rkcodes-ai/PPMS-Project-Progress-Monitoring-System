export type RoleEnum = 'HOD' | 'ADVISOR' | 'MENTOR' | 'STUDENT';

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  department_id?: number | null;
  department_code?: string | null;
  section_id?: number | null;
  section_code?: string | null;
  active_role: RoleEnum;
  available_roles: RoleEnum[];
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export type ProjectStatusEnum = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_FINAL_REVIEW'
  | 'COMPLETED'
  | 'REJECTED'
  | 'ARCHIVED';

export type ProjectPriorityEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectHealthEnum = 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'COMPLETED';

export interface ProjectMemberItem {
  id: number;
  user_id: number;
  full_name?: string;
  name?: string;
  email?: string;
  role_in_team?: string;
  role?: string;
  user?: { id: number; full_name: string; email: string; role?: string };
}

export interface ProjectListItem {
  id: number;
  code: string;
  title: string;
  category: string;
  department_id: number;
  academic_year_id: number;
  academic_year_name: string;
  section_id: number;
  section_code: string;
  section_name?: string;
  team_lead_id: number;
  team_lead_name?: string;
  mentor_id?: number | null;
  mentor_name?: string | null;
  priority: ProjectPriorityEnum;
  status: ProjectStatusEnum;
  health_status: ProjectHealthEnum;
  progress_percentage: number;
  start_date: string;
  planned_completion_date: string;
  created_at: string;
}

export interface ProjectDetail extends ProjectListItem {
  description: string;
  objectives?: string | null;
  members: ProjectMemberItem[];
  task_count?: number;
  milestone_count?: number;
  report_count?: number;
  tasks?: any[];
  milestones?: any[];
  reports?: any[];
  documents?: any[];
  conversations?: any[];
  academic_period_id?: number;
  academic_period_name?: string;
  updated_at?: string;
  team_lead?: any;
  mentor?: any;
}

export interface PaginatedProjects {
  items: ProjectListItem[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export type TaskStatusEnum = 
  | 'TO_DO'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'SUBMITTED_FOR_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'COMPLETED';

export type TaskPriorityEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  assignee_id?: number | null;
  assignee_name?: string | null;
  priority: TaskPriorityEnum;
  start_date?: string | null;
  due_date: string;
  estimated_effort: number;
  status: TaskStatusEnum;
  completion_fraction: number;
  submission_details?: string | null;
  review_status?: string | null;
  created_at: string;
  updated_at: string;
}

export type MilestoneStatusEnum = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'COMPLETED';

export interface Milestone {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  planned_due_date: string;
  completion_criteria?: string | null;
  status: MilestoneStatusEnum;
  submission_status: string;
  review_status: string;
  reviewer_id?: number | null;
  reviewer_name?: string | null;
  reviewer_comments?: string | null;
  completed_at?: string | null;
  linked_task_ids: number[];
  created_at: string;
  updated_at: string;
}

export type ReportStatusEnum = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'NEEDS_REVISION'
  | 'REJECTED';

export interface ReportReview {
  id: number;
  report_id: number;
  reviewer_id: number;
  reviewer_name: string;
  status: ReportStatusEnum;
  comments: string;
  reviewed_at: string;
}

export interface ProgressReport {
  id: number;
  project_id: number;
  submitted_by_id: number;
  submitted_by_name: string;
  reporting_period: string;
  work_completed: string;
  current_challenges?: string | null;
  planned_next_steps: string;
  supporting_evidence?: string | null;
  version: number;
  status: ReportStatusEnum;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
  reviews: ReportReview[];
}

export interface HODAnalytics {
  total_projects: number;
  in_progress_count: number;
  completed_count: number;
  at_risk_count: number;
  overdue_count: number;
  pending_reviews_count: number;
  average_progress: number;
  projects_by_year: Array<{
    year_number: number;
    name: string;
    count: number;
    average_progress: number;
  }>;
  projects_by_section: Array<{
    section_id: number;
    section_code: string;
    section_name: string;
    count: number;
    total_projects: number;
    completed_projects: number;
    at_risk_projects: number;
    avg_progress: number;
  }>;
  projects_by_status: Record<string, number>;
  mentor_workload: Array<{
    mentor_id: number;
    mentor_name: string;
    email: string;
    project_count: number;
    average_progress: number;
  }>;
  section_comparisons: Array<{
    section_id: number;
    section_code: string;
    section_name: string;
    total_projects: number;
    completed_projects: number;
    at_risk_projects: number;
    avg_progress: number;
  }>;
  total_academic_years?: number;
  total_sections?: number;
  years_summary?: AcademicYearDetail[];
}

export interface SectionSummary {
  id: number;
  name: string;
  code: string;
  academic_year_id: number;
  academic_year_number: number;
  academic_year_name: string;
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  at_risk_projects: number;
  pending_reviews_count: number;
  average_progress: number;
  assigned_advisor_name?: string | null;
  assigned_advisor_email?: string | null;
}

export interface AcademicYearDetail {
  id: number;
  year_number: number;
  code?: string;
  name: string;
  sections_count: number;
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  at_risk_projects: number;
  pending_reviews_count: number;
  average_progress: number;
  sections: SectionSummary[];
}

export interface DepartmentOverview {
  total_academic_years: number;
  total_sections: number;
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  at_risk_projects: number;
  pending_reviews_count: number;
  average_progress: number;
  years: AcademicYearDetail[];
}

export interface AdvisorAnalytics {
  section_id: number;
  section_code: string;
  section_name: string;
  academic_year_id?: number;
  academic_year_code?: string;
  academic_year_name?: string;
  academic_year_number?: number;
  advisor_name?: string | null;
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  at_risk_projects: number;
  overdue_tasks_count: number;
  pending_reviews_count: number;
  section_average_progress: number;
  projects_by_status: Record<string, number>;
  upcoming_deadlines: Array<{
    type: string;
    title: string;
    project_code: string;
    project_title: string;
    due_date: string;
  }>;
  projects: Array<{
    id: number;
    code: string;
    title: string;
    category?: string;
    status: string;
    health_status: string;
    progress_percentage: number;
    team_lead: string;
    mentor: string;
  }>;
  assigned_sections?: Array<{
    id?: number;
    section_id: number;
    code?: string;
    section_code: string;
    section_name: string;
    academic_year_id: number;
    academic_year_number: number;
    academic_year_name: string;
    total_projects: number;
  }>;
}

export interface MentorAnalytics {
  assigned_projects_count: number;
  pending_reviews_count: number;
  at_risk_count: number;
  completed_count: number;
  average_progress: number;
  assigned_projects: Array<{
    id: number;
    code: string;
    title: string;
    status: string;
    health_status: string;
    progress_percentage: number;
    team_lead_name: string;
    team_lead?: string;
    section_code: string;
    section_name?: string;
    academic_year_code?: string;
    academic_year_number?: number;
    academic_year_name?: string;
  }>;
  projects_by_year_and_section?: Array<{
    year_id?: number;
    year_number?: number;
    year_name: string;
    year_code?: string;
    academic_year_name?: string;
    section_id: number;
    section_code: string;
    section_name: string;
    projects_count: number;
    projects: Array<{
      id: number;
      code: string;
      title: string;
      status: string;
      health_status: string;
      progress_percentage: number;
      team_lead_name: string;
      section_code: string;
    }>;
  }>;
  upcoming_milestones: Array<{
    id: number;
    title: string;
    project_code: string;
    project_title: string;
    planned_due_date: string;
    status: string;
    submission_status: string;
  }>;
  pending_reports: Array<{
    id: number;
    project_code: string;
    project_title: string;
    reporting_period: string;
    submitted_by: string;
    submitted_at: string | null;
  }>;
  overdue_tasks: Array<{
    id: number;
    title: string;
    project_code: string;
    assignee: string;
    due_date: string;
    priority: string;
  }>;
}

export interface StudentAnalytics {
  authorized_projects: Array<{
    id: number;
    code: string;
    title: string;
    category: string;
    status: string;
    health_status: string;
    progress_percentage: number;
    mentor_name: string;
    planned_completion_date: string;
    academic_year_id?: number;
    academic_year_code?: string;
    academic_year_name?: string;
    academic_year_number?: number;
    section_id?: number;
    section_code?: string;
    section_name?: string;
    team_members?: any[];
  }>;
  assigned_tasks: Array<{
    id: number;
    title: string;
    project_id: number;
    project_code: string;
    status: string;
    priority: string;
    completion_fraction: number;
    due_date: string;
  }>;
  upcoming_deadlines: Array<{
    type: string;
    title: string;
    project_code: string;
    due_date: string;
    priority: string;
  }>;
  overdue_tasks: Array<{
    type: string;
    title: string;
    project_code: string;
    due_date: string;
    priority: string;
  }>;
  project_milestones: Array<{
    id: number;
    title: string;
    project_code: string;
    status: string;
    submission_status: string;
    review_status: string;
    planned_due_date: string;
  }>;
  report_review_status: Array<{
    id: number;
    project_code: string;
    reporting_period: string;
    status: string;
    feedback: string | null;
    reviewer: string | null;
  }>;
  recent_activity: Array<{
    id: number;
    activity_type: string;
    description: string;
    timestamp: string;
  }>;
}

export * from './document';
export * from './notification';
export * from './communication';

