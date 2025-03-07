"use client"

import { useState } from 'react'
import { Button } from "./ui/button"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "./ui/alert-dialog"
import { Loader2, Check, RefreshCw, AlertTriangle } from "lucide-react"
import { Badge } from "./ui/badge"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"

interface PyodideStatusProps {
  ready: boolean
  isProcessing: boolean
  onClearCache: () => void
}

export function PyodideStatus({ ready, isProcessing, onClearCache }: PyodideStatusProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  
  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={ready ? "default" : "outline"} 
              className={ready ? "bg-green-600" : "border-yellow-400 text-yellow-600"}
            >
              {ready ? (
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Pyodide Ready</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {isProcessing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  <span>Pyodide {isProcessing ? "Loading" : "Not Ready"}</span>
                </div>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {ready 
              ? "Pyodide is loaded and cached. File processing should be fast."
              : isProcessing 
                ? "Pyodide is initializing. Please wait..."
                : "Pyodide hasn't loaded yet. File processing may be slower."
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 px-2 h-6" 
            disabled={isProcessing}
          >
            <RefreshCw className="w-3 h-3" />
            <span className="text-xs">Clear Cache</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Pyodide Cache?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the cached Pyodide instance and all installed packages. 
              Use this if you're experiencing issues with file processing.
              Pyodide will need to be redownloaded the next time you process a file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onClearCache();
              setClearDialogOpen(false);
            }}>
              Clear Cache
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 