import React, { useCallback, useState } from 'react';
import { Header } from './components/Header';
import { ContextSidebar } from './components/ContextSidebar';
import { Preview } from './components/Preview';
import { organizeFiles, getAllSelectedFiles } from './utils/files';
import { generateXMLContent } from './utils/xml';
import type { FileItem, FolderItem } from './types';

function App() {
  const [items, setItems] = useState<(FileItem | FolderItem)[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Immutable update: recursively toggle selected for the file with matching id.
  const updateSelection = (items: (FileItem | FolderItem)[], id: string): (FileItem | FolderItem)[] => {
    return items.map(item => {
      if (item.id === id && item.type === 'file') {
        return { ...item, selected: !item.selected };
      }
      if (item.type === 'folder') {
        return { ...item, children: updateSelection(item.children, id) };
      }
      return item;
    });
  };

  const toggleFileSelection = useCallback((id: string) => {
    setItems(prev => updateSelection(prev, id));
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newItems = await organizeFiles(Array.from(uploadedFiles));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  const handleFolderUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newItems = await organizeFiles(Array.from(uploadedFiles));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  // When a file is right-clicked, we set it for preview.
  const handleFilePreview = useCallback((file: FileItem) => {
    setPreviewFile(file);
  }, []);

  const copySelectedToClipboard = useCallback(() => {
    const selectedFiles = getAllSelectedFiles(items);
    const xmlContent = generateXMLContent(selectedFiles);
    navigator.clipboard.writeText(xmlContent);
  }, [items]);

  const clearFiles = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header
        onCopySelected={copySelectedToClipboard}
        onClearFiles={clearFiles}
      />
      {/*
        Make main layout flexible to stack on mobile and go side-by-side on md+
      */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <ContextSidebar
          items={items}
          onFileUpload={handleFileUpload}
          onFolderUpload={handleFolderUpload}
          onFileSelect={toggleFileSelection}
          onFilePreview={handleFilePreview}
        />
        <Preview items={items} />
      </main>

      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Preview: {previewFile.name}</h2>
            <pre className="max-h-80 overflow-auto p-2 bg-gray-100 rounded text-sm">
              {previewFile.content}
            </pre>
            <div className="mt-4 text-right">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;