/**
 * Export utilities for Qwen Lens Studio
 * Supports Markdown, JSON, PDF, CSV exports
 */

import type { HistoryEntry } from './types';

const TOOL_NAMES: Record<string, string> = {
  reasoning: 'Visual Reasoning',
  multilingual: 'Multilingual',
  document: 'Document IQ',
  code: 'Code Lens',
  dual: 'Dual Compare',
};

export function downloadBlob(
  data: BlobPart,
  filename: string,
  mimeType: string = 'application/octet-stream'
): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadBlob(json, filename, 'application/json');
}

export function toMarkdown(entry: HistoryEntry): string {
  const date = new Date(entry.createdAt).toLocaleString();

  let md = `# ${entry.title}\n\n`;
  md += `**Tool:** ${TOOL_NAMES[entry.tool] || entry.tool}\n`;
  md += `**Date:** ${date}\n\n`;

  const inputs = entry.inputs ?? { thumbs: [] };
  const params: Record<string, unknown> = {};
  if (inputs.question !== undefined) params.question = inputs.question;
  if (inputs.language !== undefined) params.language = inputs.language;
  if (inputs.framework !== undefined) params.framework = inputs.framework;
  if (inputs.showThinking !== undefined) params.showThinking = inputs.showThinking;

  if (Object.keys(params).length > 0) {
    md += `## Parameters\n\n`;
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        md += `- **${key}:** ${value}\n`;
      }
    }
    md += '\n';
  }

  md += `## Output\n\n`;
  const answer = entry.output?.answer ?? '';

  if (entry.tool === 'code') {
    md += '```\n' + answer + '\n```\n\n';
  } else if (entry.tool === 'document') {
    try {
      const parsed = JSON.parse(answer);
      md += '```json\n' + JSON.stringify(parsed, null, 2) + '\n```\n\n';
    } catch {
      md += answer + '\n\n';
    }
  } else {
    md += answer + '\n\n';
  }

  const thinking = entry.output?.thinking;
  if (thinking) {
    md += `## Thinking Process\n\n`;
    md += '> ' + thinking.split('\n').join('\n> ') + '\n\n';
  }

  return md;
}

export async function toPdf(element: HTMLElement, filename: string = 'export.pdf'): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;
  const opt = {
    margin: 10,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };
  await html2pdf().set(opt).from(element).save();
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function escapeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\n');
}

export function downloadCsv(rows: string[][], filename: string): void {
  const csv = toCsv(rows);
  downloadBlob(csv, filename, 'text/csv');
}
