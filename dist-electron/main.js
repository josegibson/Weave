import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawn } from "child_process";
import fs from "node:fs";
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
const PROCESSING_ENGINE_PATH = path.join(process.env.APP_ROOT, "electron", "core", "dist", "processing_engine.exe");
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  if (!fs.existsSync(PROCESSING_ENGINE_PATH)) {
    console.error(`Processing engine executable not found at: ${PROCESSING_ENGINE_PATH}`);
    dialog.showErrorBox(
      "Processing Engine Error",
      `The processing engine executable was not found. The application may not function correctly.`
    );
  }
  setupIpcHandlers();
});
function setupIpcHandlers() {
  ipcMain.handle("select-pptx-file", async () => {
    if (!win) return { canceled: true, filePaths: [] };
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "PowerPoint Files", extensions: ["pptx"] }],
      title: "Select PowerPoint Template"
    });
    return result;
  });
  ipcMain.handle("select-excel-file", async () => {
    if (!win) return { canceled: true, filePaths: [] };
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
      title: "Select Excel Data File"
    });
    return result;
  });
  ipcMain.handle("select-directory", async () => {
    if (!win) return { canceled: true, filePaths: [] };
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory", "createDirectory"],
      title: "Select Output Directory"
    });
    return result;
  });
  ipcMain.handle("analyse-template", async (event, args) => {
    if (!win) return { success: false, message: "No window available" };
    const { templatePath } = args;
    try {
      if (!fs.existsSync(templatePath)) {
        return { success: false, message: `Template file not found: ${templatePath}` };
      }
      console.log(`Analyzing template: ${templatePath}`);
      const process2 = spawn(PROCESSING_ENGINE_PATH, ["analyse", templatePath]);
      return new Promise((resolve, reject) => {
        let stdoutData = "";
        let stderrData = "";
        process2.stdout.on("data", (data) => {
          const text = data.toString();
          win == null ? void 0 : win.webContents.send("engine-log", { type: "stdout", text });
          stdoutData += text;
        });
        process2.stderr.on("data", (data) => {
          const text = data.toString();
          win == null ? void 0 : win.webContents.send("engine-log", { type: "stderr", text });
          stderrData += text;
          console.error(`Processing engine stderr: ${text}`);
        });
        process2.on("close", (code) => {
          console.log(`Processing engine exited with code ${code}`);
          if (code === 0) {
            try {
              const result = JSON.parse(stdoutData);
              resolve({ success: true, ...result });
            } catch (err) {
              console.error("Failed to parse processing engine output:", err);
              reject({ success: false, message: `Failed to parse processing engine output: ${err.message}` });
            }
          } else {
            reject({
              success: false,
              message: `Processing engine exited with code ${code}`,
              stderr: stderrData
            });
          }
        });
        process2.on("error", (err) => {
          console.error("Failed to spawn processing engine:", err);
          reject({ success: false, message: `Failed to spawn processing engine: ${err.message}` });
        });
      });
    } catch (error) {
      console.error("Error analyzing template:", error);
      return { success: false, message: `Error: ${error.message || "Unknown error"}` };
    }
  });
  ipcMain.handle("process-template", async (event, args) => {
    if (!win) return { success: false, message: "No window available" };
    try {
      const { templatePath, dataPath, outputPath } = args;
      if (!fs.existsSync(templatePath)) {
        return { success: false, message: `Template file not found: ${templatePath}` };
      }
      if (!fs.existsSync(dataPath)) {
        return { success: false, message: `Excel data file not found: ${dataPath}` };
      }
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      console.log(`Processing template: ${templatePath} with data: ${dataPath}`);
      const process2 = spawn(PROCESSING_ENGINE_PATH, ["process", templatePath, dataPath, outputPath]);
      return new Promise((resolve, reject) => {
        let stdoutData = "";
        let stderrData = "";
        process2.stdout.on("data", (data) => {
          const text = data.toString();
          win == null ? void 0 : win.webContents.send("engine-log", { type: "stdout", text });
          stdoutData += text;
        });
        process2.stderr.on("data", (data) => {
          const text = data.toString();
          win == null ? void 0 : win.webContents.send("engine-log", { type: "stderr", text });
          stderrData += text;
          console.error(`Processing engine stderr: ${text}`);
        });
        process2.on("close", (code) => {
          console.log(`Processing engine exited with code ${code}`);
          if (code === 0) {
            try {
              const result = JSON.parse(stdoutData);
              resolve({ success: true, ...result });
            } catch (err) {
              console.error("Failed to parse processing engine output:", err);
              reject({ success: false, message: `Failed to parse processing engine output: ${err.message}` });
            }
          } else {
            reject({
              success: false,
              message: `Processing engine exited with code ${code}`,
              stderr: stderrData
            });
          }
        });
        process2.on("error", (err) => {
          console.error("Failed to spawn processing engine:", err);
          reject({ success: false, message: `Failed to spawn processing engine: ${err.message}` });
        });
      });
    } catch (error) {
      console.error("Error processing template:", error);
      return { success: false, message: `Error: ${error.message || "Unknown error"}` };
    }
  });
  ipcMain.handle("process-files", async (event, args) => {
    if (!win) return { success: false, message: "No window available" };
    try {
      const { templatePath, excelPaths, outputDirectory } = args;
      console.log(`Batch processing started. Template: ${templatePath}, Excel files: ${excelPaths.join(", ")}`);
      if (!fs.existsSync(templatePath)) {
        console.error(`Template not found: ${templatePath}`);
        return { success: false, message: `Template file not found: ${templatePath}` };
      }
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
      }
      const results = [];
      for (const excelPath of excelPaths) {
        console.log(`Processing file: ${excelPath}`);
        if (!fs.existsSync(excelPath)) {
          console.error(`Excel file not found: ${excelPath}`);
          results.push({ excelPath, success: false, message: `Excel file not found: ${excelPath}` });
          continue;
        }
        const excelFileName = path.basename(excelPath, path.extname(excelPath));
        const outputPath = path.join(outputDirectory, `${excelFileName}_processed.pptx`);
        try {
          const processResult = await new Promise((resolve, reject) => {
            console.log(`Spawning processing engine:`, PROCESSING_ENGINE_PATH, ["process", templatePath, excelPath, outputPath]);
            const proc = spawn(PROCESSING_ENGINE_PATH, ["process", templatePath, excelPath, outputPath]);
            let stdoutData = "";
            let stderrData = "";
            proc.stdout.on("data", (data) => {
              const text = data.toString();
              win == null ? void 0 : win.webContents.send("engine-log", { type: "stdout", text });
              stdoutData += text;
            });
            proc.stderr.on("data", (data) => {
              const text = data.toString();
              win == null ? void 0 : win.webContents.send("engine-log", { type: "stderr", text });
              stderrData += text;
            });
            proc.on("close", (code) => {
              console.log(`Engine process exited with code ${code}`);
              if (code === 0) {
                try {
                  const result = JSON.parse(stdoutData);
                  resolve(result);
                } catch (err) {
                  console.error("Error parsing engine output:", err);
                  reject(new Error(`Failed to parse engine output: ${err.message}`));
                }
              } else {
                reject(new Error(`Engine exited with code ${code}. Stderr: ${stderrData}`));
              }
            });
            proc.on("error", (err) => {
              console.error("Failed to start engine process:", err);
              reject(err);
            });
          });
          results.push({
            excelPath,
            success: processResult.status === "success",
            message: processResult.status === "success" ? "Successfully processed" : processResult.error || "Unknown error",
            outputPath: processResult.output_file
          });
        } catch (error) {
          console.error(`Error processing file ${excelPath}:`, error);
          results.push({
            excelPath,
            success: false,
            message: `Error processing file: ${error.message}`
          });
        }
      }
      console.log("Batch processing complete:", results);
      return results;
    } catch (error) {
      console.error("Error in batch processing handler:", error);
      const { excelPaths } = args;
      return excelPaths.map((excelPath) => ({
        excelPath,
        success: false,
        message: error.message || "Unknown error"
      }));
    }
  });
}
export {
  MAIN_DIST,
  PROCESSING_ENGINE_PATH,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
