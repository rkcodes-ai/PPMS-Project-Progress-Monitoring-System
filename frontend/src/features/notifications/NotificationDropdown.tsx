import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, CheckCheck, Clock, CheckCircle2, 
  AlertCircle, FileText, Calendar, Layers 
} from 'lucide-react';
import { notificationsApi } from '../../api/notifications';
import { useToast } from '../../context/ToastContext';
import type { NotificationItem, NotificationEventTypeEnum } from '../../types';

const getEventIcon = (type: NotificationEventTypeEnum) => {
  switch (type) {
    case 'PROPOSAL_DECISION':
    case 'MILESTONE_DECISION':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'TASK_ASSIGNED':
    case 'REVIEW_REQUEST':
      return <Layers className="w-4 h-4 text-indigo-600" />;
    case 'OVERDUE_TASK':
    case 'CORRECTION_REQUESTED':
      return <AlertCircle className="w-4 h-4 text-rose-500" />;
    case 'NEW_PROGRESS_REPORT':
      return <FileText className="w-4 h-4 text-teal-600" />;
    case 'UPCOMING_DEADLINE':
      return <Calendar className="w-4 h-4 text-amber-500" />;
    default:
      return <Bell className="w-4 h-4 text-slate-500" />;
  }
};

const formatTimeAgo = (dateStr: string): string => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
};

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Polling unread count every 30 seconds
  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  // Notifications query
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => notificationsApi.getNotifications(unreadOnly),
    enabled: isOpen,
    refetchInterval: isOpen ? 15000 : false,
  });

  const markOneMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: (err: Error) => showToast('error', 'Error', err.message),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      showToast('success', 'Notifications Updated', `${data.marked_count} notifications marked as read.`);
    },
    onError: (err: Error) => showToast('error', 'Error', err.message),
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.is_read) {
      markOneMutation.mutate(n.id);
    }
    setIsOpen(false);
    if (n.resource_type === 'project' && n.resource_id) {
      navigate(`/projects/${n.resource_id}`);
    } else if (n.resource_type === 'task') {
      navigate('/projects');
    } else if (n.resource_type === 'milestone') {
      navigate('/projects');
    } else if (n.resource_type === 'report') {
      navigate('/projects');
    }
  };

  const unreadCount = countData?.unread_count || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative focus:outline-none"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-1.5 bg-slate-100/50 border-b border-slate-200 flex items-center gap-2 text-[11px]">
            <button
              onClick={() => setUnreadOnly(false)}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                !unreadOnly ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                unreadOnly ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Unread
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No notifications in your queue.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                    !n.is_read ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                    {getEventIcon(n.event_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className={`text-xs truncate ${!n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {n.title}
                      </h5>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(n.created_at)}</span>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markOneMutation.mutate(n.id);
                      }}
                      title="Mark as read"
                      className="p-1 rounded text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
