'use client';

import React, { useState } from 'react';

interface FileUploadProps {
  onFileLoaded: (text: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Dynamically import PDF.js only in the browser
      const pdfjs = await import('pdfjs-dist');
      
      // Configure PDF.js worker
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join('\n');
        fullText += pageText + '\n\n';
      }
      
      onFileLoaded(fullText);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF. Please try another file.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="file-upload">
      <div className="upload-area">
        <label htmlFor="file-input" className="upload-label">
          {isLoading ? (
            <>
              <div className="spinner"></div>
              <span>Loading PDF...</span>
            </>
          ) : (
            <>
              <div className="upload-icon">📄</div>
              <h3>Upload Guitar Tab PDF</h3>
              <p>Click to select or drag and drop</p>
              <p className="hint">Supports standard guitar tablature PDFs</p>
            </>
          )}
        </label>
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};
