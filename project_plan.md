Weave
Weave data into insights.

# PPTX-Excel Report Generator App: Product Plan

<!-- Color Scheme Reference: -->
> Embrace richer, deeper jewel tones—like **midnight teal** `#005b61` paired with **vibrant chartreuse** `#9cff00` or **amber** `#ffbf00`. These colors feel modern, tech-savvy, and alive.

---

## 1. Vision & Goals

**Objective:** Build a desktop/web application that allows users to drag-and-drop a PowerPoint template and multiple Excel workbooks to automatically generate customized PPTX reports per workbook.

- Automate placeholder replacement for text and images (based on `grv2_pptx.py`).
- Provide an intuitive drag-and-drop or file-picker interface.
- Maintain high performance for bulk processing.
- Adhere to SOLID design, DRY, and KISS principles.


**Key Use Cases:**
1. **Single-template, multi-sheet export**: Drop one PPTX and several Excel files → generate one PPTX per Excel workbook.
2. **Bulk processing**: Process 10+ Excel files at once with status/progress feedback.

## 3. Feature Breakdown

### 3.1. File Management
- Drag-and-drop area for PPTX and Excel files.
- Fallback file-picker (single- and multi-select).
- File validation (extensions `.pptx`, `.xlsx`).

### 3.2. Processing Engine
- Wrap and extend `grv2_pptx.py` core:
  - Load template PPTX via `python-pptx`.
  - Load each Excel workbook via `openpyxl` (data_only mode).
  - Replace text placeholders using regex (flexible whitespace).
  - Extract single images per sheet, embed into PPTX at placeholder location.
- Threaded or asynchronous processing for parallel exports.
- Progress tracking & error logging.

### 3.3. User Interface / UX
- **Dashboard**:
  - File inputs with clear icons styled in midnight teal (#005b61).
  - Status list (in amber #ffbf00) showing processing steps per file.
- **Settings**:
  - Output directory selector.
- **Notifications**:
  - Success toasts in chartreuse (#9cff00).
  - Warnings/errors in amber (#ffbf00).

### 3.4. Configuration & Extensibility
- Export settings stored in JSON/YAML.
- Plugin interface for custom placeholder handlers:
  - Implement new handlers without modifying core (Open/Closed).
- CLI mode support for automation and scripting.

## 4. System Architecture

```
[ UI Layer ] ←→ [ Controller ] ←→ [ Processing Engine: grv2-adapter ] ←→ [ python-pptx, openpyxl ]
```

- **UI Layer**: React (Electron or Web), drag-and-drop file zones.
- **Controller**: Manages file events, orchestrates processing tasks (commands/queries separated).
- **Processing Engine**:
  - Single responsibility: one module per task: text replacement, image extraction, slide update, file I/O.
  - Dependency injection for flexibility in Excel/PPTX libraries.

## 5. Technology & Tools

- **Frontend**: React (with TypeScript), Electron (for desktop) or Next.js (web).
- **Backend**: Node.js bridge to Python via child process / REST → core in Python.
- **Python**:
  - `python-pptx`, `openpyxl`, `re`, `tempfile`, `logging`.
- **Packaging**:
  - PyInstaller or Docker for Python bundle.
  - Electron-builder for cross-platform desktop distributable.

## 6. Design & Branding

**Primary Palette**:
- 🟦 Midnight Teal: `#005b61`
- 🟩 Vibrant Chartreuse: `#9cff00`
- 🟧 Amber Accent: `#ffbf00`

**Typography & UI Guidelines**:
- Sans-serif headings (e.g., Montserrat) in teal.
- Body text in dark gray for readability.
- Buttons and highlights in chartreuse/amber.
- Also allow for dark mode and light mode where dark mode is the default.


## 7. Roadmap & Milestones

| Milestone              | Scope                                                          | ETA      |
|------------------------|----------------------------------------------------------------|----------|
| M1: Core engine        | Adapt `grv2_pptx.py` into modular service, basic CLI           | Week 2   |
| M2: Simple UI          | Drag-and-drop file zones + invoke CLI, single file end-to-end  | Week 4   |
| M3: Bulk & Settings    | Multi-file support, settings panel, progress indicator         | Week 6   |
| M4: Packaging & QA     | Cross-platform builds                                          | Week 8   |
| M5: Beta Release       | Public beta, gather feedback, iterate                          | Week 10  |

## 8. Next Steps
1. Review plan & prioritize features.
2. Set up repository skeleton (frontend + Python service).
3. Implement and test core processing engine.
4. Kick off UI prototypes with color palette.

---
*End of Product Plan* 