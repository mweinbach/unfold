/**
 * Utility to handle Pyodide caching with IndexedDB
 */

// Current version of our Pyodide setup - increment this when we need to invalidate cache
export const PYODIDE_CACHE_VERSION = '1.0.0';
export const PYODIDE_VERSION = 'v0.27.3'; // Updated to v0.27.3

// Database structure
const DB_NAME = 'pyodide-cache';
const DB_VERSION = 1;
const PACKAGES_STORE = 'installed-packages';
const METADATA_STORE = 'metadata';

// Open/create the IndexedDB database
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(PACKAGES_STORE)) {
        db.createObjectStore(PACKAGES_STORE);
      }
      
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE);
      }
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
}

// Save metadata about Pyodide installation
export async function savePyodideMetadata(metadata: { version: string, lastLoaded: number }): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(METADATA_STORE, 'readwrite');
    const store = transaction.objectStore(METADATA_STORE);
    
    store.put(metadata, 'pyodide-info');
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to save Pyodide metadata'));
    });
  } catch (error) {
    console.error('Error saving Pyodide metadata:', error);
    throw error;
  }
}

// Get Pyodide metadata
export async function getPyodideMetadata(): Promise<{ version: string, lastLoaded: number } | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(METADATA_STORE, 'readonly');
    const store = transaction.objectStore(METADATA_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get('pyodide-info');
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get Pyodide metadata'));
    });
  } catch (error) {
    console.error('Error getting Pyodide metadata:', error);
    return null;
  }
}

// Save information about installed package
export async function saveInstalledPackage(packageName: string, version?: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PACKAGES_STORE, 'readwrite');
    const store = transaction.objectStore(PACKAGES_STORE);
    
    store.put({ name: packageName, version, installedAt: Date.now() }, packageName);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error(`Failed to save package info: ${packageName}`));
    });
  } catch (error) {
    console.error(`Error saving package info for ${packageName}:`, error);
    throw error;
  }
}

// Check if a package is already installed
export async function isPackageInstalled(packageName: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PACKAGES_STORE, 'readonly');
    const store = transaction.objectStore(PACKAGES_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(packageName);
      
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(new Error(`Failed to check package: ${packageName}`));
    });
  } catch (error) {
    console.error(`Error checking if package ${packageName} is installed:`, error);
    return false;
  }
}

// Get all installed packages
export async function getInstalledPackages(): Promise<string[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PACKAGES_STORE, 'readonly');
    const store = transaction.objectStore(PACKAGES_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(new Error('Failed to get installed packages'));
    });
  } catch (error) {
    console.error('Error getting installed packages:', error);
    return [];
  }
}

// Clear all cache (used when version changes)
export async function clearPyodideCache(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([METADATA_STORE, PACKAGES_STORE], 'readwrite');
    
    transaction.objectStore(METADATA_STORE).clear();
    transaction.objectStore(PACKAGES_STORE).clear();
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear Pyodide cache'));
    });
  } catch (error) {
    console.error('Error clearing Pyodide cache:', error);
    throw error;
  }
}

// Check if cache is valid or needs to be refreshed
export async function isCacheValid(): Promise<boolean> {
  try {
    const metadata = await getPyodideMetadata();
    
    if (!metadata) return false;
    
    // Check if the version matches
    return metadata.version === PYODIDE_CACHE_VERSION;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}