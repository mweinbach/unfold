"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProcessedFile } from "@/lib/types"

interface DocumentViewerProps {
  file: ProcessedFile | null
  isOpen: boolean
  onClose: () => void
}

export function DocumentViewer({ file, isOpen, onClose }: DocumentViewerProps) {
  if (!file) return null

  const isPDF = file.name.toLowerCase().endsWith('.pdf')
  const isText = file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[70vh]">
        <DialogHeader>
          <DialogTitle className="truncate text-base" title={file.path || file.name}>
            {file.path || file.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {isPDF ? (
            <iframe 
              src={URL.createObjectURL(new Blob([file.content], { type: 'application/pdf' }))}
              className="w-full h-[calc(70vh-8rem)] rounded-xl border"
            />
          ) : isText ? (
            <ScrollArea className="h-[calc(70vh-8rem)] w-full rounded-xl border">
              <pre className="whitespace-pre-wrap text-sm p-4">
                {file.content}
              </pre>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-[calc(70vh-8rem)] text-muted-foreground">
              Unsupported file type
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}