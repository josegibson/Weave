import { FileItem } from '../types';
import { theme } from '../styles/theme';

interface FileListProps {
  files: FileItem[];
  onRemoveFile: (id: string) => void;
}

export default function FileList({ files, onRemoveFile }: FileListProps) {
  const getStatusColor = (status: FileItem['status']) => {
    switch (status) {
      case 'idle': return theme.colors.darkGray;
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
      <div style={{ padding: theme.spacing.md, textAlign: 'center', color: theme.colors.darkGray }}>
        No files added yet
      </div>
    );
  }

  const pptxFiles = files.filter(file => file.type === 'pptx');
  const xlsxFiles = files.filter(file => file.type === 'xlsx');

  return (
    <div style={{ margin: theme.spacing.md }}>
      {pptxFiles.length > 0 && (
        <div>
          <h3 style={{ color: theme.colors.midnightTeal, fontFamily: theme.fonts.heading }}>PowerPoint Template</h3>
          {pptxFiles.map(file => (
            <FileRow key={file.id} file={file} onRemoveFile={onRemoveFile} />
          ))}
        </div>
      )}
      
      {xlsxFiles.length > 0 && (
        <div style={{ marginTop: theme.spacing.lg }}>
          <h3 style={{ color: theme.colors.midnightTeal, fontFamily: theme.fonts.heading }}>Excel Data Files</h3>
          {xlsxFiles.map(file => (
            <FileRow key={file.id} file={file} onRemoveFile={onRemoveFile} />
          ))}
        </div>
      )}
    </div>
  );

  function FileRow({ file, onRemoveFile }: { file: FileItem, onRemoveFile: (id: string) => void }) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        backgroundColor: theme.colors.lightGray,
        borderRadius: theme.borderRadius.sm,
        transition: theme.transitions.default
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            marginRight: theme.spacing.md,
            padding: theme.spacing.xs,
            background: file.type === 'pptx' ? theme.colors.midnightTeal : theme.colors.amber,
            color: theme.colors.white,
            borderRadius: theme.borderRadius.sm,
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            {file.type.toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: theme.fonts.body }}>{file.name}</div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: getStatusColor(file.status),
              fontFamily: theme.fonts.body
            }}>
              {getStatusText(file.status)}
              {file.errorMessage && `: ${file.errorMessage}`}
            </div>
          </div>
        </div>
        <button 
          onClick={() => onRemoveFile(file.id)}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.darkGray,
            cursor: 'pointer',
            fontSize: '1rem',
            padding: theme.spacing.xs
          }}
        >
          ✕
        </button>
      </div>
    );
  }
} 