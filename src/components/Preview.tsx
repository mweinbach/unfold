import React, { useState, useMemo } from 'react';
import { generateXMLContent } from '../utils/xml';
import { getAllSelectedFiles } from '../utils/files';
import type { FileItem, FolderItem } from '../types';

interface PreviewProps {
  items: (FileItem | FolderItem)[];
}

export function Preview({ items }: PreviewProps) {
  const [instructions, setInstructions] = useState('');
  const [contextOpen, setContextOpen] = useState(true);
  const [outputOpen, setOutputOpen] = useState(true);
  
  const selectedFiles = useMemo(() => getAllSelectedFiles(items), [items]);
  const fileContext = useMemo(() => generateXMLContent(selectedFiles), [selectedFiles]);
  const finalContent = useMemo(() => 
    `Document Context:\n\n${fileContext}\n\nInstructions:\n\n${instructions}`,
    [fileContext, instructions]
  );

  return (
    <div className="flex-1 min-h-0 bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Document Context Collapsible */}
        <div>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setContextOpen(!contextOpen)}>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Context</h2>
            <span>{contextOpen ? '-' : '+'}</span>
          </div>
          {contextOpen && (
            <pre className="bg-gray-800 text-gray-100 p-4 font-mono text-sm rounded max-h-64 overflow-auto">
              {fileContext}
            </pre>
          )}
        </div>

        {/* Instructions Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Instructions</h2>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter your instructions here..."
            className="
              w-full
              p-4
              border
              border-gray-300
              rounded
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
              resize-none
              min-h-[120px]
            "
          />
        </div>

        {/* Final Output Collapsible */}
        <div>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setOutputOpen(!outputOpen)}>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Final Output</h2>
            <span>{outputOpen ? '-' : '+'}</span>
          </div>
          {outputOpen && (
            <pre className="bg-gray-800 text-gray-100 p-4 font-mono text-sm rounded max-h-64 overflow-auto">
              {finalContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}