/// <reference lib="webworker" />

// Define an extended worker scope that includes pyodide
interface PyodideWorkerGlobal extends DedicatedWorkerGlobalScope {
  pyodide?: any;
  loadPyodide?: any;
  indexedDB: IDBFactory;
}

// Define constants
const PYODIDE_VERSION = 'v0.27.3'; // Updated to v0.27.3
const PYODIDE_CACHE_VERSION = '1.0.0';
const DEFAULT_PACKAGES = ['pdfminer', 'pdfminer.six', 'python-docx']; // Removed 'micropip'
const MAX_INSTALL_RETRIES = 3;  // Maximum number of retries for package installation

// Alternative CDNs for Pyodide
const PYODIDE_CDNS = [
  `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/pyodide.js`,
  `https://cdn.skypack.dev/pyodide@${PYODIDE_VERSION}/pyodide.js`,
  `https://unpkg.com/pyodide@${PYODIDE_VERSION}/pyodide.js`
];

// Database structure
const DB_NAME = 'pyodide-cache';
const DB_VERSION = 1;
const PACKAGES_STORE = 'installed-packages';
const METADATA_STORE = 'metadata';

// Cast "self" to our extended interface
const workerScope = self as unknown as PyodideWorkerGlobal;

// Try to load Pyodide from different CDNs
let pyodideLoaded = false;
for (const cdn of PYODIDE_CDNS) {
  if (!pyodideLoaded) {
    try {
      console.log(`[Pyodide Worker] Attempting to load Pyodide from: ${cdn}`);
      workerScope.importScripts(cdn);
      pyodideLoaded = true;
      console.log(`[Pyodide Worker] Successfully loaded Pyodide from: ${cdn}`);
      break;
    } catch (error) {
      console.error(`[Pyodide Worker] Failed to load Pyodide from ${cdn}:`, error);
    }
  }
}

if (!pyodideLoaded) {
  console.error("[Pyodide Worker] Failed to load Pyodide from any CDN");
}

// Open/create the IndexedDB database
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = workerScope.indexedDB.open(DB_NAME, DB_VERSION);
    
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

// Check if Pyodide metadata exists
async function getPyodideMetadata(): Promise<{ version: string, lastLoaded: number } | null> {
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

// Save Pyodide metadata
async function savePyodideMetadata(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(METADATA_STORE, 'readwrite');
    const store = transaction.objectStore(METADATA_STORE);
    
    const metadata = {
      version: PYODIDE_CACHE_VERSION,
      lastLoaded: Date.now()
    };
    
    store.put(metadata, 'pyodide-info');
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to save Pyodide metadata'));
    });
  } catch (error) {
    console.error('Error saving Pyodide metadata:', error);
  }
}

// Check if a package is installed
async function isPackageInstalled(packageName: string): Promise<boolean> {
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

// Save installed package info with additional metadata
async function saveInstalledPackage(packageName: string, version?: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PACKAGES_STORE, 'readwrite');
    const store = transaction.objectStore(PACKAGES_STORE);
    
    store.put({ 
      name: packageName, 
      installedAt: Date.now(),
      version: version || 'unknown'
    }, packageName);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error(`Failed to save package info: ${packageName}`));
    });
  } catch (error) {
    console.error(`Error saving package info for ${packageName}:`, error);
  }
}

// Clear all cache (used when version changes)
async function clearCache(): Promise<void> {
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
  }
}

// Check if we need to invalidate the cache
async function checkCacheValidity(): Promise<boolean> {
  const metadata = await getPyodideMetadata();
  
  if (!metadata) return false;
  
  // If the cache version doesn't match, we need to invalidate
  if (metadata.version !== PYODIDE_CACHE_VERSION) {
    await clearCache();
    return false;
  }
  
  return true;
}

// Verify that a package is actually installed and importable
async function verifyPackageInstallation(packageName: string): Promise<boolean> {
  try {
    // For micropip, which is a built-in package, we check differently
    if (packageName === 'micropip') {
      const result = workerScope.pyodide.runPython(`
        import sys
        'micropip' in sys.modules
      `);
      return result === true;
    }
    
    // For other packages, try to import them
    const result = workerScope.pyodide.runPython(`
      import sys
      try:
          if '${packageName}' == 'pdfminer.six':
              import pdfminer.high_level
              success = True
          else:
              import ${packageName.replace('.', ' as _')}
              success = True
      except ImportError:
          success = False
      success
    `);
    
    return result === true;
  } catch (error) {
    console.error(`Error verifying package installation for ${packageName}:`, error);
    return false;
  }
}

// Install a single package with retries
async function installPackageWithRetry(packageName: string, retries = MAX_INSTALL_RETRIES): Promise<boolean> {
  try {
    console.log(`[Pyodide Worker] Installing ${packageName}...`);
    
    // Since 'micropip' is already loaded with Pyodide, we skip installing it
    if (packageName === 'micropip') {
      console.log(`[Pyodide Worker] Skipping installation of micropip as it is already loaded.`);
      return true;
    }
    
    // Make sure micropip is imported
    await workerScope.pyodide.runPythonAsync(`
      import micropip
      await micropip.install("${packageName}")
    `);
    
    // Verify the installation
    const isInstalled = await verifyPackageInstallation(packageName);
    
    if (isInstalled) {
      // Get package version if possible
      let version = 'unknown';
      try {
        version = workerScope.pyodide.runPython(`
          try:
              import importlib.metadata
              importlib.metadata.version("${packageName.split('.')[0]}")
          except:
              try:
                  import pkg_resources
                  pkg_resources.get_distribution("${packageName.split('.')[0]}").version
              except:
                  "unknown"
        `);
      } catch (e) {
        console.warn(`[Pyodide Worker] Could not determine version for ${packageName}:`, e);
      }
      
      await saveInstalledPackage(packageName, version);
      console.log(`[Pyodide Worker] ${packageName} installed successfully (version: ${version})`);
      return true;
    } else {
      console.warn(`[Pyodide Worker] Package ${packageName} installation verification failed`);
      
      // Retry if we have retries left
      if (retries > 0) {
        console.log(`[Pyodide Worker] Retrying installation of ${packageName} (${retries} retries left)...`);
        return installPackageWithRetry(packageName, retries - 1);
      } else {
        console.error(`[Pyodide Worker] Failed to install ${packageName} after multiple attempts`);
        return false;
      }
    }
  } catch (error) {
    console.error(`[Pyodide Worker] Error installing ${packageName}:`, error);
    
    // Retry if we have retries left
    if (retries > 0) {
      console.log(`[Pyodide Worker] Retrying installation of ${packageName} (${retries} retries left)...`);
      return installPackageWithRetry(packageName, retries - 1);
    } else {
      console.error(`[Pyodide Worker] Failed to install ${packageName} after multiple attempts`);
      return false;
    }
  }
}

async function loadPyodideAndPackages() {
  if (!workerScope.pyodide) {
    // First check if our cache is valid
    const isCacheValid = await checkCacheValidity();
    
    console.log(`[Pyodide Worker] Cache validity: ${isCacheValid ? 'Valid' : 'Invalid or not found'}`);
    
    try {
      console.log("[Pyodide Worker] Loading Pyodide...");
      
      // Try each CDN base URL for the indexURL
      let pyodideLoaded = false;
      let loadError = null;
      
      for (const cdn of PYODIDE_CDNS) {
        if (!pyodideLoaded) {
          try {
            // Extract the base URL from the CDN
            const baseUrl = cdn.substring(0, cdn.lastIndexOf('/'));
            console.log(`[Pyodide Worker] Attempting to load Pyodide from: ${baseUrl}`);
            
            // Use indexURL so Pyodide knows where to load its files
            workerScope.pyodide = await workerScope.loadPyodide({
              indexURL: baseUrl,
            });
            
            pyodideLoaded = true;
            console.log(`[Pyodide Worker] Successfully loaded Pyodide from: ${baseUrl}`);
            break;
          } catch (error) {
            console.error(`[Pyodide Worker] Failed to load Pyodide from ${cdn}:`, error);
            loadError = error;
          }
        }
      }
      
      if (!pyodideLoaded) {
        throw loadError || new Error("Failed to load Pyodide from any CDN");
      }
      
      console.log("[Pyodide Worker] Pyodide loaded successfully");
      
      // Print Pyodide version for debugging
      const pyodideVersion = workerScope.pyodide.version;
      console.log(`[Pyodide Worker] Loaded Pyodide version: ${pyodideVersion}`);
      
      // Save metadata about the loaded Pyodide instance
      await savePyodideMetadata();
      
      // Verify micropip is available after loading Pyodide
      const isMicropipVerified = await verifyPackageInstallation('micropip');
      if (!isMicropipVerified) {
        throw new Error("Failed to load critical package: micropip");
      }
      console.log("[Pyodide Worker] micropip is available and verified");
      
      // Install needed Python packages if not already installed
      const packagesToInstall = [];
      
      for (const pkg of DEFAULT_PACKAGES) {
        const installed = await isPackageInstalled(pkg);
        if (!installed) {
          packagesToInstall.push(pkg);
        } else {
          // Verify the package is actually working
          const isVerified = await verifyPackageInstallation(pkg);
          if (!isVerified) {
            console.warn(`[Pyodide Worker] Package ${pkg} was marked as installed but verification failed. Reinstalling...`);
            packagesToInstall.push(pkg);
          }
        }
      }
      
      if (packagesToInstall.length > 0) {
        console.log(`[Pyodide Worker] Installing packages: ${packagesToInstall.join(', ')}...`);
        
        // Install each package and save its installation state
        const results = await Promise.all(
          packagesToInstall.map(async (pkg) => {
            const success = await installPackageWithRetry(pkg);
            return { package: pkg, success };
          })
        );
        
        // Check if all packages were installed successfully
        const failedPackages = results.filter(r => !r.success).map(r => r.package);
        if (failedPackages.length > 0) {
          console.error(`[Pyodide Worker] Failed to install some packages: ${failedPackages.join(', ')}`);
        }
      } else {
        console.log("[Pyodide Worker] All required packages were already installed and verified");
      }
    } catch (error) {
      console.error("[Pyodide Worker] Error during Pyodide initialization:", error);
      throw error;
    }
  }
}

workerScope.onmessage = async (e: MessageEvent<any>) => {
  try {
    // Check for ping message (used to verify worker is still alive)
    if (e.data && e.data.ping === true) {
      // Respond immediately without doing any processing
      workerScope.postMessage({ success: true, ping: true });
      return;
    }
    
    // Check for dummy preload message
    if (e.data && e.data.dummy) {
      console.log("[Pyodide Worker] Received dummy preload request.");
      await loadPyodideAndPackages();
      
      // Check if any packages failed to install during preload
      const failedPackages: string[] = [];
      for (const pkg of DEFAULT_PACKAGES) {
        const isVerified = await verifyPackageInstallation(pkg);
        if (!isVerified) {
          failedPackages.push(pkg);
        }
      }
      
      console.log("[Pyodide Worker] Preload complete. Sending response...");
      workerScope.postMessage({ 
        success: true, 
        preload: true,
        failedPackages: failedPackages.length > 0 ? failedPackages : undefined
      });
      return;
    }

    // Check for cache invalidation request
    if (e.data && e.data.invalidateCache) {
      console.log("[Pyodide Worker] Clearing cache as requested");
      await clearCache();
      workerScope.pyodide = undefined; // Force reload
      workerScope.postMessage({ success: true, cacheCleared: true });
      return;
    }

    // Check for custom packages installation
    if (e.data && e.data.installPackages && Array.isArray(e.data.packages)) {
      await loadPyodideAndPackages();
      
      const packagesToInstall = [];
      for (const pkg of e.data.packages) {
        const installed = await isPackageInstalled(pkg);
        if (!installed) {
          packagesToInstall.push(pkg);
        } else {
          // Verify the package is actually working
          const isVerified = await verifyPackageInstallation(pkg);
          if (!isVerified) {
            console.warn(`[Pyodide Worker] Package ${pkg} was marked as installed but verification failed. Reinstalling...`);
            packagesToInstall.push(pkg);
          }
        }
      }
      
      if (packagesToInstall.length > 0) {
        console.log(`[Pyodide Worker] Installing custom packages: ${packagesToInstall.join(', ')}...`);
        
        const results = await Promise.all(
          packagesToInstall.map(async (pkg) => {
            const success = await installPackageWithRetry(pkg);
            return { package: pkg, success };
          })
        );
        
        // Filter successful installations
        const successfulPackages = results.filter(r => r.success).map(r => r.package);
        const failedPackages = results.filter(r => !r.success).map(r => r.package);
        
        workerScope.postMessage({ 
          success: true, 
          packagesInstalled: successfulPackages.length,
          packages: successfulPackages,
          failedPackages: failedPackages
        });
      } else {
        workerScope.postMessage({ 
          success: true, 
          packagesInstalled: 0,
          packages: [],
          failedPackages: []
        });
      }
      return;
    }

    const { file } = e.data;
    if (!file) {
      throw new Error("No file provided to Pyodide worker.");
    }

    // Make sure Pyodide is loaded
    await loadPyodideAndPackages();

    // Recognized file types
    const extension = file.name.split('.').pop()?.toLowerCase() || "";
    const knownFormats = [
      "pdf", "docx", "xlsx", "pptx",
      "odt", "ods", "odp", "rtf",
      "html", "htm", "xml", "csv",
      "xls", "epub", "mobi"
    ];

    let content: string;
    if (knownFormats.includes(extension)) {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const filePath = `/tmp/${file.name}`;

      // Write to Pyodide's virtual filesystem
      workerScope.pyodide.FS.writeFile(filePath, new Uint8Array(arrayBuffer));

      // Python snippet for extraction
      const pyCode = `
def extract_text(path):
    import sys
    import io
    from pathlib import Path

    path = Path(path)
    if path.suffix.lower() == '.pdf':
        from pdfminer.high_level import extract_text
        return extract_text(str(path))
    elif path.suffix.lower() == '.docx':
        import docx
        doc = docx.Document(str(path))
        return '\\n'.join([paragraph.text for paragraph in doc.paragraphs])
    else:
        # If extension is known but not specifically handled, just read in text mode
        return Path(path).read_text(encoding='utf-8', errors='ignore')
`;

      // Ensure the function is defined
      workerScope.pyodide.runPython(pyCode);

      // Run extraction
      content = workerScope.pyodide.runPython(`extract_text("${filePath}")`);
    } else {
      // Fallback to reading as text
      content = await file.text();
    }

    const processedFile = {
      name: file.name,
      path: file.name,
      content: content,
      selected: false,
    };

    console.log(`[Pyodide Worker] Successfully processed ${file.name}`);
    workerScope.postMessage({ success: true, file: processedFile });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[Pyodide Worker] Error:", errorMessage);
    workerScope.postMessage({ success: false, error: errorMessage });
  }
};

export {};