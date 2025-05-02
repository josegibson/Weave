import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawn } from 'child_process'

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
  
  // Setup IPC handlers
  setupIpcHandlers()
})

function setupIpcHandlers() {
  // Handle selecting directories
  ipcMain.handle('select-directory', async () => {
    if (!win) return { canceled: true, filePaths: [] }
    
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Output Directory'
    })
    
    return result
  })

  // Process files
  ipcMain.handle('process-files', async (event, args) => {
    if (!win) return { success: false, message: 'No window available' }
    
    try {
      const { templatePath, excelPaths, outputDirectory } = args
      
      // Get the path to the Python script - in production this will be different
      const scriptPath = path.join(__dirname, 'python', 'processing_engine.py')
      
      // Build the command arguments
      const cmdArgs = [
        scriptPath,
        '--template', templatePath,
        '--output-dir', outputDirectory,
        '--excel-files', ...excelPaths
      ]
      
      console.log(`Running Python script with args: ${cmdArgs.join(' ')}`)
      
      // In development, we use the system Python
      // In production, we would bundle Python with the app
      const pythonProcess = spawn('python', cmdArgs)
      
      // Process data from the Python script
      let results: Array<{ excelPath: string; success: boolean; message: string; outputPath?: string }> = []
      
      return new Promise((resolve, reject) => {
        pythonProcess.stdout.on('data', (data) => {
          const output = data.toString().trim()
          console.log(`Python stdout: ${output}`)
          
          // Parse the output
          const lines = output.split('\n')
          for (const line of lines) {
            const match = line.match(/^(success|error): (.*) -> (.*)$/)
            if (match) {
              const [_, status, excelPath, outputPath] = match
              results.push({
                excelPath,
                success: status === 'success',
                message: status === 'success' ? 'Successfully processed' : 'Processing failed',
                outputPath: status === 'success' ? outputPath : undefined
              })
            }
          }
        })
        
        pythonProcess.stderr.on('data', (data) => {
          console.error(`Python stderr: ${data.toString().trim()}`)
        })
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            resolve(results)
          } else {
            reject(new Error(`Python process exited with code ${code}`))
          }
        })
        
        pythonProcess.on('error', (err) => {
          reject(err)
        })
      })
    } catch (error: any) {
      console.error('Error processing files:', error)
      return { success: false, message: `Error: ${error.message || 'Unknown error'}` }
    }
  })
}
