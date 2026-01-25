import { Book, Chapter, PlaybackState, Bookmark } from '../types';

const DB_NAME = 'AudioNookDB';
const DB_VERSION = 1;

export const STORES = {
  BOOKS: 'books',
  CHAPTERS: 'chapters', // This will store large blobs
  PLAYBACK: 'playback',
  BOOKMARKS: 'bookmarks'
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORES.BOOKS)) {
        db.createObjectStore(STORES.BOOKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.CHAPTERS)) {
        const store = db.createObjectStore(STORES.CHAPTERS, { keyPath: 'id' });
        store.createIndex('bookId', 'bookId', { unique: false });
        store.createIndex('bookId_index', ['bookId', 'index'], { unique: true });
      }
      if (!db.objectStoreNames.contains(STORES.PLAYBACK)) {
        db.createObjectStore(STORES.PLAYBACK, { keyPath: 'bookId' });
      }
      if (!db.objectStoreNames.contains(STORES.BOOKMARKS)) {
        const store = db.createObjectStore(STORES.BOOKMARKS, { keyPath: 'id' });
        store.createIndex('bookId', 'bookId', { unique: false });
      }
    };
  });
};

export const db = {
  async addBook(book: Book, chapters: Chapter[]) {
    const db = await openDB();
    const tx = db.transaction([STORES.BOOKS, STORES.CHAPTERS], 'readwrite');
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORES.BOOKS).put(book);
      chapters.forEach(chapter => {
        tx.objectStore(STORES.CHAPTERS).put(chapter);
      });
    });
  },

  async getBooks(): Promise<Book[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.BOOKS, 'readonly');
      const request = tx.objectStore(STORES.BOOKS).getAll();
      request.onsuccess = () => {
        // Sort by lastPlayedAt descending
        const books = request.result as Book[];
        resolve(books.sort((a, b) => b.lastPlayedAt - a.lastPlayedAt));
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getChapters(bookId: string): Promise<Chapter[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CHAPTERS, 'readonly');
      const index = tx.objectStore(STORES.CHAPTERS).index('bookId');
      const request = index.getAll(bookId);
      request.onsuccess = () => {
        const chapters = request.result as Chapter[];
        resolve(chapters.sort((a, b) => a.index - b.index));
      };
      request.onerror = () => reject(request.error);
    });
  },
  
  async getChapterBlob(bookId: string, index: number): Promise<Blob | null> {
      const db = await openDB();
      return new Promise((resolve, reject) => {
          const tx = db.transaction(STORES.CHAPTERS, 'readonly');
          const storeIndex = tx.objectStore(STORES.CHAPTERS).index('bookId_index');
          const request = storeIndex.get([bookId, index]);
          request.onsuccess = () => resolve(request.result?.fileBlob || null);
          request.onerror = () => reject(request.error);
      });
  },

  async saveProgress(state: PlaybackState) {
    if (!state.bookId) return;
    const db = await openDB();
    const tx = db.transaction([STORES.PLAYBACK, STORES.BOOKS], 'readwrite');
    
    tx.objectStore(STORES.PLAYBACK).put(state);
    
    // Update last played timestamp on book
    const bookStore = tx.objectStore(STORES.BOOKS);
    const bookReq = bookStore.get(state.bookId);
    
    bookReq.onsuccess = () => {
        const book = bookReq.result;
        if (book) {
            book.lastPlayedAt = Date.now();
            bookStore.put(book);
        }
    };
  },

  async getProgress(bookId: string): Promise<PlaybackState | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PLAYBACK, 'readonly');
      const request = tx.objectStore(STORES.PLAYBACK).get(bookId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async addBookmark(bookmark: Bookmark) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.BOOKMARKS, 'readwrite');
        tx.objectStore(STORES.BOOKMARKS).put(bookmark);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  },

  async getBookmarks(bookId: string): Promise<Bookmark[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.BOOKMARKS, 'readonly');
        const index = tx.objectStore(STORES.BOOKMARKS).index('bookId');
        const request = index.getAll(bookId);
        request.onsuccess = () => resolve((request.result as Bookmark[]).sort((a, b) => a.timestamp - b.timestamp));
        request.onerror = () => reject(request.error);
    });
  },
  
  async deleteBook(bookId: string) {
    const db = await openDB();
    const tx = db.transaction([STORES.BOOKS, STORES.CHAPTERS, STORES.PLAYBACK, STORES.BOOKMARKS], 'readwrite');
    
    // Delete book metadata
    tx.objectStore(STORES.BOOKS).delete(bookId);
    tx.objectStore(STORES.PLAYBACK).delete(bookId);

    // Delete chapters (Need to find keys first or use cursor, but for now simple range deletion if key was compound would be easier, 
    // but since we index by bookId, we can just iterate and delete. 
    // Optimization: Just clear from index? No, need to delete actual records.)
    // For simplicity in this example, we iterate.
    const chapterStore = tx.objectStore(STORES.CHAPTERS);
    const chapterIndex = chapterStore.index('bookId');
    const chapterReq = chapterIndex.getAllKeys(bookId);
    
    chapterReq.onsuccess = () => {
        chapterReq.result.forEach(key => {
            chapterStore.delete(key);
        });
    };

    const bookmarkStore = tx.objectStore(STORES.BOOKMARKS);
    const bookmarkIndex = bookmarkStore.index('bookId');
    const bookmarkReq = bookmarkIndex.getAllKeys(bookId);
    
    bookmarkReq.onsuccess = () => {
        bookmarkReq.result.forEach(key => {
            bookmarkStore.delete(key);
        });
    };

    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  }
};
