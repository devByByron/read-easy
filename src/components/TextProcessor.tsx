// TextProcessor.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, Volume2, FileText, Brain, Languages, Lightbulb, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface TextProcessorProps {
  extractedText: string;
  fileName: string;
}

const LANGUAGE_MODELS = [
  { code: 'fr', name: 'French', model: 'French' },
  { code: 'es', name: 'Spanish', model: 'Spanish' },
  { code: 'de', name: 'German', model: 'German' },
  { code: 'it', name: 'Italian', model: 'Italian' },
  { code: 'zh', name: 'Chinese', model: 'Chinese' },
  { code: 'ar', name: 'Arabic', model: 'Arabic' },
  { code: 'ru', name: 'Russian', model: 'Russian' },
  { code: 'ja', name: 'Japanese', model: 'Japanese' },
  { code: 'pt', name: 'Portuguese', model: 'Portuguese' },
];

const TextProcessor = ({ extractedText, fileName }: TextProcessorProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState([1]);
  const [speechVolume, setSpeechVolume] = useState([0.8]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [processedText, setProcessedText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeProcessor, setActiveProcessor] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('fr');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const charIndexRef = useRef(0);
  const { toast } = useToast();

  // 🔹 Voice loading
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

  // 🔹 Reset on extractedText change
  useEffect(() => {
    if (!extractedText) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      charIndexRef.current = 0;
      utteranceRef.current = null;
    }
  }, [extractedText]);

  // 🔹 Handle speech playback updates
  useEffect(() => {
    if (isPlaying && utteranceRef.current) {
      const currentCharIndex = charIndexRef.current;
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        extractedText.substring(currentCharIndex)
      );
      utterance.rate = speechRate[0];
      utterance.volume = speechVolume[0];
      if (selectedVoice) {
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
      }
      utterance.onboundary = (event) => {
        if (event.name === "word") {
          charIndexRef.current = currentCharIndex + event.charIndex;
        }
      };
      utterance.onend = () => setIsPlaying(false);
      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  }, [speechRate, speechVolume]);

  useEffect(() => {
    if (!extractedText) return;
    if (isPlaying) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(extractedText);
      utterance.rate = speechRate[0];
      utterance.volume = speechVolume[0];
      if (selectedVoice) {
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
      }
      utterance.onboundary = (event) => {
        if (event.name === "word") {
          charIndexRef.current = event.charIndex;
        }
      };
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  }, [selectedVoice]);

  // 🔹 Play / Pause
  const handlePlay = () => {
    if (!extractedText.trim()) {
      toast({
        title: "No text to read",
        description: "Please extract text from a document first.",
        variant: "destructive"
      });
      return;
    }
    if (speechSynthesis.speaking && speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPlaying(false);
      return;
    }
    speechSynthesis.cancel();
    charIndexRef.current = 0;
    const utterance = new SpeechSynthesisUtterance(extractedText);
    utterance.rate = speechRate[0];
    utterance.volume = speechVolume[0];
    if (selectedVoice) {
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    }
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        charIndexRef.current = event.charIndex;
      }
    };
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  // 🔹 Stop
  const handleStop = () => {
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
    charIndexRef.current = 0;
    utteranceRef.current = null;
  };

  // 🔹 AI Processing (Gemini function)
  const processWithAI = async (type: string) => {
    setProcessing(true);
    setActiveProcessor(type);
    try {
      const inputText = processedText || extractedText;

      // Pick correct language model
      let langName = "";
      if (type === "translate") {
        const lang = LANGUAGE_MODELS.find(l => l.code === selectedLanguage);
        langName = lang ? lang.model : "";
      }

      const response = await fetch("/.netlify/functions/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, text: inputText, langModel: langName }), // ✅ fixed key
      });

      if (!response.ok) {
        throw new Error(`Function error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.result || JSON.stringify(data);

      setProcessedText(result);

      const verbMap: Record<string, string> = {
        summarize: "summarized",
        simplify: "simplified",
        translate: "translated",
      };

      toast({
        title: `Text ${verbMap[type] || type} successfully!`,
        description: "The processed text is now ready for use.",
      });
    } catch (error: any) {
      toast({
        title: "Processing Error",
        description: error.message || "There was an error processing the text.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
      setActiveProcessor('');
    }
  };

  // 🔹 Download processed text
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
                  {isPlaying ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button onClick={handleStop} variant="outline" size="lg">
                  <Square className="h-4 w-4 mr-2" /> Stop
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
                      <SelectItem
                        key={`${voice.name}-${voice.lang}`}
                        value={voice.name}
                      >
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
                {processing && activeProcessor === 'summarize'
                  ? 'Summarizing...'
                  : 'Summarize Text'}
              </Button>

              <Button
                onClick={() => processWithAI('simplify')}
                disabled={processing}
                variant="outline"
                className="justify-start h-12"
              >
                <Lightbulb className="h-4 w-4 mr-3" />
                {processing && activeProcessor === 'simplify'
                  ? 'Simplifying...'
                  : 'Simplify Text'}
              </Button>

              <div className="flex items-center gap-2">
                <Select
                  value={selectedLanguage}
                  onValueChange={setSelectedLanguage}
                  disabled={processing}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_MODELS.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => processWithAI('translate')}
                  disabled={processing}
                  variant="outline"
                  className="justify-start h-12"
                >
                  <Languages className="h-4 w-4 mr-3" />
                  {processing && activeProcessor === 'translate'
                    ? 'Translating...'
                    : 'Translate Text'}
                </Button>
              </div>

              <Button
                onClick={downloadText}
                variant="outline"
                className="justify-start h-12"
              >
                <Download className="h-4 w-4 mr-3" /> Download Text
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
            <span className="text-sm text-muted-foreground">{fileName}</span>
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
