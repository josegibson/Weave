# Weave - PowerPoint Template Processor

A modern app for processing PowerPoint templates with data from Excel files.

## Features

- Replace placeholders in PowerPoint templates with data from Excel files
- Support for text and image replacements
- Placeholder format: `{SheetName:CellReference}` or `{SheetName:IMG}` for images
- Clean, modern UI for easy template management

## Core Functionality

The application implements the following functionality based on the Python implementation in `grv2_pptx.py`:

1. **Template Analysis**: Detects placeholders in PowerPoint templates
2. **Excel Data Extraction**: Extracts values from Excel cells
3. **Placeholder Replacement**: Replaces placeholders with actual data
4. **Image Handling**: Supports extracting images from Excel and inserting them into PowerPoint

## Technology Stack

- React + TypeScript for the UI
- XLSX.js for Excel file processing
- JSZip for PowerPoint manipulation

## Placeholder Format

Placeholders follow this format: `{SheetName:Identifier}`

Where:
- `SheetName`: The name of the Excel sheet containing the data
- `Identifier`: Either a cell reference (e.g., `A1`) or `IMG` for images

Examples:
- `{Sheet1:A1}` - Replace with value from Sheet1, cell A1
- `{DATA:IMG}` - Replace with image from DATA sheet

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. Select a PowerPoint template file
2. Upload an Excel data file
3. Review detected placeholders
4. Process the template to replace placeholders with data

## Output Settings Summary Order

The output settings are displayed in the following order:
1. Template
2. Placeholders
3. Data Files 