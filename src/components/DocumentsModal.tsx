import { useState, useRef } from 'react';
import { X, Download, Upload, FileText, Image, FileCheck, Trash2, CheckSquare, Square } from 'lucide-react';
import type { Guest, GuestDocument } from '../lib/db';
import { updateGuest } from '../lib/db';
import {
  createGuestDocument,
  downloadDocument,
  downloadDocumentsAsZip,
  formatFileSize,
  getFileIcon,
  getPreviewUrl,
} from '../lib/documentService';

interface DocumentsModalProps {
  guest: Guest;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function DocumentsModal({ guest, onClose, onUpdate }: DocumentsModalProps) {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<GuestDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all documents for the guest and associated guests
  console.log("DocumentsModal Render: guest name:", guest.name, "prop documents:", guest.documents);
  const allDocuments = guest.documents || [];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const newDocuments: GuestDocument[] = [];
      
      for (let i = 0; i < files.length; i++) {
        try {
          const document = await createGuestDocument(files[i], guest.id, 'admin');
          newDocuments.push(document);
        } catch (err) {
          setUploadError(`Failed to upload ${files[i].name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          continue;
        }
      }

      if (newDocuments.length > 0) {
        console.log("DocumentsModal handleFileSelect: Current guest documents count:", allDocuments.length);
        console.log("DocumentsModal handleFileSelect: New documents count:", newDocuments.length);
        const updatedDocuments = [...allDocuments, ...newDocuments];
        console.log("DocumentsModal handleFileSelect: Saving updated documents to db:", updatedDocuments);
        await updateGuest(guest.id, { documents: updatedDocuments });
        console.log("DocumentsModal handleFileSelect: Calling onUpdate...");
        onUpdate?.();
      }
    } catch (err) {
      console.error("DocumentsModal handleFileSelect error:", err);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload documents');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadSelected = () => {
    const docsToDownload = allDocuments.filter(doc => selectedDocuments.includes(doc.id));
    if (docsToDownload.length === 1) {
      downloadDocument(docsToDownload[0]);
    } else {
      downloadDocumentsAsZip(docsToDownload, guest.name);
    }
  };

  const handleDownloadAll = () => {
    if (allDocuments.length === 0) return;
    downloadDocumentsAsZip(allDocuments, guest.name);
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedDocuments.length} document(s)?`)) return;

    const updatedDocuments = allDocuments.filter(doc => !selectedDocuments.includes(doc.id));
    await updateGuest(guest.id, { documents: updatedDocuments });
    setSelectedDocuments([]);
    onUpdate?.();
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDocuments.length === allDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(allDocuments.map(doc => doc.id));
    }
  };

  const getRelatedGuestName = (relatedGuestId?: string) => {
    if (!relatedGuestId) return null;
    const relatedGuest = guest.additionalGuests?.find(g => 
      // Since additional guests don't have IDs, we'll match by other criteria
      // This is a simplified version - you might need to adjust based on your data structure
      relatedGuestId === guest.id
    );
    return relatedGuest?.name || 'Associated Guest';
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
              <p className="text-sm text-gray-600 mt-1">
                {guest.name} {allDocuments.length > 0 && `• ${allDocuments.length} document(s)`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                Upload Documents
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedDocuments.length > 0 && (
                <>
                  <button
                    onClick={handleDownloadSelected}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Selected ({selectedDocuments.length})
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {allDocuments.length > 0 && (
                <>
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {selectedDocuments.length === allDocuments.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    Select All
                  </button>
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download All as Zip
                  </button>
                </>
              )}

              <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded ${
                    viewMode === 'grid' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded ${
                    viewMode === 'list' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {uploadError}
            </div>
          )}

          {/* Documents Grid/List */}
          <div className="flex-1 overflow-y-auto p-6">
            {allDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <FileText className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No documents uploaded</p>
                <p className="text-sm mt-2">Click "Upload Documents" to add documents for this guest</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allDocuments.map((doc) => {
                  const previewUrl = getPreviewUrl(doc);
                  const isSelected = selectedDocuments.includes(doc.id);

                  return (
                    <div
                      key={doc.id}
                      className={`relative border rounded-lg overflow-hidden transition-all ${
                        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="aspect-square bg-gray-100 flex items-center justify-center cursor-pointer"
                        onClick={() => setPreviewDocument(doc)}
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt={doc.fileName} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="h-16 w-16 text-gray-400" />
                        )}
                      </div>
                      <div className="p-2 bg-white">
                        <p className="text-xs font-medium text-gray-900 truncate" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDocumentSelection(doc.id);
                        }}
                        className="absolute top-2 right-2 p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {allDocuments.map((doc) => {
                  const isSelected = selectedDocuments.includes(doc.id);
                  const relatedName = getRelatedGuestName(doc.relatedGuestId);

                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                        isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => toggleDocumentSelection(doc.id)}
                        className="flex-shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      <div className="flex-shrink-0">
                        {getPreviewUrl(doc) ? (
                          <img
                            src={getPreviewUrl(doc)!}
                            alt={doc.fileName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <FileText className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          {relatedName && (
                            <>
                              <span>•</span>
                              <span>{relatedName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewDocument(doc)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          title="Preview"
                        >
                          <FileCheck className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{previewDocument.fileName}</h3>
                <p className="text-sm text-gray-500">{formatFileSize(previewDocument.fileSize)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadDocument(previewDocument)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {previewDocument.fileType.startsWith('image/') ? (
                <img
                  src={previewDocument.base64Data}
                  alt={previewDocument.fileName}
                  className="max-w-full h-auto mx-auto"
                />
              ) : previewDocument.fileType === 'application/pdf' ? (
                <iframe
                  src={previewDocument.base64Data}
                  className="w-full h-[70vh]"
                  title={previewDocument.fileName}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <FileText className="h-16 w-16 mb-4 text-gray-300" />
                  <p>Preview not available for this file type</p>
                  <button
                    onClick={() => downloadDocument(previewDocument)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Download to View
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
