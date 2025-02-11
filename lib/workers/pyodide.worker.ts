/// <reference lib="webworker" />

import { ProcessedFile } from '../types';

declare const self: DedicatedWorkerGlobalScope;

// Main message handler
self.onmessage = async (e: MessageEvent) => {
  const { file } = e.data;
  try {
    // For .txt and .md files, just return the content as is
    self.postMessage({ success: true, file });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};