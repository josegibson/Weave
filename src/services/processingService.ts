import { FileItem, ProcessingOptions, ProcessingResult, TemplatePattern } from '../types';

/**
 * Service for processing PPTX and Excel files.
 */
export class ProcessingService {
  /**
   * Analyze a PowerPoint template file to identify placeholders
   */
  static async analyzeTemplate(
    pptxTemplate: FileItem
  ): Promise<TemplatePattern[]> {
    try {
      // Call the main process to invoke the processing engine in analyse mode
      const result = await window.electron.ipcRenderer.invoke('analyse-template', {
        templatePath: pptxTemplate.path
      });
      
      if (!result.success) {
        console.error('Template analysis failed:', result.message);
        throw new Error(result.message || 'Template analysis failed');
      }
      
      // Convert the analysis result to our TemplatePattern format
      const patterns: TemplatePattern[] = [];
      
      // Process placeholders from each slide
      result.slides?.forEach(slide => {
        slide.placeholders.forEach(placeholder => {
          patterns.push({
            type: placeholder.type === 'image' ? 'image' : 'text',
            pattern: placeholder.text,
            description: `${placeholder.type === 'image' ? 'Image' : 'Text'} from ${placeholder.sheet_name}, ${placeholder.identifier}`,
            slide: slide.slide_number
          });
        });
      });
      
      return patterns;
    } catch (error) {
      console.error('Template analysis failed:', error);
      throw error;
    }
  }

  /**
   * Process a single template with a single Excel data file
   */
  static async processTemplate(
    pptxTemplate: FileItem,
    excelFile: FileItem,
    outputPath: string
  ): Promise<ProcessingResult> {
    try {
      // Call the main process to invoke the processing engine in process mode
      const result = await window.electron.ipcRenderer.invoke('process-template', {
        templatePath: pptxTemplate.path,
        dataPath: excelFile.path,
        outputPath: outputPath
      });
      
      if (!result.success) {
        throw new Error(result.message || 'Processing failed');
      }
      
      return {
        success: true,
        message: 'Processing completed successfully',
        outputPath: result.output_file
      };
    } catch (error) {
      console.error('Processing failed:', error);
      throw error;
    }
  }

  /**
   * Process the specified files according to the given options.
   */
  static async processFiles(
    pptxTemplate: FileItem,
    excelFiles: FileItem[],
    options: ProcessingOptions,
    onProgress?: () => void
  ): Promise<ProcessingResult[]> {
    try {
      // Call the main process to invoke the processing engine for batch processing
      const results = await window.electron.ipcRenderer.invoke('process-files', {
        templatePath: pptxTemplate.path,
        excelPaths: excelFiles.map(file => file.path),
        outputDirectory: options.outputDirectory
      });
      
      // Call the progress callback for each file (this might happen before actual completion in the real implementation)
      excelFiles.forEach(() => {
        if (onProgress) {
          onProgress();
        }
      });
      
      if (Array.isArray(results)) {
        // Convert the results to our expected format
        return results.map(result => ({
          success: result.success,
          message: result.message || (result as any).error || 'Processing completed',
          outputPath: (result as any).outputFile || (result as any).output_file
        }));
      } else if (results && typeof results === 'object') {
        // Handle error case where results is an object with { success: false, message: '...' }
        throw new Error((results as any).message || 'Processing failed');
      } else {
        throw new Error('Unexpected result format from processing');
      }
    } catch (error) {
      console.error('Processing failed:', error);
      throw error;
    }
  }
} 