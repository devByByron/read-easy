// Debug utility for speech synthesis issues
export const debugSpeechSynthesis = () => {
  console.group('🎙️ Speech Synthesis Debug Info');
  
  // Check basic support
  console.log('speechSynthesis in window:', 'speechSynthesis' in window);
  console.log('SpeechSynthesisUtterance in window:', 'SpeechSynthesisUtterance' in window);
  console.log('Secure context:', window.isSecureContext);
  console.log('Protocol:', window.location.protocol);
  console.log('Hostname:', window.location.hostname);
  
  if ('speechSynthesis' in window) {
    // Check synthesis state
    console.log('speechSynthesis.speaking:', speechSynthesis.speaking);
    console.log('speechSynthesis.pending:', speechSynthesis.pending);
    console.log('speechSynthesis.paused:', speechSynthesis.paused);
    
    // Get available voices
    const voices = speechSynthesis.getVoices();
    console.log('Available voices count:', voices.length);
    
    if (voices.length > 0) {
      console.log('Voice details:');
      const systemVoices = [];
      const remoteVoices = [];
      
      voices.forEach((voice, index) => {
        const isLocal = voice.localService !== false && !voice.name.includes('Google');
        const status = isLocal ? '✅ Recommended' : '⚠️ Remote/May have issues';
        console.log(`  ${index + 1}. ${voice.name} (${voice.lang}) - ${status} [Default: ${voice.default}, Local: ${voice.localService}]`);
        
        if (isLocal) {
          systemVoices.push(voice.name);
        } else {
          remoteVoices.push(voice.name);
        }
      });
      
      console.log(`System/Local voices (${systemVoices.length}):`, systemVoices);
      console.log(`Remote voices (${remoteVoices.length}):`, remoteVoices);
      
      // Group by language
      const voicesByLang = voices.reduce((acc, voice) => {
        const lang = voice.lang.split('-')[0];
        if (!acc[lang]) acc[lang] = [];
        const isLocal = voice.localService !== false && !voice.name.includes('Google');
        acc[lang].push(`${voice.name}${isLocal ? ' ✅' : ' ⚠️'}`);
        return acc;
      }, {} as Record<string, string[]>);
      
      console.log('Voices by language:', voicesByLang);
      
      if (systemVoices.length === 0) {
        console.warn('⚠️ No local/system voices found! This may cause TTS issues.');
      }
    } else {
      console.warn('No voices available - this might be the issue!');
    }
  }
  
  // Browser detection
  const userAgent = navigator.userAgent;
  const isChrome = /Chrome/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isEdge = /Edge/.test(userAgent);
  
  console.log('Browser detection:', {
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    userAgent: userAgent.substring(0, 100) + '...'
  });
  
  console.groupEnd();
};

export const testSpeechSynthesis = (text = 'Hello, this is a test of the speech synthesis API.') => {
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported');
    return;
  }
  
  console.log('🧪 Testing speech synthesis...');
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  utterance.onstart = () => console.log('✅ Speech started successfully');
  utterance.onend = () => console.log('✅ Speech ended successfully');
  utterance.onerror = (event) => console.error('❌ Speech error:', event);
  
  try {
    speechSynthesis.speak(utterance);
    console.log('Speech synthesis command sent');
  } catch (error) {
    console.error('Error calling speechSynthesis.speak():', error);
  }
};