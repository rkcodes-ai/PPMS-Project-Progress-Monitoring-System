import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { HODAnalyticsView } from './HODAnalyticsView';
import { AdvisorAnalyticsView } from './AdvisorAnalyticsView';
import { MentorAnalyticsView } from './MentorAnalyticsView';
import { StudentAnalyticsView } from './StudentAnalyticsView';

export const AnalyticsPage: React.FC = () => {
  const { activeRole } = useAuth();

  switch (activeRole) {
    case 'STUDENT':
      return <StudentAnalyticsView />;
    case 'HOD':
      return <HODAnalyticsView />;
    case 'ADVISOR':
      return <AdvisorAnalyticsView />;
    case 'MENTOR':
      return <MentorAnalyticsView />;
    default:
      return <StudentAnalyticsView />;
  }
};
