import React, { useRef, useState } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import { db } from '../services/db';
import { v4 as uuidv4 } from 'uuid';
import { Book, Chapter } from '../types';
import { Button } from './Button';

interface FileImporterProps {
  onImportComplete: () => void;
}

export const FileImporter: React.FC<FileImporterProps> = ({ onImportComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    try {
      // Group files by potential book (simple logic: all selected files belong to one book for now)
      // In a more complex app, we'd try to parse folder structures or ID3 tags.
      
      const fileList = Array.from(files) as File[];
      // Expanded regex to include m4a which is common on iOS
      const audioFiles = fileList.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|m4b|m4a|aac|wav|ogg)$/i)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      if (audioFiles.length === 0) {
        alert("No audio files found in selection. Please ensure you selected audio files (MP3, M4B, etc).");
        setIsProcessing(false);
        return;
      }

      // Create Book Metadata
      const bookId = uuidv4();
      // Use directory name if available, else first file name
      // webkitRelativePath might be available if folder selection was used
      const firstFile = audioFiles[0] as File & { webkitRelativePath?: string };
      const dirPath = firstFile.webkitRelativePath;
      const title = dirPath ? dirPath.split('/')[0] : firstFile.name.replace(/\.[^/.]+$/, "");

      const newBook: Book = {
        id: bookId,
        title: title,
        addedAt: Date.now(),
        lastPlayedAt: Date.now(),
        totalChapters: audioFiles.length,
      };

      const chapters: Chapter[] = audioFiles.map((file, index) => ({
        id: uuidv4(),
        bookId: bookId,
        index: index,
        title: file.name,
        fileName: file.name,
        fileBlob: file
      }));

      await db.addBook(newBook, chapters);
      onImportComplete();
    } catch (error) {
      console.error("Import failed", error);
      alert("Failed to import book. Storage might be full.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
      <input 
        type="file" 
        multiple 
        accept="audio/*,.mp3,.m4b,.m4a,.aac,.wav,.ogg" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        id="file-upload"
      />
      
      <div className="mb-4 p-4 bg-brand-500/10 rounded-full">
        {isProcessing ? (
           <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        ) : (
           <FolderPlus className="w-8 h-8 text-brand-400" />
        )}
      </div>
      
      <h3 className="text-lg font-semibold mb-2">Add New Audiobook</h3>
      <p className="text-slate-400 text-center text-sm mb-6 max-w-xs">
        Select multiple audio files to create a book. 
        <br />
        <span className="text-xs text-slate-500 mt-1 block">(On iPhone: Select "Choose Files" to browse iCloud/Phone storage)</span>
      </p>
      
      <Button 
        onClick={() => fileInputRef.current?.click()} 
        isLoading={isProcessing}
        variant="primary"
      >
        Select Files
      </Button>
    </div>
  );
};