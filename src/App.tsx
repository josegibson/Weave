import { useState, useEffect } from 'react'
import './App.css'
import FileDropZone from './components/FileDropZone'
import FileList from './components/FileList'
import Settings from './components/Settings'
import { FileItem, ProcessingOptions } from './types'
import { theme } from './styles/theme'
import { ProcessingService } from './services/processingService'

function App() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [darkMode, setDarkMode] = useState(true)
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    outputDirectory: ''
  })

  // Check system preference for dark mode
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(prefersDark)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleFilesAdded = (newFiles: FileItem[]) => {
    // If a new PPTX is added, replace existing ones
    if (newFiles.some(file => file.type === 'pptx')) {
      const existingXlsxFiles = files.filter(file => file.type === 'xlsx')
      const newPptxFiles = newFiles.filter(file => file.type === 'pptx')
      // Take the first PPTX if multiple were uploaded
      const pptxToKeep = newPptxFiles.length > 0 ? [newPptxFiles[0]] : []
      
      setFiles([...existingXlsxFiles, ...pptxToKeep, ...newFiles.filter(file => file.type === 'xlsx')])
    } else {
      setFiles([...files, ...newFiles])
    }
  }

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id))
  }

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
    }
  }

  const appStyles = {
    backgroundColor: darkMode ? '#121212' : theme.colors.white,
    color: darkMode ? '#e0e0e0' : theme.colors.darkGray,
    minHeight: '100vh',
    transition: theme.transitions.default
  }

  return (
    <div className="app-wrapper" style={appStyles}>
      <div className="app-container">
        <header className="app-header">
          <div className="title-container">
            <h1 style={{ 
              fontFamily: theme.fonts.heading,
              color: darkMode ? theme.colors.vibrantChartreuse : theme.colors.midnightTeal
            }}>
              Weave
            </h1>
            <p style={{ color: darkMode ? '#e0e0e0' : theme.colors.darkGray }}>
              PPTX-Excel Report Generator
            </p>
          </div>
          
          <button 
            onClick={toggleDarkMode}
            className="theme-toggle-btn"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>

        <main className="app-main">
          <div className="app-grid">
            <div className="file-section">
              <FileDropZone 
                onFilesAdded={handleFilesAdded} 
                acceptedTypes={['.pptx', '.xlsx']}
                darkMode={darkMode}
              />
              
              <FileList 
                files={files} 
                onRemoveFile={handleRemoveFile}
                darkMode={darkMode}
              />
            </div>
            
            <div className="config-section">
              <Settings 
                options={processingOptions}
                onChange={setProcessingOptions}
                darkMode={darkMode}
              />
              
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
              
              <button
                onClick={handleProcess}
                disabled={isProcessing || files.length === 0 || !processingOptions.outputDirectory}
                className="process-btn"
                style={{
                  backgroundColor: darkMode ? theme.colors.vibrantChartreuse : theme.colors.midnightTeal,
                  color: darkMode ? theme.colors.darkGray : theme.colors.white,
                  opacity: isProcessing || files.length === 0 || !processingOptions.outputDirectory ? 0.6 : 1,
                }}
              >
                {isProcessing ? 'Processing...' : 'Generate Reports'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
