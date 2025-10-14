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
  { code: 'en', name: 'English', model: 'English', voiceLangs: ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-ZA', 'en'] }, 
  { code: 'fr', name: 'French', model: 'French', voiceLangs: ['fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'fr'] },
  { code: 'es', name: 'Spanish', model: 'Spanish', voiceLangs: ['es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-US', 'es'] },
  { code: 'de', name: 'German', model: 'German', voiceLangs: ['de-DE', 'de-AT', 'de-CH', 'de'] },
  { code: 'it', name: 'Italian', model: 'Italian', voiceLangs: ['it-IT', 'it-CH', 'it'] },
  { code: 'zh', name: 'Chinese', model: 'Chinese', voiceLangs: ['zh-CN', 'zh-TW', 'zh-HK', 'zh'] },
  { code: 'ar', name: 'Arabic', model: 'Arabic', voiceLangs: ['ar-SA', 'ar-AE', 'ar-EG', 'ar-MA', 'ar'] },
  { code: 'ru', name: 'Russian', model: 'Russian', voiceLangs: ['ru-RU', 'ru'] },
  { code: 'ja', name: 'Japanese', model: 'Japanese', voiceLangs: ['ja-JP', 'ja'] },
  { code: 'pt', name: 'Portuguese', model: 'Portuguese', voiceLangs: ['pt-BR', 'pt-PT', 'pt'] },
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
  const [autoSwitchVoice, setAutoSwitchVoice] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const charIndexRef = useRef(0);
  const { toast } = useToast();

  // 🔹 Helper function to find best voice for a language
  const findVoiceForLanguage = (langCode: string, preferLocal = true) => {
    const langModel = LANGUAGE_MODELS.find(l => l.code === langCode);
    if (!langModel || voices.length === 0) return null;

    // All voices are already filtered, so we can use them directly
    // Further filter by preference if needed
    const voicesToSearch = preferLocal 
      ? voices.filter(voice => voice.localService !== false) 
      : voices;

    // If no local voices and preferLocal is true, fall back to all filtered voices
    const finalVoices = voicesToSearch.length > 0 ? voicesToSearch : voices;

    // Try to find exact matches first, then partial matches
    for (const voiceLang of langModel.voiceLangs) {
      // Try exact match
      const exactMatch = finalVoices.find(voice => voice.lang === voiceLang);
      if (exactMatch) {
        console.log(`Found exact voice match for ${langCode}:`, exactMatch.name, exactMatch.lang, 'Reliable:', exactMatch.localService !== false);
        return exactMatch;
      }
      
      // Try partial match (e.g., 'fr' matches 'fr-FR')
      const partialMatch = finalVoices.find(voice => voice.lang.startsWith(voiceLang));
      if (partialMatch) {
        console.log(`Found partial voice match for ${langCode}:`, partialMatch.name, partialMatch.lang, 'Reliable:', partialMatch.localService !== false);
        return partialMatch;
      }
    }

    return null;
  };

  // 🔹 Handle language selection change
  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    
    // Auto-switch to appropriate voice if enabled
    if (autoSwitchVoice && voices.length > 0) {
      const languageVoice = findVoiceForLanguage(newLanguage);
      if (languageVoice) {
        setSelectedVoice(languageVoice.name);
        console.log(`Auto-switched voice for ${newLanguage}:`, languageVoice.name);
        toast({
          title: "Voice Auto-Selected",
          description: `Switched to ${languageVoice.name} for ${LANGUAGE_MODELS.find(l => l.code === newLanguage)?.name || newLanguage}`,
        });
      }
    }
  };

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
            speechSynthesis.cancel();
            resolve(false);
          }
        }, 500); // Shorter timeout
        
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

  // 🔹 Filter out known problematic voices
  const filterWorkingVoices = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] => {
    return voices.filter(voice => {
      // Remove known problematic voice patterns
      const problematicPatterns = [
        /Google.*Network/i,
        /Remote/i,
        /Microsoft.*Online/i,
        /Azure/i,
        /Cloud/i
      ];
      
      // Check if voice name matches problematic patterns
      const isProblematic = problematicPatterns.some(pattern => 
        pattern.test(voice.name)
      );
      
      if (isProblematic) {
        console.log('Filtered out problematic voice:', voice.name);
        return false;
      }
      
      // Prefer local voices
      if (voice.localService === false) {
        // Only include remote voices if they're from trusted sources
        const trustedRemotePatterns = [
          /Microsoft/i,
          /Apple/i,
          /System/i
        ];
        
        const isTrustedRemote = trustedRemotePatterns.some(pattern => 
          pattern.test(voice.name)
        );
        
        if (!isTrustedRemote) {
          console.log('Filtered out untrusted remote voice:', voice.name);
          return false;
        }
      }
      
      return true;
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
        // Filter out problematic voices
        const filteredVoices = filterWorkingVoices(availableVoices);
        console.log(`Filtered voices: ${filteredVoices.length}/${availableVoices.length} voices remaining`);
        
        // Further prioritize reliable voices
        const workingVoices = filteredVoices.sort((a, b) => {
          // Sort by reliability score
          const getReliabilityScore = (voice: SpeechSynthesisVoice) => {
            let score = 0;
            
            // Local voices are most reliable
            if (voice.localService !== false) score += 100;
            
            // System/native voices are preferred
            if (voice.name.includes('Microsoft') && !voice.name.includes('Online')) score += 50;
            if (voice.name.includes('System')) score += 50;
            if (voice.name.includes('Apple')) score += 50;
            
            // English voices get slight priority for fallback
            if (voice.lang.startsWith('en')) score += 10;
            
            // Penalize known problematic patterns
            if (voice.name.includes('Google')) score -= 30;
            if (voice.name.includes('Network')) score -= 50;
            
            return score;
          };
          
          return getReliabilityScore(b) - getReliabilityScore(a);
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
          
          // Auto-retry with the next available voice
          const currentVoice = utterance.voice;
          if (currentVoice) {
            const nextVoice = voices.find(v => 
              v.name !== currentVoice.name && v.localService !== false
            );
            if (nextVoice) {
              console.log('Auto-switching to next reliable voice:', nextVoice.name);
              setSelectedVoice(nextVoice.name);
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
          
          // Auto-retry with the next available voice
          const currentVoice = utterance.voice;
          if (currentVoice) {
            const nextVoice = voices.find(v => 
              v.name !== currentVoice.name && v.localService !== false
            );
            if (nextVoice) {
              console.log('Auto-switching to next reliable voice:', nextVoice.name);
              setSelectedVoice(nextVoice.name);
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
        // Since voices are already filtered, any voice in the list should be reliable
        console.log('Using selected voice:', voice.name, voice.lang, 'Local:', voice.localService !== false);
        return voice;
      }
      console.log('Selected voice not found in filtered list:', selectedVoice);
      
      // If selected voice was filtered out, auto-select a replacement
      const currentLangCode = selectedVoice ? 
        voices.find(v => v.name === selectedVoice)?.lang.split('-')[0] || 'en' : 'en';
      const replacementVoice = findVoiceForLanguage(currentLangCode);
      if (replacementVoice) {
        console.log('Auto-selecting replacement voice:', replacementVoice.name);
        setSelectedVoice(replacementVoice.name);
        return replacementVoice;
      }
    }

    // If we have processed text (like translated text), try to match language
    let targetLanguage = 'en';
    if (processedText && activeProcessor === 'translate') {
      targetLanguage = selectedLanguage;
      console.log(`Looking for voice for translated text in: ${targetLanguage}`);
      
      // Try to find the best voice for the target language
      const languageVoice = findVoiceForLanguage(targetLanguage);
      if (languageVoice) {
        console.log('Found voice for translated text:', languageVoice.name, languageVoice.lang);
        setSelectedVoice(languageVoice.name);
        return languageVoice;
      }
    }

    // Prioritize system voices over remote voices
    const systemVoices = voices.filter(voice => 
      voice.localService !== false && !voice.name.includes('Google')
    );
    const voicesToSearch = systemVoices.length > 0 ? systemVoices : voices;

    // Try to find voice for current target language
    const languageVoice = findVoiceForLanguage(targetLanguage);
    
    // Fallback to English voice
    const englishVoice = findVoiceForLanguage('en');
    
    // Final fallback to any available voice
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
        if (currentVoice) {
          console.log('Speech failed with voice:', currentVoice.name, 'Finding alternative...');
          
          // Find the next best voice (excluding the failed one)
          const alternativeVoice = voices.find(v => 
            v.name !== currentVoice.name && 
            v.localService !== false
          );
          
          if (alternativeVoice) {
            setSelectedVoice(alternativeVoice.name);
            toast({
              title: "Voice Switched",
              description: `Switched to ${alternativeVoice.name} due to compatibility issues.`,
            });
            return;
          }
        }
        
        toast({
          title: "Speech Error",
          description: "There was an error with text-to-speech. All voices have been tested for compatibility.",
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
    try {
      // Clear any existing error handlers to prevent error messages during stop
      if (utteranceRef.current) {
        utteranceRef.current.onerror = null;
        utteranceRef.current.onend = null;
      }
      
      // Cancel speech synthesis
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel();
      }
      
      // Reset state
      setIsPlaying(false);
      charIndexRef.current = 0;
      utteranceRef.current = null;
    } catch (error) {
      // Silent catch to prevent stop errors from showing
      console.log('Stop completed');
      setIsPlaying(false);
      charIndexRef.current = 0;
      utteranceRef.current = null;
    }
  };

  // 🔹 AI Processing (Gemini function)
  const processWithAI = async (type: string) => {
    setProcessing(true);
    setActiveProcessor(type);
    try {
      const inputText = processedText || extractedText;

      // Check text length and warn user
      const MAX_LENGTH = type === 'translate' ? 3000 : 4000;
      if (inputText.length > MAX_LENGTH) {
        toast({
          title: "Text Too Long",
          description: `Processing first ${MAX_LENGTH} characters. For full text, summarize first then ${type}.`,
        });
      }

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
      console.error('AI Processing error:', error);
      
      let errorMessage = error.message || "There was an error processing the text.";
      let errorTitle = "Processing Error";
      
      // Handle specific error cases
      if (error.message?.includes('timeout') || error.message?.includes('504')) {
        errorTitle = "Request Timeout";
        errorMessage = "Text is too long for processing. Try summarizing first, then translate the summary.";
      } else if (error.message?.includes('Function error: Gateway Timeout')) {
        errorTitle = "Processing Timeout";
        errorMessage = "The request took too long. Please try with shorter text or summarize first.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">
                      Voice 
                     
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto-switch"
                        checked={autoSwitchVoice}
                        onChange={(e) => setAutoSwitchVoice(e.target.checked)}
                        className="h-3 w-3"
                      />
                     
                    </div>
                  </div>
                  <Select 
                    value={selectedVoice} 
                    onValueChange={setSelectedVoice}
                    disabled={!speechSupported || voices.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={voices.length === 0 ? "Loading voices..." : "Select a voice"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        // Group voices by language and type
                        const groupedVoices = voices.reduce((acc, voice) => {
                          const langCode = voice.lang.split('-')[0];
                          const isLocal = voice.localService !== false && !voice.name.includes('Google');
                          
                          if (!acc[langCode]) {
                            acc[langCode] = { local: [], remote: [] };
                          }
                          
                          if (isLocal) {
                            acc[langCode].local.push(voice);
                          } else {
                            acc[langCode].remote.push(voice);
                          }
                          
                          return acc;
                        }, {} as Record<string, { local: SpeechSynthesisVoice[], remote: SpeechSynthesisVoice[] }>);

                        // Sort languages: current target language first, then English, then alphabetically
                        const sortedLangs = Object.keys(groupedVoices).sort((a, b) => {
                          if (a === selectedLanguage && b !== selectedLanguage) return -1;
                          if (b === selectedLanguage && a !== selectedLanguage) return 1;
                          if (a === 'en' && b !== 'en') return -1;
                          if (b === 'en' && a !== 'en') return 1;
                          return a.localeCompare(b);
                        });

                        return sortedLangs.flatMap(langCode => {
                          const langName = LANGUAGE_MODELS.find(l => l.code === langCode)?.name || langCode.toUpperCase();
                          const { local, remote } = groupedVoices[langCode];
                          
                          const items = [];
                          
                          // Add local voices first (these are most reliable)
                          local.forEach(voice => {
                            items.push(
                              <SelectItem
                                key={`${voice.name}-${voice.lang}`}
                                value={voice.name}
                                className="font-medium"
                              >
                                {`${voice.name} (${langName}) ✓ Reliable`}
                              </SelectItem>
                            );
                          });
                          
                          // Add remote voices (only the filtered reliable ones)
                          remote.forEach(voice => {
                            items.push(
                              <SelectItem
                                key={`${voice.name}-${voice.lang}`}
                                value={voice.name}
                                className="text-muted-foreground"
                              >
                                {`${voice.name} (${langName}) ✓ Tested`}
                              </SelectItem>
                            );
                          });
                          
                          return items;
                        });
                      })()}
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

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedLanguage}
                    onValueChange={handleLanguageChange}
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
                
                {/* Quick language buttons for common languages */}
                <div className="flex flex-wrap gap-1">
                  {['en', 'es', 'fr', 'de', 'it'].map(langCode => {
                    const lang = LANGUAGE_MODELS.find(l => l.code === langCode);
                    if (!lang) return null;
                    
                    return (
                      <Button
                        key={langCode}
                        onClick={() => handleLanguageChange(langCode)}
                        variant={selectedLanguage === langCode ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs"
                        disabled={processing}
                      >
                        {lang.name}
                      </Button>
                    );
                  })}
                </div>
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
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {(processedText || extractedText).length} characters
                {(processedText || extractedText).length > 3000 && (
                  <span className="text-amber-600 ml-2">
                    ⚠️ Long text - may need summarizing
                  </span>
                )}
              </span>
              <span className="text-sm text-muted-foreground">{fileName}</span>
            </div>
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
