importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js");

import { ProcessedFile } from "../types";

declare const self: DedicatedWorkerGlobalScope;

interface PyodideWorkerGlobalScope extends DedicatedWorkerGlobalScope {
  pyodide?: any;
  pyodideReady?: Promise<void>;
}

const globalScope = self as PyodideWorkerGlobalScope;

async function loadPyodideAndPackages() {
  if (!globalScope.pyodide) {
    // Load Pyodide
    globalScope.pyodide = await loadPyodide();

    // Load micropip to install python packages
    await globalScope.pyodide.loadPackage("micropip");

    // Now install the needed Python libraries
    // pdfminer.six for PDF extraction, python-docx for .docx
    // You can extend this with other packages as needed
    await globalScope.pyodide.runPythonAsync(`
import micropip
await micropip.install("pdfminer.six")
await micropip.install("python-docx")
    `);

    // Define our extract_text() function in Python
    await globalScope.pyodide.runPythonAsync(`
import os
from typing import Union

def extract_text(file_path: Union[str, bytes]) -> str:
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()
    text = ""

    if ext == ".pdf":
        try:
            from pdfminer.high_level import extract_text as pdf_extract_text
            text = pdf_extract_text(file_path)
        except Exception as e:
            text = "Error extracting PDF: " + str(e)
    elif ext == ".docx":
        try:
            import docx
            doc = docx.Document(file_path)
            text = "\\n".join([para.text for para in doc.paragraphs])
        except Exception as e:
            text = "Error extracting DOCX: " + str(e)
    elif ext in [".xlsx", ".xls"]:
        text = "Excel extraction not implemented"
    elif ext == ".pptx":
        text = "PowerPoint extraction not implemented"
    elif ext in [".odt", ".ods", ".odp"]:
        text = "OpenDocument extraction not implemented"
    elif ext == ".rtf":
        text = "RTF extraction not implemented"
    elif ext in [".html", ".htm"]:
        text = "HTML extraction not implemented"
    elif ext == ".xml":
        text = "XML extraction not implemented"
    elif ext == ".csv":
        text = "CSV extraction not implemented"
    elif ext in [".epub", ".mobi"]:
        text = "eBook extraction not implemented"
    else:
        # If none above, fallback to reading as plain text
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
        except Exception as e:
            text = "Error reading as text: " + str(e)

    return text
    `);
  }
}

// Listen for messages from the main thread
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

    // If the extension is known, we pass it to our Python extraction function
    // Otherwise, we read it as plain text
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
      // If it's not in known formats, fallback to reading as text
      // (e.g., .txt, .md, .py, etc.)
      content = await file.text();
    }

    const processedFile: ProcessedFile = {
      name: file.name,
      path: file.name,
      content: content,
      selected: false
    };

    self.postMessage({ success: true, file: processedFile });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error occurred";
    self.postMessage({ success: false, error: errorMessage });
  }
};

export {};