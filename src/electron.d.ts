interface AnalyzeTemplateResult {
  success: boolean;
  message?: string;
  slides?: Array<{
    slide_number: number;
    placeholders: Array<{
      text: string;
      sheet_name: string;
      identifier: string;
      shape_type: string;
      type: 'cell' | 'image';
      position?: {
        left: number;
        top: number;
        width: number;
        height: number;
      };
      table_position?: {
        row: number;
        column: number;
      };
    }>;
  }>;
  sheets_required?: string[];
  cell_references?: any[];
  image_references?: any[];
  error?: string;
}

interface ProcessTemplateResult {
  success: boolean;
  status?: string;
  error?: string;
  output_file?: string;
  message?: string;
}

interface FileSelectionResult {
  canceled: boolean;
  filePaths: string[];
}

// Server status response
interface ServerStatusResult {
  available: boolean;
  message: string;
}

interface ElectronAPI {
  ipcRenderer: {
    on(channel: string, callback: (...args: any[]) => void): void;
    off(channel: string, callback: (...args: any[]) => void): void;
    send(channel: string, ...args: any[]): void;
    invoke(channel: string, ...args: any[]): Promise<any>;
    
    // Server status check
    invoke(channel: 'check-server'): Promise<ServerStatusResult>;
    
    // File selection
    invoke(channel: 'select-pptx-file', ...args: any[]): Promise<FileSelectionResult>;
    invoke(channel: 'select-excel-file', ...args: any[]): Promise<FileSelectionResult>;
    invoke(channel: 'select-directory', ...args: any[]): Promise<FileSelectionResult>;
    
    // Template analysis
    invoke(channel: 'analyse-template', args: { templatePath: string }): Promise<AnalyzeTemplateResult>;
    
    // Template processing
    invoke(channel: 'process-template', args: { 
      templatePath: string; 
      dataPath: string; 
      outputPath: string; 
      outputFormat: 'pptx' | 'pdf'; 
    }): Promise<ProcessTemplateResult>;
    
    // Batch processing
    invoke(channel: 'process-files', args: { 
      templatePath: string; 
      excelPaths: string[]; 
      outputDirectory: string; 
      outputFormat: 'pptx' | 'pdf'; 
    }): Promise<ProcessTemplateResult[]>;
  }
}

declare interface Window {
  electron: ElectronAPI;
} 