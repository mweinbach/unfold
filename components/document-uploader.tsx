"use client"

import { Button } from "@/components/ui/button"
import { FolderUp, Upload } from "lucide-react"
import { DocumentList } from "./document-list"
import { DocumentContext } from "@/lib/types"

interface DocumentUploaderProps {
  onFolderUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  documentContext: DocumentContext;
  onToggleFile: (file: ProcessedFile, isSorted: boolean) => void;
  error?: string | null;
}

export function DocumentUploader({
  onFolderUpload,
  onFileUpload,
  documentContext,
  onToggleFile,
  error
}: DocumentUploaderProps) {
  return (
    <div className="flex flex-col gap-4 p-6 bg-card rounded-xl shadow-md border transition-shadow duration-200 hover:shadow-lg">
      <h2 className="text-xl font-semibold">Your Documents</h2>
      
      <div className="grid gap-4">
        <div className="relative">
          <input
            type="file"
            webkitdirectory=""
            directory=""
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={onFolderUpload}
            multiple
          />
          <Button variant="outline" className="h-24 md:h-32 border-dashed w-full rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <FolderUp className="mr-2 h-5 w-5" />
            Upload Folder
          </Button>
        </div>
        
        <div className="relative">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={onFileUpload}
            multiple
            accept=".txt,.md,.pdf,.docx,.xlsx,.pptx,.odt,.ods,.odp,.rtf,.html,.htm,.xml,.csv,.xls,.epub,.mobi,.py,.js,.java"
          />
          <Button variant="outline" className="h-24 md:h-32 border-dashed w-full rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <Upload className="mr-2 h-5 w-5" />
            Upload Documents
          </Button>
        </div>
      </div>
      
      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
      
      <DocumentList
        sortedFiles={documentContext.sorted}
        unsortedFiles={documentContext.unsorted}
        onToggleFile={onToggleFile}
      />
    </div>
  );
}