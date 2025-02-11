"use client"

import { useEffect } from "react"

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
  useEffect(() => {
    // Check if pyodide is already preloaded
    if (typeof window !== "undefined" && window.__PYODIDE_PRELOADED__) {
      console.log("[Pyodide] Already preloaded. Skipping...")
      return
    }

    // Mark as preloaded to prevent subsequent loads
    if (typeof window !== "undefined") {
      window.__PYODIDE_PRELOADED__ = true
    }

    // If on iOS, introduce a small delay before spinning up the worker
    const delay = isIOS() ? 3000 : 0
    const timeoutId = setTimeout(() => {
      console.log("[Pyodide] Starting worker... (delay = " + delay + "ms)")
      const worker = new Worker(
        new URL("../lib/workers/pyodide.worker.ts", import.meta.url),
        { type: "module" }
      )

      worker.postMessage({ dummy: true })
      worker.onmessage = (event) => {
        if (event.data && event.data.preload) {
          console.log("[Pyodide] Preloaded successfully on iOS or other device.")
          worker.terminate()
        }
      }
      worker.onerror = (err) => {
        console.error("[Pyodide] Error preloading:", err)
        worker.terminate()
      }
    }, delay)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  return null
}