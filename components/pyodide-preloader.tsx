"use client"

import { useEffect, useState } from "react"

declare global {
  interface Window {
    __PYODIDE_PRELOADED__?: boolean
  }
}

function isIOS() {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function PyodidePreloader() {
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error" | "fallback">("idle")
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 2

  useEffect(() => {
    // Check if pyodide is already preloaded
    if (typeof window !== "undefined" && window.__PYODIDE_PRELOADED__) {
      console.log("[Pyodide] Already preloaded. Skipping...")
      setStatus("loaded")
      return
    }

    // Skip on iOS devices due to memory constraints
    if (isIOS()) {
      console.log("[Pyodide] iOS detected. Skipping preload...")
      return
    }

    const preloadPyodide = async () => {
      try {
        setStatus("loading")
        // Create a web worker
        const worker = new Worker(new URL("../lib/workers/pyodide.worker.ts", import.meta.url))

        // Set a timeout to detect stalled loading
        const timeoutId = setTimeout(() => {
          console.warn("[Pyodide] Loading timeout reached. Worker might be stalled.")
          worker.terminate()
          
          if (retryCount < maxRetries) {
            console.log(`[Pyodide] Retrying preload (${retryCount + 1}/${maxRetries})...`)
            setRetryCount(prev => prev + 1)
          } else {
            console.error("[Pyodide] Max retries reached. Falling back to limited functionality.")
            setError("Pyodide initialization timed out. The application will run with limited functionality.")
            setStatus("fallback")
            // Mark as preloaded but with limited functionality
            window.__PYODIDE_PRELOADED__ = false
          }
        }, 60000) // 60 second timeout

        // Handle messages from the worker
        worker.onmessage = (e) => {
          clearTimeout(timeoutId)
          
          if (e.data && e.data.success && e.data.preload) {
            console.log("[Pyodide] Preload successful")
            
            // Check if there were any failed package installations
            if (e.data.failedPackages && e.data.failedPackages.length > 0) {
              const failedPackagesStr = e.data.failedPackages.join(', ');
              console.warn(`[Pyodide] Some packages failed to install: ${failedPackagesStr}`);
              setError(`Some packages failed to install: ${failedPackagesStr}. The application may have limited functionality.`);
            }
            
            // Mark as preloaded
            window.__PYODIDE_PRELOADED__ = true
            setStatus("loaded")
          } else if (e.data && !e.data.success) {
            console.error("[Pyodide] Preload error:", e.data.error)
            setError(e.data.error || "Unknown error during Pyodide preload")
            
            // If we have retries left and it's a micropip error, retry
            if (retryCount < maxRetries && e.data.error && e.data.error.includes("micropip")) {
              console.log(`[Pyodide] Retrying preload after micropip error (${retryCount + 1}/${maxRetries})...`)
              setRetryCount(prev => prev + 1)
            } else {
              console.error("[Pyodide] Max retries reached or non-micropip error. Falling back to limited functionality.")
              setStatus("fallback")
              // Mark as not preloaded
              window.__PYODIDE_PRELOADED__ = false
            }
          }
        }

        // Add error handler for worker
        worker.onerror = (err) => {
          clearTimeout(timeoutId)
          console.error("[Pyodide] Worker error:", err)
          setError(`Worker error: ${err.message || "Unknown worker error"}`)
          
          if (retryCount < maxRetries) {
            console.log(`[Pyodide] Retrying preload after worker error (${retryCount + 1}/${maxRetries})...`)
            setRetryCount(prev => prev + 1)
          } else {
            console.error("[Pyodide] Max retries reached. Falling back to limited functionality.")
            setStatus("fallback")
            // Mark as not preloaded
            window.__PYODIDE_PRELOADED__ = false
          }
        }

        // Send a dummy message to trigger preloading
        worker.postMessage({ dummy: true })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error("[Pyodide] Preload error:", error)
        setError(errorMessage)
        
        if (retryCount < maxRetries) {
          console.log(`[Pyodide] Retrying preload after error (${retryCount + 1}/${maxRetries})...`)
          setRetryCount(prev => prev + 1)
        } else {
          console.error("[Pyodide] Max retries reached. Falling back to limited functionality.")
          setStatus("fallback")
          // Mark as not preloaded
          window.__PYODIDE_PRELOADED__ = false
        }
      }
    }

    // Start preloading after a short delay to avoid blocking initial render
    const timer = setTimeout(() => {
      preloadPyodide()
    }, 2000)

    return () => {
      clearTimeout(timer)
    }
  }, [retryCount]) // Re-run effect when retryCount changes

  // Render error message if there's an error
  if (status === "error" && error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded shadow-sm max-w-md">
        <h4 className="font-medium">Pyodide Initialization Error</h4>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
        >
          Reload Page
        </button>
      </div>
    )
  }
  
  // Render fallback message if we're in fallback mode
  if (status === "fallback") {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded shadow-sm max-w-md">
        <h4 className="font-medium">Limited Functionality Mode</h4>
        <p className="text-sm">
          {error || "Some features requiring Python processing are unavailable."}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded"
        >
          Try Again
        </button>
      </div>
    )
  }

  // No visual UI rendering for other states
  return null
}