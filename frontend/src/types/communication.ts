export type ConversationTypeEnum = 'PROJECT_DISCUSSION' | 'DIRECT_MESSAGE';

export interface MessageItem {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_role?: string;
  content: string;
  related_task_id?: number | null;
  related_milestone_id?: number | null;
  related_report_id?: number | null;
  created_at: string;
  is_own_message: boolean;
}

export interface ConversationItem {
  id: number;
  title?: string | null;
  conversation_type: ConversationTypeEnum;
  project_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  message_count: number;
  unread_count: number;
  last_message?: MessageItem | null;
}

export interface SendMessagePayload {
  content: string;
  related_task_id?: number | null;
  related_milestone_id?: number | null;
  related_report_id?: number | null;
}

export interface MarkReadResult {
  conversation_id: number;
  marked_read_at: string;
  unread_count: number;
}
