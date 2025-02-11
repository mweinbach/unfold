"use client"

import { useEffect } from "react"

export function PyodidePreloader() {
  useEffect(() => {
    const worker = new Worker(new URL("../lib/workers/pyodide.worker.ts", import.meta.url), { type: "module" });
    // Send a dummy message to trigger pyodide and micropip loading
    worker.postMessage({ dummy: true });
    worker.onmessage = (event) => {
      if (event.data && event.data.preload) {
        console.log("Pyodide and micropip preloaded successfully.");
        worker.terminate();
      }
    };
    worker.onerror = (err) => {
      console.error("Pyodide preloading error:", err);
      worker.terminate();
    };
  }, []);

  return null;
}