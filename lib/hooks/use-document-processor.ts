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
        newSorted[file.path] = { ...newSorted[file.path], selected: !file.selected };
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
      // Create placeholder processed files with status=loading
      const partialFiles: ProcessedFile[] = files.map((f) => ({
        name: f.name,
        path: f.name,
        content: "",
        selected: false,
        status: "loading",
      }));

      // Add placeholders to state so the user sees them immediately
      setDocumentContext(prev => {
        if (sorted) {
          const newSorted = { ...prev.sorted };
          partialFiles.forEach(file => {
            newSorted[file.path] = file;
          });
          return { ...prev, sorted: newSorted };
        } else {
          return { ...prev, unsorted: [...prev.unsorted, ...partialFiles] };
        }
      });

      // Spawn a worker per file, updating each placeholder on success/failure
      const promises = partialFiles.map((placeholder, i) => {
        const file = files[i];
        return new Promise<ProcessedFile>((resolve, reject) => {
          const worker = new Worker(
            new URL('../workers/pyodide.worker.ts', import.meta.url),
            { type: 'module' }
          );

          worker.onmessage = (event: MessageEvent) => {
            if (event.data.success) {
              // Worker finished successfully
              placeholder.status = "processed";
              placeholder.content = event.data.file.content || "";
              // Update context
              setDocumentContext(prev => {
                if (sorted) {
                  const newSorted = { ...prev.sorted };
                  newSorted[placeholder.path] = { ...placeholder };
                  return { ...prev, sorted: newSorted };
                } else {
                  const newUnsorted = prev.unsorted.map(f =>
                    f.path === placeholder.path ? { ...placeholder } : f
                  );
                  return { ...prev, unsorted: newUnsorted };
                }
              });
              resolve(placeholder);
            } else {
              // Worker returned an error
              placeholder.status = "error";
              placeholder.content = "";
              setDocumentContext(prev => {
                if (sorted) {
                  const newSorted = { ...prev.sorted };
                  newSorted[placeholder.path] = { ...placeholder };
                  return { ...prev, sorted: newSorted };
                } else {
                  const newUnsorted = prev.unsorted.map(f =>
                    f.path === placeholder.path ? { ...placeholder } : f
                  );
                  return { ...prev, unsorted: newUnsorted };
                }
              });
              reject(event.data.error);
            }
            worker.terminate();
          };

          worker.onerror = (err) => {
            placeholder.status = "error";
            placeholder.content = "";
            setDocumentContext(prev => {
              if (sorted) {
                const newSorted = { ...prev.sorted };
                newSorted[placeholder.path] = { ...placeholder };
                return { ...prev, sorted: newSorted };
              } else {
                const newUnsorted = prev.unsorted.map(f =>
                  f.path === placeholder.path ? { ...placeholder } : f
                );
                return { ...prev, unsorted: newUnsorted };
              }
            });
            worker.terminate();
            reject(err);
          };

          // Kick off the worker
          worker.postMessage({ file });
        });
      });

      await Promise.all(promises);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
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