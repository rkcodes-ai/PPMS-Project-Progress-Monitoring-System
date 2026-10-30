import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { documentsApi } from '../../api/documents';
import { useToast } from '../../context/ToastContext';
import type { DocumentTypeEnum } from '../../types';

interface UploadDocumentModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

const DOCUMENT_TYPES: { value: DocumentTypeEnum; label: string }[] = [
  { value: 'PROPOSAL', label: 'Project Proposal' },
  { value: 'REQUIREMENTS', label: 'Software Requirements (SRS)' },
  { value: 'DESIGN', label: 'Architecture & System Design' },
  { value: 'PROGRESS_REPORT', label: 'Progress Report Attachment' },
  { value: 'RESEARCH', label: 'Research Paper / Survey' },
  { value: 'TEST_REPORT', label: 'Test Report / Evaluation' },
  { value: 'FINAL_DOCUMENTATION', label: 'Final Documentation' },
  { value: 'OTHER', label: 'Other Document' },
];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.pptx', '.xlsx', '.zip', '.png', '.jpg', '.jpeg'];

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  projectId,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocumentTypeEnum>('PROPOSAL');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Please select a document to upload.');
      if (!title.trim()) throw new Error('Please enter a document title.');

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('document_type', docType);
      formData.append('file', selectedFile);

      return documentsApi.uploadDocument(projectId, formData);
    },
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      showToast('success', 'Document Uploaded', `Document '${newDoc.title}' uploaded successfully.`);
      handleClose();
    },
    onError: (err: Error) => {
      showToast('error', 'Upload Failed', err.message);
    },
  });

  const handleClose = () => {
    setTitle('');
    setDocType('PROPOSAL');
    setSelectedFile(null);
    setFileError(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`Disallowed file type '${ext}'. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`);
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File size exceeds 15MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!title) {
      // Auto-populate title with pleasant format from filename
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(baseName.replace(/[_-]/g, ' '));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Project Document"
      subtitle="Supported deliverables: PDF, DOCX, PPTX, XLSX, TXT, ZIP, Images (max 15MB)"
      maxWidth="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          uploadMutation.mutate();
        }}
        className="space-y-4"
      >
        <Input
          label="Document Title *"
          placeholder="e.g. System Architecture Specification v1.0"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Document Category *
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentTypeEnum)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Select File *
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-400 transition-colors bg-slate-50/50">
            <div className="space-y-1 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-400" />
              <div className="flex text-xs text-slate-600 justify-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-semibold text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                >
                  <span>Choose file from device</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept={ALLOWED_EXTENSIONS.join(',')}
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-400">PDF, Word, Slides, Archives up to 15MB</p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-2 p-2 bg-indigo-50/80 rounded-lg border border-indigo-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-900 truncate max-w-xs">{selectedFile.name}</span>
              <span className="text-indigo-600 font-mono text-[11px]">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </span>
            </div>
          )}

          {fileError && (
            <div className="mt-2 p-2 bg-rose-50 rounded-lg border border-rose-200 flex items-center gap-1.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{fileError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={uploadMutation.isPending}
            disabled={!selectedFile || !title.trim()}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            Upload Document
          </Button>
        </div>
      </form>
    </Modal>
  );
};
