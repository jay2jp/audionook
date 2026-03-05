import React, { useRef, useState } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import { db } from '../services/db';
import { v4 as uuidv4 } from 'uuid';
import { Book, Chapter } from '../types';
import { Button } from './Button';
import * as mm from 'music-metadata-browser';

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
      const fileList = Array.from(files) as File[];
      const audioFiles = fileList.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|m4b|m4a|aac|wav|ogg)$/i)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      if (audioFiles.length === 0) {
        alert("No audio files found in selection. Please ensure you selected audio files (MP3, M4B, etc).");
        setIsProcessing(false);
        return;
      }

      const bookId = uuidv4();
      const firstFile = audioFiles[0] as File & { webkitRelativePath?: string };
      const dirPath = firstFile.webkitRelativePath;
      const title = dirPath ? dirPath.split('/')[0] : firstFile.name.replace(/\.[^/.]+$/, "");

      const chapters: Chapter[] = [];
      let chapterIndex = 0;

      for (const file of audioFiles) {
        if (file.name.toLowerCase().endsWith('.m4b')) {
          try {
            const metadata = await mm.parseBlob(file);
            const chaptersInFile = metadata.chapters;
            if (chaptersInFile && chaptersInFile.length > 0) {
              for (const ch of chaptersInFile) {
                chapters.push({
                  id: uuidv4(),
                  bookId: bookId,
                  index: chapterIndex++,
                  title: ch.title || `Chapter ${chapterIndex}`,
                  fileName: file.name,
                  startTime: ch.startTime,
                  endTime: ch.endTime,
                  fileBlob: file
                });
              }
              continue;
            }
          } catch (e) {
            console.error("Failed to parse m4b chapters", e);
          }
        }
        
        chapters.push({
          id: uuidv4(),
          bookId: bookId,
          index: chapterIndex++,
          title: file.name,
          fileName: file.name,
          fileBlob: file
        });
      }

      const newBook: Book = {
        id: bookId,
        title: title,
        addedAt: Date.now(),
        lastPlayedAt: Date.now(),
        totalChapters: chapters.length,
      };

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
