import React, { useState, useEffect } from 'react';
import { 
  processPresentation, 
  analyzePresentationPlaceholders, 
  detectPlaceholders 
} from '../utils/presentationProcessor';
import SummarySection from './SummarySection';

interface PlaceholderInfo {
  placeholder: string;
  content: string;
  description?: string;
}

interface PresentationProcessorProps {
  templateFile: File | null;
  dataFiles: File[];
  onProcessComplete?: (result: { success: boolean, message: string, output: Blob | null }) => void;
}

const PresentationProcessor: React.FC<PresentationProcessorProps> = ({
  templateFile,
  dataFiles,
  onProcessComplete
}) => {
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Analyze the template file for placeholders when it's uploaded
  useEffect(() => {
    const analyzeTemplate = async () => {
      if (!templateFile) {
        setPlaceholders([]);
        return;
      }

      try {
        // In a real implementation, this would use analyzePresentationPlaceholders
        // For now, we'll use a placeholder implementation that creates dummy placeholders
        const dummyPlaceholders: PlaceholderInfo[] = [
          { placeholder: '{Sheet1:A1}', content: 'Sheet1:A1', description: 'Title cell' },
          { placeholder: '{Sheet1:B2}', content: 'Sheet1:B2', description: 'Subtitle' },
          { placeholder: '{DATA:IMG}', content: 'DATA:IMG', description: 'Image from DATA sheet' }
        ];
        
        setPlaceholders(dummyPlaceholders);
        setError(null);
      } catch (err) {
        setError(`Error analyzing template: ${err instanceof Error ? err.message : String(err)}`);
        setPlaceholders([]);
      }
    };

    analyzeTemplate();
  }, [templateFile]);

  const handleProcess = async () => {
    if (!templateFile || dataFiles.length === 0) {
      setError('Please select a template and at least one data file');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressTimer);
            return 90; // Leave final 10% for actual completion
          }
          return newProgress;
        });
      }, 300);

      // Process the files using our utility function
      const result = await processPresentation(templateFile, dataFiles[0]);
      
      clearInterval(progressTimer);
      setProgress(100);
      
      if (onProcessComplete) {
        onProcessComplete(result);
      }
    } catch (err) {
      setError(`Processing error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  };

  // Prepare data for the summary section
  const templateData = templateFile ? {
    name: templateFile.name,
    type: templateFile.type
  } : null;

  const dataFilesData = dataFiles.map(file => ({
    name: file.name,
    type: file.type
  }));

  return (
    <div className="presentation-processor">
      {/* Summary Section - Template, Placeholders, Data Files in that order */}
      <SummarySection 
        template={templateData}
        placeholders={placeholders}
        dataFiles={dataFilesData}
      />

      {/* Progress Section */}
      {processing && (
        <div className="progress-container">
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${progress}%`,
                backgroundColor: 'rgb(156, 255, 0)' 
              }}
            ></div>
          </div>
          <div className="progress-text">{progress}% complete</div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message" style={{ color: 'rgb(255, 80, 80)', marginTop: '10px' }}>
          {error}
        </div>
      )}

      {/* Process Button */}
      <button 
        className="process-btn" 
        onClick={handleProcess}
        disabled={processing || !templateFile || dataFiles.length === 0}
        style={{
          backgroundColor: 'rgb(156, 255, 0)',
          color: 'rgb(0, 51, 51)'
        }}
      >
        {processing ? 'Processing...' : 'Process Presentation'}
      </button>
    </div>
  );
};

export default PresentationProcessor; 