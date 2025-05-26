import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawn } from 'child_process'
import fs from 'node:fs'
import fetch from 'node-fetch'
import FormData from 'form-data'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Server configuration
const SERVER_URL = 'http://172.18.0.2:5000'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// Path to the processing engine executable: look under resources first, then fallback to dev build
const packagedEnginePath = path.join(process.resourcesPath, 'processing_engine', 'processing_engine.exe')
const devEnginePath = path.join(process.env.APP_ROOT, 'electron', 'core', 'dist', 'processing_engine.exe')
export const PROCESSING_ENGINE_PATH = fs.existsSync(packagedEnginePath)
  ? packagedEnginePath
  : devEnginePath

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'weave.svg'),
    titleBarStyle: 'hiddenInset', // macOS - hides title bar but keeps controls
    autoHideMenuBar: true, // Windows/Linux - hides menu bar but keeps it accessible via Alt key
    frame: true, // Keep the native window frame with controls
    show: false, // Don't show until we're ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // When window is ready to show
  win.once('ready-to-show', () => {
    win?.show()
    // Check server health after a short delay to allow the UI to load
    setTimeout(() => {
      checkServerHealth()
    }, 1000)
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
  
  // Check if the processing engine executable exists
  if (!fs.existsSync(PROCESSING_ENGINE_PATH)) {
    console.error(`Processing engine executable not found at: ${PROCESSING_ENGINE_PATH}`)
    dialog.showErrorBox(
      'Processing Engine Error',
      `The processing engine executable was not found. The application may not function correctly.`
    )
  }
  
  // Setup IPC handlers
  setupIpcHandlers()
})

// Check server availability
async function checkServerHealth() {
  try {
    const response = await fetch(`${SERVER_URL}/api/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('Server health check:', data);
      win?.webContents.send('server-status', { available: true, message: 'Server is available' });
      return true;
    } else {
      console.error('Server returned non-OK response:', response.status);
      win?.webContents.send('server-status', { available: false, message: `Server error: ${response.status}` });
      return false;
    }
  } catch (error) {
    console.error('Failed to connect to server:', error);
    win?.webContents.send('server-status', { available: false, message: 'Cannot connect to server' });
    return false;
  }
}

function setupIpcHandlers() {
  console.log('Setting up IPC handlers...')
  
  // Check server health
  ipcMain.handle('check-server', async () => {
    return await checkServerHealth();
  });
  
  // Handle selecting files
  ipcMain.handle('select-pptx-file', async () => {
    if (!win) return { canceled: true, filePaths: [] }
    
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'PowerPoint Files', extensions: ['pptx'] }],
      title: 'Select PowerPoint Template'
    })
    
    return result
  })
  
  // Handle selecting Excel files
  ipcMain.handle('select-excel-file', async () => {
    if (!win) return { canceled: true, filePaths: [] }
    
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      title: 'Select Excel Data File'
    })
    
    return result
  })

  // Handle selecting directories
  ipcMain.handle('select-directory', async () => {
    if (!win) return { canceled: true, filePaths: [] }
    
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Output Directory'
    })
    
    return result
  })

  // Analyze PowerPoint template
  ipcMain.handle('analyse-template', async (event, args) => {
    if (!win) return { success: false, message: 'No window available' }
    
    const { templatePath } = args
    
    try {
      // Validate the template path
      if (!fs.existsSync(templatePath)) {
        return { success: false, message: `Template file not found: ${templatePath}` }
      }
      
      console.log(`Analyzing template: ${templatePath}`)
      
      // Create form data with the template file
      const formData = new FormData();
      formData.append('file', fs.createReadStream(templatePath));
      
      // Send the file to the server for analysis
      const response = await fetch(`${SERVER_URL}/api/analyse-template`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json() as { error: string };
        throw new Error(errorData.error || 'Server error during template analysis');
      }
      
      const result = await response.json() as {
        slides: any[];
        sheets_required: string[];
        cell_references: any[];
        image_references: any[];
      };
      
      return { 
        success: true, 
        slides: result.slides,
        sheets_required: result.sheets_required,
        cell_references: result.cell_references,
        image_references: result.image_references
      };
      
    } catch (error: any) {
      console.error('Error analyzing template:', error)
      return { success: false, message: `Error: ${error.message || 'Unknown error'}` }
    }
  })

  // Process PowerPoint with Excel data
  ipcMain.handle('process-template', async (event, args) => {
    if (!win) return { success: false, message: 'No window available' }
    
    try {
      const { templatePath, dataPath, outputPath, outputFormat } = args
      
      // Validate inputs
      if (!fs.existsSync(templatePath)) {
        return { success: false, message: `Template file not found: ${templatePath}` }
      }
      
      if (!fs.existsSync(dataPath)) {
        return { success: false, message: `Excel data file not found: ${dataPath}` }
      }
      
      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      
      console.log(`Processing template: ${templatePath} with data: ${dataPath}, format: ${outputFormat}`)
      
      // Create form data with both template and data files
      const formData = new FormData();
      formData.append('template', fs.createReadStream(templatePath));
      formData.append('data', fs.createReadStream(dataPath));
      formData.append('format', outputFormat);
      
      try {
        // Send the files to the server for processing
        const response = await fetch(`${SERVER_URL}/api/process`, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders()
        });
        
        if (!response.ok) {
          const errorData = await response.json() as { error: string };
          throw new Error(errorData.error || 'Server error during processing');
        }
        
        const result = await response.json() as { output_filename: string };
        
        // Download the processed file
        const downloadResponse = await fetch(`${SERVER_URL}/api/download/${result.output_filename}`);
        
        if (!downloadResponse.ok) {
          throw new Error('Failed to download processed file');
        }
        
        // Save the downloaded file to the output path
        const fileBuffer = await downloadResponse.buffer();
        fs.writeFileSync(outputPath, fileBuffer);
        
        return { 
          success: true, 
          message: 'Processing completed successfully',
          output_file: outputPath
        };
      } catch (error: any) {
        console.error('Server request failed:', error);
        return { 
          success: false, 
          message: `Server request failed: ${error.message}`
        };
      }
    } catch (error: any) {
      console.error('Error processing template:', error)
      return { success: false, message: `Error: ${error.message || 'Unknown error'}` }
    }
  })

  // Process multiple files (batch processing)
  ipcMain.handle('process-files', async (event, args) => {
    if (!win) return { success: false, message: 'No window available' }
    
    try {
      const { templatePath, excelPaths, outputDirectory, outputFormat } = args
      console.log(`Batch processing started. Template: ${templatePath}, Excel files: ${excelPaths.join(', ')}`)
      
      // Validate the template path
      if (!fs.existsSync(templatePath)) {
        console.error(`Template not found: ${templatePath}`)
        return { success: false, message: `Template file not found: ${templatePath}` }
      }
      
      // Validate output directory
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true })
      }
      
      const results: Array<any> = []
      
      for (const excelPath of excelPaths) {
        console.log(`Processing file: ${excelPath}`)
        if (!fs.existsSync(excelPath)) {
          console.error(`Excel file not found: ${excelPath}`)
          results.push({ excelPath, success: false, message: `Excel file not found: ${excelPath}` })
          continue
        }
        
        const excelFileName = path.basename(excelPath, path.extname(excelPath))
        const outputPath = path.join(outputDirectory, `${excelFileName}_processed.${outputFormat}`)
        
        try {
          // Create form data with the template and data files
          const formData = new FormData();
          formData.append('template', fs.createReadStream(templatePath));
          formData.append('data', fs.createReadStream(excelPath));
          formData.append('format', outputFormat);
          
          // Send the files to the server for processing
          const response = await fetch(`${SERVER_URL}/api/process`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
          });
          
          if (!response.ok) {
            const errorData = await response.json() as { error: string };
            throw new Error(errorData.error || 'Server error during processing');
          }
          
          const result = await response.json() as { output_filename: string };
          
          // Download the processed file
          const downloadResponse = await fetch(`${SERVER_URL}/api/download/${result.output_filename}`);
          
          if (!downloadResponse.ok) {
            throw new Error('Failed to download processed file');
          }
          
          // Save the downloaded file to the output path
          const fileBuffer = await downloadResponse.buffer();
          fs.writeFileSync(outputPath, fileBuffer);
          
          results.push({
            excelPath,
            success: true,
            message: 'Successfully processed',
            outputPath: outputPath
          });
        } catch (error: any) {
          console.error(`Error processing file ${excelPath}:`, error)
          results.push({
            excelPath,
            success: false,
            message: `Error processing file: ${error.message}`
          })
        }
      }

      console.log('Batch processing complete:', results)
      return results
    } catch (error: any) {
      console.error('Error in batch processing handler:', error)
      const { excelPaths } = args as { excelPaths: string[] }
      return excelPaths.map(excelPath => ({
        excelPath,
        success: false,
        message: error.message || 'Unknown error'
      }))
    }
  })
}