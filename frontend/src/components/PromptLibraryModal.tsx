/**
 * Prompt Library Modal for managing prompt templates
 */

import { useState, useEffect } from 'react';
import { listPrompts, savePrompt, deletePrompt, duplicatePrompt, PromptTemplate } from '../lib/prompts';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: string;
  onApply: (template: PromptTemplate) => void;
  currentSystemPrompt?: string;
}

export function PromptLibraryModal({ isOpen, onClose, tool, onApply, currentSystemPrompt }: PromptLibraryModalProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [editing, setEditing] = useState<PromptTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrompts(listPrompts(tool));
      setEditing(null);
      setIsCreating(false);
    }
  }, [isOpen, tool]);

  const handleSave = () => {
    if (editing) {
      savePrompt(tool, editing);
      setPrompts(listPrompts(tool));
      setEditing(null);
      setIsCreating(false);
    }
  };

  const handleCreate = () => {
    setEditing({
      id: '',
      name: 'New Template',
      systemPrompt: currentSystemPrompt || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setIsCreating(true);
  };

  const handleEdit = (template: PromptTemplate) => {
    setEditing({ ...template });
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deletePrompt(tool, id);
      setPrompts(listPrompts(tool));
    }
  };

  const handleDuplicate = (template: PromptTemplate) => {
    const duplicate = duplicatePrompt(tool, template.id, `${template.name} (Copy)`);
    if (duplicate) {
      setPrompts(listPrompts(tool));
    }
  };

  const handleApply = (template: PromptTemplate) => {
    onApply(template);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-background-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Prompt Library</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {editing ? (
          <div className="p-6 space-y-4 overflow-auto">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-3 py-2 bg-background-input border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                System Prompt
              </label>
              <textarea
                value={editing.systemPrompt || ''}
                onChange={(e) => setEditing({ ...editing, systemPrompt: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 bg-background-input border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder="Enter system prompt..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => { setEditing(null); setIsCreating(false); }}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isCreating ? 'Create Template' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border flex justify-between items-center">
              <span className="text-sm text-text-secondary">
                {prompts.length} template{prompts.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={handleCreate}
                className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                + New Template
              </button>
            </div>

            <div className="overflow-auto flex-1 p-4">
              {prompts.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  No templates yet. Create your first template!
                </div>
              ) : (
                <div className="space-y-3">
                  {prompts.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 bg-background-input border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-text-primary truncate">
                            {template.name}
                          </h3>
                          {template.systemPrompt && (
                            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                              {template.systemPrompt.substring(0, 100)}
                              {template.systemPrompt.length > 100 ? '...' : ''}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-text-muted">
                            Updated {new Date(template.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApply(template)}
                            className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded text-sm font-medium transition-colors"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => handleEdit(template)}
                            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDuplicate(template)}
                            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                            title="Duplicate"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-1.5 text-text-secondary hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PromptLibraryModal;
