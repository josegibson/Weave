import { FileItem } from '../types';
import { theme } from '../styles/theme';

interface FileListProps {
  files: FileItem[];
  onRemoveFile: (id: string) => void;
  darkMode?: boolean;
}

export default function FileList({ files, onRemoveFile, darkMode = false }: FileListProps) {
  const getStatusColor = (status: FileItem['status']) => {
    switch (status) {
      case 'idle': return darkMode ? 'rgba(255, 255, 255, 0.6)' : theme.colors.darkGray;
      case 'processing': return theme.colors.amber;
      case 'success': return theme.colors.vibrantChartreuse;
      case 'error': return theme.colors.error;
    }
  };

  const getStatusText = (status: FileItem['status']) => {
    switch (status) {
      case 'idle': return 'Ready';
      case 'processing': return 'Processing...';
      case 'success': return 'Completed';
      case 'error': return 'Error';
    }
  };

  if (files.length === 0) {
    return (
      <div className="file-list-empty" style={{ 
        textAlign: 'center', 
        color: darkMode ? 'rgba(255, 255, 255, 0.6)' : theme.colors.darkGray,
        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        borderRadius: theme.borderRadius.md,
        padding: '24px'
      }}>
        <p>No files added yet</p>
        <small style={{ opacity: 0.7 }}>Drop files above or click to select</small>
      </div>
    );
  }

  const pptxFiles = files.filter(file => file.type === 'pptx');
  const xlsxFiles = files.filter(file => file.type === 'xlsx');

  return (
    <div className="file-list">
      {pptxFiles.length > 0 && (
        <div className="file-list-section">
          <h3 style={{ 
            color: darkMode ? theme.colors.vibrantChartreuse : theme.colors.midnightTeal, 
            fontFamily: theme.fonts.heading,
            fontSize: '1.1rem',
            margin: '0 0 12px 0'
          }}>
            PowerPoint Template
          </h3>
          <div className="file-list-items">
            {pptxFiles.map(file => (
              <FileRow key={file.id} file={file} onRemoveFile={onRemoveFile} darkMode={darkMode} />
            ))}
          </div>
        </div>
      )}
      
      {xlsxFiles.length > 0 && (
        <div className="file-list-section" style={{ marginTop: pptxFiles.length > 0 ? theme.spacing.lg : 0 }}>
          <h3 style={{ 
            color: darkMode ? theme.colors.vibrantChartreuse : theme.colors.midnightTeal, 
            fontFamily: theme.fonts.heading,
            fontSize: '1.1rem',
            margin: '0 0 12px 0'
          }}>
            Excel Data Files ({xlsxFiles.length})
          </h3>
          <div className="file-list-items">
            {xlsxFiles.map(file => (
              <FileRow key={file.id} file={file} onRemoveFile={onRemoveFile} darkMode={darkMode} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FileRowProps {
  file: FileItem;
  onRemoveFile: (id: string) => void;
  darkMode: boolean;
}

function FileRow({ file, onRemoveFile, darkMode }: FileRowProps) {
  const getStatusColor = (status: FileItem['status']) => {
    switch (status) {
      case 'idle': return darkMode ? 'rgba(255, 255, 255, 0.6)' : theme.colors.darkGray;
      case 'processing': return theme.colors.amber;
      case 'success': return theme.colors.vibrantChartreuse;
      case 'error': return theme.colors.error;
    }
  };

  const getStatusText = (status: FileItem['status']) => {
    switch (status) {
      case 'idle': return 'Ready';
      case 'processing': return 'Processing...';
      case 'success': return 'Completed';
      case 'error': return 'Error';
    }
  };

  const getFileIcon = () => {
    if (file.type === 'pptx') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    } else {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M7 8H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
  };

  return (
    <div className="file-row" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      marginBottom: '8px',
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.lightGray,
      borderRadius: theme.borderRadius.md,
      transition: theme.transitions.default,
      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          marginRight: theme.spacing.md,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          background: file.type === 'pptx' 
            ? (darkMode ? 'rgba(0, 91, 97, 0.5)' : theme.colors.midnightTeal) 
            : (darkMode ? 'rgba(255, 191, 0, 0.5)' : theme.colors.amber),
          color: darkMode ? theme.colors.white : theme.colors.white,
          borderRadius: theme.borderRadius.sm,
          fontSize: '0.7rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {getFileIcon()}
          {file.type.toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ 
            fontFamily: theme.fonts.body,
            color: darkMode ? theme.colors.white : theme.colors.darkGray,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '200px'
          }}>
            {file.name}
          </div>
          <div style={{ 
            fontSize: '0.8rem', 
            color: getStatusColor(file.status),
            fontFamily: theme.fonts.body,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <StatusDot status={file.status} />
            {getStatusText(file.status)}
            {file.errorMessage && `: ${file.errorMessage}`}
          </div>
        </div>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemoveFile(file.id);
        }}
        className="file-remove-btn"
        style={{
          background: 'none',
          border: 'none',
          color: darkMode ? 'rgba(255, 255, 255, 0.5)' : theme.colors.darkGray,
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: theme.spacing.xs,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          transition: 'all 0.2s ease'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

function StatusDot({ status }: { status: FileItem['status'] }) {
  const getColor = () => {
    switch (status) {
      case 'idle': return '#999999';
      case 'processing': return theme.colors.amber;
      case 'success': return theme.colors.vibrantChartreuse;
      case 'error': return theme.colors.error;
    }
  };
  
  return (
    <span style={{
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: getColor(),
      marginRight: '4px'
    }} />
  );
} 