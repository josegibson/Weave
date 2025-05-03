import { useState } from 'react';
import { theme } from '../styles/theme';
import { ProcessingOptions } from '../types';

interface SettingsProps {
  options: ProcessingOptions;
  onChange: (options: ProcessingOptions) => void;
  darkMode?: boolean;
  isExpanded?: boolean;
}

export default function Settings({ options, onChange, darkMode = false, isExpanded: propIsExpanded = false }: SettingsProps) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  
  // Use prop-controlled expansion state if provided, otherwise use internal state
  const isExpanded = propIsExpanded !== undefined ? propIsExpanded : internalIsExpanded;

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
    <div className="settings-panel">
      <div className="directory-selector">
        <div className="directory-label">Output Directory</div>
        <div className="directory-input-group">
          <div className="directory-path">
            {options.outputDirectory ? (
              options.outputDirectory
            ) : (
              <span className="directory-placeholder">Select an output directory for generated reports</span>
            )}
          </div>
          <button 
            onClick={handleSelectOutputDir}
            className="directory-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Browse
          </button>
        </div>
        {!options.outputDirectory && (
          <div className="directory-message">
            Please select an output directory before generating reports
          </div>
        )}
      </div>
    </div>
  );
} 