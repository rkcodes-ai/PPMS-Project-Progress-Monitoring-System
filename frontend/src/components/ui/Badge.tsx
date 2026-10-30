import React from 'react';
import type { ProjectStatusEnum, ProjectHealthEnum, ProjectPriorityEnum, TaskStatusEnum, MilestoneStatusEnum, ReportStatusEnum } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
}) => {
  const variantStyles = {
    default: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-teal-50 text-teal-800 border-teal-200',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  const dotColors = {
    default: 'bg-emerald-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-teal-600',
    neutral: 'bg-stone-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center font-medium border rounded-full ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ProjectStatusEnum | TaskStatusEnum | MilestoneStatusEnum | ReportStatusEnum | ProjectHealthEnum | string }> = ({ status }) => {
  switch (status) {
    case 'COMPLETED':
    case 'APPROVED':
      return <Badge variant="success" dot>{status.replace(/_/g, ' ')}</Badge>;
    case 'IN_PROGRESS':
    case 'SUBMITTED':
    case 'SUBMITTED_FOR_REVIEW':
    case 'SUBMITTED_FOR_FINAL_REVIEW':
    case 'UNDER_REVIEW':
      return <Badge variant="info" dot>{status.replace(/_/g, ' ')}</Badge>;
    case 'AT_RISK':
    case 'NEEDS_REVISION':
    case 'REVISION_REQUESTED':
    case 'CHANGES_REQUESTED':
      return <Badge variant="warning" dot>{status.replace(/_/g, ' ')}</Badge>;
    case 'DELAYED':
    case 'REJECTED':
    case 'BLOCKED':
      return <Badge variant="danger" dot>{status.replace(/_/g, ' ')}</Badge>;
    case 'DRAFT':
    case 'TO_DO':
    case 'PENDING':
    default:
      return <Badge variant="neutral" dot>{status ? status.replace(/_/g, ' ') : 'PENDING'}</Badge>;
  }
};

export const HealthBadge: React.FC<{ health: ProjectHealthEnum }> = ({ health }) => {
  switch (health) {
    case 'ON_TRACK':
    case 'COMPLETED':
      return <Badge variant="success" dot>On Track</Badge>;
    case 'AT_RISK':
      return <Badge variant="warning" dot>At Risk</Badge>;
    case 'DELAYED':
      return <Badge variant="danger" dot>Delayed</Badge>;
    default:
      return <Badge variant="neutral" dot>{health}</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: ProjectPriorityEnum }> = ({ priority }) => {
  switch (priority) {
    case 'CRITICAL':
      return <Badge variant="danger">{priority}</Badge>;
    case 'HIGH':
      return <Badge variant="warning">{priority}</Badge>;
    case 'MEDIUM':
      return <Badge variant="info">{priority}</Badge>;
    case 'LOW':
    default:
      return <Badge variant="neutral">{priority}</Badge>;
  }
};
