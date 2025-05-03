import { useState, useEffect, useRef } from 'react'
import './App.css'
import FileDropZone from './components/FileDropZone'
import FileList from './components/FileList'
import Settings from './components/Settings'
import { FileItem, ProcessingOptions, WizardStep, TemplatePattern } from './types'
import { theme } from './styles/theme'
import { ProcessingService } from './services/processingService'

function App() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [darkMode, setDarkMode] = useState(true) // Always use dark mode
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    outputDirectory: ''
  })
  const [currentStep, setCurrentStep] = useState<WizardStep>('template')
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templateAnalysis, setTemplateAnalysis] = useState<{
    placeholders: TemplatePattern[];
    loading: boolean;
  }>({
    placeholders: [],
    loading: false
  });

  // Check system preference for dark mode - but default to true
  useEffect(() => {
    setDarkMode(true) // Always use dark mode
  }, [])

  const handleFilesAdded = async (newFiles: FileItem[]) => {
    if (currentStep === 'template') {
      // For template step, we only accept PPTX files
      const pptxFiles = newFiles.filter(file => file.type === 'pptx')
      if (pptxFiles.length > 0) {
        // Take only the first PPTX if multiple were uploaded
        const pptxToKeep = [pptxFiles[0]]
        setFiles(prevFiles => {
          // Replace any existing PPTX files
          const nonPptxFiles = prevFiles.filter(file => file.type !== 'pptx')
          return [...nonPptxFiles, ...pptxToKeep]
        })
        
        // Analyze the template file to find patterns
        await analyzeTemplateFile(pptxFiles[0]);
      }
    } else if (currentStep === 'data') {
      // For data step, we only accept XLSX files
      const xlsxFiles = newFiles.filter(file => file.type === 'xlsx')
      if (xlsxFiles.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...xlsxFiles])
      }
    }
  }

  const analyzeTemplateFile = async (file: FileItem) => {
    setTemplateAnalysis(prev => ({ ...prev, loading: true }));
    
    try {
      // This would be an actual analysis of the PPTX file to find patterns
      // For now, we'll simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // This is where you would implement the actual pattern extraction
      // For demonstration, we'll create mock data based on the Python script logic
      const mockPatterns: TemplatePattern[] = [
        { 
          type: 'text', 
          pattern: '{Sheet1:A1}', 
          description: 'Cell reference from Sheet1, cell A1',
          slide: 1
        },
        { 
          type: 'text', 
          pattern: '{Performance:B2}', 
          description: 'Cell reference from Performance sheet, cell B2',
          slide: 1
        },
        { 
          type: 'image', 
          pattern: '{Charts:IMG}', 
          description: 'Image from Charts sheet',
          slide: 2
        },
        { 
          type: 'text', 
          pattern: '{Summary:C5}', 
          description: 'Cell reference from Summary sheet, cell C5',
          slide: 3
        }
      ];
      
      setTemplateAnalysis({
        placeholders: mockPatterns,
        loading: false
      });
    } catch (error) {
      console.error('Failed to analyze template:', error);
      setTemplateAnalysis({
        placeholders: [],
        loading: false
      });
    }
  };

  const handleRemoveFile = (id: string) => {
    // Use the fileInputRef to reset the input field, which allows reselecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // If removing template file, clear the analysis
    const fileToRemove = files.find(file => file.id === id);
    if (fileToRemove?.type === 'pptx') {
      setTemplateAnalysis({
        placeholders: [],
        loading: false
      });
    }
    
    setFiles(files.filter(file => file.id !== id))
  }

  const handleChangeTemplate = () => {
    // Reset the template so user can select a new one
    setFiles(prevFiles => prevFiles.filter(file => file.type !== 'pptx'))
    // Also reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear the analysis
    setTemplateAnalysis({
      placeholders: [],
      loading: false
    });
  }

  const handleNextStep = () => {
    if (currentStep === 'template') {
      setCurrentStep('data')
    } else if (currentStep === 'data') {
      setCurrentStep('output')
    }
  }

  const handlePreviousStep = () => {
    if (currentStep === 'data') {
      setCurrentStep('template')
    } else if (currentStep === 'output') {
      setCurrentStep('data')
    }
  }

  const handleStepClick = (step: WizardStep) => {
    // Only allow navigation to completed steps or the next available step
    const stepOrder: WizardStep[] = ['template', 'data', 'output', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const targetIndex = stepOrder.indexOf(step);
    
    // Can't click on future steps (except the immediate next one if requirements are met)
    if (targetIndex > currentIndex + 1) return;
    
    // Can't click on the next step if requirements aren't met
    if (targetIndex === currentIndex + 1) {
      if (currentStep === 'template' && !canProceedFromTemplate) return;
      if (currentStep === 'data' && !canProceedFromData) return;
      if (currentStep === 'output' && !canProceedFromOutput) return;
    }
    
    // Can always go to previous steps or current step (no-op)
    setCurrentStep(step);
  };

  const handleProcess = async () => {
    // Validation
    const pptxFile = files.find(file => file.type === 'pptx')
    const xlsxFiles = files.filter(file => file.type === 'xlsx')
    
    if (!pptxFile) {
      alert('Please add a PowerPoint template file.')
      return
    }
    
    if (xlsxFiles.length === 0) {
      alert('Please add at least one Excel data file.')
      return
    }
    
    if (!processingOptions.outputDirectory) {
      alert('Please select an output directory.')
      return
    }
    
    // Start processing
    setIsProcessing(true)
    setProgress(0)
    
    try {
      // Update status for all files
      setFiles(prevFiles => 
        prevFiles.map(file => ({ ...file, status: 'processing' }))
      )
      
      // Process files with progress updates
      const totalFiles = xlsxFiles.length
      let completedFiles = 0
      
      const updateProgress = () => {
        completedFiles++
        const newProgress = Math.floor((completedFiles / totalFiles) * 100)
        setProgress(newProgress)
      }
      
      const results = await ProcessingService.processFiles(
        pptxFile,
        xlsxFiles,
        processingOptions,
        updateProgress
      )
      
      // Update status based on results
      setFiles(prevFiles => 
        prevFiles.map(file => {
          if (file.type === 'xlsx') {
            const result = results.find(r => 
              r.outputPath?.includes(file.name.replace('.xlsx', '.pptx'))
            )
            
            if (result) {
              return {
                ...file,
                status: result.success ? 'success' : 'error',
                errorMessage: !result.success ? result.message : undefined
              }
            }
          }
          return file.type === 'pptx' 
            ? { ...file, status: 'success' } 
            : file
        })
      )
      
      // Set progress to 100% when done
      setProgress(100)
    } catch (error) {
      console.error('Processing failed:', error)
      
      // Update status to error for all files
      setFiles(prevFiles => 
        prevFiles.map(file => ({ 
          ...file, 
          status: 'error',
          errorMessage: 'Processing failed' 
        }))
      )
    } finally {
      setIsProcessing(false)
      setCurrentStep('complete')
    }
  }

  const appStyles = {
    backgroundColor: '#121212',
    color: '#e0e0e0',
    minHeight: '100vh',
    transition: theme.transitions.default
  }

  const canProceedFromTemplate = files.some(file => file.type === 'pptx')
  const canProceedFromData = files.some(file => file.type === 'xlsx')
  const canProceedFromOutput = !!processingOptions.outputDirectory

  // Get step status for indicator
  const getStepStatus = (step: WizardStep): 'active' | 'completed' | 'upcoming' => {
    const stepOrder: WizardStep[] = ['template', 'data', 'output', 'complete']
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(step)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'upcoming'
  }

  // Get if a step is clickable 
  const isStepClickable = (step: WizardStep): boolean => {
    const status = getStepStatus(step);
    if (status === 'completed') return true;
    if (status === 'active') return false; // Already on this step
    
    // For upcoming step - only the next one is clickable if requirements are met
    const stepOrder: WizardStep[] = ['template', 'data', 'output', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex !== currentIndex + 1) return false;
    
    // Check if requirements are met
    if (currentStep === 'template') return canProceedFromTemplate;
    if (currentStep === 'data') return canProceedFromData;
    if (currentStep === 'output') return canProceedFromOutput;
    
    return false;
  };

  // Get template file if exists
  const templateFile = files.find(file => file.type === 'pptx')

  return (
    <div className="app-wrapper" style={appStyles}>
      <div className="app-container">
        <header className="app-header">
          <div className="title-container">
            <h1 style={{ 
              fontFamily: theme.fonts.heading,
              color: theme.colors.vibrantChartreuse
            }}>
              Weave
            </h1>
            <p style={{ color: '#e0e0e0' }}>
              PPTX-Excel Report Generator
            </p>
          </div>
        </header>

        <main className="app-main">
          {/* Step indicator */}
          <div className="step-indicator">
            {(['template', 'data', 'output', 'complete'] as WizardStep[]).map((step, index) => (
              <div 
                key={step} 
                className={`step-item ${getStepStatus(step)} ${isStepClickable(step) ? 'clickable' : ''}`}
                onClick={() => isStepClickable(step) && handleStepClick(step)}
              >
                <div className="step-number">
                  {getStepStatus(step) === 'completed' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="step-label">
                  {step === 'template' && 'Select Template'}
                  {step === 'data' && 'Add Data Files'}
                  {step === 'output' && 'Output Settings'}
                  {step === 'complete' && 'Complete'}
                </div>
                {index < 3 && <div className="step-connector" />}
              </div>
            ))}
          </div>

          <div className="wizard-content">
            {currentStep === 'template' && (
              <div className="step-content">
                <h2 className="step-title">Select PowerPoint Template</h2>
                <p className="step-description">
                  Select a PowerPoint (.pptx) template file that will be used as the base for your reports.
                </p>
                
                <div className="template-container">
                  {!templateFile ? (
                    <div className="file-drop-container">
                      <FileDropZone 
                        onFilesAdded={handleFilesAdded} 
                        acceptedTypes={['.pptx']}
                        darkMode={darkMode}
                        fileInputRef={fileInputRef}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="file-display">
                        <div className="file-info">
                          <div className="file-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                              <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="file-details">
                            <div className="file-name">{templateFile.name}</div>
                            <div className="file-type">PowerPoint Template</div>
                          </div>
                        </div>
                        <button 
                          className="file-remove-icon"
                          onClick={() => handleRemoveFile(templateFile.id)}
                          aria-label="Remove template"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                      
                      {/* Template Analysis Section */}
                      <div className="template-analysis">
                        <h3 className="analysis-title">
                          Template Analysis
                          {templateAnalysis.loading && (
                            <span className="loading-indicator">
                              <span className="dot"></span>
                              <span className="dot"></span>
                              <span className="dot"></span>
                            </span>
                          )}
                        </h3>
                        
                        {templateAnalysis.loading ? (
                          <p className="analysis-loading">Analyzing template file...</p>
                        ) : templateAnalysis.placeholders.length > 0 ? (
                          <>
                            <p className="analysis-summary">
                              Found {templateAnalysis.placeholders.length} placeholders in your template:
                            </p>
                            <div className="pattern-list">
                              {templateAnalysis.placeholders.map((pattern, index) => (
                                <div key={index} className="pattern-item">
                                  <div className="pattern-icon">
                                    {pattern.type === 'text' ? (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M4 18H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                      </svg>
                                    ) : (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                                        <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    )}
                                  </div>
                                  <div className="pattern-details">
                                    <div className="pattern-code">{pattern.pattern}</div>
                                    <div className="pattern-description">
                                      {pattern.description} <span className="pattern-slide">Slide {pattern.slide}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="analysis-none">No placeholders found in the template. Make sure your template includes patterns like {"{SheetName:CellRef}"} or {"{SheetName:IMG}"}.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="wizard-actions">
                  <button
                    onClick={handleNextStep}
                    disabled={!canProceedFromTemplate}
                    className="next-btn"
                    style={{
                      backgroundColor: theme.colors.vibrantChartreuse,
                      color: theme.colors.darkGray,
                      opacity: !canProceedFromTemplate ? 0.6 : 1,
                    }}
                  >
                    Next: Add Data Files
                  </button>
                </div>
              </div>
            )}
            
            {currentStep === 'data' && (
              <div className="step-content">
                <h2 className="step-title">Add Excel Data Files</h2>
                <p className="step-description">
                  Add one or more Excel (.xlsx) files containing data for your reports.
                </p>
                
                <FileDropZone 
                  onFilesAdded={handleFilesAdded} 
                  acceptedTypes={['.xlsx']}
                  darkMode={darkMode}
                  fileInputRef={fileInputRef}
                />
                
                {files.filter(file => file.type === 'xlsx').length > 0 && (
                  <FileList 
                    files={files.filter(file => file.type === 'xlsx')} 
                    onRemoveFile={handleRemoveFile}
                    darkMode={darkMode}
                  />
                )}
                
                <div className="wizard-actions">
                  <button
                    onClick={handlePreviousStep}
                    className="back-btn"
                    style={{
                      color: theme.colors.vibrantChartreuse,
                    }}
                  >
                    Back
                  </button>
                  
                  <button
                    onClick={handleNextStep}
                    disabled={!canProceedFromData}
                    className="next-btn"
                    style={{
                      backgroundColor: theme.colors.vibrantChartreuse,
                      color: theme.colors.darkGray,
                      opacity: !canProceedFromData ? 0.6 : 1,
                    }}
                  >
                    Next: Output Settings
                  </button>
                </div>
              </div>
            )}
            
            {currentStep === 'output' && (
              <div className="step-content">
                <h2 className="step-title">Output Settings</h2>
                <p className="step-description">
                  Configure where your generated reports will be saved.
                </p>
                
                <Settings 
                  options={processingOptions}
                  onChange={setProcessingOptions}
                  darkMode={darkMode}
                  isExpanded={true}
                />
                
                <div className="wizard-summary">
                  <h3>Summary</h3>
                  <div className="summary-item">
                    <span>Template:</span>
                    <strong>{files.find(file => file.type === 'pptx')?.name || 'None'}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Data Files:</span>
                    <strong>{files.filter(file => file.type === 'xlsx').length} files selected</strong>
                  </div>
                  <div className="summary-item">
                    <span>Placeholders:</span>
                    <strong>{templateAnalysis.placeholders.length} found</strong>
                  </div>
                </div>
                
                <div className="wizard-actions">
                  <button
                    onClick={handlePreviousStep}
                    className="back-btn"
                    style={{
                      color: theme.colors.vibrantChartreuse,
                    }}
                  >
                    Back
                  </button>
                  
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing || !canProceedFromOutput}
                    className="process-btn"
                    style={{
                      backgroundColor: theme.colors.vibrantChartreuse,
                      color: theme.colors.darkGray,
                      opacity: isProcessing || !canProceedFromOutput ? 0.6 : 1,
                    }}
                  >
                    {isProcessing ? 'Processing...' : 'Generate Reports'}
                  </button>
                </div>
              </div>
            )}
            
            {currentStep === 'complete' && (
              <div className="step-content">
                <h2 className="step-title">Processing Complete</h2>
                <p className="step-description">
                  Your reports have been generated. You can view the results below.
                </p>
                
                <FileList 
                  files={files} 
                  onRemoveFile={handleRemoveFile}
                  darkMode={darkMode}
                />
                
                <div className="wizard-actions">
                  <button
                    onClick={() => {
                      setFiles([])
                      setCurrentStep('template')
                      setTemplateAnalysis({
                        placeholders: [],
                        loading: false
                      })
                    }}
                    className="restart-btn"
                    style={{
                      backgroundColor: theme.colors.vibrantChartreuse,
                      color: theme.colors.darkGray,
                    }}
                  >
                    Start New Batch
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {isProcessing && (
            <div className="progress-container">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: theme.colors.vibrantChartreuse
                  }}
                />
              </div>
              <div className="progress-text">{progress}% Complete</div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
