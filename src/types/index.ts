export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'pptx' | 'xlsx';
  status: 'idle' | 'processing' | 'success' | 'error';
  errorMessage?: string;
}

export interface ProcessingResult {
  success: boolean;
  message: string;
  outputPath?: string;
}

export interface ProcessingOptions {
  outputDirectory: string;
} 