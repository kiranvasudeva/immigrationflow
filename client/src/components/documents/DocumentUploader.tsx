import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Scan, File, Camera } from "lucide-react";
import Tesseract from 'tesseract.js';
import jsPDF from 'jspdf';

interface DocumentUploaderProps {
  assignmentId: string;
  onUploadComplete?: () => void;
}

export function DocumentUploader({ assignmentId, onUploadComplete }: DocumentUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [documentKind, setDocumentKind] = useState<'USER_UPLOAD' | 'ADMIN_RECEIPT' | 'GENERATED_PDF'>('USER_UPLOAD');
  const [documentType, setDocumentType] = useState<'BIRTH_CERTIFICATE' | 'MARRIAGE_CERTIFICATE' | 'PASSPORT' | 'ID_CARD' | 'DIPLOMA' | 'EMPLOYMENT_CONTRACT' | 'BANK_STATEMENT' | 'OTHER'>('OTHER');
  const [scanMode, setScanMode] = useState<'upload' | 'scan' | 'photo'>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", `/api/assignments/${assignmentId}/documents`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      setIsOpen(false);
      setFiles(null);
      setScannedText('');
      setNotes('');
      onUploadComplete?.();
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', assignmentId, 'documents'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
  };

  const handleScanDocument = async () => {
    if (!files || files.length === 0) {
      toast({
        title: "Error",
        description: "Please select a file to scan",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    try {
      const file = files[0];
      const { data: { text } } = await Tesseract.recognize(file, 'eng+ron', {
        logger: m => console.log(m)
      });
      setScannedText(text);
      toast({
        title: "Success",
        description: "Document scanned successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to scan document",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const convertToPDF = async (text: string, originalFileName: string) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 10;
    let y = margin;

    // Add title
    doc.setFontSize(16);
    doc.text('Scanned Document', margin, y);
    y += lineHeight * 2;

    // Add original filename
    doc.setFontSize(12);
    doc.text(`Original: ${originalFileName}`, margin, y);
    y += lineHeight * 2;

    // Add scanned text
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 2 * margin);
    
    for (let i = 0; i < lines.length; i++) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(lines[i], margin, y);
      y += lineHeight;
    }

    return doc.output('blob');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files || files.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    
    // If we have scanned text, create a PDF version
    if (scannedText && files[0]) {
      const pdfBlob = await convertToPDF(scannedText, files[0].name);
      const pdfFile = new File([pdfBlob], `scanned_${files[0].name}.pdf`, { type: 'application/pdf' });
      formData.append('files', pdfFile);
      formData.append('scannedText', scannedText);
    } else {
      // Upload original files
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
    }
    
    formData.append('documentKind', documentKind);
    formData.append('documentType', documentType);
    if (notes) {
      formData.append('notes', notes);
    }

    uploadMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-upload-document">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Mode Selection */}
          <div className="space-y-3">
            <Label>Upload Method</Label>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={scanMode === 'upload' ? 'default' : 'outline'}
                onClick={() => setScanMode('upload')}
                className="flex-1"
              >
                <File className="h-4 w-4 mr-2" />
                File Upload
              </Button>
              <Button
                type="button"
                variant={scanMode === 'scan' ? 'default' : 'outline'}
                onClick={() => setScanMode('scan')}
                className="flex-1"
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan & Convert
              </Button>
              <Button
                type="button"
                variant={scanMode === 'photo' ? 'default' : 'outline'}
                onClick={() => setScanMode('photo')}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Photo Capture
              </Button>
            </div>
          </div>

          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="files">Select Files</Label>
            <Input
              id="files"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
              onChange={handleFileChange}
              data-testid="input-document-files"
            />
            <p className="text-sm text-gray-500">
              Supported formats: PDF, Images (JPG, PNG, GIF), Documents (DOC, DOCX), Text files
            </p>
          </div>

          {/* Document Kind */}
          <div className="space-y-2">
            <Label>Document Kind</Label>
            <Select value={documentKind} onValueChange={(value: any) => setDocumentKind(value)}>
              <SelectTrigger data-testid="select-document-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER_UPLOAD">User Upload</SelectItem>
                <SelectItem value="ADMIN_RECEIPT">Admin Receipt</SelectItem>
                <SelectItem value="GENERATED_PDF">Generated PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={documentType} onValueChange={(value: any) => setDocumentType(value)}>
              <SelectTrigger data-testid="select-document-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BIRTH_CERTIFICATE">Birth Certificate</SelectItem>
                <SelectItem value="MARRIAGE_CERTIFICATE">Marriage Certificate</SelectItem>
                <SelectItem value="PASSPORT">Passport</SelectItem>
                <SelectItem value="ID_CARD">ID Card</SelectItem>
                <SelectItem value="DIPLOMA">Diploma</SelectItem>
                <SelectItem value="EMPLOYMENT_CONTRACT">Employment Contract</SelectItem>
                <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scan Functionality */}
          {scanMode === 'scan' && files && files.length > 0 && (
            <div className="space-y-3">
              <Button
                type="button"
                onClick={handleScanDocument}
                disabled={isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="h-4 w-4 mr-2" />
                    Scan Document
                  </>
                )}
              </Button>
              
              {scannedText && (
                <div className="space-y-2">
                  <Label>Scanned Text</Label>
                  <Textarea
                    value={scannedText}
                    onChange={(e) => setScannedText(e.target.value)}
                    rows={6}
                    className="text-sm"
                    placeholder="Scanned text will appear here..."
                  />
                  <p className="text-sm text-gray-500">
                    You can edit the scanned text before converting to PDF
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this document..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending || !files || files.length === 0}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}