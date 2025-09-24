# Weave

Weave is a powerful tool that streamlines the creation of PowerPoint presentations by dynamically weaving data from Excel files into your presentation templates. This application is designed for anyone who needs to generate customized reports, summaries, or presentations on a regular basis, saving you time and effort.

## Key Features

-   **Template-based Generation**: Create stunning presentations by defining templates with placeholders for your data.
-   **Excel Integration**: Seamlessly pull data from your Excel spreadsheets to populate your presentations.
-   **Dynamic Content**: Weave supports both text and image replacement, allowing for rich and dynamic content.
-   **User-friendly Interface**: A clean and intuitive interface makes it easy to manage your templates, data, and generate presentations.
-   **Cross-platform**: Built with Electron, Weave works on Windows, macOS, and Linux.

## How it Works

Weave uses a simple yet powerful placeholder syntax to identify where your data should be inserted into your PowerPoint template. The placeholders are in the format `{SheetName:CellReference}` for text and `{SheetName:IMG}` for images.

When you provide a PowerPoint template and an Excel file, Weave reads the data from the specified sheet and cell in your Excel file and replaces the corresponding placeholder in your presentation. This allows you to quickly generate multiple presentations with different data, all based on the same template.

## Architecture

Weave is a desktop application built with Electron. It consists of three main parts:

1.  **Frontend**: A React-based user interface (UI) that allows you to interact with the application.
2.  **Backend**: A powerful Python processing engine that handles the heavy lifting of presentation generation. The backend is a Flask server that exposes a REST API.
3.  **Main Process**: The Electron main process acts as a bridge between the frontend and the backend. It starts the Python server and facilitates communication between the UI and the processing engine.

This decoupled architecture allows for a clear separation of concerns and makes the application more robust and scalable.

## Technology Stack

Weave is built with a modern technology stack to ensure a robust and reliable experience:

-   **Frontend**: React with TypeScript for a type-safe and component-based user interface.
-   **Backend**: A powerful Python processing engine that handles the heavy lifting of presentation generation.
-   **Cross-platform**: Electron to package the application for desktop use.

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

## Getting Started

To get started with Weave, follow these simple steps:

1.  **Installation**:
    ```bash
    npm install
    ```
2.  **Run Backend**:
    ```bash
    cd server
    pip install -r requirements.txt
    python app.py
    ```
3.  **Run Frontend**:
    ```bash
    npm run dev
    ```
4.  **Build**:
    ```bash
    npm run build
    ```
This will create a standalone installer for your operating system.

## Usage

1.  **Launch Weave**: Open the application to get started.
2.  **Select Your Template**: Choose the PowerPoint template you want to use.
3.  **Provide Your Data**: Select the Excel file containing the data you want to weave into your presentation.
4.  **Generate**: Click the "Generate" button to create your new presentation.

Weave will then process your files and generate a new PowerPoint presentation with your data woven in.