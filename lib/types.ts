export interface ProcessedFile {
  name: string;
  path: string;
  content: string;
  selected?: boolean;
  /**
   * status can be "loading", "processed", or "error".
   */
  status?: "loading" | "processed" | "error";
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