import { useState, useRef } from "react";
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
  const [documentType, setDocumentType] = useState<string>('OTHER');
  const [scanMode, setScanMode] = useState<'upload' | 'scan' | 'photo'>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [notes, setNotes] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      resetForm();
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

  const resetForm = () => {
    setIsOpen(false);
    setFiles(null);
    setScannedText('');
    setNotes('');
    setScanMode('upload');
    stopCamera();
  };

  const handleModeChange = (mode: 'upload' | 'scan' | 'photo') => {
    stopCamera(); // Stop camera when switching modes
    setFiles(null); // Clear selected files
    setScannedText(''); // Clear any scanned text
    setScanMode(mode);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use rear camera on mobile
      });
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            setFiles(dataTransfer.files);
            stopCamera();
            
            toast({
              title: "Success",
              description: "Photo captured successfully",
            });
          }
        }, 'image/jpeg', 0.8);
      }
    }
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
                onClick={() => handleModeChange('upload')}
                className="flex-1"
                data-testid="button-mode-upload"
              >
                <File className="h-4 w-4 mr-2" />
                File Upload
              </Button>
              <Button
                type="button"
                variant={scanMode === 'scan' ? 'default' : 'outline'}
                onClick={() => handleModeChange('scan')}
                className="flex-1"
                data-testid="button-mode-scan"
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan & Convert
              </Button>
              <Button
                type="button"
                variant={scanMode === 'photo' ? 'default' : 'outline'}
                onClick={() => handleModeChange('photo')}
                className="flex-1"
                data-testid="button-mode-photo"
              >
                <Camera className="h-4 w-4 mr-2" />
                Photo Capture
              </Button>
            </div>
          </div>

          {/* File Selection - Only show for upload mode */}
          {scanMode === 'upload' && (
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
          )}

          {/* Scan Mode - File Selection */}
          {scanMode === 'scan' && (
            <div className="space-y-2">
              <Label htmlFor="scan-files">Select Document to Scan</Label>
              <Input
                id="scan-files"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={handleFileChange}
                data-testid="input-scan-files"
              />
              <p className="text-sm text-gray-500">
                Select an image or PDF file to extract text with OCR
              </p>
            </div>
          )}

          {/* Photo Capture Mode */}
          {scanMode === 'photo' && (
            <div className="space-y-4">
              {!isCapturing ? (
                <div className="text-center">
                  <Button
                    type="button"
                    onClick={startCamera}
                    className="w-full"
                    data-testid="button-start-camera"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Click to start camera and capture document photos
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1"
                      data-testid="button-capture-photo"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stopCamera}
                      data-testid="button-stop-camera"
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  <p className="text-sm text-gray-500 text-center">
                    Position document within the camera view and click capture
                  </p>
                </div>
              )}
              
              {files && files.length > 0 && (
                <div className="text-sm text-green-600">
                  ✓ Photo captured: {files[0].name}
                </div>
              )}
            </div>
          )}

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
                {/* Personal Identity Documents */}
                <SelectItem value="BIRTH_CERTIFICATE">Birth Certificate</SelectItem>
                <SelectItem value="MARRIAGE_CERTIFICATE">Marriage Certificate</SelectItem>
                <SelectItem value="PASSPORT">Passport</SelectItem>
                <SelectItem value="ID_CARD">ID Card</SelectItem>
                <SelectItem value="DIPLOMA">Diploma</SelectItem>
                <SelectItem value="EMPLOYMENT_CONTRACT">Employment Contract</SelectItem>
                <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                
                {/* Romanian Immigration Forms */}
                <SelectItem value="WORK_CONTRACT_TEMPLATE">Work Contract Template</SelectItem>
                <SelectItem value="POWER_OF_ATTORNEY_TEMPLATE">Power of Attorney Template</SelectItem>
                <SelectItem value="JOB_DESCRIPTION_TEMPLATE">Job Description Template</SelectItem>
                <SelectItem value="VISA_APPLICATION_FORM">Visa Application Form</SelectItem>
                <SelectItem value="RESIDENCE_APPLICATION_TEMPLATE">Residence Application Template</SelectItem>
                <SelectItem value="AJOFM_WORK_PERMIT_APPLICATION">AJOFM Work Permit Application</SelectItem>
                <SelectItem value="IGI_WORK_PERMIT_APPLICATION">IGI Work Permit Application</SelectItem>
                <SelectItem value="CONSULATE_VISA_FORM">Consulate Visa Form</SelectItem>
                <SelectItem value="IGI_RESIDENCE_PERMIT_FORM">IGI Residence Permit Form</SelectItem>
                
                {/* Supporting Documents */}
                <SelectItem value="MEDICAL_CERTIFICATE">Medical Certificate</SelectItem>
                <SelectItem value="CRIMINAL_RECORD_CERTIFICATE">Criminal Record Certificate</SelectItem>
                <SelectItem value="APOSTILLE_DOCUMENT">Apostille Document</SelectItem>
                <SelectItem value="TRANSLATION_CERTIFICATE">Translation Certificate</SelectItem>
                <SelectItem value="HOUSING_CONTRACT">Housing Contract</SelectItem>
                <SelectItem value="COMPANY_REGISTRATION_CERTIFICATE">Company Registration Certificate</SelectItem>
                <SelectItem value="TAX_CERTIFICATE">Tax Certificate</SelectItem>
                <SelectItem value="SALARY_CERTIFICATE">Salary Certificate</SelectItem>
                <SelectItem value="INSURANCE_CERTIFICATE">Insurance Certificate</SelectItem>
                
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Scan & Convert Interface */}
          {scanMode === 'scan' && (
            <div className="space-y-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <div className="text-center">
                <Scan className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium">Document Scanner</h3>
                <p className="text-sm text-gray-500">Professional OCR scanning and text extraction</p>
              </div>

              {!files || files.length === 0 ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">Select a document to begin scanning</p>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('scan-files')?.click()}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <File className="h-8 w-8 mb-2" />
                      <span className="text-sm">Choose File</span>
                      <span className="text-xs text-gray-500">PDF, Images</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleModeChange('photo')}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Camera className="h-8 w-8 mb-2" />
                      <span className="text-sm">Take Photo</span>
                      <span className="text-xs text-gray-500">Use Camera</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Document Preview */}
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <File className="h-5 w-5 text-blue-500" />
                        <span className="font-medium text-sm">{files[0].name}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {(files[0].size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    
                    {files[0].type.startsWith('image/') && (
                      <div className="mt-2">
                        <img 
                          src={URL.createObjectURL(files[0])} 
                          alt="Document preview"
                          className="max-h-32 rounded border object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Scan Controls */}
                  <div className="bg-white rounded-lg p-4 border space-y-3">
                    <Label className="font-medium">OCR Settings</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Language</Label>
                        <select className="w-full p-2 border rounded text-sm" defaultValue="eng+ron">
                          <option value="eng">English</option>
                          <option value="ron">Romanian</option>
                          <option value="eng+ron">English + Romanian</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Quality</Label>
                        <select className="w-full p-2 border rounded text-sm" defaultValue="2">
                          <option value="1">Fast</option>
                          <option value="2">Balanced</option>
                          <option value="3">Accurate</option>
                        </select>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      onClick={handleScanDocument}
                      disabled={isScanning}
                      className="w-full"
                      data-testid="button-scan-document"
                    >
                      {isScanning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Scanning Document...
                          <span className="ml-2 text-xs opacity-75">This may take a moment</span>
                        </>
                      ) : (
                        <>
                          <Scan className="h-4 w-4 mr-2" />
                          Start OCR Scan
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Scan Results */}
                  {scannedText && (
                    <div className="bg-white rounded-lg p-4 border space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Extracted Text</Label>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(scannedText)}
                          >
                            Copy Text
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setScannedText('')}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      
                      <Textarea
                        value={scannedText}
                        onChange={(e) => setScannedText(e.target.value)}
                        rows={8}
                        className="text-sm font-mono"
                        placeholder="Extracted text will appear here..."
                        data-testid="textarea-scanned-text"
                      />
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{scannedText.length} characters extracted</span>
                        <span>You can edit the text before saving</span>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Auto-detect and extract common field patterns
                            const lines = scannedText.split('\n');
                            // This could be enhanced with more sophisticated field detection
                            console.log('Auto-detecting fields from text:', lines);
                          }}
                        >
                          Auto-Detect Fields
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Convert to structured format
                            const structured = scannedText.split('\n').filter(line => line.trim());
                            setScannedText(structured.join('\n'));
                          }}
                        >
                          Clean Format
                        </Button>
                      </div>
                    </div>
                  )}
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
              onClick={resetForm}
              data-testid="button-cancel"
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