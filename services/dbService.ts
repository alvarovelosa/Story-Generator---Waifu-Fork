
interface ImageRecord {
  id: string;
  image: {
    base64: string;
    mimeType: string;
  };
}

const DB_NAME = 'AIStoryGeneratorDB';
const STORE_NAME = 'loreImages';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening IndexedDB.');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
  return dbPromise;
};

export const saveImage = async (id: string, image: { base64: string; mimeType: string }): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, image });

    request.onsuccess = () => resolve();
    request.onerror = () => {
        console.error('Error saving image to IndexedDB:', request.error);
        reject('Error saving image.');
    };
  });
};

export const getAllImages = async (): Promise<Map<string, { base64: string; mimeType: string }>> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const imageMap = new Map<string, { base64: string; mimeType: string }>();
      if(request.result){
        request.result.forEach((record: ImageRecord) => {
          imageMap.set(record.id, record.image);
        });
      }
      resolve(imageMap);
    };
    request.onerror = () => {
        console.error('Error getting all images from IndexedDB:', request.error);
        reject('Error fetching images.');
    };
  });
};

export const getAllImageIds = async (): Promise<string[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();

        request.onsuccess = () => {
            resolve(request.result.map(key => String(key)));
        };
        request.onerror = () => {
            console.error('Error getting all image IDs from IndexedDB:', request.error);
            reject('Error fetching image keys.');
        };
    });
};


export const deleteImages = async (ids: string[]): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      if (ids.length === 0) {
          resolve();
          return;
      }

      let deleteCount = 0;
      const totalToDelete = ids.length;

      ids.forEach(id => {
          const request = store.delete(id);
          // The "best" practice here would be to wait for all onsuccess handlers
          request.onsuccess = () => {
              deleteCount++;
              if(deleteCount === totalToDelete) {
                  // This is not quite right if transactions auto-commit.
                  // The transaction.oncomplete is better.
              }
          };
          request.onerror = (e) => {
              console.error(`Error deleting image ${id} from IndexedDB:`, request.error);
              // Don't reject the whole promise, just log the error and continue
              // but we need to stop the transaction
              (e.target as any).transaction.abort();
              reject(`Transaction aborted due to error deleting ${id}`);
          };
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        console.error('Error in delete transaction:', transaction.error);
        reject('Delete transaction failed');
      }
    });
};

export const clearAllImages = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Error clearing images from IndexedDB:', request.error);
            reject('Error clearing image store.');
        };
    });
};
