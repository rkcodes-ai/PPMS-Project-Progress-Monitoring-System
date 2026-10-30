import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { HODDashboard } from './HODDashboard';
import { AdvisorDashboard } from './AdvisorDashboard';
import { MentorDashboard } from './MentorDashboard';
import { StudentDashboard } from './StudentDashboard';

export const DashboardPage: React.FC = () => {
  const { activeRole } = useAuth();

  switch (activeRole) {
    case 'HOD':
      return <HODDashboard />;
    case 'ADVISOR':
      return <AdvisorDashboard />;
    case 'MENTOR':
      return <MentorDashboard />;
    case 'STUDENT':
    default:
      return <StudentDashboard />;
  }
};
