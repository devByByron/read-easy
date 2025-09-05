import React, { useState } from 'react';
import { ThemeProvider } from "next-themes";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
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
    <AccessibilityProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          
          <main className="flex-1" role="main">
            <Hero />
            <SimpleFileUpload onFileProcessed={handleFileProcessed} onFileDeleted={handleFileDeleted} />
            
            {extractedText && (
              <div id="text-processor">
                <TextProcessor extractedText={extractedText} fileName={fileName} />
              </div>
            )}
            
            {/* Features Section */}
            <section id="features" className="py-20 bg-muted/30" aria-labelledby="features-heading">
              <div className="container max-w-screen-xl">
                <div className="text-center mb-16">
                  <h2 id="features-heading" className="text-3xl font-bold mb-4 sr-enhanced">Built for Accessibility</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto sr-enhanced">
                    ReadEasy is designed with accessibility at its core, making documents readable for everyone
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
                  <Card className="p-6 hover:shadow-md transition-shadow" role="listitem">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
                      <Eye className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 sr-enhanced">High Contrast Design</h3>
                    <p className="text-muted-foreground sr-enhanced">
                      Carefully designed color schemes and typography for optimal readability
                    </p>
                  </Card>
                  
                  <Card className="p-6 hover:shadow-md transition-shadow" role="listitem">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4" aria-hidden="true">
                      <Ear className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 sr-enhanced">Advanced Text-to-Speech</h3>
                    <p className="text-muted-foreground sr-enhanced">
                      Natural-sounding voices with adjustable speed and volume controls
                    </p>
                  </Card>
                  
                  <Card className="p-6 hover:shadow-md transition-shadow" role="listitem">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4" aria-hidden="true">
                      <Accessibility className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 sr-enhanced">Screen Reader Compatible</h3>
                    <p className="text-muted-foreground sr-enhanced">
                      Full keyboard navigation and screen reader support throughout
                    </p>
                  </Card>
                  
                  <Card className="p-6 hover:shadow-md transition-shadow" role="listitem">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 sr-enhanced">Fast OCR Processing</h3>
                    <p className="text-muted-foreground sr-enhanced">
                      Powered by Tesseract.js for accurate and fast text extraction
                    </p>
                  </Card>
                  
                  <Card className="p-6 hover:shadow-md transition-shadow" role="listitem">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4" aria-hidden="true">
                      <Globe className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 sr-enhanced">Multi-language Support</h3>
                    <p className="text-muted-foreground sr-enhanced">
                      Translate and process text in multiple languages with AI
                    </p>
                  </Card>
                  
                  <Card className="p-6 hover:shadow-md transition-shadow" role="listitem">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 sr-enhanced">Privacy First</h3>
                    <p className="text-muted-foreground sr-enhanced">
                      All processing happens in your browser - your documents never leave your device
                    </p>
                  </Card>
                </div>
              </div>
            </section>
            
            {/* How it Works */}
            <section id="how-it-works" className="py-20" aria-labelledby="how-it-works-heading">
              <div className="container max-w-screen-md">
                <div className="text-center mb-16">
                  <h2 id="how-it-works-heading" className="text-3xl font-bold mb-4 sr-enhanced">How ReadEasy Works</h2>
                  <p className="text-lg text-muted-foreground sr-enhanced">
                    Simple, fast, and accessible document processing in three steps
                  </p>
                </div>
                
                <div className="space-y-8" role="list">
                  <div className="flex items-start space-x-4" role="listitem">
                    <Badge variant="secondary" className="mt-1 h-8 w-8 rounded-full flex items-center justify-center" aria-hidden="true">
                      1
                    </Badge>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 sr-enhanced">Upload Your Document</h3>
                      <p className="text-muted-foreground sr-enhanced">
                        Drag and drop PDF files or images containing text. We support various formats 
                        including PNG, JPG, and PDF files up to 10MB.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4" role="listitem">
                    <Badge variant="secondary" className="mt-1 h-8 w-8 rounded-full flex items-center justify-center" aria-hidden="true">
                      2
                    </Badge>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 sr-enhanced">Automatic Text Extraction</h3>
                      <p className="text-muted-foreground sr-enhanced">
                        Our OCR technology automatically extracts text from your documents with high accuracy. 
                        The process happens entirely in your browser for maximum privacy.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4" role="listitem">
                    <Badge variant="secondary" className="mt-1 h-8 w-8 rounded-full flex items-center justify-center" aria-hidden="true">
                      3
                    </Badge>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 sr-enhanced">Listen or Enhance</h3>
                      <p className="text-muted-foreground sr-enhanced">
                        Use text-to-speech to listen to your content, or enhance it with AI-powered 
                        summarization, translation, and simplification tools.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
          
          {/* Footer */}
          <footer className="border-t bg-background" role="contentinfo">
            <div className="container max-w-screen-xl py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold sr-enhanced">ReadEasy</h3>
                  <p className="text-sm text-muted-foreground sr-enhanced">
                    Making documents accessible for everyone through innovative technology and thoughtful design.
                  </p>
                </div>
                
                <nav aria-label="Features navigation">
                  <h4 className="font-medium sr-enhanced">Features</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="sr-enhanced">OCR Text Extraction</li>
                    <li className="sr-enhanced">Text-to-Speech</li>
                    <li className="sr-enhanced">AI Summarization</li>
                    <li className="sr-enhanced">Language Translation</li>
                  </ul>
                </nav>
                
                <nav aria-label="Accessibility features">
                  <h4 className="font-medium sr-enhanced">Accessibility</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="sr-enhanced">High Contrast Mode</li>
                    <li className="sr-enhanced">Screen Reader Support</li>
                    <li className="sr-enhanced">Keyboard Navigation</li>
                    <li className="sr-enhanced">Readable Typography</li>
                  </ul>
                </nav>
                
                <div className="space-y-4">
                  <h4 className="font-medium sr-enhanced">Connect</h4>
                  <div className="flex space-x-4">
                    <Github className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" aria-label="GitHub repository" />
                    <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" aria-label="Twitter profile" />
                    <Mail className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" aria-label="Send email" />
                  </div>
                </div>
              </div>
              
              <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                <p className="sr-enhanced">&copy; 2024 ReadEasy. Built with accessibility in mind.</p>
              </div>
            </div>
          </footer>
        </div>
      </ThemeProvider>
    </AccessibilityProvider>
  );
};

export default Landing;