import { apiClient } from './client';
import type { 
  ConversationItem, 
  MessageItem, 
  SendMessagePayload, 
  MarkReadResult 
} from '../types';

export const communicationApi = {
  getProjectConversations: async (projectId: number): Promise<ConversationItem[]> => {
    const res = await apiClient.get<ConversationItem[]>(`/projects/${projectId}/conversations`);
    return res.data;
  },

  createProjectConversation: async (projectId: number, title?: string): Promise<ConversationItem> => {
    const res = await apiClient.post<ConversationItem>(`/projects/${projectId}/conversations`, { title });
    return res.data;
  },

  getConversationMessages: async (
    conversationId: number, 
    limit: number = 100, 
    skip: number = 0,
    autoMarkRead: boolean = true
  ): Promise<MessageItem[]> => {
    const res = await apiClient.get<MessageItem[]>(`/conversations/${conversationId}/messages`, {
      params: { limit, skip, auto_mark_read: autoMarkRead }
    });
    return res.data;
  },

  sendMessage: async (conversationId: number, payload: SendMessagePayload): Promise<MessageItem> => {
    const res = await apiClient.post<MessageItem>(`/conversations/${conversationId}/messages`, payload);
    return res.data;
  },

  markConversationRead: async (conversationId: number): Promise<MarkReadResult> => {
    const res = await apiClient.post<MarkReadResult>(`/conversations/${conversationId}/read`);
    return res.data;
  },

  getConversationUnreadCount: async (conversationId: number): Promise<{ conversation_id: number; unread_count: number }> => {
    const res = await apiClient.get<{ conversation_id: number; unread_count: number }>(`/conversations/${conversationId}/unread-count`);
    return res.data;
  }
};
