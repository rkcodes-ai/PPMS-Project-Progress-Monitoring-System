import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { projectsApi } from '../../api/projects';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { ProjectDetail, ProjectPriorityEnum } from '../../types';

interface EditProjectModalProps {
  project: ProjectDetail;
  isOpen: boolean;
  onClose: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, isOpen, onClose }) => {
  const { activeRole } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [objectives, setObjectives] = useState(project.objectives || '');
  const [category, setCategory] = useState(project.category);
  const [priority, setPriority] = useState<ProjectPriorityEnum>(project.priority);
  const [plannedCompletionDate, setPlannedCompletionDate] = useState(
    project.planned_completion_date.split('T')[0]
  );
  const [mentorId, setMentorId] = useState<number | undefined>(project.mentor_id || undefined);

  const canEditMentor = activeRole === 'HOD' || activeRole === 'ADVISOR';

  const updateMutation = useMutation({
    mutationFn: (payload: any) => projectsApi.updateProject(project.id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('success', 'Project Updated', `Changes to project ${updated.code} have been saved.`);
      onClose();
    },
    onError: (err: Error) => {
      showToast('error', 'Update Failed', err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      title,
      description,
      objectives,
      category,
      priority,
      planned_completion_date: new Date(plannedCompletionDate).toISOString(),
      ...(canEditMentor && mentorId ? { mentor_id: Number(mentorId) } : {}),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Project ${project.code}`}
      subtitle="Modify project parameters and academic metadata"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Domain / Category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
            Project Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Objectives
          </label>
          <textarea
            rows={2}
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Planned Completion Date"
            type="date"
            required
            value={plannedCompletionDate}
            onChange={(e) => setPlannedCompletionDate(e.target.value)}
          />

          {canEditMentor && (
            <Select
              label="Assigned Faculty Mentor"
              value={mentorId || ''}
              onChange={(e) => setMentorId(e.target.value ? Number(e.target.value) : undefined)}
              options={[
                { value: '', label: 'Select Faculty Mentor' },
                { value: 2, label: 'Dr. Aruna Sharma' },
                { value: 3, label: 'Dr. Biren Patel' },
                { value: 4, label: 'Dr. Chitra Raman' },
                { value: 5, label: 'Dr. Dinesh Kumar' },
                { value: 6, label: 'Dr. Esha Mehta' },
                { value: 7, label: 'Dr. Farhan Gupta' },
              ]}
            />
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
