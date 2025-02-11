/*
  This worker runs in the background to avoid blocking the main thread.
  It loads Pyodide, installs necessary Python packages via micropip, and extracts or converts text from various document formats.
*/

self.addEventListener('message', async (e) => {
  const { type, payload, docType } = e.data;

  if (type === 'init') {
    // Load Pyodide and install packages.
    await initPyodideAndPackages();
    (self as any).postMessage({ type: 'ready' });
  } else if (type === 'extractPDF') {
    // Backward compatibility for PDF extraction.
    const buffer = payload;
    try {
      const text = await extractPdfText(buffer);
      (self as any).postMessage({ type: 'extracted', text });
    } catch (error) {
      (self as any).postMessage({ type: 'error', message: String(error) });
    }
  } else if (type === 'extractDocument') {
    // Handle extraction for various document types based on docType.
    const buffer = payload;
    try {
      let text = "";
      if (docType === 'pdf') {
        text = await extractPdfText(buffer);
      } else if (docType === 'xlsx') {
        text = await extractXlsxToCsv(buffer);
      } else if (docType === 'docx') {
        text = await extractDocxText(buffer);
      } else if (docType === 'pptx') {
        text = await extractPptxText(buffer);
      } else if (docType === 'pages') {
        text = await extractPagesText(buffer);
      } else {
        throw new Error('Unsupported document type');
      }
      (self as any).postMessage({ type: 'extracted', text });
    } catch (error) {
      (self as any).postMessage({ type: 'error', message: String(error) });
    }
  }
});

let pyodide: any = null;
let isPyodideInitialized = false;

async function initPyodideAndPackages() {
  if (isPyodideInitialized) return;
  // Dynamically import loadPyodide.
  const { loadPyodide } = await import('pyodide');
  
  pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
    env: { HOME: '/home/pyodide' }
  });
  // Load micropip and install required packages.
  await pyodide.loadPackage('micropip');
  const micropip = pyodide.pyimport('micropip');
  await micropip.install('PyPDF2');
  await micropip.install('openpyxl');
  await micropip.install('python-docx');
  await micropip.install('python-pptx');

  // Define Python function for extracting PDF text.
  await pyodide.runPythonAsync(`
from PyPDF2 import PdfReader
from io import BytesIO

def extract_pdf_text(pdf_bytes):
    try:
        pdf = PdfReader(BytesIO(pdf_bytes))
        text = []
        for page_num, page in enumerate(pdf.pages, 1):
            content = page.extract_text()
            if content and content.strip():
                text.append(f"## Page {page_num}\\n\\n{content}\\n")
        return "\\n".join(text)
    except Exception as e:
        return f"Error extracting PDF text: {str(e)}"
  `);

  // Define Python function for converting XLSX to CSV.
  await pyodide.runPythonAsync(`
import csv
from io import BytesIO, StringIO
def extract_xlsx_to_csv(xlsx_bytes):
    try:
        import openpyxl
        wb = openpyxl.load_workbook(BytesIO(xlsx_bytes), data_only=True)
        sheet = wb.active
        output = StringIO()
        writer = csv.writer(output)
        for row in sheet.iter_rows(values_only=True):
            writer.writerow(list(row))
        return output.getvalue()
    except Exception as e:
        return f"Error converting XLSX to CSV: {str(e)}"
  `);

  // Define Python function for extracting DOCX text.
  await pyodide.runPythonAsync(`
def extract_docx_text(docx_bytes):
    try:
        from docx import Document
        from io import BytesIO
        document = Document(BytesIO(docx_bytes))
        text = []
        for para in document.paragraphs:
            if para.text and para.text.strip():
                text.append(para.text)
        return "\\n".join(text)
    except Exception as e:
        return f"Error extracting DOCX text: {str(e)}"
  `);

  // Define Python function for extracting PPTX text.
  await pyodide.runPythonAsync(`
def extract_pptx_text(pptx_bytes):
    try:
        from pptx import Presentation
        from io import BytesIO
        prs = Presentation(BytesIO(pptx_bytes))
        text = []
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text and shape.text.strip():
                    text.append(shape.text)
        return "\\n".join(text)
    except Exception as e:
        return f"Error extracting PPTX text: {str(e)}"
  `);

  // Define Python function for extracting Pages text (stub implementation).
  await pyodide.runPythonAsync(`
def extract_pages_text(pages_bytes):
    return "Pages format extraction not supported."
  `);

  isPyodideInitialized = true;
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  if (!pyodide) throw new Error('Pyodide not initialized');
  const bytes = new Uint8Array(buffer);
  const pdfData = pyodide.toPy(bytes);
  const extractPdfTextFn = pyodide.globals.get("extract_pdf_text");
  const result = await extractPdfTextFn(pdfData);
  pdfData.destroy();
  return result.toString();
}

async function extractXlsxToCsv(buffer: ArrayBuffer): Promise<string> {
  if (!pyodide) throw new Error('Pyodide not initialized');
  const bytes = new Uint8Array(buffer);
  const data = pyodide.toPy(bytes);
  const func = pyodide.globals.get("extract_xlsx_to_csv");
  const result = await func(data);
  data.destroy();
  return result.toString();
}

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  if (!pyodide) throw new Error('Pyodide not initialized');
  const bytes = new Uint8Array(buffer);
  const data = pyodide.toPy(bytes);
  const func = pyodide.globals.get("extract_docx_text");
  const result = await func(data);
  data.destroy();
  return result.toString();
}

async function extractPptxText(buffer: ArrayBuffer): Promise<string> {
  if (!pyodide) throw new Error('Pyodide not initialized');
  const bytes = new Uint8Array(buffer);
  const data = pyodide.toPy(bytes);
  const func = pyodide.globals.get("extract_pptx_text");
  const result = await func(data);
  data.destroy();
  return result.toString();
}

async function extractPagesText(buffer: ArrayBuffer): Promise<string> {
  if (!pyodide) throw new Error('Pyodide not initialized');
  const bytes = new Uint8Array(buffer);
  const data = pyodide.toPy(bytes);
  const func = pyodide.globals.get("extract_pages_text");
  const result = await func(data);
  data.destroy();
  return result.toString();
}