import React from 'react';
import { FileUploader } from './FileUploader';
import { FileList } from './FileList';
import type { FileItem, FolderItem } from '../types';

interface ContextSidebarProps {
  items: (FileItem | FolderItem)[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect: (id: string) => void;
  onFilePreview: (file: FileItem) => void;
}

export function ContextSidebar({
  items,
  onFileUpload,
  onFolderUpload,
  onFileSelect,
  onFilePreview,
}: ContextSidebarProps) {
  return (
    <div
      className="
        w-full
        md:w-64
        lg:w-80
        flex-shrink-0
        bg-white
        border-b md:border-b-0 md:border-r
        border-gray-200
        p-4
        overflow-y-auto
      "
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Documents</h2>
      
      <div className="space-y-4 mb-6">
        <FileUploader
          icon={<span>📁</span>}
          label="Upload Folder"
          onChange={onFolderUpload}
          directory
        />
        <FileUploader
          icon={<span>📄</span>}
          label="Upload Documents"
          onChange={onFileUpload}
        />
      </div>

      <FileList
        items={items}
        onFileSelect={onFileSelect}
        onFilePreview={onFilePreview}
      />
    </div>
  );
}