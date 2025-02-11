"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DocumentViewer } from "@/components/document-viewer"
import { File, Folder } from "lucide-react"
import { ProcessedFile } from "@/lib/types"
import { useState } from "react"

interface DocumentListProps {
  sortedFiles: Record<string, ProcessedFile>;
  unsortedFiles: ProcessedFile[];
  onToggleFile: (file: ProcessedFile, isSorted: boolean) => void;
}

export function DocumentList({ sortedFiles, unsortedFiles, onToggleFile }: DocumentListProps) {
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  const handleViewFile = (file: ProcessedFile) => {
    setSelectedFile(file)
    setIsViewerOpen(true)
  }

  const renderLoadingSpinner = (
    <div
      className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle text-muted-foreground"
      role="status"
      aria-label="Loading"
    />
  );

  return (
    <Card className="p-4 mt-4 shadow-sm rounded-xl transition-shadow duration-200 hover:shadow-md">
      {/* Folder Files */}
      {Object.keys(sortedFiles).length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Folder Documents
          </h3>
          <ScrollArea className="h-[30vh] pr-4">
            <div className="space-y-2">
              {Object.entries(sortedFiles).map(([path, file]) => (
                <div key={path} className="flex items-center gap-3 group">
                  <Checkbox 
                    id={`sorted-${path}`}
                    checked={file.selected}
                    onCheckedChange={() => onToggleFile(file, true)}
                  />
                  <label
                    htmlFor={`sorted-${path}`}
                    className="text-sm flex items-center gap-2 flex-1 cursor-pointer"
                  >
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate flex-1" title={path}>
                      {path}
                    </span>
                  </label>
                  {/* Show a spinner if loading */}
                  {file.status === "loading" && renderLoadingSpinner}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap rounded-lg"
                    onClick={() => handleViewFile(file)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Unsorted Files */}
      {unsortedFiles.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="font-medium flex items-center gap-2">
            <File className="h-4 w-4" />
            Individual Documents
          </h3>
          <ScrollArea className="h-[30vh] pr-4">
            <div className="space-y-2">
              {unsortedFiles.map((file) => (
                <div key={file.name} className="flex items-center gap-3 group">
                  <Checkbox 
                    id={`unsorted-${file.name}`}
                    checked={file.selected}
                    onCheckedChange={() => onToggleFile(file, false)}
                  />
                  <label
                    htmlFor={`unsorted-${file.name}`}
                    className="text-sm flex items-center gap-2 flex-1 cursor-pointer"
                  >
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate flex-1" title={file.name}>
                      {file.name}
                    </span>
                  </label>
                  {/* Show a spinner if loading */}
                  {file.status === "loading" && renderLoadingSpinner}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap rounded-lg"
                    onClick={() => handleViewFile(file)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {Object.keys(sortedFiles).length === 0 && unsortedFiles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No documents uploaded yet
        </div>
      )}
      
      <DocumentViewer
        file={selectedFile}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false)
          setSelectedFile(null)
        }}
      />
    </Card>
  );
}