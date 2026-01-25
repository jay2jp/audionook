export interface Book {
  id: string;
  title: string;
  author?: string;
  coverImage?: string; // Base64 or Blob URL
  addedAt: number;
  lastPlayedAt: number;
  totalChapters: number;
}

export interface Chapter {
  id: string;
  bookId: string;
  index: number;
  title: string;
  fileName: string;
  duration?: number;
  fileBlob: Blob; // Stored in IndexedDB
}

export interface PlaybackState {
  bookId: string | null;
  chapterIndex: number;
  currentTime: number;
  playbackRate: number;
}

export interface Bookmark {
  id: string;
  bookId: string;
  chapterIndex: number;
  timestamp: number;
  note: string;
  createdAt: number;
}
