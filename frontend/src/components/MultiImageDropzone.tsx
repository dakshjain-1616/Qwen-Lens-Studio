import React, { useCallback, useState } from 'react';

interface MultiImageDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const MultiImageDropzone: React.FC<MultiImageDropzoneProps> = ({ 
  onFilesSelected,
  disabled = false 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10' 
          : 'border-slate-600 hover:border-slate-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
        id="multi-image-input"
      />
      <label 
        htmlFor="multi-image-input" 
        className={disabled ? 'pointer-events-none' : 'cursor-pointer'}
      >
        <div className="text-4xl mb-2">📁</div>
        <p className="text-slate-300 mb-1">
          Drop multiple images here or click to select
        </p>
        <p className="text-slate-500 text-sm">
          Supports: JPG, PNG, GIF, WebP
        </p>
      </label>
    </div>
  );
};

export default MultiImageDropzone;
