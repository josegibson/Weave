import { useState } from 'react';
import { theme } from '../styles/theme';
import { ProcessingOptions } from '../types';

interface SettingsProps {
  options: ProcessingOptions;
  onChange: (options: ProcessingOptions) => void;
}

export default function Settings({ options, onChange }: SettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelectOutputDir = async () => {
    try {
      // For Electron, we'd use the dialog API via IPC
      // This is a placeholder that will be implemented through IPC later
      window.electron.ipcRenderer.invoke('select-directory')
        .then((result: { canceled: boolean, filePaths: string[] }) => {
          if (!result.canceled && result.filePaths.length > 0) {
            onChange({
              ...options,
              outputDirectory: result.filePaths[0]
            });
          }
        });
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  return (
    <div style={{
      margin: theme.spacing.md,
      backgroundColor: theme.colors.lightGray,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden'
    }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: theme.spacing.md,
          backgroundColor: theme.colors.midnightTeal,
          color: theme.colors.white,
          cursor: 'pointer',
          fontFamily: theme.fonts.heading
        }}
      >
        <h3 style={{ margin: 0 }}>Settings</h3>
        <span>{isExpanded ? '▲' : '▼'}</span>
      </div>

      {isExpanded && (
        <div style={{ padding: theme.spacing.md }}>
          <div style={{ marginBottom: theme.spacing.md }}>
            <label 
              style={{ 
                display: 'block', 
                marginBottom: theme.spacing.sm,
                color: theme.colors.darkGray,
                fontFamily: theme.fonts.body
              }}
            >
              Output Directory
            </label>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <input 
                type="text"
                value={options.outputDirectory}
                readOnly
                style={{
                  flex: 1,
                  padding: theme.spacing.sm,
                  border: `1px solid ${theme.colors.darkGray}`,
                  borderRadius: theme.borderRadius.sm,
                  fontFamily: theme.fonts.body
                }}
              />
              <button 
                onClick={handleSelectOutputDir}
                style={{
                  backgroundColor: theme.colors.amber,
                  color: theme.colors.darkGray,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  cursor: 'pointer',
                  fontFamily: theme.fonts.body,
                  fontWeight: 'bold',
                  transition: theme.transitions.default
                }}
              >
                Browse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 