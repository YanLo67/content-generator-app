// hooks/useFileDrop.ts
import { useState, useCallback } from "react";

type UseFileDropOptions = {
  onFileDrop: (file: File) => void;
};

export function useFileDrop({ onFileDrop }: UseFileDropOptions) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File | null) => {
    if (file) {
      onFileDrop(file);
    }
  }, [onFileDrop]);

  const handleDragEvents = (e: React.DragEvent<HTMLElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    handleDragEvents(e, false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file || null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file || null);
  };
  
  return {
    isDragging,
    handleDragEnter: (e: React.DragEvent<HTMLElement>) => handleDragEvents(e, true),
    handleDragLeave: (e: React.DragEvent<HTMLElement>) => handleDragEvents(e, false),
    handleDragOver: (e: React.DragEvent<HTMLElement>) => e.preventDefault(),
    handleDrop,
    handleFileChange,
  };
}