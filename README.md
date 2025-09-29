# Weave

Weave is a powerful tool that streamlines the creation of PowerPoint presentations by dynamically weaving data from Excel files into your presentation templates. This application is designed for anyone who needs to generate customized reports, summaries, or presentations on a regular basis, saving you time and effort.

## Key Features

-   **Template-based Generation**: Create stunning presentations by defining templates with placeholders for your data.
-   **Excel Integration**: Seamlessly pull data from your Excel spreadsheets to populate your presentations.
-   **Dynamic Content**: Weave supports both text and image replacement, allowing for rich and dynamic content.
-   **User-friendly Interface**: A clean and intuitive interface makes it easy to manage your templates, data, and generate presentations.
-   **Cross-platform**: Built with Electron, Weave works on Windows, macOS, and Linux.

## Architectural Evolution

Weave began as a standalone desktop application, with the backend and frontend bundled into a single installer using PyInstaller. The goal was to provide a simple, all-in-one tool for a specific client. However, as the project's potential grew, the limitations of this approach became clear, leading to the current, more robust client-server architecture. This migration was driven by the need for scalability, the ability to leverage powerful server-side tools like LibreOffice, and to enable more advanced features in the future.

## Project Structure

The project is now organized into a "pragmatic monorepo" structure with three distinct parts:

-   **`/server`**: A Python Flask backend that handles all the business logic, file processing, and document conversion.
-   **`/react-app`**: A standalone React application (using Vite) that serves as the user interface. All frontend source code and configurations reside here.
-   **`/electron`**: The Electron shell application. It acts as a wrapper for the React app, giving it desktop capabilities like native file dialogs and direct file saving.

This decoupled architecture provides a clear separation of concerns and enhances security by centralizing all business logic.

## Technology Stack

-   **Frontend**: React with TypeScript, built with Vite.
-   **Desktop Shell**: Electron.
-   **Backend**: A Python server using the Flask framework.
-   **Document Processing**:
    -   `python-pptx`: For creating and manipulating PowerPoint files.
    -   `openpyxl`: For reading data from Excel files.
    -   `LibreOffice`: Planned for robust, open-source document conversions.

## Getting Started

This project consists of two main parts that must be run separately in development: the Python server and the Electron frontend.

**1. Run the Backend Server (in Terminal 1):**
```bash
# Navigate to the server directory
cd server

# Install dependencies (if you haven't already)
pip install -r requirements.txt

# Run the server
python app.py
```
The server will be running on `http://localhost:5000`.

**2. Run the Frontend Application (in Terminal 2):**
```bash
# Install Node.js dependencies from the project root
npm install

# Run the Electron app in development mode
npm run dev
```

## Future Plans

This project is actively being developed with the following goals in mind:

-   **Abstract the Service Layer:** Refactor the frontend's communication layer to support both the Electron shell and a standard web browser from a single codebase.
-   **Complete Open-Source Migration:** Fully remove the legacy `PowerPointConverter` and its `comtypes` dependency, relying exclusively on LibreOffice for all document conversions.
-   **In-App Template Editor:** Leverage the server-based architecture to build a rich, in-app editor for creating and managing presentation templates, reducing the reliance on external PowerPoint editors.

## Screenshots

<div style="display: flex; flex-wrap: wrap; justify-content: space-around;">
  <div style="flex: 0 0 45%; margin: 10px; text-align: center;">
    <h3>Opening Page</h3>
    <img src="docs/opening_page.png" alt="Opening Page" width="100%">
  </div>
  <div style="flex: 0 0 45%; margin: 10px; text-align: center;">
    <h3>Template Uploaded</h3>
    <img src="docs/template_uploaded.png" alt="Template Uploaded" width="100%">
  </div>
  <div style="flex: 0 0 45%; margin: 10px; text-align: center;">
    <h3>Excel Uploaded</h3>
    <img src="docs/excel_uploaded.png" alt="Excel Uploaded" width="100%">
  </div>
  <div style="flex: 0 0 45%; margin: 10px; text-align: center;">
    <h3>Output Settings</h3>
    <img src="docs/output_settings.png" alt="Output Settings" width="100%">
  </div>
  <div style="flex: 0 0 45%; margin: 10px; text-align: center;">
    <h3>Completed Page</h3>
    <img src="docs/completed_page.png" alt="Completed Page" width="100%">
  </div>
</div>
