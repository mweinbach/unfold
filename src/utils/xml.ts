import type { FileItem } from '../types';

export function generateXMLContent(files: FileItem[]): string {
  if (files.length === 0) return 'No documents selected';
  
  function formatContent(content: string): string {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map(line => `  ${line}`).join('\n');
  }
  
  const fileContents = files.map(file => {
    const indentedContent = formatContent(file.content);
    return `<file path="${file.path}">\n${indentedContent}\n</file>`;
  }).join('\n\n');

  return `<documents>\n${fileContents}\n</documents>`;
}