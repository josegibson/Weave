import React from 'react';

interface PlaceholderInfo {
  placeholder: string;
  content: string;
  description?: string;
}

interface SummarySectionProps {
  template: {
    name: string;
    type: string;
  } | null;
  placeholders: PlaceholderInfo[];
  dataFiles: {
    name: string;
    type: string;
  }[];
}

/**
 * Summary section that displays the output settings in the following order:
 * 1. Template
 * 2. Placeholders
 * 3. Data Files
 */
const SummarySection: React.FC<SummarySectionProps> = ({ 
  template, 
  placeholders, 
  dataFiles 
}) => {
  return (
    <div className="wizard-summary">
      <h3>Output Settings Summary</h3>
      
      {/* Template Section */}
      <div className="summary-item">
        <span>Template:</span>
        <span>
          {template ? template.name : 'No template selected'}
        </span>
      </div>
      
      {/* Placeholders Section */}
      <div className="summary-item">
        <span>Placeholders:</span>
        <span>
          {placeholders.length > 0 
            ? `${placeholders.length} found` 
            : 'No placeholders detected'
          }
        </span>
      </div>
      {placeholders.length > 0 && (
        <div className="pattern-list">
          {placeholders.map((item, index) => (
            <div key={index} className="pattern-item">
              <div className="pattern-icon">
                <i className="fas fa-code"></i>
              </div>
              <div className="pattern-details">
                <div className="pattern-code">{item.placeholder}</div>
                <div className="pattern-description">
                  {item.description || `References ${item.content}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Data Files Section */}
      <div className="summary-item">
        <span>Data Files:</span>
        <span>
          {dataFiles.length > 0 
            ? `${dataFiles.length} file(s)` 
            : 'No data files selected'
          }
        </span>
      </div>
      {dataFiles.length > 0 && (
        <div className="file-list-summary">
          {dataFiles.map((file, index) => (
            <div key={index} className="file-info-summary">
              <span>{file.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SummarySection; 