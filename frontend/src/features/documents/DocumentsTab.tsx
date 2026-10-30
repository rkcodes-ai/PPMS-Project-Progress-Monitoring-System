import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, Upload, Download, Trash2, Calendar, User, 
  FileCheck, AlertCircle, Eye 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { UploadDocumentModal } from './UploadDocumentModal';
import { documentsApi } from '../../api/documents';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { ProjectDetail, DocumentItem, DocumentTypeEnum } from '../../types';

interface DocumentsTabProps {
  project: ProjectDetail;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocumentTypeBadge = (type: DocumentTypeEnum) => {
  switch (type) {
    case 'PROPOSAL':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'REQUIREMENTS':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'DESIGN':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'PROGRESS_REPORT':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'RESEARCH':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'TEST_REPORT':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'FINAL_DOCUMENTATION':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'OTHER':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ project }) => {
  const { user, activeRole } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleOpenPreview = async (doc: DocumentItem) => {
    try {
      setPreviewDoc(doc);
      setIsPreviewLoading(true);
      const { blobUrl } = await documentsApi.fetchDocumentBlob(doc.id);
      setPreviewUrl(blobUrl);
    } catch (err) {
      showToast('error', 'Preview Error', err instanceof Error ? err.message : 'Unable to load preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents', project.id],
    queryFn: () => documentsApi.getProjectDocuments(project.id),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: number) => documentsApi.deleteDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', project.id] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      showToast('success', 'Document Deleted', 'Document removed successfully.');
      setDocToDelete(null);
    },
    onError: (err: Error) => {
      showToast('error', 'Delete Failed', err.message);
    },
  });

  const handleDownload = async (doc: DocumentItem) => {
    try {
      await documentsApi.downloadDocument(doc.id, doc.file_name);
      showToast('info', 'Download Started', `Downloading ${doc.file_name}...`);
    } catch (err: unknown) {
      showToast('error', 'Download Failed', err instanceof Error ? err.message : 'Unable to download file.');
    }
  };

  const canDeleteDoc = (doc: DocumentItem): boolean => {
    if (!user) return false;
    if (activeRole === 'HOD' || activeRole === 'ADVISOR' || activeRole === 'MENTOR') {
      return true;
    }
    // Student can only delete documents they personally uploaded
    return doc.uploaded_by_id === user.id;
  };

  if (isLoading) {
    return (
      <Card title="Project Documents & Deliverables">
        <TableSkeleton rows={4} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Project Documents & Deliverables">
        <div className="p-8 text-center bg-rose-50 rounded-xl border border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-rose-800">Unable to load project documents</h4>
          <p className="text-xs text-rose-600 mt-1">
            {error instanceof Error ? error.message : 'An error occurred loading project documents.'}
          </p>
        </div>
      </Card>
    );
  }

  const hasDocuments = documents && documents.length > 0;

  return (
    <div className="space-y-6">
      <Card
        title="Project Documents & Deliverables"
        subtitle="Manage SRS, architecture designs, code archives, research papers, and evaluation reports"
        action={
          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            Upload Document
          </Button>
        }
      >
        {!hasDocuments ? (
          <EmptyState
            icon={<FileCheck className="w-10 h-10 text-slate-300" />}
            title="No project documents uploaded yet"
            description="Upload formal project documentation, design specifications, or test reports to the shared project vault."
            actionText="Upload First Document"
            onAction={() => setIsUploadOpen(true)}
          />

        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/60">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block">{doc.title}</span>
                          <span className="text-[11px] font-mono text-slate-400 font-normal">
                            {doc.file_name} • v{doc.version}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDocumentTypeBadge(doc.document_type)}`}>
                        {doc.document_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {formatFileSize(doc.file_size_bytes)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{doc.uploader_name || 'Academic User'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPreview(doc)}
                          title="Preview Document"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download Document"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {canDeleteDoc(doc) && (
                          <button
                            onClick={() => setDocToDelete(doc)}
                            title="Delete Document"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      {isUploadOpen && (
        <UploadDocumentModal
          projectId={project.id}
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <Modal
          isOpen={Boolean(docToDelete)}
          onClose={() => setDocToDelete(null)}
          title="Confirm Document Deletion"
          subtitle="Are you sure you want to permanently delete this file?"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              This action will permanently delete <strong>{docToDelete.file_name}</strong> from the server and remove all associated records.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setDocToDelete(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                isLoading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(docToDelete.id)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete File
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={handleClosePreview}
          title={`Document Preview: ${previewDoc.title}`}
          subtitle={`${previewDoc.file_name} • ${formatFileSize(previewDoc.file_size_bytes)}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {isPreviewLoading ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Loading secure document preview...</p>
              </div>
            ) : previewUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                {previewDoc.mime_type.includes('image') ? (
                  <div className="p-4 flex items-center justify-center max-h-[520px] overflow-auto">
                    <img 
                      src={previewUrl} 
                      alt={previewDoc.file_name} 
                      className="max-h-[500px] object-contain rounded-lg shadow-sm"
                    />
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    title={previewDoc.file_name}
                    className="w-full h-[520px] bg-white border-0"
                  />
                )}
              </div>
            ) : (
              <div className="p-6 text-center bg-amber-50 rounded-xl border border-amber-200">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-amber-900">Inline preview unavailable</h4>
                <p className="text-xs text-amber-700 mt-1">
                  This document type cannot be rendered inline in the browser previewer.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Uploaded by {previewDoc.uploader_name} on {new Date(previewDoc.created_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDownload(previewDoc)}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Download File
                </Button>
                <Button size="sm" onClick={handleClosePreview}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
