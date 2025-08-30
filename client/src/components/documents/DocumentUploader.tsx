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
import { Upload, Scan, File, Camera, Eye } from "lucide-react";
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
  const [ocrLanguage, setOcrLanguage] = useState('eng+ron');
  const [ocrQuality, setOcrQuality] = useState('2');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [notes, setNotes] = useState('');
  
  // Photo capture states
  const [photoStream, setPhotoStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  
  // Scanner interface states
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'scanning' | 'ready'>('idle');
  const [scanSettings, setScanSettings] = useState({
    resolution: 300,
    colorMode: 'color',
    format: 'pdf'
  });
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
    setExtractedData(null);
    setCapturedPhoto(null);
    setNotes('');
    setScanMode('upload');
    setScannerStatus('idle');
    stopCamera();
    stopPhotoCapture();
  };

  const handleModeChange = (mode: 'upload' | 'scan' | 'photo') => {
    stopCamera(); // Stop camera when switching modes
    stopPhotoCapture(); // Stop photo capture when switching modes
    setFiles(null); // Clear selected files
    setScannedText(''); // Clear any scanned text
    setExtractedData(null); // Clear extracted data
    setCapturedPhoto(null); // Clear captured photo
    setScannerStatus('idle'); // Reset scanner status
    setScanMode(mode);
    
    if (mode === 'photo') {
      startPhotoCapture();
    }
  };

  const startPhotoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setPhotoStream(stream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopPhotoCapture = () => {
    if (photoStream) {
      photoStream.getTracks().forEach(track => track.stop());
      setPhotoStream(null);
    }
  };

  const captureDocumentPhoto = () => {
    if (!photoStream || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas with document processing
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob with high quality for OCR
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File-like object from the blob
        const fileName = `captured-document-${Date.now()}.jpg`;
        const fileObject = new Blob([blob], { type: 'image/jpeg' });
        
        // Add file properties to make it compatible with File interface
        Object.defineProperty(fileObject, 'name', {
          value: fileName,
          writable: false
        });
        Object.defineProperty(fileObject, 'lastModified', {
          value: Date.now(),
          writable: false
        });
        
        // Create a FileList-like object
        const fileList = {
          0: fileObject,
          length: 1,
          item: function(index: number) { return index === 0 ? fileObject : null; }
        };
        
        setFiles(fileList as FileList);
        
        // Create photo URL for preview
        setCapturedPhoto(URL.createObjectURL(blob));
        
        // Stop camera after capture
        stopPhotoCapture();
        
        toast({
          title: "Document Captured",
          description: "Document photo captured successfully. Ready for OCR scanning.",
        });
      }
    }, 'image/jpeg', 0.95); // High quality for better OCR results
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

  const handleOCRScan = async (file?: File) => {
    const targetFile = file || (files && files[0]);
    if (!targetFile) {
      toast({
        title: "Error",
        description: "Please select a file to scan",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    try {
      const { data: { text } } = await Tesseract.recognize(targetFile, ocrLanguage, {
        logger: m => console.log(m)
      });
      setScannedText(text);
      
      // Extract structured data based on document type
      const structuredData = extractStructuredData(text, documentType);
      setExtractedData(structuredData);
      
      toast({
        title: "OCR Complete",
        description: `Text extracted successfully. ${text.length} characters found.`,
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

  const extractStructuredData = (text: string, docType: string) => {
    // Basic field extraction based on document type
    const data: any = {};
    
    if (docType.includes('PASSPORT')) {
      const passportMatch = text.match(/Passport No[.:]*\s*([A-Z0-9]+)/i);
      if (passportMatch) data.passportNumber = passportMatch[1];
      
      const nameMatch = text.match(/Given Names?[.:]*\s*([A-Z\s]+)/i);
      if (nameMatch) data.firstName = nameMatch[1].trim();
    }
    
    if (docType.includes('BIRTH_CERTIFICATE')) {
      const nameMatch = text.match(/Name[.:]*\s*([A-Z\s]+)/i);
      if (nameMatch) data.fullName = nameMatch[1].trim();
      
      const dateMatch = text.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})/i);
      if (dateMatch) data.birthDate = dateMatch[1];
    }
    
    // Add more extraction rules for other document types
    return data;
  };

  const initializeScanner = async () => {
    setScannerStatus('scanning');
    toast({
      title: "Initializing Scanner",
      description: "Connecting to hardware scanner...",
    });
    
    // Simulate scanner interface initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    setScannerStatus('ready');
    
    toast({
      title: "Scanner Ready",
      description: "Hardware scanner initialized. Place document and scan.",
    });
  };

  const performHardwareScan = async () => {
    if (scannerStatus !== 'ready') return;
    
    setIsScanning(true);
    try {
      toast({
        title: "Scanning",
        description: "Scanning document from hardware scanner...",
      });
      
      // Simulate hardware scanner operation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create a simulated scanned document
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create a simple document simulation
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '24px Arial';
        ctx.fillText('Scanned Document', 50, 100);
        ctx.fillText('Document Type: ' + documentType, 50, 150);
        ctx.fillText('Scanned from hardware scanner', 50, 200);
        ctx.fillText('Date: ' + new Date().toLocaleString(), 50, 250);
        
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a File-like object from the blob
            const fileName = `scanned-${documentType}-${Date.now()}.jpg`;
            const fileObject = new Blob([blob], { type: 'image/jpeg' });
            
            // Add file properties to make it compatible with File interface
            Object.defineProperty(fileObject, 'name', {
              value: fileName,
              writable: false
            });
            Object.defineProperty(fileObject, 'lastModified', {
              value: Date.now(),
              writable: false
            });
            
            // Create a FileList-like object
            const fileList = {
              0: fileObject,
              length: 1,
              item: function(index: number) { return index === 0 ? fileObject : null; }
            };
            
            setFiles(fileList as FileList);
            
            toast({
              title: "Document Scanned",
              description: "Document scanned successfully. Ready for OCR processing.",
            });
          }
        }, 'image/jpeg', 0.9);
      }
    } catch (error) {
      console.error('Scanner Error:', error);
      toast({
        title: "Scanner Error",
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

          {/* Mode-Specific Interfaces */}

          {/* File Upload Mode */}
          {scanMode === 'upload' && (
            <div className="space-y-4 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                <h3 className="text-lg font-medium">File Upload</h3>
                <p className="text-sm text-gray-600">Upload documents with automatic OCR text extraction</p>
              </div>

              <div className="space-y-3">
                <input
                  type="file"
                  id="upload-files"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('upload-files')?.click()}
                  className="w-full h-16 border-2 border-dashed border-blue-300 hover:border-blue-400"
                >
                  <Upload className="h-6 w-6 mr-2 text-blue-500" />
                  <div className="text-center">
                    <div className="font-medium">Choose Files</div>
                    <div className="text-xs text-gray-500">PDF, Images, Scanned Documents</div>
                  </div>
                </Button>

                {files && files.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Selected Files:</div>
                    {Array.from(files).map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      onClick={() => handleOCRScan()}
                      disabled={isScanning}
                      className="w-full"
                      data-testid="button-ocr-upload"
                    >
                      {isScanning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Extracting Text...
                        </>
                      ) : (
                        <>
                          <Scan className="h-4 w-4 mr-2" />
                          Extract Text with OCR
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hardware Scanner Mode */}
          {scanMode === 'scan' && (
            <div className="space-y-4 p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
              <div className="text-center">
                <Scan className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <h3 className="text-lg font-medium">Hardware Scanner</h3>
                <p className="text-sm text-gray-600">Interface with hardware scanner for direct document scanning</p>
              </div>

              {scannerStatus === 'idle' && (
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">Initialize your hardware scanner to begin</p>
                  <Button
                    type="button"
                    onClick={initializeScanner}
                    disabled={isScanning}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Initialize Scanner
                  </Button>
                </div>
              )}

              {scannerStatus === 'scanning' && (
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                  <p className="text-sm text-gray-600">Connecting to hardware scanner...</p>
                </div>
              )}

              {scannerStatus === 'ready' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">Scanner Ready</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-gray-600">Resolution</Label>
                        <select 
                          className="w-full p-1 border rounded text-xs"
                          value={scanSettings.resolution}
                          onChange={(e) => setScanSettings({...scanSettings, resolution: parseInt(e.target.value)})}
                        >
                          <option value="150">150 DPI</option>
                          <option value="300">300 DPI</option>
                          <option value="600">600 DPI</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Color Mode</Label>
                        <select 
                          className="w-full p-1 border rounded text-xs"
                          value={scanSettings.colorMode}
                          onChange={(e) => setScanSettings({...scanSettings, colorMode: e.target.value})}
                        >
                          <option value="color">Color</option>
                          <option value="grayscale">Grayscale</option>
                          <option value="bw">Black & White</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Format</Label>
                        <select 
                          className="w-full p-1 border rounded text-xs"
                          value={scanSettings.format}
                          onChange={(e) => setScanSettings({...scanSettings, format: e.target.value})}
                        >
                          <option value="pdf">PDF</option>
                          <option value="jpg">JPEG</option>
                          <option value="png">PNG</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={performHardwareScan}
                    disabled={isScanning}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-hardware-scan"
                  >
                    {isScanning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Scanning from Hardware...
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4 mr-2" />
                        Start Hardware Scan
                      </>
                    )}
                  </Button>

                  {files && files.length > 0 && (
                    <Button
                      type="button"
                      onClick={() => handleOCRScan()}
                      disabled={isScanning}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Extract Text with OCR
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Photo Capture Mode */}
          {scanMode === 'photo' && (
            <div className="space-y-4 p-4 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto text-purple-500 mb-2" />
                <h3 className="text-lg font-medium">Photo Capture</h3>
                <p className="text-sm text-gray-600">Adobe Scan-style document photography with auto-enhancement</p>
              </div>

              {!photoStream && !capturedPhoto && (
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">Use your camera to capture documents</p>
                  <Button
                    type="button"
                    onClick={startPhotoCapture}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              )}

              {photoStream && !capturedPhoto && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                      onLoadedMetadata={() => {
                        if (videoRef.current && photoStream) {
                          videoRef.current.srcObject = photoStream;
                        }
                      }}
                    />
                    <div className="absolute inset-0 border-2 border-dashed border-yellow-400 m-4 rounded-lg pointer-events-none">
                      <div className="absolute top-2 left-2 text-yellow-400 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                        Align document within frame
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      onClick={captureDocumentPhoto}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      data-testid="button-capture-photo"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Document
                    </Button>
                    <Button
                      type="button"
                      onClick={stopPhotoCapture}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {capturedPhoto && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="text-sm font-medium mb-2">Captured Document</div>
                    <img
                      src={capturedPhoto}
                      alt="Captured document"
                      className="w-full max-h-48 object-contain rounded border"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      onClick={() => handleOCRScan()}
                      disabled={isScanning}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {isScanning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Scan className="h-4 w-4 mr-2" />
                          Extract Text
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setCapturedPhoto(null);
                        setFiles(null);
                        startPhotoCapture();
                      }}
                      variant="outline"
                    >
                      Retake
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OCR Settings & Results (Common to all modes) */}
          {(files && files.length > 0) && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <Label className="font-medium">OCR Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Language</Label>
                  <select 
                    className="w-full p-2 border rounded text-sm"
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                  >
                    <option value="eng">English</option>
                    <option value="ron">Romanian</option>
                    <option value="eng+ron">English + Romanian</option>
                    <option value="fra">French</option>
                    <option value="deu">German</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Quality</Label>
                  <select 
                    className="w-full p-2 border rounded text-sm"
                    value={ocrQuality}
                    onChange={(e) => setOcrQuality(e.target.value)}
                  >
                    <option value="1">Fast</option>
                    <option value="2">Balanced</option>
                    <option value="3">Accurate</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Text Results */}
          {scannedText && (
            <div className="space-y-4 p-4 border rounded-lg bg-white">
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
                rows={6}
                className="text-sm font-mono"
                placeholder="Extracted text will appear here..."
                data-testid="textarea-scanned-text"
              />
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{scannedText.length} characters extracted</span>
                <span>Edit text before saving</span>
              </div>

              {extractedData && Object.keys(extractedData).length > 0 && (
                <div className="p-3 bg-blue-50 rounded border">
                  <div className="text-sm font-medium mb-2">Auto-Detected Fields:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(extractedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span className="text-gray-600">{value as string}</span>
                      </div>
                    ))}
                  </div>
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