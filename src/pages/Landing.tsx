import React, { useState } from 'react';
import { ThemeProvider } from "next-themes";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
// Fixed component import reference
import SimpleFileUpload from "@/components/SimpleFileUpload";
import TextProcessor from "@/components/TextProcessor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Zap, 
  Globe, 
  Accessibility, 
  Eye, 
  Ear,
  Github,
  Twitter,
  Mail
} from 'lucide-react';

const Landing = () => {
  const [extractedText, setExtractedText] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileProcessed = (text: string, name: string) => {
    setExtractedText(text);
    setFileName(name);
    
    // Scroll to the text processor section
    setTimeout(() => {
      document.getElementById('text-processor')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleFileDeleted = (deletedFileName: string) => {
    // Clear extracted text if the deleted file was the source
    if (fileName === deletedFileName) {
      setExtractedText('');
      setFileName('');
    }
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex min-h-screen flex-col">
        <Header />
        
        <main className="flex-1">
          <Hero />
          {/* Features Section */}
          <section id="features" className="py-20 bg-muted/30">
            <div className="container max-w-screen-xl">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Built for Accessibility</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  ReadEasy is designed with accessibility at its core, making documents readable for everyone
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">High Contrast Design</h3>
                  <p className="text-muted-foreground">
                    Carefully designed color schemes and typography for optimal readability
                  </p>
                </Card>
                
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Ear className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Advanced Text-to-Speech</h3>
                  <p className="text-muted-foreground">
                    Natural-sounding voices with adjustable speed and volume controls
                  </p>
                </Card>
                
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Accessibility className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Screen Reader Compatible</h3>
                  <p className="text-muted-foreground">
                    Full keyboard navigation and screen reader support throughout
                  </p>
                </Card>
                
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Fast OCR Processing</h3>
                  <p className="text-muted-foreground">
                    Powered by Tesseract.js for accurate and fast text extraction
                  </p>
                </Card>
                
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Globe className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Multi-language Support</h3>
                  <p className="text-muted-foreground">
                    Translate and process text in multiple languages with AI
                  </p>
                </Card>
                
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Privacy First</h3>
                  <p className="text-muted-foreground">
                    All processing happens in your browser - your documents never leave your device
                  </p>
                </Card>
              </div>
            </div>
          </section>
          
          {/* How it Works */}
          <section id="how-it-works" className="py-20">
            <div className="container max-w-screen-md">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">How ReadEasy Works</h2>
                <p className="text-lg text-muted-foreground">
                  Simple, fast, and accessible document processing in three steps
                </p>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <Badge variant="secondary" className="mt-1 h-8 w-8 rounded-full flex items-center justify-center">
                    1
                  </Badge>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Upload Your Document</h3>
                    <p className="text-muted-foreground">
                      Drag and drop PDF files or images containing text. We support various formats 
                      including PNG, JPG, and PDF files up to 10MB.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Badge variant="secondary" className="mt-1 h-8 w-8 rounded-full flex items-center justify-center">
                    2
                  </Badge>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Automatic Text Extraction</h3>
                    <p className="text-muted-foreground">
                      Our OCR technology automatically extracts text from your documents with high accuracy. 
                      The process happens entirely in your browser for maximum privacy.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Badge variant="secondary" className="mt-1 h-8 w-8 rounded-full flex items-center justify-center">
                    3
                  </Badge>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Listen or Enhance</h3>
                    <p className="text-muted-foreground">
                      Use text-to-speech to listen to your content, or enhance it with AI-powered 
                      summarization, translation, and simplification tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

           <SimpleFileUpload onFileProcessed={handleFileProcessed} onFileDeleted={handleFileDeleted} />
          
          {extractedText && (
            <div id="text-processor">
              <TextProcessor extractedText={extractedText} fileName={fileName} />
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="border-t bg-background">
          <div className="container max-w-screen-xl py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold">ReadEasy</h3>
                <p className="text-sm text-muted-foreground">
                  Making documents accessible for everyone through innovative technology and thoughtful design.
                </p>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Features</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>OCR Text Extraction</li>
                  <li>Text-to-Speech</li>
                  <li>AI Summarization</li>
                  <li>Language Translation</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Accessibility</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>High Contrast Mode</li>
                  <li>Screen Reader Support</li>
                  <li>Keyboard Navigation</li>
                  <li>Readable Typography</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Connect</h4>
                <div className="flex space-x-4">
                  <Github className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
                  <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
                  <Mail className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
            
            <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2024 ReadEasy. Built with accessibility in mind.</p>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default Landing;
