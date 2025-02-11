import React from 'react';
import type { FileItem, FolderItem } from '../types';

interface FileListProps {
  items: (FileItem | FolderItem)[];
  onFileSelect: (id: string) => void;
  onFilePreview: (file: FileItem) => void;
}

export function FileList({ items, onFileSelect, onFilePreview }: FileListProps) {
  function renderItem(item: FileItem | FolderItem) {
    if (item.type === 'file') {
      return (
        <div
          key={item.id}
          className={`p-2 cursor-pointer border rounded mb-1 ${item.selected ? 'bg-indigo-100' : 'bg-white'}`}
          onClick={() => onFileSelect(item.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            onFilePreview(item);
          }}
        >
          {item.name}
        </div>
      );
    } else {
      return (
        <div key={item.id} className="ml-4 mb-1">
          <div className="font-bold">{item.name}</div>
          <div>
            {item.children.map(child => renderItem(child))}
          </div>
        </div>
      );
    }
  }

  return <div>{items.map(renderItem)}</div>;
}