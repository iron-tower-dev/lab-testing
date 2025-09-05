import { readFileSync } from 'fs';
import { join } from 'path';

export interface ParsedCSVRow {
  [key: string]: string | number | boolean | Date | null;
}

/**
 * Parses a CSV file and returns an array of objects with typed values
 * @param fileName - Name of the CSV file in the docs folder
 * @param columnMap - Optional mapping of CSV column names to object property names
 * @param typeMap - Optional mapping of columns to their expected types
 * @returns Array of parsed objects
 */
export function parseCSV(
  fileName: string,
  columnMap?: Record<string, string>,
  typeMap?: Record<string, 'string' | 'number' | 'boolean' | 'date'>
): ParsedCSVRow[] {
  const filePath = join(process.cwd(), 'docs', fileName);
  const csvContent = readFileSync(filePath, 'utf-8');
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // Parse header row, removing BOM if present
  const headers = parseCSVLine(lines[0].replace(/^\ufeff/, ''));
  const rows: ParsedCSVRow[] = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue; // Skip malformed rows
    
    const row: ParsedCSVRow = {};
    
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const propertyName = columnMap?.[header] || header;
      let value: string | number | boolean | Date | null = values[j];
      
      // Handle NULL values
      if (value === 'NULL' || value === '' || value === null) {
        value = null;
      } else if (typeMap?.[header]) {
        value = convertValue(value as string, typeMap[header]);
      }
      
      row[propertyName] = value;
    }
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * Parses a single CSV line, handling quoted values and commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

/**
 * Converts a string value to the specified type
 */
function convertValue(value: string, type: 'string' | 'number' | 'boolean' | 'date'): string | number | boolean | Date | null {
  switch (type) {
    case 'number':
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    
    case 'boolean':
      if (value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'y') return true;
      if (value === '0' || value.toLowerCase() === 'false' || value.toLowerCase() === 'n') return false;
      return null;
    
    case 'date':
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    
    case 'string':
    default:
      return value;
  }
}

/**
 * Utility function to clean HTML entities in descriptions
 */
export function cleanHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&micro;/g, 'μ')
    .replace(/&quot;/g, '"');
}
