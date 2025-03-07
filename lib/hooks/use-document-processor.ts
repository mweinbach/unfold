"use client"

import { useState, useCallback, useRef, useEffect } from 'react';
import { ProcessedFile, DocumentContext, FinalOutput } from '../types';

export function useDocumentProcessor() {
  const [documentContext, setDocumentContext] = useState<DocumentContext>({
    sorted: {},
    unsorted: []
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep track of whether Pyodide is ready
  const [pyodideReady, setPyodideReady] = useState(false);
  // Track if we're in fallback mode (limited functionality)
  const [fallbackMode, setFallbackMode] = useState(false);
  // Reference to the shared worker to reuse
  const workerRef = useRef<Worker | null>(null);
  // Track initialization attempts
  const initAttempts = useRef(0);
  const maxInitAttempts = 2;

  // Initialize the worker once on mount
  useEffect(() => {
    // Only create the worker if it doesn't exist yet and we haven't exceeded max attempts
    if (!workerRef.current && typeof window !== 'undefined' && initAttempts.current <= maxInitAttempts) {
      initAttempts.current += 1;
      
      try {
        console.log(`[Document Processor] Initializing Pyodide worker (attempt ${initAttempts.current}/${maxInitAttempts + 1})...`);
        
        const worker = new Worker(
          new URL('../workers/pyodide.worker.ts', import.meta.url),
          { type: 'module' }
        );

        // Set a timeout to detect stalled initialization
        const timeoutId = setTimeout(() => {
          console.warn("[Document Processor] Pyodide worker initialization timed out");
          if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
          }
          
          if (initAttempts.current <= maxInitAttempts) {
            // Will trigger a re-run of this effect
            initAttempts.current += 1;
          } else {
            console.error("[Document Processor] Max initialization attempts reached. Falling back to limited functionality.");
            setFallbackMode(true);
            setError("Pyodide initialization timed out. Some document processing features may be unavailable.");
          }
        }, 30000); // 30 second timeout

        worker.onmessage = (event) => {
          clearTimeout(timeoutId);
          
          if (event.data.success && event.data.preload) {
            console.log("[Document Processor] Pyodide worker is ready");
            setPyodideReady(true);
          } else if (!event.data.success) {
            console.error("[Document Processor] Pyodide worker initialization failed:", event.data.error);
            setError(event.data.error || "Failed to initialize document processor");
            
            // If it's a critical error, enter fallback mode
            if (event.data.error && event.data.error.includes("micropip")) {
              console.warn("[Document Processor] Critical package missing. Entering fallback mode.");
              setFallbackMode(true);
            }
          }
        };

        worker.onerror = (err) => {
          clearTimeout(timeoutId);
          console.error("[Document Processor] Pyodide worker error:", err);
          setError("Worker error: " + (err.message || "Unknown error"));
          
          if (initAttempts.current <= maxInitAttempts) {
            // Will trigger a re-run of this effect
            initAttempts.current += 1;
          } else {
            console.error("[Document Processor] Max initialization attempts reached after error. Falling back to limited functionality.");
            setFallbackMode(true);
          }
        };

        // Send a preload message to prepare Pyodide
        worker.postMessage({ dummy: true });
        
        // Store the worker reference
        workerRef.current = worker;
      } catch (err) {
        console.error("[Document Processor] Failed to initialize Pyodide worker:", err);
        setError("Failed to initialize document processor. Please try refreshing the page.");
        
        if (initAttempts.current <= maxInitAttempts) {
          // Will trigger a re-run of this effect
          initAttempts.current += 1;
        } else {
          console.error("[Document Processor] Max initialization attempts reached after error. Falling back to limited functionality.");
          setFallbackMode(true);
        }
      }
    }

    // Cleanup function to terminate the worker
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [initAttempts.current]);

  // Add a recovery mechanism for unexpected worker termination
  useEffect(() => {
    // Skip if we're in fallback mode or if the worker is already initialized
    if (fallbackMode || !pyodideReady) return;
    
    const checkWorkerInterval = setInterval(() => {
      // Check if the worker is still alive by sending a ping
      if (workerRef.current) {
        try {
          // Set up a timeout to detect if the worker doesn't respond
          const timeoutId = setTimeout(() => {
            console.warn("[Document Processor] Worker not responding to ping, may be terminated");
            
            // Reset the worker reference so it can be recreated
            workerRef.current = null;
            setPyodideReady(false);
            
            // Attempt to reinitialize if we haven't exceeded max attempts
            if (initAttempts.current <= maxInitAttempts) {
              console.log("[Document Processor] Attempting to recover from worker termination");
              initAttempts.current += 1;
            } else {
              console.error("[Document Processor] Max recovery attempts reached. Falling back to limited functionality.");
              setFallbackMode(true);
              setError("Document processor stopped responding. Some features may be unavailable.");
              clearInterval(checkWorkerInterval);
            }
          }, 5000); // 5 second timeout for response
          
          // Create a one-time event listener for the ping response
          const pingHandler = (event: MessageEvent) => {
            if (event.data && event.data.ping === true) {
              // Worker is alive
              clearTimeout(timeoutId);
              // Remove this one-time listener
              workerRef.current?.removeEventListener('message', pingHandler);
            }
          };
          
          // Add the event listener
          workerRef.current.addEventListener('message', pingHandler);
          
          // Send the ping
          workerRef.current.postMessage({ ping: true });
        } catch (error) {
          console.error("[Document Processor] Error checking worker status:", error);
          
          // Worker is likely terminated
          workerRef.current = null;
          setPyodideReady(false);
          
          // Attempt to reinitialize
          if (initAttempts.current <= maxInitAttempts) {
            console.log("[Document Processor] Attempting to recover from worker error");
            initAttempts.current += 1;
          } else {
            console.error("[Document Processor] Max recovery attempts reached. Falling back to limited functionality.");
            setFallbackMode(true);
            setError("Document processor encountered an error. Some features may be unavailable.");
            clearInterval(checkWorkerInterval);
          }
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(checkWorkerInterval);
    };
  }, [fallbackMode, pyodideReady, initAttempts.current]);

  // Function to clear the cache if needed (for debugging or troubleshooting)
  const clearPyodideCache = useCallback(() => {
    if (workerRef.current) {
      setIsProcessing(true);
      workerRef.current.onmessage = (event) => {
        if (event.data.success && event.data.cacheCleared) {
          console.log("[Document Processor] Cache cleared successfully");
          // Re-initialize Pyodide
          workerRef.current?.postMessage({ dummy: true });
          setPyodideReady(false);
        }
      };
      workerRef.current.postMessage({ invalidateCache: true });
    }
  }, []);

  // Function to install additional Python packages
  const installPackages = useCallback((packages: string[]) => {
    return new Promise<{installed: string[], failed: string[]}>((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error("Worker is not initialized"));
        return;
      }

      const oldHandler = workerRef.current.onmessage;
      
      workerRef.current.onmessage = (event) => {
        if (event.data.success && event.data.packagesInstalled !== undefined) {
          console.log(`[Document Processor] Installed ${event.data.packagesInstalled} packages`);
          
          // Log any failed packages
          if (event.data.failedPackages && event.data.failedPackages.length > 0) {
            console.warn(`[Document Processor] Failed to install ${event.data.failedPackages.length} packages: ${event.data.failedPackages.join(', ')}`);
          }
          
          // Restore the original handler
          if (workerRef.current) {
            workerRef.current.onmessage = oldHandler;
          }
          
          resolve({
            installed: event.data.packages || [],
            failed: event.data.failedPackages || []
          });
        } else if (!event.data.success) {
          if (workerRef.current) {
            workerRef.current.onmessage = oldHandler;
          }
          reject(new Error(event.data.error || "Failed to install packages"));
        }
      };

      workerRef.current.postMessage({ 
        installPackages: true, 
        packages 
      });
    });
  }, []);

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

  // Process files with fallback for text files if Pyodide is not available
  const processFiles = useCallback(async (files: File[], sorted: boolean = false) => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // If we're in fallback mode, use a simpler text-only processing approach
      if (fallbackMode) {
        console.log("[Document Processor] Using fallback processing mode for files");
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          try {
            // Only process text files in fallback mode
            const isTextFile = file.type.startsWith('text/') || 
                              ['.txt', '.md', '.js', '.ts', '.html', '.css', '.json', '.csv']
                                .some(ext => file.name.toLowerCase().endsWith(ext));
            
            if (isTextFile) {
              const content = await file.text();
              
              const processedFile = {
                name: file.name,
                path: file.name,
                content: content,
                selected: false,
              };
              
              if (sorted) {
                setDocumentContext(prev => ({
                  ...prev,
                  sorted: {
                    ...prev.sorted,
                    [file.name]: processedFile
                  }
                }));
              } else {
                setDocumentContext(prev => ({
                  ...prev,
                  unsorted: [...prev.unsorted, processedFile]
                }));
              }
            } else {
              console.warn(`[Document Processor] Skipping non-text file in fallback mode: ${file.name}`);
            }
          } catch (fileError) {
            console.error(`[Document Processor] Error processing file ${file.name}:`, fileError);
          }
        }
        
        setIsProcessing(false);
        return;
      }
      
      // Regular processing with Pyodide worker
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`[Document Processor] Processing file ${i + 1}/${files.length}: ${file.name}`);
        
        await new Promise<void>((resolve, reject) => {
          const messageHandler = (event: MessageEvent) => {
            if (event.data.success) {
              // Worker finished successfully
              const processedFile: ProcessedFile = {
                name: file.name,
                path: file.name,
                content: event.data.file.content || "",
                selected: false,
                status: "processed",
              };
              
              // Update context
              setDocumentContext(prev => {
                if (sorted) {
                  const newSorted = { ...prev.sorted };
                  newSorted[processedFile.path] = processedFile;
                  return { ...prev, sorted: newSorted };
                } else {
                  const newUnsorted = prev.unsorted.map(f =>
                    f.path === processedFile.path ? processedFile : f
                  );
                  return { ...prev, unsorted: newUnsorted };
                }
              });
              resolve();
            } else {
              // Worker returned an error
              const processedFile: ProcessedFile = {
                name: file.name,
                path: file.name,
                content: "",
                selected: false,
                status: "error",
              };
              
              // Update context
              setDocumentContext(prev => {
                if (sorted) {
                  const newSorted = { ...prev.sorted };
                  newSorted[processedFile.path] = processedFile;
                  return { ...prev, sorted: newSorted };
                } else {
                  const newUnsorted = prev.unsorted.map(f =>
                    f.path === processedFile.path ? processedFile : f
                  );
                  return { ...prev, unsorted: newUnsorted };
                }
              });
              reject(event.data.error);
            }
            
            // Remove this event handler after processing
            if (workerRef.current) {
              workerRef.current.onmessage = null;
            }
          };

          // Set the message handler
          if (workerRef.current) {
            workerRef.current.onmessage = messageHandler;
            // Kick off processing for this file
            workerRef.current.postMessage({ file });
          } else {
            reject(new Error("Worker was terminated unexpectedly"));
          }
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [fallbackMode]);

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
    pyodideReady,
    fallbackMode,
    toggleFile,
    processFiles,
    generateOutput,
    clearPyodideCache,
    installPackages
  };
}