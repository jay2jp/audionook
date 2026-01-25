import React, { useEffect, useState } from 'react';
import { db } from './services/db';
import { Book, Chapter, PlaybackState } from './types';
import { Library } from './components/Library';
import { Player } from './components/Player';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Active Book State
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeChapters, setActiveChapters] = useState<Chapter[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState | undefined>(undefined);

  const refreshLibrary = async () => {
    const fetchedBooks = await db.getBooks();
    setBooks(fetchedBooks);
  };

  useEffect(() => {
    refreshLibrary().finally(() => setLoading(false));
  }, []);

  const handleBookSelect = async (book: Book) => {
    try {
      // 1. Get Chapters
      const chapters = await db.getChapters(book.id);
      
      // 2. Get Last Known Position
      const savedState = await db.getProgress(book.id);
      
      setActiveChapters(chapters);
      setPlaybackState(savedState || {
        bookId: book.id,
        chapterIndex: 0,
        currentTime: 0,
        playbackRate: 1.0
      });
      setActiveBook(book);
    } catch (err) {
      console.error("Error opening book", err);
      alert("Could not open book. Please try deleting and re-importing it.");
    }
  };

  const closePlayer = async () => {
      // Refresh library order as lastPlayedAt might have changed
      await refreshLibrary();
      setActiveBook(null);
      setActiveChapters([]);
  };

  const handleDeleteBook = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this book and all its files?")) {
        await db.deleteBook(id);
        await refreshLibrary();
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 text-brand-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 text-slate-200 font-sans selection:bg-brand-500/30">
      <Library 
        books={books} 
        onBookSelect={handleBookSelect}
        onImportComplete={refreshLibrary}
        onDeleteBook={handleDeleteBook}
      />
      
      {activeBook && activeChapters.length > 0 && (
        <Player
          book={activeBook}
          chapters={activeChapters}
          initialState={playbackState}
          onClose={closePlayer}
        />
      )}
    </div>
  );
}
