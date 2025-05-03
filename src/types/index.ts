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

export type WizardStep = 'template' | 'data' | 'output' | 'complete'; 

export interface TemplatePattern {
  type: 'text' | 'image';
  pattern: string;
  description: string;
  slide: number;
} 