import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Image, X, CheckCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileProcessed: (text: string, fileName: string) => void;
}

const FileUploadFallback = ({ onFileProcessed }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(validateFile);
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFile = async (file: File) => {
    setProcessing(true);
    setProgress(0);

    try {
      if (file.type === 'application/pdf') {
        // For PDF processing, you would typically use a library like PDF.js
        // For now, we'll simulate the process
        setProgress(30);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(60);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(100);
        
        // Simulate extracted text
        const sampleText = "This is sample text extracted from the PDF document. ReadEasy would process the actual PDF content here using OCR technology.";
        onFileProcessed(sampleText, file.name);
      } else {
        // For image processing with Tesseract.js
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        
        setProgress(20);
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
        }, 200);
        
        const { data: { text } } = await worker.recognize(file);
        
        clearInterval(progressInterval);
        setProgress(100);
        
        await worker.terminate();
        onFileProcessed(text, file.name);
      }
      
      setProcessedFiles(prev => new Set([...prev, file.name]));
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <section id="upload-section" className="py-20">
      <div className="container max-w-screen-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Upload Your Documents</h2>
          <p className="text-lg text-muted-foreground">
            Drag and drop your PDF files or images to get started
          </p>
        </div>

        <Card className="p-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp"
              onChange={handleFileInput}
              className="hidden"
            />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop your files here...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, PNG, JPG, and other image formats (max 10MB)
                </p>
              </>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold">Selected Files:</h3>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    {file.type === 'application/pdf' ? (
                      <FileText className="h-5 w-5 text-destructive" />
                    ) : (
                      <Image className="h-5 w-5 text-accent" />
                    )}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {processedFiles.has(file.name) ? (
                      <CheckCircle className="h-5 w-5 text-accent" />
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => processFile(file)}
                          disabled={processing}
                        >
                          Process
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={processing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {processing && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Processing...</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default FileUploadFallback;