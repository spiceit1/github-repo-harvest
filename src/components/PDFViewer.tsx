import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, currentPage, setCurrentPage }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(600);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const updatePageWidth = () => {
      const container = document.getElementById('pdf-container');
      if (container) {
        setPageWidth((container.clientWidth - 40) / scale);
      }
    };

    updatePageWidth();
    window.addEventListener('resize', updatePageWidth);
    
    return () => window.removeEventListener('resize', updatePageWidth);
  }, [scale]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (numPages && currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.6));
  };

  const rotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };

  return (
    <div id="pdf-container" className="flex flex-col items-center">
      <div className="flex justify-between w-full mb-3">
        <div className="flex space-x-2">
          <button
            onClick={zoomOut}
            className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={zoomIn}
            className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={rotate}
            className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {Math.round(scale * 100)}%
        </span>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center h-64 w-full">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        className="border border-gray-200 rounded"
        loading={
          <div className="flex justify-center items-center h-64 w-full">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        }
        error={
          <div className="flex justify-center items-center h-64 w-full text-red-500">
            Failed to load PDF. Please check if the file is valid.
          </div>
        }
      >
        <Page 
          pageNumber={currentPage} 
          width={pageWidth}
          scale={scale}
          rotate={rotation}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={
            <div className="flex justify-center items-center h-64 w-full">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          }
        />
      </Document>
      
      <div className="flex items-center justify-between w-full mt-4">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </button>
        
        <p className="text-sm text-gray-600">
          Page {currentPage} of {numPages || '--'}
        </p>
        
        <button
          onClick={goToNextPage}
          disabled={!numPages || currentPage >= numPages}
          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default PDFViewer;