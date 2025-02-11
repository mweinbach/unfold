export interface ProcessedFile {
  name: string;
  path: string;
  content: string;
  selected?: boolean;
}

export interface DocumentContext {
  sorted: {
    [path: string]: ProcessedFile;
  };
  unsorted: ProcessedFile[];
}

export interface FinalOutput {
  documentContext: string;
  userInstructions: string;
}