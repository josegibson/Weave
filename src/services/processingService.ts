import { FileItem, ProcessingOptions, ProcessingResult } from '../types';

/**
 * Service for processing PPTX and Excel files.
 */
export class ProcessingService {
  /**
   * Process the specified files according to the given options.
   */
  static async processFiles(
    pptxTemplate: FileItem,
    excelFiles: FileItem[],
    options: ProcessingOptions
  ): Promise<ProcessingResult[]> {
    try {
      // Call the main process to invoke the Python processing engine
      const results = await window.electron.ipcRenderer.invoke('process-files', {
        templatePath: pptxTemplate.path,
        excelPaths: excelFiles.map(file => file.path),
        outputDirectory: options.outputDirectory
      });
      
      if (Array.isArray(results)) {
        // Convert the results to our expected format
        return results.map(result => ({
          success: result.success,
          message: result.message,
          outputPath: result.outputPath
        }));
      } else if (results && typeof results === 'object') {
        // Handle error case where results is an object with { success: false, message: '...' }
        throw new Error(results.message || 'Processing failed');
      } else {
        throw new Error('Unexpected result format from processing');
      }
    } catch (error) {
      console.error('Processing failed:', error);
      throw error;
    }
  }
} 