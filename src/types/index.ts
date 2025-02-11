export interface FileItem {
  id: string;
  name: string;
  content: string;
  selected: boolean;
  type: 'file';
  path: string;
}

export interface FolderItem {
  id: string;
  name: string;
  selected: boolean;
  type: 'folder';
  children: (FileItem | FolderItem)[];
  path: string;
}