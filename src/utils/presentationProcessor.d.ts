declare module '../utils/presentationProcessor' {
  export function logWarning(message: string): void;
  export function logInfo(message: string): void;
  
  export function detectPlaceholders(text: string): Array<{
    placeholder: string;
    content: string;
  }>;
  
  export function analyzePresentationPlaceholders(file: File): Promise<Array<{
    placeholder: string;
    content: string;
  }>>;
  
  export function processPresentation(
    pptxFile: File, 
    excelFile: File
  ): Promise<{
    success: boolean;
    message: string;
    output: Blob | null;
  }>;
} 