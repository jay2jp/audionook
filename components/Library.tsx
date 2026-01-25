import React from 'react';
import { Book as BookType } from '../types';
import { FileImporter } from './FileImporter';
import { Book, Clock, Trash2, PlayCircle } from 'lucide-react';
import { Button } from './Button';

interface LibraryProps {
  books: BookType[];
  onBookSelect: (book: BookType) => void;
  onImportComplete: () => void;
  onDeleteBook: (e: React.MouseEvent, id: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ books, onBookSelect, onImportComplete, onDeleteBook }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-32 max-w-5xl mx-auto w-full">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Library</h1>
        <p className="text-slate-400">Your personal offline collection</p>
      </header>

      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <FileImporter onImportComplete={onImportComplete} />
        </div>
      ) : (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.map((book) => (
                <div 
                    key={book.id}
                    onClick={() => onBookSelect(book)}
                    className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-brand-500/50 rounded-xl p-4 transition-all cursor-pointer shadow-lg hover:shadow-xl"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg">
                            <Book className="text-white w-6 h-6" />
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-500 hover:text-red-400"
                            onClick={(e) => onDeleteBook(e, book.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-slate-100 mb-1 line-clamp-1 group-hover:text-brand-300 transition-colors">
                        {book.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                        {book.totalChapters} Chapter{book.totalChapters !== 1 ? 's' : ''}
                    </p>
                    
                    <div className="flex items-center text-xs text-slate-500 gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Last played {new Date(book.lastPlayedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                         <PlayCircle className="w-10 h-10 text-brand-400 fill-brand-900/50" />
                    </div>
                </div>
                ))}
                
                {/* Always show importer as the last card or in a separate section if list is long, 
                    but for this layout, putting it in the grid is nice. */}
                <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl hover:bg-slate-800/30 transition-colors">
                     <FileImporter onImportComplete={onImportComplete} />
                     <span className="sr-only">Import more</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
