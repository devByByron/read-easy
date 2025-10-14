// TextProcessor.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, Volume2, FileText, Brain, Languages, Lightbulb, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { callGeminiAPI } from "@/lib/gemini";
import { debugSpeechSynthesis } from "@/lib/speech-debug";

interface TextProcessorProps {
  extractedText: string;
  fileName: string;
}

const LANGUAGE_MODELS = [
  { code: 'en', name: 'English', model: 'English' }, 
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
  const [speechSupported, setSpeechSupported] = useState(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const charIndexRef = useRef(0);
  const { toast } = useToast();

  // 🔹 Test if a voice works properly
  const testVoice = async (voice: SpeechSynthesisVoice): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const testUtterance = new SpeechSynthesisUtterance('test');
        testUtterance.voice = voice;
        testUtterance.volume = 0; // Silent test
        testUtterance.rate = 2; // Fast test
        
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        }, 1000);
        
        testUtterance.onstart = () => {
          if (!resolved) {
            resolved = true;
            speechSynthesis.cancel();
            clearTimeout(timeout);
            resolve(true);
          }
        };
        
        testUtterance.onerror = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(false);
          }
        };
        
        speechSynthesis.speak(testUtterance);
      } catch (error) {
        console.error('Voice test failed:', error);
        resolve(false);
      }
    });
  };

  // Check if speech synthesis is supported
  useEffect(() => {
    const isSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    
    setSpeechSupported(isSupported && isSecureContext);
    
    if (!isSupported) {
      console.warn('Speech synthesis not supported in this browser');
      debugSpeechSynthesis();
      toast({
        title: "Text-to-Speech Not Available",
        description: "Your browser doesn't support text-to-speech functionality.",
        variant: "destructive"
      });
    } else if (!isSecureContext) {
      console.warn('Speech synthesis requires secure context (HTTPS)');
      debugSpeechSynthesis();
      toast({
        title: "Secure Connection Required",
        description: "Text-to-speech requires a secure HTTPS connection to work properly.",
        variant: "destructive"
      });
    } else {
      // Log debug info in console for troubleshooting
      debugSpeechSynthesis();
    }
  }, []);

  // 🔹 Voice loading
  useEffect(() => {
    if (!speechSupported) return;

    const loadVoices = async () => {
      const availableVoices = speechSynthesis.getVoices();
      console.log('Available voices:', availableVoices.length, availableVoices.map(v => `${v.name} (${v.lang}) [Local: ${v.localService}]`));
      
      if (availableVoices.length > 0) {
        // Filter and prioritize working voices
        const workingVoices = availableVoices.filter(voice => {
          // Prefer local/system voices as they're more reliable
          if (voice.localService !== false && !voice.name.includes('Google')) {
            return true;
          }
          // Include remote voices but with lower priority
          return true;
        });
        
        setVoices(workingVoices);
        
        // Only set default voice if none is selected
        if (!selectedVoice) {
          // Prioritize system/native voices over remote voices (Google, etc.)
          const systemVoices = availableVoices.filter(voice => 
            !voice.name.includes('Google') && !voice.name.includes('Remote')
          );
          const allVoices = systemVoices.length > 0 ? systemVoices : availableVoices;
          
          // Try to find an English voice first, then fallback to first available
          const englishVoice = allVoices.find(voice => 
            voice.lang.startsWith('en')
          );
          const defaultVoice = englishVoice || allVoices[0];
          
          if (defaultVoice) {
            setSelectedVoice(defaultVoice.name);
            console.log('Selected default voice:', defaultVoice.name, defaultVoice.lang, 'Local service:', defaultVoice.localService);
          }
        }
      }
    };

    // Load voices immediately
    loadVoices();
    
    // Also listen for voice changes (important for some browsers)
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    // Fallback: try loading voices again after delays (important for production)
    const timeouts = [100, 500, 1000, 2000].map((delay, index) => 
      setTimeout(() => {
        if (voices.length === 0) {
          console.log(`Fallback voice loading attempt ${index + 1}...`);
          loadVoices();
        }
      }, delay)
    );

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [speechSupported]);

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
      try {
        const currentCharIndex = charIndexRef.current;
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(
          extractedText.substring(currentCharIndex)
        );
        utterance.rate = speechRate[0];
        utterance.volume = speechVolume[0];
        
        const voice = getValidVoice();
        if (voice) {
          utterance.voice = voice;
        }
        
        utterance.onboundary = (event) => {
          if (event.name === "word") {
            charIndexRef.current = currentCharIndex + event.charIndex;
          }
        };
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = (event) => {
          console.error('Speech error during playback update:', event);
          setIsPlaying(false);
          
          // Auto-retry with a system voice if current voice failed
          const currentVoice = utterance.voice;
          if (currentVoice && (currentVoice.name.includes('Google') || currentVoice.localService === false)) {
            const systemVoice = voices.find(v => 
              v.localService !== false && !v.name.includes('Google')
            );
            if (systemVoice) {
              console.log('Auto-switching to system voice:', systemVoice.name);
              setSelectedVoice(systemVoice.name);
            }
          }
        };
        
        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error updating speech playback:', error);
        setIsPlaying(false);
      }
    }
  }, [speechRate, speechVolume, voices]);

  useEffect(() => {
    if (!extractedText) return;
    if (isPlaying) {
      try {
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(extractedText);
        utterance.rate = speechRate[0];
        utterance.volume = speechVolume[0];
        
        const voice = getValidVoice();
        if (voice) {
          utterance.voice = voice;
        }
        
        utterance.onboundary = (event) => {
          if (event.name === "word") {
            charIndexRef.current = event.charIndex;
          }
        };
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = (event) => {
          console.error('Speech error during voice change:', event);
          setIsPlaying(false);
          
          // Auto-retry with a system voice if current voice failed
          const currentVoice = utterance.voice;
          if (currentVoice && (currentVoice.name.includes('Google') || currentVoice.localService === false)) {
            const systemVoice = voices.find(v => 
              v.localService !== false && !v.name.includes('Google')
            );
            if (systemVoice) {
              console.log('Auto-switching to system voice:', systemVoice.name);
              setSelectedVoice(systemVoice.name);
            }
          }
        };
        
        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error changing voice during playback:', error);
        setIsPlaying(false);
      }
    }
  }, [selectedVoice, voices]);

  // 🔹 Helper function to get a valid voice
  const getValidVoice = () => {
    if (!voices.length) {
      console.log('No voices available');
      return null;
    }

    // Try to find the selected voice and validate it works
    if (selectedVoice) {
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        // Prefer local/system voices over remote ones for reliability
        if (voice.localService !== false && !voice.name.includes('Google')) {
          console.log('Using selected voice (system):', voice.name, voice.lang, 'Local:', voice.localService);
          return voice;
        } else if (voice.localService === false || voice.name.includes('Google')) {
          console.log('Selected voice is remote/Google, finding local alternative:', voice.name);
          // Try to find a local voice for the same language
          const localVoiceForLang = voices.find(v => 
            v.lang.startsWith(voice.lang.split('-')[0]) && 
            v.localService !== false && 
            !v.name.includes('Google')
          );
          if (localVoiceForLang) {
            console.log('Found local alternative:', localVoiceForLang.name, localVoiceForLang.lang);
            setSelectedVoice(localVoiceForLang.name);
            return localVoiceForLang;
          }
        }
        console.log('Using selected voice (remote fallback):', voice.name, voice.lang);
        return voice;
      }
      console.log('Selected voice not found:', selectedVoice);
    }

    // If we have processed text (like translated text), try to match language
    let languageHint = 'en';
    if (processedText && activeProcessor === 'translate') {
      const selectedLang = LANGUAGE_MODELS.find(l => l.code === selectedLanguage);
      if (selectedLang) {
        languageHint = selectedLang.code;
      }
    }

    // Prioritize system voices over remote voices
    const systemVoices = voices.filter(voice => 
      voice.localService !== false && !voice.name.includes('Google')
    );
    const voicesToSearch = systemVoices.length > 0 ? systemVoices : voices;

    // Try to find a voice for the language hint
    const languageVoice = voicesToSearch.find(voice => 
      voice.lang.startsWith(languageHint)
    );
    
    // Fallback to a good default voice
    const englishVoice = voicesToSearch.find(voice => 
      voice.lang.startsWith('en')
    );
    const fallbackVoice = languageVoice || englishVoice || voicesToSearch[0] || voices[0];
    
    if (fallbackVoice) {
      console.log('Using fallback voice:', fallbackVoice.name, fallbackVoice.lang, 'Local:', fallbackVoice.localService);
      // Update selected voice to the working one
      setSelectedVoice(fallbackVoice.name);
    }
    
    return fallbackVoice;
  };

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
    
    try {
      speechSynthesis.cancel();
      charIndexRef.current = 0;
      
      const utterance = new SpeechSynthesisUtterance(extractedText);
      utterance.rate = speechRate[0];
      utterance.volume = speechVolume[0];
      
      const voice = getValidVoice();
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onboundary = (event) => {
        if (event.name === "word") {
          charIndexRef.current = event.charIndex;
        }
      };
      utterance.onstart = () => {
        console.log('Speech started');
        setIsPlaying(true);
      };
      utterance.onend = () => {
        console.log('Speech ended');
        setIsPlaying(false);
      };
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setIsPlaying(false);
        
        // Try to recover by switching to a different voice
        const currentVoice = utterance.voice;
        if (currentVoice && (currentVoice.name.includes('Google') || currentVoice.localService === false)) {
          console.log('Retrying with system voice due to error with remote voice:', currentVoice.name);
          
          // Find a local system voice
          const systemVoice = voices.find(v => 
            v.localService !== false && 
            !v.name.includes('Google') && 
            v.lang.startsWith('en')
          );
          
          if (systemVoice && systemVoice.name !== currentVoice.name) {
            setSelectedVoice(systemVoice.name);
            toast({
              title: "Voice Switched",
              description: `Switched to ${systemVoice.name} due to compatibility issues.`,
            });
            return;
          }
        }
        
        toast({
          title: "Speech Error",
          description: "There was an error with text-to-speech. Try selecting a different voice.",
          variant: "destructive"
        });
      };
      
      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error starting speech:', error);
      setIsPlaying(false);
      toast({
        title: "Speech Error",
        description: "Text-to-speech is not available in your browser.",
        variant: "destructive"
      });
    }
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

      let data;
      
      // Check if running locally (development) or on Netlify (production)
      const isLocalDev = import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.DEV;
      
      if (isLocalDev) {
        // Use local Gemini API service
        data = await callGeminiAPI(type, inputText, langName);
      } else {
        // Use Netlify function
        const response = await fetch("/.netlify/functions/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, text: inputText, langModel: langName }),
        });

        if (!response.ok) {
          throw new Error(`Function error: ${response.statusText}`);
        }

        data = await response.json();
      }

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
            {!speechSupported ? (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Text-to-speech is not available in your browser. Please try using Chrome, Firefox, or Safari.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handlePlay}
                    variant={isPlaying ? "secondary" : "default"}
                    size="lg"
                    className="min-w-[100px]"
                    disabled={!speechSupported || voices.length === 0}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button 
                    onClick={handleStop} 
                    variant="outline" 
                    size="lg"
                    disabled={!speechSupported}
                  >
                    <Square className="h-4 w-4 mr-2" /> Stop
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Voice 
                    <span className="text-xs text-muted-foreground ml-2">
                      (✓ = Recommended, ⚠️ = May have issues)
                    </span>
                  </label>
                  <Select 
                    value={selectedVoice} 
                    onValueChange={setSelectedVoice}
                    disabled={!speechSupported || voices.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={voices.length === 0 ? "Loading voices..." : "Select a voice"} />
                    </SelectTrigger>
                    <SelectContent>
                      {voices
                        .sort((a, b) => {
                          // Sort by: 1. Local first, 2. English first, 3. Name alphabetically
                          const aLocal = a.localService !== false && !a.name.includes('Google');
                          const bLocal = b.localService !== false && !b.name.includes('Google');
                          
                          if (aLocal && !bLocal) return -1;
                          if (!aLocal && bLocal) return 1;
                          
                          const aEng = a.lang.startsWith('en');
                          const bEng = b.lang.startsWith('en');
                          
                          if (aEng && !bEng) return -1;
                          if (!aEng && bEng) return 1;
                          
                          return a.name.localeCompare(b.name);
                        })
                        .map((voice) => {
                          const isLocal = voice.localService !== false && !voice.name.includes('Google');
                          const displayName = `${voice.name} (${voice.lang})${isLocal ? ' ✓' : ' ⚠️'}`;
                          
                          return (
                            <SelectItem
                              key={`${voice.name}-${voice.lang}`}
                              value={voice.name}
                              className={isLocal ? '' : 'text-muted-foreground'}
                            >
                              {displayName}
                            </SelectItem>
                          );
                        })}
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
                    disabled={!speechSupported}
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
                    disabled={!speechSupported}
                  />
                </div>
              </div>
            )}
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
