import { extractPDFText, extractDocumentText } from './pyodide';
import type { FileItem, FolderItem } from '../types';

export async function readFileContent(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const content = await extractPDFText(arrayBuffer);
      return content;
    } catch (error: any) {
      console.error('Error extracting PDF content:', error);
      return `Error: Could not extract content from PDF "${file.name}". ${error.message || error}`;
    }
  } else if (extension === 'xlsx' || extension === 'docx' || extension === 'pptx' || extension === 'pages') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const content = await extractDocumentText(extension, arrayBuffer);
      return content;
    } catch (error: any) {
      console.error(`Error extracting content from ${extension}:`, error);
      return `Error: Could not extract content from ${extension} file "${file.name}". ${error.message || error}`;
    }
  }
  // For .txt, .md, or any other textual files, read as text:
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function getAllSelectedFiles(items: (FileItem | FolderItem)[]): FileItem[] {
  const selectedFiles: FileItem[] = [];
  
  function traverse(items: (FileItem | FolderItem)[]) {
    for (const item of items) {
      if (item.type === 'file' && item.selected) {
        selectedFiles.push(item);
      } else if (item.type === 'folder') {
        traverse(item.children);
      }
    }
  }
  
  traverse(items);
  return selectedFiles;
}

export async function organizeFiles(files: File[]): Promise<(FileItem | FolderItem)[]> {
  const items = new Map<string, FolderItem>();
  const result: (FileItem | FolderItem)[] = [];

  for (const file of files) {
    const content = await readFileContent(file);
    const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];
    
    if (pathParts.length === 1) {
      // Single file
      result.push({
        id: crypto.randomUUID(),
        name: file.name,
        content,
        selected: false,
        type: 'file',
        path: file.name
      });
      continue;
    }

    // Handle nested folders
    let currentPath = '';
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderName = pathParts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      if (!items.has(currentPath)) {
        const folder: FolderItem = {
          id: crypto.randomUUID(),
          name: folderName,
          selected: false,
          type: 'folder',
          children: [],
          path: currentPath
        };
        items.set(currentPath, folder);

        if (parentPath) {
          const parentFolder = items.get(parentPath);
          if (parentFolder) {
            parentFolder.children.push(folder);
          }
        } else {
          result.push(folder);
        }
      }
    }

    // Add file to its parent folder
    const fileName = pathParts[pathParts.length - 1];
    const parentPath = pathParts.slice(0, -1).join('/');
    const parentFolder = items.get(parentPath);
    
    if (parentFolder) {
      parentFolder.children.push({
        id: crypto.randomUUID(),
        name: fileName,
        content,
        selected: false,
        type: 'file',
        path: file.webkitRelativePath
      });
    }
  }

  return result;
}