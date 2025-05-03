import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawn } from 'child_process'
import fs from 'node:fs'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

// Path to the processing engine executable
export const PROCESSING_ENGINE_PATH = path.join(process.env.APP_ROOT, 'electron', 'core', 'dist', 'processing_engine.exe')

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
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

function setupIpcHandlers() {
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
      
      // Run the processing engine in analyse mode
      const process = spawn(PROCESSING_ENGINE_PATH, ['analyse', templatePath])
      
      return new Promise((resolve, reject) => {
        let stdoutData = ''
        let stderrData = ''
        
        process.stdout.on('data', (data) => {
          const text = data.toString()
          win?.webContents.send('engine-log', { type: 'stdout', text })
          stdoutData += text
        })
        
        process.stderr.on('data', (data) => {
          const text = data.toString()
          win?.webContents.send('engine-log', { type: 'stderr', text })
          stderrData += text
          console.error(`Processing engine stderr: ${text}`)
        })
        
        process.on('close', (code) => {
          console.log(`Processing engine exited with code ${code}`)
          
          if (code === 0) {
            try {
              const result = JSON.parse(stdoutData)
              resolve({ success: true, ...result })
            } catch (err: any) {
              console.error('Failed to parse processing engine output:', err)
              reject({ success: false, message: `Failed to parse processing engine output: ${err.message}` })
            }
          } else {
            reject({ 
              success: false, 
              message: `Processing engine exited with code ${code}`,
              stderr: stderrData
            })
          }
        })
        
        process.on('error', (err) => {
          console.error('Failed to spawn processing engine:', err)
          reject({ success: false, message: `Failed to spawn processing engine: ${err.message}` })
        })
      })
    } catch (error: any) {
      console.error('Error analyzing template:', error)
      return { success: false, message: `Error: ${error.message || 'Unknown error'}` }
    }
  })

  // Process PowerPoint with Excel data
  ipcMain.handle('process-template', async (event, args) => {
    if (!win) return { success: false, message: 'No window available' }
    
    try {
      const { templatePath, dataPath, outputPath } = args
      
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
      
      console.log(`Processing template: ${templatePath} with data: ${dataPath}`)
      
      // Run the processing engine in process mode
      const process = spawn(PROCESSING_ENGINE_PATH, ['process', templatePath, dataPath, outputPath])
      
      return new Promise((resolve, reject) => {
        let stdoutData = ''
        let stderrData = ''
        
        process.stdout.on('data', (data) => {
          const text = data.toString()
          win?.webContents.send('engine-log', { type: 'stdout', text })
          stdoutData += text
        })
        
        process.stderr.on('data', (data) => {
          const text = data.toString()
          win?.webContents.send('engine-log', { type: 'stderr', text })
          stderrData += text
          console.error(`Processing engine stderr: ${text}`)
        })
        
        process.on('close', (code) => {
          console.log(`Processing engine exited with code ${code}`)
          
          if (code === 0) {
            try {
              const result = JSON.parse(stdoutData)
              resolve({ success: true, ...result })
            } catch (err: any) {
              console.error('Failed to parse processing engine output:', err)
              reject({ success: false, message: `Failed to parse processing engine output: ${err.message}` })
            }
          } else {
            reject({ 
              success: false, 
              message: `Processing engine exited with code ${code}`,
              stderr: stderrData
            })
          }
        })
        
        process.on('error', (err) => {
          console.error('Failed to spawn processing engine:', err)
          reject({ success: false, message: `Failed to spawn processing engine: ${err.message}` })
        })
      })
    } catch (error: any) {
      console.error('Error processing template:', error)
      return { success: false, message: `Error: ${error.message || 'Unknown error'}` }
    }
  })

  // Process multiple files (batch processing)
  ipcMain.handle('process-files', async (event, args) => {
    if (!win) return { success: false, message: 'No window available' }
    
    try {
      const { templatePath, excelPaths, outputDirectory } = args
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
        const outputPath = path.join(outputDirectory, `${excelFileName}_processed.pptx`)
        
        try {
          const processResult = await new Promise<{status: string, error?: string, output_file?: string}>((resolve, reject) => {
            console.log(`Spawning processing engine:`, PROCESSING_ENGINE_PATH, ['process', templatePath, excelPath, outputPath])
            const proc = spawn(PROCESSING_ENGINE_PATH, ['process', templatePath, excelPath, outputPath])
            let stdoutData = ''
            let stderrData = ''
            
            proc.stdout.on('data', (data) => {
              const text = data.toString()
              win?.webContents.send('engine-log', { type: 'stdout', text })
              stdoutData += text
            })
            proc.stderr.on('data', (data) => {
              const text = data.toString()
              win?.webContents.send('engine-log', { type: 'stderr', text })
              stderrData += text
            })
            proc.on('close', (code) => {
              console.log(`Engine process exited with code ${code}`)
              if (code === 0) {
                try {
                  const result = JSON.parse(stdoutData)
                  resolve(result)
                } catch (err: any) {
                  console.error('Error parsing engine output:', err)
                  reject(new Error(`Failed to parse engine output: ${err.message}`))
                }
              } else {
                reject(new Error(`Engine exited with code ${code}. Stderr: ${stderrData}`))
              }
            })
            proc.on('error', (err) => {
              console.error('Failed to start engine process:', err)
              reject(err)
            })
          })
          results.push({
            excelPath,
            success: processResult.status === 'success',
            message: processResult.status === 'success' ? 'Successfully processed' : (processResult.error || 'Unknown error'),
            outputPath: processResult.output_file
          })
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
      // Return an error result for each Excel file so the UI clears processing state
      const { excelPaths } = args as { excelPaths: string[] }
      return excelPaths.map(excelPath => ({
        excelPath,
        success: false,
        message: error.message || 'Unknown error'
      }))
    }
  })
}
