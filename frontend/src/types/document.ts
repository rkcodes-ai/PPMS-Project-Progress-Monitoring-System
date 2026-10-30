export type DocumentTypeEnum =
  | 'PROPOSAL'
  | 'REQUIREMENTS'
  | 'DESIGN'
  | 'PROGRESS_REPORT'
  | 'RESEARCH'
  | 'TEST_REPORT'
  | 'FINAL_DOCUMENTATION'
  | 'OTHER';

export interface DocumentItem {
  id: number;
  project_id: number;
  uploaded_by_id: number;
  uploader_name?: string;
  title: string;
  document_type: DocumentTypeEnum;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  version: number;
  created_at: string;
}
