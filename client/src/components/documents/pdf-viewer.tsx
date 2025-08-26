import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentUrl?: string;
}

export default function PDFViewer({ isOpen, onClose, documentTitle, documentUrl }: PDFViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-5/6 flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">{documentTitle}</DialogTitle>
              <p className="text-sm text-secondary">Generated PDF with client data auto-populated</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" data-testid="button-download-pdf">
                <i className="fas fa-download mr-2"></i>Download
              </Button>
              <Button variant="outline" data-testid="button-print-pdf">
                <i className="fas fa-print mr-2"></i>Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 p-6 bg-gray-100 overflow-auto">
          <div className="h-full bg-surface rounded-lg shadow-inner flex items-center justify-center">
            {/* Mock PDF Document Preview */}
            <div className="text-center">
              <div className="bg-surface border-4 border-gray-200 rounded-lg shadow-lg w-96 h-96 mx-auto flex flex-col p-8 text-left relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <div className="transform rotate-45 text-6xl font-bold text-gray-400">
                    PREVIEW
                  </div>
                </div>
                
                {/* Document Content */}
                <div className="text-center mb-6">
                  <h3 className="font-bold text-lg">CONTRACT INDIVIDUAL DE MUNCĂ</h3>
                  <p className="text-sm text-secondary">Nr. 2024/001</p>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <strong>Angajator:</strong> <span className="bg-blue-100 px-2 py-1 rounded">TechCorp Solutions SRL</span>
                  </div>
                  <div>
                    <strong>CUI:</strong> <span className="bg-blue-100 px-2 py-1 rounded font-mono">RO12345678</span>
                  </div>
                  <div>
                    <strong>Adresa:</strong> <span className="bg-blue-100 px-2 py-1 rounded">Calea Victoriei 15, Bucuresti</span>
                  </div>
                  
                  <hr className="border-gray-300" />
                  
                  <div>
                    <strong>Angajat:</strong> <span className="bg-green-100 px-2 py-1 rounded">John Smith</span>
                  </div>
                  <div>
                    <strong>Cetățenie:</strong> <span className="bg-green-100 px-2 py-1 rounded">USA</span>
                  </div>
                  <div>
                    <strong>Pașaport:</strong> <span className="bg-green-100 px-2 py-1 rounded font-mono">US1234567</span>
                  </div>
                  
                  <hr className="border-gray-300" />
                  
                  <div>
                    <strong>Funcția:</strong> <span className="bg-yellow-100 px-2 py-1 rounded">Senior Software Developer</span>
                  </div>
                  <div>
                    <strong>Salariul:</strong> <span className="bg-yellow-100 px-2 py-1 rounded">15,000 RON</span>
                  </div>
                </div>
                
                <div className="mt-auto text-xs text-secondary">
                  <p>Document generat automat • Watermark: john.smith@techcorp.ro</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-secondary text-sm">PDF.js Document Viewer</p>
                <p className="text-xs text-secondary mt-1">
                  Preview of auto-populated template with client data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-secondary">
              <i className="fas fa-info-circle mr-1"></i>
              This document contains auto-populated data from your profile
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={onClose} data-testid="button-cancel-pdf">
                Cancel
              </Button>
              <Button data-testid="button-confirm-submit">
                Confirm & Submit
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
