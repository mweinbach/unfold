"use client"

import { useCallback, useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { DocumentUploader } from "@/components/document-uploader"
import { DocumentProcessor } from "@/components/document-processor"
import { useDocumentProcessor } from "@/lib/hooks/use-document-processor"
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PyodidePreloader } from "@/components/pyodide-preloader"

export default function Home() {
  const [instructions, setInstructions] = useState("")
  const { 
    documentContext, 
    isProcessing, 
    error, 
    pyodideReady,
    processFiles, 
    generateOutput, 
    toggleFile,
    clearPyodideCache
  } = useDocumentProcessor()

  const handleFolderUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(Array.from(e.target.files), true);
    }
  }, [processFiles]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(Array.from(e.target.files), false);
    }
  }, [processFiles]);

  const output = generateOutput(instructions);
  const hasSelectedFiles = Object.values(documentContext.sorted).some(f => f.selected) ||
    documentContext.unsorted.some(f => f.selected);
  const contextDisplay = !hasSelectedFiles ? "No documents selected" : output.documentContext;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* This component preloads Pyodide in the background */}
      <PyodidePreloader />

      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 auto-rows-min">
          <DocumentUploader
            onFolderUpload={handleFolderUpload}
            onFileUpload={handleFileUpload}
            documentContext={documentContext}
            onToggleFile={toggleFile}
            error={error}
          />

          <DocumentProcessor
            isProcessing={isProcessing}
            documentContext={contextDisplay}
            output={output}
            instructions={instructions}
            onInstructionsChange={(value) => setInstructions(value)}
            pyodideReady={pyodideReady}
            onClearCache={clearPyodideCache}
          />
        </div>
      </main>

      <Footer />
      <Analytics />
      <SpeedInsights />
    </div>
  );
}