import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { projectsApi } from '../../api/projects';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { ProjectPriorityEnum } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [category, setCategory] = useState('AI/ML');
  const [academicYearId, setAcademicYearId] = useState<number>(2);
  const [sectionId, setSectionId] = useState<number>(user?.section_id || 1);
  const [priority, setPriority] = useState<ProjectPriorityEnum>('MEDIUM');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [plannedCompletionDate, setPlannedCompletionDate] = useState('2027-05-31');

  const createMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['hod-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      showToast('success', 'Project Created', `Project ${project.code} has been initiated in Draft status.`);
      onClose();
    },
    onError: (err: Error) => {
      showToast('error', 'Creation Failed', err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('warning', 'Validation Error', 'Please complete the required project title and description.');
      return;
    }

    createMutation.mutate({
      title,
      description,
      objectives,
      category,
      academic_year_id: Number(academicYearId),
      section_id: Number(sectionId),
      priority,
      start_date: new Date(startDate).toISOString(),
      planned_completion_date: new Date(plannedCompletionDate).toISOString(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate Academic Project Proposal"
      subtitle="Creates a new project record in Draft status"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. AI-Based Automated Inspection System"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Domain / Category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. AI/ML, Cybersecurity, Web"
          />

          <Select
            label="Priority Level"
            value={priority}
            onChange={(e) => setPriority(e.target.value as ProjectPriorityEnum)}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Project Description *
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a comprehensive academic summary of the project scope and problem statement..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Expected Objectives
          </label>
          <textarea
            rows={2}
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="Bullet list or summary of measurable academic deliverables..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Academic Year"
            value={academicYearId}
            onChange={(e) => setAcademicYearId(Number(e.target.value))}
            options={[
              { value: 2, label: 'Second Year (Sophomore)' },
              { value: 3, label: 'Third Year (Junior)' },
              { value: 4, label: 'Fourth Year (Senior)' },
            ]}
          />

          <Select
            label="Designated Section"
            value={sectionId}
            onChange={(e) => setSectionId(Number(e.target.value))}
            options={[
              { value: 1, label: 'Section CSE-A (Y2)' },
              { value: 2, label: 'Section CSE-B (Y2)' },
              { value: 3, label: 'Section CSE-C (Y2)' },
              { value: 4, label: 'Section CSE-D (Y2)' },
              { value: 5, label: 'Section CSE-E (Y2)' },
              { value: 6, label: 'Section CSE-A (Y3)' },
              { value: 7, label: 'Section CSE-B (Y3)' },
              { value: 8, label: 'Section CSE-C (Y3)' },
              { value: 9, label: 'Section CSE-D (Y3)' },
              { value: 10, label: 'Section CSE-A (Y4)' },
              { value: 11, label: 'Section CSE-B (Y4)' },
              { value: 12, label: 'Section CSE-C (Y4)' },
              { value: 13, label: 'Section CSE-D (Y4)' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            label="Planned Completion Date"
            type="date"
            required
            value={plannedCompletionDate}
            onChange={(e) => setPlannedCompletionDate(e.target.value)}
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Create Project Proposal
          </Button>
        </div>
      </form>
    </Modal>
  );
};
