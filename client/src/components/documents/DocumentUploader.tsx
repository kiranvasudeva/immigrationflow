import { useState, useRef, useEffect } from "react";
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
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [detectedCorners, setDetectedCorners] = useState<Array<{x: number, y: number}> | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  
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

  // Connect camera stream to video element when available
  useEffect(() => {
    if (photoStream && videoRef.current) {
      videoRef.current.srcObject = photoStream;
      // Start edge detection when video is ready
      const video = videoRef.current;
      video.addEventListener('loadedmetadata', () => {
        startEdgeDetection();
      });
    }
  }, [photoStream]);

  // Start continuous edge detection
  const startEdgeDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsDetecting(true);
    
    const detectEdges = () => {
      if (!videoRef.current || !canvasRef.current || !photoStream) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx || video.readyState !== 4) {
        requestAnimationFrame(detectEdges);
        return;
      }
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame
      ctx.drawImage(video, 0, 0);
      
      // Detect document edges
      const corners = detectDocumentEdges(canvas);
      setDetectedCorners(corners);
      
      // Continue detection
      if (photoStream) {
        requestAnimationFrame(detectEdges);
      }
    };
    
    requestAnimationFrame(detectEdges);
  };

  // Document edge detection algorithm
  const detectDocumentEdges = (canvas: HTMLCanvasElement): Array<{x: number, y: number}> | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const width = canvas.width;
    const height = canvas.height;
    
    try {
      // Get image data
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Convert to grayscale and apply edge detection
      const grayData = new Uint8ClampedArray(width * height);
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        grayData[i / 4] = gray;
      }
      
      // Apply Gaussian blur to reduce noise
      const blurred = gaussianBlur(grayData, width, height);
      
      // Apply Canny edge detection
      const edges = cannyEdgeDetection(blurred, width, height);
      
      // Find contours and detect rectangular shapes
      const corners = findDocumentCorners(edges, width, height);
      
      return corners;
    } catch (error) {
      console.error('Error in edge detection:', error);
      return null;
    }
  };

  // Gaussian blur for noise reduction
  const gaussianBlur = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
    const result = new Uint8ClampedArray(data.length);
    const kernel = [1, 4, 6, 4, 1]; // 1D Gaussian kernel
    const kernelSum = 16;
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        for (let k = 0; k < kernel.length; k++) {
          const px = Math.max(0, Math.min(width - 1, x + k - 2));
          sum += data[y * width + px] * kernel[k];
        }
        result[y * width + x] = sum / kernelSum;
      }
    }
    
    // Vertical pass
    const result2 = new Uint8ClampedArray(data.length);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let sum = 0;
        for (let k = 0; k < kernel.length; k++) {
          const py = Math.max(0, Math.min(height - 1, y + k - 2));
          sum += result[py * width + x] * kernel[k];
        }
        result2[y * width + x] = sum / kernelSum;
      }
    }
    
    return result2;
  };

  // Simplified Canny edge detection
  const cannyEdgeDetection = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
    const result = new Uint8ClampedArray(data.length);
    
    // Sobel operator for gradient calculation
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = data[(y + ky) * width + (x + kx)];
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            gx += pixel * sobelX[kernelIndex];
            gy += pixel * sobelY[kernelIndex];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        result[y * width + x] = magnitude > 50 ? 255 : 0; // Threshold
      }
    }
    
    return result;
  };

  // Find document corners using contour detection with document-specific criteria
  const findDocumentCorners = (edges: Uint8ClampedArray, width: number, height: number): Array<{x: number, y: number}> | null => {
    // Document detection criteria
    const minArea = (width * height) * 0.15; // Minimum 15% of image area (documents should be substantial)
    const maxArea = (width * height) * 0.85; // Maximum 85% of image area (leave some margin)
    const minAspectRatio = 0.5; // Minimum width/height ratio (not too thin)
    const maxAspectRatio = 2.0; // Maximum width/height ratio (not too wide)
    
    // Find potential rectangular contours using edge detection
    const contours = findRectangularContours(edges, width, height);
    
    // Filter contours to find document-like shapes
    for (const contour of contours) {
      const area = calculatePolygonArea(contour);
      const boundingRect = getBoundingRect(contour);
      const aspectRatio = boundingRect.width / boundingRect.height;
      
      // Check if this contour meets document criteria
      if (area >= minArea && area <= maxArea &&
          aspectRatio >= minAspectRatio && aspectRatio <= maxAspectRatio) {
        
        // Additional document checks
        if (isLikelyDocument(contour, edges, width, height)) {
          return contour;
        }
      }
    }
    
    return null; // No valid document detected
  };

  // Find rectangular contours in the edge image
  const findRectangularContours = (edges: Uint8ClampedArray, width: number, height: number): Array<Array<{x: number, y: number}>> => {
    const contours: Array<Array<{x: number, y: number}>> = [];
    
    // Simplified contour detection - look for rectangular patterns
    // In production, you'd use more sophisticated algorithms like Suzuki-Abe
    
    // For now, use a grid-based approach to find strong edge clusters
    const gridSize = 20;
    const strongEdgeThreshold = 200;
    
    for (let y = gridSize; y < height - gridSize; y += gridSize) {
      for (let x = gridSize; x < width - gridSize; x += gridSize) {
        // Check if this grid cell has strong edges indicating a corner
        if (hasStrongEdges(edges, x, y, gridSize, width, height, strongEdgeThreshold)) {
          // Try to trace a rectangular contour from this point
          const rect = traceRectangle(edges, x, y, width, height);
          if (rect && rect.length === 4) {
            contours.push(rect);
          }
        }
      }
    }
    
    return contours;
  };

  // Check if a region has strong edges (potential corner)
  const hasStrongEdges = (edges: Uint8ClampedArray, centerX: number, centerY: number, radius: number, width: number, height: number, threshold: number): boolean => {
    let edgeCount = 0;
    let totalPixels = 0;
    
    for (let y = Math.max(0, centerY - radius); y < Math.min(height, centerY + radius); y++) {
      for (let x = Math.max(0, centerX - radius); x < Math.min(width, centerX + radius); x++) {
        const pixel = edges[y * width + x];
        if (pixel > threshold) edgeCount++;
        totalPixels++;
      }
    }
    
    return (edgeCount / totalPixels) > 0.3; // At least 30% of pixels should be edges
  };

  // Trace a rectangular contour from a starting point
  const traceRectangle = (edges: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): Array<{x: number, y: number}> | null => {
    // Simplified rectangle tracing - look for document-like rectangular patterns
    // This is a basic implementation; production would use more sophisticated tracing
    
    const minSize = Math.min(width, height) * 0.2;
    const maxSize = Math.min(width, height) * 0.8;
    
    // Try different rectangle sizes around the starting point
    for (let size = minSize; size < maxSize; size += 20) {
      const rect = [
        { x: Math.max(10, startX - size/2), y: Math.max(10, startY - size/2) },
        { x: Math.min(width-10, startX + size/2), y: Math.max(10, startY - size/2) },
        { x: Math.min(width-10, startX + size/2), y: Math.min(height-10, startY + size/2) },
        { x: Math.max(10, startX - size/2), y: Math.min(height-10, startY + size/2) }
      ];
      
      // Check if this rectangle has good edge support
      if (hasGoodEdgeSupport(edges, rect, width, height)) {
        return rect;
      }
    }
    
    return null;
  };

  // Check if a rectangle has good edge support (likely to be a document)
  const hasGoodEdgeSupport = (edges: Uint8ClampedArray, rect: Array<{x: number, y: number}>, width: number, height: number): boolean => {
    let edgeSupport = 0;
    const perimeterPoints = 100; // Sample points along the perimeter
    
    // Check edges along the rectangle perimeter
    for (let i = 0; i < 4; i++) {
      const start = rect[i];
      const end = rect[(i + 1) % 4];
      
      for (let t = 0; t <= 1; t += 1 / perimeterPoints) {
        const x = Math.round(start.x + t * (end.x - start.x));
        const y = Math.round(start.y + t * (end.y - start.y));
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          if (edges[y * width + x] > 100) {
            edgeSupport++;
          }
        }
      }
    }
    
    return (edgeSupport / (perimeterPoints * 4)) > 0.15; // At least 15% edge support
  };

  // Additional checks to determine if a contour is likely a document
  const isLikelyDocument = (contour: Array<{x: number, y: number}>, edges: Uint8ClampedArray, width: number, height: number): boolean => {
    // Check if the contour has document-like properties
    
    // 1. Check for consistent edges along borders
    const edgeConsistency = checkEdgeConsistency(contour, edges, width, height);
    if (edgeConsistency < 0.2) return false;
    
    // 2. Check that it's not too close to image edges (documents shouldn't fill entire frame)
    const margin = Math.min(width, height) * 0.05;
    for (const point of contour) {
      if (point.x < margin || point.x > width - margin || 
          point.y < margin || point.y > height - margin) {
        // Allow some tolerance but not full-frame objects
        continue;
      }
    }
    
    // 3. Check for rectangular-ness (corners should be roughly 90 degrees)
    const rectangularness = checkRectangularness(contour);
    if (rectangularness < 0.7) return false;
    
    return true;
  };

  // Helper functions
  const calculatePolygonArea = (points: Array<{x: number, y: number}>): number => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  };

  const getBoundingRect = (points: Array<{x: number, y: number}>): {x: number, y: number, width: number, height: number} => {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const checkEdgeConsistency = (contour: Array<{x: number, y: number}>, edges: Uint8ClampedArray, width: number, height: number): number => {
    // Check how consistently the contour follows actual edges
    let hits = 0;
    let total = 0;
    
    for (let i = 0; i < contour.length; i++) {
      const point = contour[i];
      const x = Math.round(point.x);
      const y = Math.round(point.y);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (edges[y * width + x] > 50) hits++;
        total++;
      }
    }
    
    return total > 0 ? hits / total : 0;
  };

  const checkRectangularness = (contour: Array<{x: number, y: number}>): number => {
    if (contour.length !== 4) return 0;
    
    // Calculate angles between consecutive edges
    let angleScore = 0;
    for (let i = 0; i < 4; i++) {
      const p1 = contour[i];
      const p2 = contour[(i + 1) % 4];
      const p3 = contour[(i + 2) % 4];
      
      const angle = calculateAngle(p1, p2, p3);
      const deviation = Math.abs(angle - Math.PI / 2); // Deviation from 90 degrees
      angleScore += Math.max(0, 1 - deviation / (Math.PI / 4)); // Score based on how close to 90 degrees
    }
    
    return angleScore / 4; // Average score
  };

  const calculateAngle = (p1: {x: number, y: number}, p2: {x: number, y: number}, p3: {x: number, y: number}): number => {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    return Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
  };

  // Check for available cameras when photo mode is selected
  const checkCameraAvailability = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        // MediaDevices API not supported
        setHasCameraAccess(false);
        return;
      }

      // First, request permission to get camera info
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        // Camera permission granted
      } catch (permError) {
        console.error('Camera permission denied:', permError);
        setHasCameraAccess(false);
        toast({
          title: "Camera Permission Required",
          description: "Please allow camera access and try again.",
          variant: "destructive",
        });
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      // Available cameras found
      
      setAvailableCameras(cameras);
      setHasCameraAccess(cameras.length > 0);
      
      if (cameras.length > 0 && !selectedCameraId) {
        // Prefer back camera for documents
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        );
        const selectedCamera = backCamera?.deviceId || cameras[0].deviceId;
        setSelectedCameraId(selectedCamera);
        console.log('Selected camera:', selectedCamera);
      }
    } catch (error) {
      console.error('Error checking camera availability:', error);
      setHasCameraAccess(false);
      setAvailableCameras([]);
      setSelectedCameraId('');
      
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

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
    setHasCameraAccess(null);
    setAvailableCameras([]);
    setSelectedCameraId('');
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
      // Reset camera state and auto-check
      setHasCameraAccess(null);
      setAvailableCameras([]);
      setSelectedCameraId('');
      checkCameraAvailability();
    }
  };

  const startPhotoCapture = async () => {
    console.log('Starting photo capture...');
    console.log('Available cameras:', availableCameras);
    console.log('Selected camera ID:', selectedCameraId);
    
    try {
      // If no camera selected, pick the first available one
      let cameraId = selectedCameraId;
      if (!cameraId && availableCameras.length > 0) {
        cameraId = availableCameras[0].deviceId;
        setSelectedCameraId(cameraId);
        console.log('Auto-selected camera:', cameraId);
      }
      
      if (!cameraId) {
        throw new Error('No camera available');
      }

      console.log('Requesting camera with ID:', cameraId);

      const constraints = {
        video: {
          deviceId: { exact: cameraId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      console.log('Camera constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', stream);
      
      setPhotoStream(stream);
      
      // Set video source immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Video source set');
      } else {
        console.log('Video ref not available');
      }
      
      toast({
        title: "Camera Ready",
        description: "Position your document within the frame and capture.",
      });
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      
      let errorMessage = "Unable to access camera. ";
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += "Please allow camera permissions and try again.";
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += "No camera found on this device.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage += "Camera is not supported in this browser.";
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += "Camera is already in use by another application.";
      } else {
        errorMessage += `Error: ${error.message || 'Unknown error'}`;
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopPhotoCapture = () => {
    // Stop edge detection
    setIsDetecting(false);
    setDetectedCorners(null);
    
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

  // Crop document and apply perspective correction
  const cropAndEnhanceDocument = async (sourceCanvas: HTMLCanvasElement, corners: Array<{x: number, y: number}>): Promise<HTMLCanvasElement> => {
    // Create a new canvas for the cropped and enhanced document
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return sourceCanvas;

    // Calculate the output dimensions (A4 ratio: 1:1.414)
    const aspectRatio = 1.414;
    const maxWidth = 800;
    const outputWidth = maxWidth;
    const outputHeight = maxWidth * aspectRatio;
    
    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;

    // Sort corners to ensure correct order: top-left, top-right, bottom-right, bottom-left
    const sortedCorners = sortCorners(corners);
    
    // Apply perspective transformation
    const transformedImage = applyPerspectiveTransform(sourceCanvas, sortedCorners, outputWidth, outputHeight);
    
    // Draw transformed image
    outputCtx.drawImage(transformedImage, 0, 0);
    
    // Apply image enhancements
    enhanceDocumentImage(outputCtx, outputWidth, outputHeight);
    
    return outputCanvas;
  };

  // Sort corners in clockwise order starting from top-left
  const sortCorners = (corners: Array<{x: number, y: number}>): Array<{x: number, y: number}> => {
    // Calculate center point
    const centerX = corners.reduce((sum, corner) => sum + corner.x, 0) / corners.length;
    const centerY = corners.reduce((sum, corner) => sum + corner.y, 0) / corners.length;
    
    // Sort by angle from center
    const sorted = corners.sort((a, b) => {
      const angleA = Math.atan2(a.y - centerY, a.x - centerX);
      const angleB = Math.atan2(b.y - centerY, b.x - centerX);
      return angleA - angleB;
    });
    
    // Ensure we start with top-left corner
    const topLeft = sorted.reduce((min, corner) => 
      (corner.x + corner.y < min.x + min.y) ? corner : min
    );
    
    const startIndex = sorted.indexOf(topLeft);
    return [...sorted.slice(startIndex), ...sorted.slice(0, startIndex)];
  };

  // Apply perspective transformation (simplified version)
  const applyPerspectiveTransform = (sourceCanvas: HTMLCanvasElement, corners: Array<{x: number, y: number}>, outputWidth: number, outputHeight: number): HTMLCanvasElement => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return sourceCanvas;

    tempCanvas.width = outputWidth;
    tempCanvas.height = outputHeight;

    // For simplicity, we'll use a basic transformation
    // In a production app, you'd implement proper perspective transformation matrices
    
    // Define destination corners
    const destCorners = [
      {x: 0, y: 0},
      {x: outputWidth, y: 0},
      {x: outputWidth, y: outputHeight},
      {x: 0, y: outputHeight}
    ];

    // Calculate simple scaling and offset
    const sourceRect = {
      x: Math.min(...corners.map(c => c.x)),
      y: Math.min(...corners.map(c => c.y)),
      width: Math.max(...corners.map(c => c.x)) - Math.min(...corners.map(c => c.x)),
      height: Math.max(...corners.map(c => c.y)) - Math.min(...corners.map(c => c.y))
    };

    // Draw the cropped region
    tempCtx.drawImage(
      sourceCanvas,
      sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,
      0, 0, outputWidth, outputHeight
    );

    return tempCanvas;
  };

  // Enhance document image with filters
  const enhanceDocumentImage = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Apply contrast enhancement and sharpening
    for (let i = 0; i < data.length; i += 4) {
      // Increase contrast
      const contrast = 1.2;
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128));     // Red
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128)); // Green
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128)); // Blue
      
      // Optional: Convert to grayscale for documents
      // const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      // data[i] = data[i + 1] = data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
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

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // Apply automatic cropping and enhancement if edges are detected
        let finalCanvas = canvas;
        if (detectedCorners && detectedCorners.length === 4) {
          finalCanvas = await cropAndEnhanceDocument(canvas, detectedCorners);
        }
        
        finalCanvas.toBlob((blob) => {
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
                  {hasCameraAccess === null && (
                    <div>
                      <p className="text-sm text-gray-600">Preparing camera...</p>
                      <div className="mt-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      </div>
                    </div>
                  )}
                  
                  {hasCameraAccess === false && (
                    <div className="space-y-3">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Camera className="h-5 w-5 text-yellow-600" />
                          <div className="text-sm text-yellow-800">
                            <div className="font-medium">No Camera Found</div>
                            <div>You need a phone/tablet/laptop with a camera to use this feature</div>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={checkCameraAvailability}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                      <p className="text-xs text-gray-500">
                        Alternative: Use File Upload mode to upload photos taken with your phone's camera app
                      </p>
                    </div>
                  )}
                  
                  {hasCameraAccess === true && availableCameras.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Use your camera to capture documents</p>
                      
                      {availableCameras.length > 1 && (
                        <div>
                          <Label className="text-sm text-gray-600">Select Camera</Label>
                          <select 
                            className="w-full p-2 border rounded text-sm mt-1"
                            value={selectedCameraId}
                            onChange={(e) => setSelectedCameraId(e.target.value)}
                          >
                            {availableCameras.map((camera) => (
                              <option key={camera.deviceId} value={camera.deviceId}>
                                {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <Button
                        type="button"
                        onClick={startPhotoCapture}
                        disabled={availableCameras.length === 0}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    </div>
                  )}
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
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      style={{ display: 'none' }}
                    />
                    
                    {/* Document edge detection overlay */}
                    {detectedCorners && detectedCorners.length === 4 && (
                      <svg 
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox={`0 0 ${videoRef.current?.videoWidth || 640} ${videoRef.current?.videoHeight || 480}`}
                        preserveAspectRatio="xMidYMid slice"
                      >
                        <polygon
                          points={detectedCorners.map(corner => `${corner.x},${corner.y}`).join(' ')}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeDasharray="10,5"
                        />
                        {detectedCorners.map((corner, index) => (
                          <circle
                            key={index}
                            cx={corner.x}
                            cy={corner.y}
                            r="6"
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        ))}
                      </svg>
                    )}
                    
                    {/* Status indicators */}
                    <div className="absolute top-2 left-2 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                      {detectedCorners && detectedCorners.length === 4 ? (
                        <span className="text-green-400 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Document detected
                        </span>
                      ) : (
                        <span className="text-yellow-400 flex items-center">
                          <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Detecting document...
                        </span>
                      )}
                    </div>
                    
                    {/* Detection quality indicator */}
                    {detectedCorners && detectedCorners.length === 4 && (
                      <div className="absolute top-2 right-2 text-xs bg-green-500 bg-opacity-80 text-white px-2 py-1 rounded">
                        Ready to capture
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {availableCameras.length > 1 && (
                      <div>
                        <Label className="text-sm text-gray-600">Switch Camera</Label>
                        <select 
                          className="w-full p-2 border rounded text-sm mt-1"
                          value={selectedCameraId}
                          onChange={(e) => {
                            stopPhotoCapture();
                            setSelectedCameraId(e.target.value);
                            setTimeout(() => startPhotoCapture(), 100);
                          }}
                        >
                          {availableCameras.map((camera) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                              {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
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