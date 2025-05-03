// PowerPoint and Excel processing functionality
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Logging functions
const logWarning = (message) => {
  console.warn(`WARNING: ${message}`);
};

const logInfo = (message) => {
  console.info(`INFO: ${message}`);
};

// Find a sheet in the workbook, normalizing spaces and handling case-insensitive matches
const findSheet = (workbook, sheetName) => {
  // Normalize the input sheet name: strip spaces, collapse multiple spaces
  const normalizedInput = sheetName.trim().replace(/\s+/g, ' ').toLowerCase();
  
  for (const sheet of workbook.SheetNames) {
    // Normalize the workbook sheet name similarly
    const normalizedSheet = sheet.trim().replace(/\s+/g, ' ').toLowerCase();
    if (normalizedInput === normalizedSheet) {
      return workbook.Sheets[sheet];
    }
  }
  
  logWarning(`Sheet '${sheetName}' not found after normalization.`);
  return null;
};

// Extract value from Excel cell
const extractExcelValue = (workbook, sheetName, colLetter, row) => {
  try {
    const rowNum = parseInt(row, 10);
    if (rowNum < 1) {
      throw new Error("Row must be >= 1");
    }
    
    const sheet = findSheet(workbook, sheetName);
    if (!sheet) {
      return null;
    }
    
    const cellRef = `${colLetter}${rowNum}`;
    const cell = sheet[cellRef];
    return cell ? String(cell.v) : "";
  } catch (e) {
    logWarning(`Error accessing cell ${sheetName}:${colLetter}${row} - ${e.message}`);
    return null;
  }
};

// Extract image from Excel (simplified for JavaScript implementation)
// Note: This is a placeholder, as extracting images from Excel in JavaScript
// would require a different implementation strategy than Python
const extractExcelImage = async (workbook, sheetName) => {
  logWarning("Excel image extraction is not fully implemented in JavaScript version");
  // In a real implementation, you would extract images from the Excel file
  // However, this is more complex in JS and would require additional libraries
  return null;
};

// Replace placeholders in text
const replacePlaceholdersInText = (text, workbook) => {
  const pattern = /\{([^}]+)\}/g;
  const matches = Array.from(text.matchAll(pattern));
  
  if (!matches.length) {
    return { newText: text, imageReplacement: null };
  }
  
  let newText = "";
  let lastEnd = 0;
  let imageReplacement = null;
  
  for (const match of matches) {
    const content = match[1].trim();
    const parts = content.split(/\s*:\s*/);
    
    if (parts.length === 2) {
      const sheetName = parts[0].trim().replace(/\s+/g, ' ');
      const identifier = parts[1].trim().replace(/\s+/g, '');
      
      let value;
      if (identifier.toUpperCase() === "IMG") {
        // Handle image placeholder (simplified implementation)
        imageReplacement = { sheetName, placeholder: match[0] };
        value = "";
      } else {
        // Handle cell reference
        const cellMatch = identifier.match(/([A-Za-z]+)(\d+)/i);
        if (cellMatch && cellMatch[0] === identifier) {
          const [, colLetter, row] = cellMatch;
          value = extractExcelValue(workbook, sheetName, colLetter, row);
          if (value === null) {
            value = match[0]; // Keep placeholder if value couldn't be retrieved
          }
        } else {
          logWarning(`Invalid cell ID '${identifier}' in placeholder '${match[0]}'`);
          value = match[0];
        }
      }
    } else {
      logWarning(`Invalid placeholder '${match[0]}'`);
      value = match[0];
    }
    
    newText += text.substring(lastEnd, match.index) + value;
    lastEnd = match.index + match[0].length;
  }
  
  newText += text.substring(lastEnd);
  return { newText, imageReplacement };
};

// Detect placeholders in text
const detectPlaceholders = (text) => {
  const pattern = /\{([^}]+)\}/g;
  const matches = Array.from(text.matchAll(pattern));
  return matches.map(match => ({
    placeholder: match[0],
    content: match[1].trim()
  }));
};

// Process presentation file to extract and analyze placeholders
const analyzePresentationPlaceholders = async (file) => {
  try {
    const placeholders = new Set();
    
    // In a real implementation, this would parse the PPTX file
    // and extract all placeholders from text boxes and tables
    
    logInfo("Analyzing presentation for placeholders");
    // Placeholder implementation - in real code you would:
    // 1. Use JSZip to extract XML content from PPTX
    // 2. Parse XML to identify text elements
    // 3. Search for placeholder patterns and extract them
    
    return Array.from(placeholders);
  } catch (error) {
    logWarning(`Error analyzing presentation: ${error.message}`);
    return [];
  }
};

// Process presentation with data from Excel
const processPresentation = async (pptxFile, excelFile) => {
  try {
    logInfo(`Loading Excel file: ${excelFile.name}`);
    const workbookData = await excelFile.arrayBuffer();
    const workbook = XLSX.read(workbookData, { type: 'array' });
    
    logInfo(`Loaded Excel. Sheets: ${workbook.SheetNames.join(', ')}`);
    
    logInfo(`Loading PowerPoint file: ${pptxFile.name}`);
    // In a real implementation, you would:
    // 1. Use JSZip to read and modify the PPTX
    // 2. Replace placeholders in the XML content
    // 3. Re-package the modified content
    
    // This is a simplified placeholder implementation
    const output = await processPPTX(pptxFile, workbook);
    
    return {
      success: true,
      message: "Presentation processed successfully",
      output
    };
  } catch (error) {
    logWarning(`Error processing presentation: ${error.message}`);
    return {
      success: false,
      message: `Failed to process presentation: ${error.message}`,
      output: null
    };
  }
};

// Placeholder for PPTX processing implementation
const processPPTX = async (pptxFile, workbook) => {
  // In a real implementation, this would:
  // 1. Extract the PPTX content
  // 2. Process each slide
  // 3. Replace placeholders with Excel data
  // 4. Handle image replacements
  // 5. Package the modified content
  
  // This is just a placeholder for demonstration
  return new Blob([await pptxFile.arrayBuffer()], { type: pptxFile.type });
};

// Export the functions for use in components
export {
  processPresentation,
  analyzePresentationPlaceholders,
  detectPlaceholders,
  logInfo,
  logWarning
}; 