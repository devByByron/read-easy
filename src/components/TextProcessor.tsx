import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  FileText, 
  Brain, 
  Languages, 
  Lightbulb,
  Download
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface TextProcessorProps {
  extractedText: string;
  fileName: string;
}

const TextProcessor = ({ extractedText, fileName }: TextProcessorProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState([1]);
  const [speechVolume, setSpeechVolume] = useState([0.8]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [processedText, setProcessedText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeProcessor, setActiveProcessor] = useState<string>('');
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [selectedVoice]);

  const handlePlay = () => {
    if (!extractedText.trim()) {
      toast({
        title: "No text to read",
        description: "Please extract text from a document first.",
        variant: "destructive"
      });
      return;
    }

    if (speechSynthesis.speaking) {
      if (speechSynthesis.paused) {
        speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        speechSynthesis.pause();
        setIsPlaying(false);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(extractedText);
    utterance.rate = speechRate[0];
    utterance.volume = speechVolume[0];
    
    if (selectedVoice) {
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      toast({
        title: "Speech Error",
        description: "There was an error with text-to-speech playback.",
        variant: "destructive"
      });
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const processWithAI = async (type: string) => {
    setProcessing(true);
    setActiveProcessor(type);
    
    try {
      // Simulate AI processing - in a real app, you'd call Hugging Face API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let result = '';
      switch (type) {
        case 'summarize':
          result = `SUMMARY: ${extractedText.substring(0, 200)}... (This is a simulated summary. In production, this would use AI to create a proper summary.)`;
          break;
        case 'simplify':
          result = `SIMPLIFIED: This text has been made easier to understand. ${extractedText.substring(0, 150)}... (This is a simulated simplification.)`;
          break;
        case 'translate':
          result = `TRANSLATED: Ceci est une traduction simulée du texte. ${extractedText.substring(0, 100)}... (This is a simulated translation to French.)`;
          break;
        default:
          result = extractedText;
      }
      
      setProcessedText(result);
      toast({
        title: `Text ${type}d successfully!`,
        description: "The processed text is now ready for use.",
      });
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "There was an error processing the text with AI.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
      setActiveProcessor('');
    }
  };

  const downloadText = () => {
    const textToDownload = processedText || extractedText;
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, "")}_processed.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!extractedText) return null;

  return (
    <section className="py-20">
      <div className="container max-w-screen-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Process Your Text</h2>
          <p className="text-lg text-muted-foreground">
            Listen to your text or enhance it with AI-powered tools
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Text-to-Speech Controls */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Volume2 className="h-5 w-5 mr-2 text-primary" />
              <h3 className="text-xl font-semibold">Text-to-Speech</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handlePlay}
                  variant={isPlaying ? "secondary" : "default"}
                  size="lg"
                  className="min-w-[100px]"
                >
                  {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Button onClick={handleStop} variant="outline" size="lg">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Voice</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Speed: {speechRate[0].toFixed(1)}x
                </label>
                <Slider
                  value={speechRate}
                  onValueChange={setSpeechRate}
                  max={2}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Volume: {Math.round(speechVolume[0] * 100)}%
                </label>
                <Slider
                  value={speechVolume}
                  onValueChange={setSpeechVolume}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* AI Processing Tools */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Brain className="h-5 w-5 mr-2 text-accent" />
              <h3 className="text-xl font-semibold">AI Tools</h3>
            </div>
            
            <div className="grid gap-3">
              <Button
                onClick={() => processWithAI('summarize')}
                disabled={processing}
                variant="outline"
                className="justify-start h-12"
              >
                <FileText className="h-4 w-4 mr-3" />
                {processing && activeProcessor === 'summarize' ? 'Summarizing...' : 'Summarize Text'}
              </Button>
              
              <Button
                onClick={() => processWithAI('simplify')}
                disabled={processing}
                variant="outline"
                className="justify-start h-12"
              >
                <Lightbulb className="h-4 w-4 mr-3" />
                {processing && activeProcessor === 'simplify' ? 'Simplifying...' : 'Simplify Language'}
              </Button>
              
              <Button
                onClick={() => processWithAI('translate')}
                disabled={processing}
                variant="outline"
                className="justify-start h-12"
              >
                <Languages className="h-4 w-4 mr-3" />
                {processing && activeProcessor === 'translate' ? 'Translating...' : 'Translate Text'}
              </Button>
              
              <Button
                onClick={downloadText}
                variant="outline"
                className="justify-start h-12"
              >
                <Download className="h-4 w-4 mr-3" />
                Download Text
              </Button>
            </div>
          </Card>
        </div>

        {/* Text Display */}
        <Card className="mt-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">
              {processedText ? 'Processed Text' : 'Extracted Text'}
            </h3>
            <span className="text-sm text-muted-foreground">
              {fileName}
            </span>
          </div>
          
          <Textarea
            value={processedText || extractedText}
            readOnly
            className="min-h-[300px] text-base leading-relaxed resize-none"
            placeholder="Your extracted text will appear here..."
          />
        </Card>
      </div>
    </section>
  );
};

export default TextProcessor;