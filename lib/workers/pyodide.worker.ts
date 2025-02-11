/* pyodide.worker.ts */
/// <reference lib="webworker" />

declare const loadPyodide: any;
declare const self: DedicatedWorkerGlobalScope & { pyodide?: any };

const globalScope = self;

async function loadPyodideAndPackages() {
  if (!globalScope.pyodide) {
    // Load Pyodide
    globalScope.pyodide = await loadPyodide();
    // Load micropip to install Python packages
    await globalScope.pyodide.loadPackage("micropip");
    // Install the needed Python libraries
    await globalScope.pyodide.runPythonAsync(`
import micropip
await micropip.install("pdfminer.six")
await micropip.install("python-docx")
`);
  }
}

globalScope.onmessage = async (e: MessageEvent<any>) => {
  try {
    // Check for dummy message to preload pyodide and micropip
    if (e.data && e.data.dummy) {
      await loadPyodideAndPackages();
      self.postMessage({ success: true, preload: true });
      return;
    }
    const { file } = e.data;
    await loadPyodideAndPackages();

    const extension = file.name.split('.').pop()?.toLowerCase() || "";
    // List of recognized file types
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

      // Run the extraction
      content = globalScope.pyodide.runPython(`extract_text("${filePath}")`);
    } else {
      // Fallback to reading as text
      content = await file.text();
    }

    const processedFile = {
      name: file.name,
      path: file.name,
      content: content,
      selected: false
    };

    self.postMessage({ success: true, file: processedFile });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    self.postMessage({ success: false, error: errorMessage });
  }
};

export {};