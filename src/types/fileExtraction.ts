// types/fileExtraction.ts

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ExtractionProgress {
  stage: 'reading' | 'processing' | 'saving';
  progress: number;
  message: string;
}

export interface ExtractionOptions {
  maxSizeInMB?: number;
  preserveFormatting?: boolean;
  extractMetadata?: boolean;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  extension: string;
}

export interface ExtractionStats {
  totalFiles: number;
  successfulExtractions: number;
  failedExtractions: number;
  totalCharactersExtracted: number;
  averageProcessingTime: number;
}

// types/supabase.ts (exemple)
export interface Database {
  public: {
    Tables: {
      ideas: {
        Row: {
          id: string;
          user_id: string;
          source_type: string;
          content: string;
          file_url: string | null;
          original_filename: string | null;
          file_size: number | null;
          extracted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          source_type: string;
          content: string;
          file_url?: string | null;
          original_filename?: string | null;
          file_size?: number | null;
          extracted_at?: string;
        };
        Update: {
          content?: string;
          file_url?: string | null;
          original_filename?: string | null;
          file_size?: number | null;
          updated_at?: string;
        };
      };
    };
  };
}