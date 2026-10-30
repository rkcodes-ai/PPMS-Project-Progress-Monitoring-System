import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { communicationApi } from '../../api/communication';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import type { ProjectDetail, MessageItem, ConversationItem } from '../../types';

interface DiscussionsTabProps {
  project: ProjectDetail;
}

const getRoleBadgeStyle = (role?: string) => {
  switch (role?.toUpperCase()) {
    case 'HOD':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ADVISOR':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'MENTOR':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'STUDENT':
    case 'LEADER':
    case 'MEMBER':
    default:
      return 'bg-teal-100 text-teal-800 border-teal-200';
  }
};

const formatMessageTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

export const DiscussionsTab: React.FC<DiscussionsTabProps> = ({ project }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch conversations for this project
  const { 
    data: conversations, 
    isLoading: isConvsLoading, 
    error: convsError,
    refetch: refetchConvs 
  } = useQuery<ConversationItem[]>({
    queryKey: ['project-conversations', project.id],
    queryFn: () => communicationApi.getProjectConversations(project.id),
  });

  const activeConversation = conversations && conversations.length > 0 ? conversations[0] : null;

  // 2. Fetch messages for the active conversation with REST polling (5s interval)
  const { 
    data: messages, 
    isLoading: isMsgsLoading, 
    error: msgsError,
    refetch: refetchMsgs,
    isFetching: isFetchingMsgs
  } = useQuery<MessageItem[]>({
    queryKey: ['conversation-messages', activeConversation?.id],
    queryFn: () => communicationApi.getConversationMessages(activeConversation!.id),
    enabled: !!activeConversation,
    refetchInterval: 5000, // 5s REST-based periodic polling
  });

  // Auto-scroll to bottom whenever new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (text: string) => {
      if (!activeConversation) throw new Error('No active discussion found.');
      return communicationApi.sendMessage(activeConversation.id, { content: text.trim() });
    },
    onSuccess: (newMsg) => {
      setMessageText('');
      // Invalidate to update conversation unread counters and message history
      queryClient.setQueryData<MessageItem[]>(['conversation-messages', activeConversation?.id], (old) => {
        return old ? [...old, newMsg] : [newMsg];
      });
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', activeConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['project-conversations', project.id] });
      showToast('success', 'Message Sent', 'Your message was added to the project discussion.');
    },
    onError: (err: Error) => {
      showToast('error', 'Message Delivery Failed', err.message);
    }
  });

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isConvsLoading) {
    return (
      <Card title="Project Discussions & Collaboration">
        <TableSkeleton rows={4} />
      </Card>
    );
  }

  if (convsError) {
    return (
      <Card title="Project Discussions & Collaboration">
        <div className="p-8 text-center bg-rose-50 rounded-xl border border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-rose-800">Unable to load project discussion</h4>
          <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">
            {convsError instanceof Error ? convsError.message : 'You may not have authorized permissions to view this discussion.'}
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refetchConvs()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Info & Sync Indicator */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              {activeConversation?.title || `${project.code} Technical Discussion`}
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {messages?.length || 0} messages
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized academic consultation between students, supervisors, and department committee
          </p>
        </div>

        {/* Polling / Sync Status Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <span className={`w-2 h-2 rounded-full ${isFetchingMsgs ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500'}`} />
            <span>Live sync active (polling every 5s)</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => refetchMsgs()} 
            isLoading={isFetchingMsgs}
            icon={<RefreshCw className="w-3 h-3" />}
            title="Refresh discussion history"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {isMsgsLoading ? (
            <div className="space-y-3">
              <div className="h-16 bg-slate-200 rounded-xl w-3/4 animate-pulse"></div>
              <div className="h-16 bg-slate-200 rounded-xl w-2/3 ml-auto animate-pulse"></div>
              <div className="h-16 bg-slate-200 rounded-xl w-1/2 animate-pulse"></div>
            </div>
          ) : msgsError ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-rose-700">Failed to load message history.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => refetchMsgs()}>
                Retry
              </Button>
            </div>
          ) : messages?.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon={<MessageSquare className="w-10 h-10 text-slate-400" />}
                title="No discussion messages yet"
                description="Start the conversation! Post questions, research findings, or milestone updates for your team and mentor."
              />
            </div>
          ) : (
            messages?.map((msg) => {
              const isOwn = msg.is_own_message || (user && msg.sender_id === user.id);

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-full`}
                >
                  {/* Sender Header */}
                  <div className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] ${isOwn ? 'flex-row-reverse text-indigo-700' : 'text-slate-600'}`}>
                    <span className="font-semibold text-slate-800">
                      {isOwn ? 'You' : msg.sender_name}
                    </span>
                    {msg.sender_role && (
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getRoleBadgeStyle(msg.sender_role)}`}>
                        {msg.sender_role}
                      </span>
                    )}
                    <span className="text-slate-400 text-[10px] flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div 
                    className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm max-w-[85%] sm:max-w-[75%] shadow-xs break-words whitespace-pre-wrap leading-relaxed ${
                      isOwn 
                        ? 'bg-indigo-600 text-white rounded-br-xs' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer Form */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="relative">
              <textarea
                rows={3}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message to project collaborators... (Press Enter to send, Shift+Enter for new line)"
                maxLength={5000}
                disabled={sendMutation.isPending || !activeConversation}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white resize-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>{messageText.length}/5000 characters</span>
                <span className="hidden sm:inline">• Markdown/plain-text supported</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  isLoading={sendMutation.isPending}
                  disabled={!messageText.trim() || sendMutation.isPending || !activeConversation}
                  icon={<Send className="w-3.5 h-3.5" />}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Send Message
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
