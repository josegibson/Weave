import { app as E, BrowserWindow as v, dialog as y, ipcMain as h } from "electron";
import { fileURLToPath as F } from "node:url";
import i from "node:path";
import { spawn as S } from "child_process";
import p from "node:fs";
const R = i.dirname(F(import.meta.url));
process.env.APP_ROOT = i.join(R, "..");
const $ = process.env.VITE_DEV_SERVER_URL, k = i.join(process.env.APP_ROOT, "dist-electron"), O = i.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = $ ? i.join(process.env.APP_ROOT, "public") : O;
const T = i.join(process.resourcesPath, "processing_engine", "processing_engine.exe"), I = i.join(process.env.APP_ROOT, "electron", "core", "dist", "processing_engine.exe"), x = p.existsSync(T) ? T : I;
let e;
function b() {
  e = new v({
    icon: i.join(process.env.VITE_PUBLIC, "weave.svg"),
    titleBarStyle: "hiddenInset",
    // macOS - hides title bar but keeps controls
    autoHideMenuBar: !0,
    // Windows/Linux - hides menu bar but keeps it accessible via Alt key
    frame: !0,
    // Keep the native window frame with controls
    show: !1,
    // Don't show until we're ready
    webPreferences: {
      preload: i.join(R, "preload.mjs")
    }
  }), e.maximize(), e.show(), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), $ ? e.loadURL($) : e.loadFile(i.join(O, "index.html"));
}
E.on("window-all-closed", () => {
  process.platform !== "darwin" && (E.quit(), e = null);
});
E.on("activate", () => {
  v.getAllWindows().length === 0 && b();
});
E.whenReady().then(() => {
  b(), p.existsSync(x) || (console.error(`Processing engine executable not found at: ${x}`), y.showErrorBox(
    "Processing Engine Error",
    "The processing engine executable was not found. The application may not function correctly."
  )), N();
});
function N() {
  h.handle("select-pptx-file", async () => e ? await y.showOpenDialog(e, {
    properties: ["openFile"],
    filters: [{ name: "PowerPoint Files", extensions: ["pptx"] }],
    title: "Select PowerPoint Template"
  }) : { canceled: !0, filePaths: [] }), h.handle("select-excel-file", async () => e ? await y.showOpenDialog(e, {
    properties: ["openFile"],
    filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
    title: "Select Excel Data File"
  }) : { canceled: !0, filePaths: [] }), h.handle("select-directory", async () => e ? await y.showOpenDialog(e, {
    properties: ["openDirectory", "createDirectory"],
    title: "Select Output Directory"
  }) : { canceled: !0, filePaths: [] }), h.handle("analyse-template", async (P, f) => {
    if (!e) return { success: !1, message: "No window available" };
    const { templatePath: s } = f;
    try {
      if (!p.existsSync(s))
        return { success: !1, message: `Template file not found: ${s}` };
      console.log(`Analyzing template: ${s}`);
      const n = S(x, ["analyse", s]);
      return new Promise((u, l) => {
        let o = "", m = "";
        n.stdout.on("data", (r) => {
          const t = r.toString();
          e == null || e.webContents.send("engine-log", { type: "stdout", text: t }), o += t;
        }), n.stderr.on("data", (r) => {
          const t = r.toString();
          e == null || e.webContents.send("engine-log", { type: "stderr", text: t }), m += t, console.error(`Processing engine stderr: ${t}`);
        }), n.on("close", (r) => {
          if (console.log(`Processing engine exited with code ${r}`), r === 0)
            try {
              const t = JSON.parse(o);
              u({ success: !0, ...t });
            } catch (t) {
              console.error("Failed to parse processing engine output:", t), l({ success: !1, message: `Failed to parse processing engine output: ${t.message}` });
            }
          else
            l({
              success: !1,
              message: `Processing engine exited with code ${r}`,
              stderr: m
            });
        }), n.on("error", (r) => {
          console.error("Failed to spawn processing engine:", r), l({ success: !1, message: `Failed to spawn processing engine: ${r.message}` });
        });
      });
    } catch (n) {
      return console.error("Error analyzing template:", n), { success: !1, message: `Error: ${n.message || "Unknown error"}` };
    }
  }), h.handle("process-template", async (P, f) => {
    if (!e) return { success: !1, message: "No window available" };
    try {
      const { templatePath: s, dataPath: n, outputPath: u } = f;
      if (!p.existsSync(s))
        return { success: !1, message: `Template file not found: ${s}` };
      if (!p.existsSync(n))
        return { success: !1, message: `Excel data file not found: ${n}` };
      const l = i.dirname(u);
      p.existsSync(l) || p.mkdirSync(l, { recursive: !0 }), console.log(`Processing template: ${s} with data: ${n}`);
      const o = S(x, ["process", s, n, u]);
      return new Promise((m, r) => {
        let t = "", w = "";
        o.stdout.on("data", (a) => {
          const c = a.toString();
          e == null || e.webContents.send("engine-log", { type: "stdout", text: c }), t += c;
        }), o.stderr.on("data", (a) => {
          const c = a.toString();
          e == null || e.webContents.send("engine-log", { type: "stderr", text: c }), w += c, console.error(`Processing engine stderr: ${c}`);
        }), o.on("close", (a) => {
          if (console.log(`Processing engine exited with code ${a}`), a === 0)
            try {
              const c = JSON.parse(t);
              m({ success: !0, ...c });
            } catch (c) {
              console.error("Failed to parse processing engine output:", c), r({ success: !1, message: `Failed to parse processing engine output: ${c.message}` });
            }
          else
            r({
              success: !1,
              message: `Processing engine exited with code ${a}`,
              stderr: w
            });
        }), o.on("error", (a) => {
          console.error("Failed to spawn processing engine:", a), r({ success: !1, message: `Failed to spawn processing engine: ${a.message}` });
        });
      });
    } catch (s) {
      return console.error("Error processing template:", s), { success: !1, message: `Error: ${s.message || "Unknown error"}` };
    }
  }), h.handle("process-files", async (P, f) => {
    if (!e) return { success: !1, message: "No window available" };
    try {
      const { templatePath: s, excelPaths: n, outputDirectory: u } = f;
      if (console.log(`Batch processing started. Template: ${s}, Excel files: ${n.join(", ")}`), !p.existsSync(s))
        return console.error(`Template not found: ${s}`), { success: !1, message: `Template file not found: ${s}` };
      p.existsSync(u) || p.mkdirSync(u, { recursive: !0 });
      const l = [];
      for (const o of n) {
        if (console.log(`Processing file: ${o}`), !p.existsSync(o)) {
          console.error(`Excel file not found: ${o}`), l.push({ excelPath: o, success: !1, message: `Excel file not found: ${o}` });
          continue;
        }
        const m = i.basename(o, i.extname(o)), r = i.join(u, `${m}_processed.pptx`);
        try {
          const t = await new Promise((w, a) => {
            console.log("Spawning processing engine:", x, ["process", s, o, r]);
            const c = S(x, ["process", s, o, r]);
            let _ = "", D = "";
            c.stdout.on("data", (g) => {
              const d = g.toString();
              e == null || e.webContents.send("engine-log", { type: "stdout", text: d }), _ += d;
            }), c.stderr.on("data", (g) => {
              const d = g.toString();
              e == null || e.webContents.send("engine-log", { type: "stderr", text: d }), D += d;
            }), c.on("close", (g) => {
              if (console.log(`Engine process exited with code ${g}`), g === 0)
                try {
                  const d = JSON.parse(_);
                  w(d);
                } catch (d) {
                  console.error("Error parsing engine output:", d), a(new Error(`Failed to parse engine output: ${d.message}`));
                }
              else
                a(new Error(`Engine exited with code ${g}. Stderr: ${D}`));
            }), c.on("error", (g) => {
              console.error("Failed to start engine process:", g), a(g);
            });
          });
          l.push({
            excelPath: o,
            success: t.status === "success",
            message: t.status === "success" ? "Successfully processed" : t.error || "Unknown error",
            outputPath: t.output_file
          });
        } catch (t) {
          console.error(`Error processing file ${o}:`, t), l.push({
            excelPath: o,
            success: !1,
            message: `Error processing file: ${t.message}`
          });
        }
      }
      return console.log("Batch processing complete:", l), l;
    } catch (s) {
      console.error("Error in batch processing handler:", s);
      const { excelPaths: n } = f;
      return n.map((u) => ({
        excelPath: u,
        success: !1,
        message: s.message || "Unknown error"
      }));
    }
  });
}
export {
  k as MAIN_DIST,
  x as PROCESSING_ENGINE_PATH,
  O as RENDERER_DIST,
  $ as VITE_DEV_SERVER_URL
};
