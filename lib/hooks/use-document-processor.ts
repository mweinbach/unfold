"use client"

import { useState, useCallback } from 'react';
import { ProcessedFile, DocumentContext, FinalOutput } from '../types';

export function useDocumentProcessor() {
  const [documentContext, setDocumentContext] = useState<DocumentContext>({
    sorted: {},
    unsorted: []
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFile = useCallback((file: ProcessedFile, isSorted: boolean) => {
    setDocumentContext(prev => {
      if (isSorted) {
        const newSorted = { ...prev.sorted };
        newSorted[file.path] = { ...file, selected: !file.selected };
        return { ...prev, sorted: newSorted };
      } else {
        const newUnsorted = prev.unsorted.map(f => 
          f.name === file.name ? { ...f, selected: !f.selected } : f
        );
        return { ...prev, unsorted: newUnsorted };
      }
    });
  }, []);

  const processFiles = useCallback(async (files: File[], sorted: boolean = false) => {
    setIsProcessing(true);
    setError(null);
    try {
      const worker = new Worker(new URL('../workers/pyodide.worker.ts', import.meta.url));
      const processedFiles: ProcessedFile[] = [];
      for (const file of files) {
        if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
          continue;
        }
        const content = await file.text();
        const processedFile: ProcessedFile = {
          name: file.name,
          path: sorted ? file.webkitRelativePath || file.name : file.name,
          content,
          selected: false
        };
        processedFiles.push(processedFile);
      }
      setDocumentContext(prev => {
        if (sorted) {
          const newSorted = { ...prev.sorted };
          processedFiles.forEach(file => {
            newSorted[file.path] = file;
          });
          return { ...prev, sorted: newSorted };
        } else {
          return { ...prev, unsorted: [...prev.unsorted, ...processedFiles] };
        }
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const generateOutput = useCallback((instructions: string): FinalOutput => {
    // Generate document context XML
    const contextXml = [
      '<document_context>',
      Object.entries(documentContext.sorted)
        .filter(([_, file]) => file.selected)
        .map(([path, file]) => 
        `  <file path="${path}">\n    <content>${file.content}</content>\n  </file>`
      ).join('\n'),
      documentContext.unsorted.some(f => f.selected) ? '  <unsorted_files>' : '',
      documentContext.unsorted
        .filter(file => file.selected)
        .map(file =>
        `    <filename name="${file.name}">\n      <context>${file.content}</context>\n    </filename>`
      ).join('\n'),
      documentContext.unsorted.some(f => f.selected) ? '  </unsorted_files>' : '',
      '</document_context>'
    ].filter(Boolean).join('\n');

    // Generate user instructions XML
    const instructionsXml = `<user_instructions>\n  ${instructions}\n</user_instructions>`;

    return {
      documentContext: contextXml,
      userInstructions: instructionsXml
    };
  }, [documentContext]);

  return {
    documentContext,
    isProcessing,
    error,
    toggleFile,
    processFiles,
    generateOutput
  };
}