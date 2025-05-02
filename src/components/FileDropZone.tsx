import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { theme } from '../styles/theme';
import { FileItem } from '../types';

// Extend the File interface to include the path property for Electron
interface ElectronFile extends File {
  path: string;
}

interface FileDropZoneProps {
  onFilesAdded: (files: FileItem[]) => void;
  acceptedTypes: string[];
}

export default function FileDropZone({ onFilesAdded, acceptedTypes }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (fileList: FileList) => {
    const newFiles: FileItem[] = [];
    
    Array.from(fileList).forEach(file => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension && (fileExtension === 'pptx' || fileExtension === 'xlsx')) {
        newFiles.push({
          id: crypto.randomUUID(),
          name: file.name,
          path: (file as ElectronFile).path || '', // Use the path property if available (Electron)
          type: fileExtension as 'pptx' | 'xlsx',
          status: 'idle'
        });
      }
    });
    
    if (newFiles.length > 0) {
      onFilesAdded(newFiles);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? theme.colors.vibrantChartreuse : theme.colors.midnightTeal}`,
        backgroundColor: isDragging ? 'rgba(156, 255, 0, 0.1)' : theme.colors.lightGray,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.xl,
        textAlign: 'center',
        cursor: 'pointer',
        transition: theme.transitions.default,
        margin: theme.spacing.md
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept={acceptedTypes.join(',')}
        style={{ display: 'none' }}
      />
      <h3 style={{ color: theme.colors.midnightTeal, fontFamily: theme.fonts.heading }}>
        Drop files here or click to select
      </h3>
      <p style={{ color: theme.colors.darkGray, fontFamily: theme.fonts.body }}>
        Accept {acceptedTypes.join(', ')} files
      </p>
    </div>
  );
} 