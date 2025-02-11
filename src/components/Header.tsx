import React from 'react';

interface HeaderProps {
  onCopySelected: () => void;
  onClearFiles: () => void;
}

export function Header({ onCopySelected, onClearFiles }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          {/* Removed lucide-react icon for testing */}
          <h1 className="text-2xl font-bold text-gray-900">Prompt Reasoner</h1>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={onCopySelected}
            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Copy Selected
          </button>
          <button
            onClick={onClearFiles}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Clear All
          </button>
        </div>
      </div>
    </header>
  );
}