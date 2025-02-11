let worker: Worker | null = null;
let workerReady = false;
let pendingQueue: Array<(ready: boolean) => void> = [];

function initPyodideWorker() {
  if (!worker) {
    // Spin up the new worker, referencing the file we just created:
    worker = new Worker(new URL('../workers/pyodideWorker.ts', import.meta.url), {
      type: 'module',
    });

    // Immediately send an init message:
    worker.postMessage({ type: 'init' });

    worker.onmessage = (e) => {
      const { type, text, message } = e.data;
      if (type === 'ready') {
        workerReady = true;
        pendingQueue.forEach(fn => fn(true));
        pendingQueue = [];
      } else if (type === 'error') {
        console.error('Pyodide worker error:', message);
      }
    };
  }
}

function waitForWorkerReady(): Promise<boolean> {
  if (workerReady) return Promise.resolve(true);
  return new Promise((resolve) => {
    pendingQueue.push(resolve);
  });
}

/**
 * Extracts text from a PDF ArrayBuffer by sending it to the Pyodide Worker.
 */
export async function extractPDFText(pdfBytes: ArrayBuffer): Promise<string> {
  initPyodideWorker();
  await waitForWorkerReady();

  if (!worker) {
    throw new Error('Pyodide Worker was not initialized');
  }

  return new Promise<string>((resolve, reject) => {
    const handleMessage = (e: MessageEvent) => {
      const { type, text, message } = e.data;
      if (type === 'extracted') {
        worker?.removeEventListener('message', handleMessage);
        resolve(text);
      } else if (type === 'error') {
        worker?.removeEventListener('message', handleMessage);
        reject(new Error(message));
      }
    };
    worker.addEventListener('message', handleMessage);
    worker.postMessage({ type: 'extractPDF', payload: pdfBytes }, [pdfBytes]);
  });
}

/**
 * Extracts text from various document types by sending them to the Pyodide Worker.
 * @param docType - The file extension (e.g. 'xlsx', 'docx', 'pptx', 'pages')
 * @param docBytes - The ArrayBuffer of the file.
 */
export async function extractDocumentText(docType: string, docBytes: ArrayBuffer): Promise<string> {
  initPyodideWorker();
  await waitForWorkerReady();

  if (!worker) {
    throw new Error('Pyodide Worker was not initialized');
  }

  return new Promise<string>((resolve, reject) => {
    const handleMessage = (e: MessageEvent) => {
      const { type, text, message } = e.data;
      if (type === 'extracted') {
        worker?.removeEventListener('message', handleMessage);
        resolve(text);
      } else if (type === 'error') {
        worker?.removeEventListener('message', handleMessage);
        reject(new Error(message));
      }
    };
    worker.addEventListener('message', handleMessage);
    worker.postMessage({ type: 'extractDocument', docType, payload: docBytes }, [docBytes]);
  });
}