import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DocumentUploadProps {
  assignmentId: string;
  onUploadComplete?: (fileId: string) => void;
}

export default function DocumentUpload({ assignmentId, onUploadComplete }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      // In a real implementation, this would:
      // 1. Get signed upload URL from backend
      // 2. Upload file to S3
      // 3. Create document record in database
      console.log("Uploading file:", selectedFile.name);
      
      // Mock upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful upload
      const mockFileId = "mock-file-id";
      onUploadComplete?.(mockFileId);
      
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card data-testid="card-document-upload">
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="file-upload">Select File</Label>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            data-testid="input-file-upload"
          />
          {selectedFile && (
            <p className="text-sm text-secondary mt-1">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
        </div>
        
        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          data-testid="button-upload-file"
        >
          {isUploading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Uploading...
            </>
          ) : (
            <>
              <i className="fas fa-upload mr-2"></i>
              Upload Document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
