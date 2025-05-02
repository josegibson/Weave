import { useState } from 'react'
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
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    outputDirectory: ''
  })

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
    
    try {
      // Update status for all files
      setFiles(prevFiles => 
        prevFiles.map(file => ({ ...file, status: 'processing' }))
      )
      
      // Process files
      const results = await ProcessingService.processFiles(
        pptxFile,
        xlsxFiles,
        processingOptions
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

  return (
    <div className="app-container" style={{ fontFamily: theme.fonts.body }}>
      <header style={{ 
        textAlign: 'center', 
        marginBottom: theme.spacing.xl,
        color: theme.colors.midnightTeal
      }}>
        <h1 style={{ fontFamily: theme.fonts.heading }}>Weave</h1>
        <p>PPTX-Excel Report Generator</p>
      </header>

      <main>
        <FileDropZone 
          onFilesAdded={handleFilesAdded} 
          acceptedTypes={['.pptx', '.xlsx']} 
        />
        
        <FileList 
          files={files} 
          onRemoveFile={handleRemoveFile}
        />
        
        <Settings 
          options={processingOptions}
          onChange={setProcessingOptions}
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: theme.spacing.xl 
        }}>
          <button
            onClick={handleProcess}
            disabled={isProcessing || files.length === 0 || !processingOptions.outputDirectory}
            style={{
              backgroundColor: theme.colors.vibrantChartreuse,
              color: theme.colors.darkGray,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing || files.length === 0 || !processingOptions.outputDirectory ? 0.7 : 1,
              transition: theme.transitions.default,
              fontFamily: theme.fonts.heading
            }}
          >
            {isProcessing ? 'Processing...' : 'Generate Reports'}
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
