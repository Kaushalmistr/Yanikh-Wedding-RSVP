import { v4 as uuidv4 } from 'uuid';
import type { GuestDocument } from './db';

/**
 * Convert a File object to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Convert base64 string to blob
 */
export function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

/**
 * Validate file type (images and PDFs only)
 */
export function validateDocumentFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'application/pdf',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Only images (JPG, PNG, WEBP, GIF, BMP) and PDF files are allowed. You selected: ${file.type || 'unknown type'}`,
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File is too large. Maximum size is 10MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Create a GuestDocument object from a File
 */
export async function createGuestDocument(
  file: File,
  guestId: string,
  uploadedBy: 'guest' | 'admin' = 'guest',
  relatedGuestId?: string,
  description?: string
): Promise<GuestDocument> {
  const validation = validateDocumentFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const base64Data = await fileToBase64(file);

  return {
    id: uuidv4(),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    base64Data,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
    guestId,
    relatedGuestId,
    description,
  };
}

/**
 * Download a document
 */
export function downloadDocument(document: GuestDocument): void {
  const blob = base64ToBlob(document.base64Data, document.fileType);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = document.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download multiple documents as individual files
 */
export function downloadMultipleDocuments(documents: GuestDocument[]): void {
  documents.forEach((doc) => {
    setTimeout(() => downloadDocument(doc), 100);
  });
}

/**
 * Create a simple zip file (using JSZip would require adding dependency)
 * For now, we'll download files individually with a naming pattern
 */
export function downloadDocumentsAsZip(documents: GuestDocument[], guestName: string): void {
  // Since we're using localStorage and don't have JSZip, we'll download individually
  // with a prefix to indicate they're part of a set
  const sanitizedName = guestName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  documents.forEach((doc, index) => {
    const blob = base64ToBlob(doc.base64Data, doc.fileType);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Add prefix to filename
    const extension = doc.fileName.split('.').pop();
    const baseName = doc.fileName.replace(`.${extension}`, '');
    link.download = `${sanitizedName}_${index + 1}_${baseName}.${extension}`;
    
    document.body.appendChild(link);
    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, index * 100);
  });
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) {
    return '🖼️';
  } else if (fileType === 'application/pdf') {
    return '📄';
  }
  return '📎';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get preview URL for image files
 */
export function getPreviewUrl(document: GuestDocument): string | null {
  if (document.fileType.startsWith('image/')) {
    return document.base64Data;
  }
  return null;
}
