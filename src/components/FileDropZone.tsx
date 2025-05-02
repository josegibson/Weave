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
  darkMode?: boolean;
}

export default function FileDropZone({ onFilesAdded, acceptedTypes, darkMode = false }: FileDropZoneProps) {
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

  const getBorderColor = () => {
    if (isDragging) {
      return theme.colors.vibrantChartreuse;
    }
    return darkMode ? 'rgba(255, 255, 255, 0.2)' : theme.colors.midnightTeal;
  };

  const getBackgroundColor = () => {
    if (isDragging) {
      return darkMode 
        ? 'rgba(156, 255, 0, 0.15)' 
        : 'rgba(156, 255, 0, 0.1)';
    }
    return darkMode 
      ? 'rgba(255, 255, 255, 0.05)' 
      : theme.colors.lightGray;
  };

  const getTextColor = () => {
    return darkMode 
      ? theme.colors.vibrantChartreuse 
      : theme.colors.midnightTeal;
  };

  const getSubTextColor = () => {
    return darkMode 
      ? 'rgba(255, 255, 255, 0.7)' 
      : theme.colors.darkGray;
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="file-drop-zone"
      style={{
        border: `2px dashed ${getBorderColor()}`,
        backgroundColor: getBackgroundColor(),
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.xl,
        textAlign: 'center',
        cursor: 'pointer',
        transition: theme.transitions.default,
        margin: 0,
        position: 'relative',
        overflow: 'hidden'
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
      
      <div className="file-drop-icon" style={{ marginBottom: '16px', opacity: 0.9 }}>
        {isDragging ? (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16L12 8" stroke={getTextColor()} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 13L12 16L15 13" stroke={getTextColor()} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 19H21" stroke={getTextColor()} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16" stroke={getTextColor()} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 4L12 16" stroke={getTextColor()} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 8L12 4L16 8" stroke={getTextColor()} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      
      <h3 style={{ 
        color: getTextColor(), 
        fontFamily: theme.fonts.heading,
        margin: '0 0 8px 0',
        fontWeight: 600
      }}>
        {isDragging ? 'Drop files here' : 'Drag files here or click to select'}
      </h3>
      
      <p style={{ 
        color: getSubTextColor(), 
        fontFamily: theme.fonts.body,
        margin: 0,
        fontSize: '0.9rem'
      }}>
        {`Accept ${acceptedTypes.join(', ')} files`}
      </p>
    </div>
  );
} 