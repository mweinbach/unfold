/* pyodide.worker.ts */
/// <reference lib="webworker" />

// Load the Pyodide script from the official CDN
self.importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js");

declare const loadPyodide: any;
declare const self: DedicatedWorkerGlobalScope & { pyodide?: any };

const globalScope = self;

// This function loads Pyodide and micropip if they're not already loaded.
async function loadPyodideAndPackages() {
  if (!globalScope.pyodide) {
    console.log("[Pyodide Worker] Loading Pyodide...");
    // Use indexURL so Pyodide knows where to load its files.
    globalScope.pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/",
    });
    console.log("[Pyodide Worker] Pyodide loaded. Now loading micropip...");

    await globalScope.pyodide.loadPackage("micropip");
    console.log("[Pyodide Worker] micropip loaded. Installing Python packages...");

    // Install the needed Python libraries
    // pdfminer.six requires a pure-Python environment, but should work here
    await globalScope.pyodide.runPythonAsync(`
import micropip
await micropip.install("pdfminer.six")
await micropip.install("python-docx")
`);
    console.log("[Pyodide Worker] Packages installed successfully.");
  }
}

globalScope.onmessage = async (e: MessageEvent<any>) => {
  try {
    // Check for dummy preload message
    if (e.data && e.data.dummy) {
      console.log("[Pyodide Worker] Received dummy preload request.");
      await loadPyodideAndPackages();
      console.log("[Pyodide Worker] Preload complete. Sending response...");
      self.postMessage({ success: true, preload: true });
      return;
    }

    const { file } = e.data;
    if (!file) {
      throw new Error("No file provided to Pyodide worker.");
    }

    // Make sure Pyodide is loaded
    await loadPyodideAndPackages();

    // Recognized file types
    const extension = file.name.split('.').pop()?.toLowerCase() || "";
    const knownFormats = [
      "pdf", "docx", "xlsx", "pptx",
      "odt", "ods", "odp", "rtf",
      "html", "htm", "xml", "csv",
      "xls", "epub", "mobi"
    ];

    let content: string;

    if (knownFormats.includes(extension)) {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const filePath = `/tmp/${file.name}`;

      // Write to Pyodide's virtual filesystem
      globalScope.pyodide.FS.writeFile(filePath, new Uint8Array(arrayBuffer));

      // Python snippet for extraction
      const pyCode = `
def extract_text(path):
    import sys
    import io
    from pathlib import Path

    path = Path(path)
    if path.suffix.lower() == '.pdf':
        from pdfminer.high_level import extract_text
        return extract_text(str(path))
    elif path.suffix.lower() == '.docx':
        import docx
        doc = docx.Document(str(path))
        return '\\n'.join([paragraph.text for paragraph in doc.paragraphs])
    else:
        # If extension is known but not specifically handled, just read in text mode
        return Path(path).read_text(encoding='utf-8', errors='ignore')
`;

      // Make sure the function is defined
      globalScope.pyodide.runPython(pyCode);

      // Run extraction
      content = globalScope.pyodide.runPython(`extract_text("${filePath}")`);
    } else {
      // Fallback to reading as text
      content = await file.text();
    }

    const processedFile = {
      name: file.name,
      path: file.name,
      content: content,
      selected: false,
    };

    console.log(`[Pyodide Worker] Successfully processed ${file.name}`);
    self.postMessage({ success: true, file: processedFile });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[Pyodide Worker] Error:", errorMessage);
    self.postMessage({ success: false, error: errorMessage });
  }
};