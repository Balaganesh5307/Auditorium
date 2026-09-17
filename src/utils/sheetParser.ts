import type { TeamsMap, TeamData } from '../data/teams';
import * as XLSX from 'xlsx';

// ============================================
// Unified parser: auto-detects file type
// ============================================

export async function parseFile(file: File): Promise<TeamsMap> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'csv') {
    return parseCSV(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file);
  } else if (ext === 'pdf') {
    return parsePDF(file);
  } else if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext)) {
    return parseImage(file);
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

// ============================================
// CSV Parser
// ============================================

async function parseCSV(file: File): Promise<TeamsMap> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  // Skip header row
  const dataLines = lines.length > 1 && isHeaderRow(lines[0]) ? lines.slice(1) : lines;

  return linesToTeams(dataLines.map((line) => parseCSVLine(line)));
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ============================================
// Excel Parser
// ============================================

async function parseExcel(file: File): Promise<TeamsMap> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

  // Skip header
  const dataRows = rows.length > 1 && isHeaderRow(rows[0].join(',')) ? rows.slice(1) : rows;

  return linesToTeams(dataRows.map((row) => row.map(String)));
}

// ============================================
// PDF Parser
// ============================================

async function parsePDF(file: File): Promise<TeamsMap> {
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += text + '\n';
  }

  // Try to parse extracted text as CSV-like rows
  return parseExtractedText(fullText);
}

// ============================================
// Image OCR Parser
// ============================================

async function parseImage(file: File): Promise<TeamsMap> {
  const Tesseract = await import('tesseract.js');
  const { data } = await Tesseract.recognize(file, 'eng', {
    logger: () => {}, // Suppress verbose logging
  });

  return parseExtractedText(data.text);
}

// ============================================
// Shared utilities
// ============================================

function isHeaderRow(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes('table') ||
    lower.includes('team') ||
    lower.includes('position') ||
    lower.includes('member') ||
    lower.includes('name')
  );
}

function parseExtractedText(text: string): TeamsMap {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Try to find lines that look like table data (start with a letter+number like A1, B3, etc.)
  const dataLines: string[][] = [];

  for (const line of lines) {
    if (isHeaderRow(line)) continue;

    // Try splitting by common delimiters: comma, tab, pipe, multiple spaces
    let parts: string[];
    if (line.includes(',')) {
      parts = parseCSVLine(line);
    } else if (line.includes('\t')) {
      parts = line.split('\t').map((s) => s.trim());
    } else if (line.includes('|')) {
      parts = line.split('|').map((s) => s.trim()).filter((s) => s.length > 0);
    } else {
      parts = line.split(/\s{2,}/).map((s) => s.trim());
    }

    // Check if first part looks like a table position (e.g., A1, B3, C5)
    if (parts.length >= 2 && /^[A-Za-z]\d+$/.test(parts[0])) {
      dataLines.push(parts);
    }
  }

  return linesToTeams(dataLines);
}

function linesToTeams(rows: string[][]): TeamsMap {
  const teams: TeamsMap = {};

  for (const cols of rows) {
    if (cols.length < 2) continue;

    const tablePos = cols[0].toUpperCase().trim();
    if (!/^[A-Z]\d+$/.test(tablePos)) continue;

    const teamName = cols[1]?.trim() || `Team ${tablePos}`;

    // Remaining columns are member names
    const memberNames = cols.slice(2).filter((n) => n && n.trim().length > 0);

    const members = memberNames.length > 0
      ? memberNames.map((name, i) => ({
          name: name.trim(),
          role: i === 0 ? 'Team Leader' : 'Member',
        }))
      : [
          { name: 'Member 1', role: 'Team Leader' },
          { name: 'Member 2', role: 'Developer' },
          { name: 'Member 3', role: 'Designer' },
          { name: 'Member 4', role: 'Engineer' },
        ];

    const team: TeamData = {
      table: tablePos,
      teamName,
      position: tablePos,
      members,
      projectDescription: '',
    };

    teams[tablePos] = team;
  }

  if (Object.keys(teams).length === 0) {
    throw new Error('No valid team data found in the file. Expected rows like: A1, Team Name, Member1, Member2, ...');
  }

  return teams;
}

// ============================================
// Template CSV generator
// ============================================

export function generateTemplateCSV(rows: string[], cols: number[]): string {
  const header = 'Table Position,Team Name,Member 1,Member 2,Member 3,Member 4';
  const lines = [header];

  for (const row of rows) {
    for (const col of cols) {
      lines.push(`${row}${col},Team Name,Member 1,Member 2,Member 3,Member 4`);
    }
  }

  return lines.join('\n');
}
