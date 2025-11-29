import mammoth from 'mammoth';
import { supabase } from './lib/supabase';

export interface TextExtractionResult {
  text: string;
  pageCount?: number;
  wordCount?: number;
}

export class TextExtractionService {
  /**
   * Extract text from PDF buffer
   */
  async extractFromPDF(buffer: Buffer): Promise<TextExtractionResult> {
    try {
      // Dynamic import for pdf-parse v2.x (ESM with named export)
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      
      // Get text and info from the PDF
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();
      
      // Clean up resources
      await parser.destroy();
      
      return {
        text: textResult.text,
        pageCount: infoResult.total,
        wordCount: textResult.text.split(/\s+/).length
      };
    } catch (error) {
      console.error('PDF text extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from DOCX buffer
   */
  async extractFromDOCX(buffer: Buffer): Promise<TextExtractionResult> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      return {
        text: result.value,
        wordCount: result.value.split(/\s+/).length
      };
    } catch (error) {
      console.error('DOCX text extraction error:', error);
      throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from DOC (legacy Word format)
   * Note: mammoth handles both .doc and .docx formats
   */
  async extractFromDOC(buffer: Buffer): Promise<TextExtractionResult> {
    return this.extractFromDOCX(buffer);
  }

  /**
   * Extract text from file buffer based on MIME type
   */
  async extractText(buffer: Buffer, mimeType: string): Promise<TextExtractionResult> {
    switch (mimeType) {
      case 'application/pdf':
        return this.extractFromPDF(buffer);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.extractFromDOCX(buffer);
      
      case 'application/msword':
        return this.extractFromDOC(buffer);
      
      default:
        throw new Error(`Unsupported file type: ${mimeType}. Only PDF, DOC, and DOCX are supported.`);
    }
  }

  /**
   * Download file from Supabase Storage and extract text
   */
  async extractFromStoragePath(storagePath: string): Promise<TextExtractionResult> {
    try {
      // Download file from Supabase Storage
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(storagePath);

      if (error || !data) {
        throw new Error(`Failed to download file from storage: ${error?.message || 'File not found'}`);
      }

      // Convert Blob to Buffer
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Detect MIME type from file extension
      const ext = storagePath.split('.').pop()?.toLowerCase();
      let mimeType: string;

      switch (ext) {
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'doc':
          mimeType = 'application/msword';
          break;
        default:
          throw new Error(`Unsupported file extension: ${ext}`);
      }

      return this.extractText(buffer, mimeType);
    } catch (error) {
      console.error('Storage text extraction error:', error);
      throw new Error(`Failed to extract text from storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate extracted text has meaningful content
   */
  validateExtractedText(text: string): boolean {
    if (!text || text.trim().length < 50) {
      return false;
    }

    // Check if text has at least some words (not just symbols/numbers)
    const words = text.match(/[a-zA-Z]{3,}/g);
    return (words?.length || 0) > 10;
  }
}

export const textExtractionService = new TextExtractionService();
