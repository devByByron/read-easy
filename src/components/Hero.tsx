import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, FileText, Volume2, Brain } from "lucide-react";

const Hero = () => {
  const scrollToUpload = () => {
    document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-subtle-gradient" />
      
      <div className="relative container max-w-screen-xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
            <FileText className="mr-2 h-4 w-4" />
            Accessibility-First Text Processing
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Transform Any Document Into
            <span className="bg-hero-gradient bg-clip-text text-transparent"> Accessible Content</span>
          </h1>
          
          <p className="mb-8 text-xl text-muted-foreground md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Upload documents, extract text with OCR, and instantly convert to speech or simplify with AI. 
            Designed for everyone, especially those with reading difficulties.
          </p>
          
          <div className="mb-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={scrollToUpload}
              className="text-lg px-8 py-6 shadow-primary hover:shadow-lg transition-all duration-300"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 hover:bg-secondary/50 transition-all duration-300"
            >
              View Demo
            </Button>
          </div>
          
          {/* Process Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Upload</h3>
              <p className="text-sm text-muted-foreground text-center">
                Drop your PDF or image files
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Extract</h3>
              <p className="text-sm text-muted-foreground text-center">
                OCR automatically extracts text
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Volume2 className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Listen</h3>
              <p className="text-sm text-muted-foreground text-center">
                High-quality text-to-speech
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Simplify</h3>
              <p className="text-sm text-muted-foreground text-center">
                AI-powered text processing
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;