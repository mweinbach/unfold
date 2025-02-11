"use client"

import { Button } from "@/components/ui/button"
import { Github, HelpCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function Footer() {
  return (
    <footer className="border-t bg-muted/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <p className="text-sm text-muted-foreground">
              © 2025 Unfold. All rights reserved.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  About
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>About Unfold</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[calc(80vh-8rem)] pr-4">
                  <div className="space-y-6 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2">How does Unfold work?</h3>
                    <p className="text-muted-foreground">
                      Unfold uses Pyodide, a Python runtime that runs entirely in your browser. This means all document processing happens locally on your device - no data is ever sent to a server.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">What types of files can I process?</h3>
                    <p className="text-muted-foreground">
                      Unfold supports all major document formats. You can upload individual files or entire folders to analyze their contents.
                    </p>
                    <div className="mt-2">
                      <h4 className="font-medium mb-1">Currently Supported:</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Text Documents (.txt)</li>
                        <li>Markdown Files (.md)</li>
                        <li>PDF Documents (.pdf)</li>
                      </ul>
                      <h4 className="font-medium mb-1 mt-3">Coming Soon:</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Microsoft Office (.docx, .xlsx, .pptx)</li>
                        <li>OpenDocument Formats (.odt, .ods, .odp)</li>
                        <li>Rich Text Format (.rtf)</li>
                        <li>HTML Documents (.html, .htm)</li>
                        <li>XML Files (.xml)</li>
                        <li>CSV and Excel (.csv, .xls)</li>
                        <li>eBook Formats (.epub, .mobi)</li>
                        <li>Source Code Files (.py, .js, .java, etc.)</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">How do I use it?</h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Upload your documents using either the folder or file upload buttons</li>
                      <li>Select the documents you want to analyze by checking the boxes</li>
                      <li>Enter your instructions in the text area</li>
                      <li>View the processed output in the Final Output section</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Is my data secure?</h3>
                    <p className="text-muted-foreground">
                      Yes! Since all processing happens in your browser using Pyodide, your documents never leave your device. This makes Unfold perfect for processing sensitive or confidential information.
                    </p>
                  </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/mweinbach/unfold" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}