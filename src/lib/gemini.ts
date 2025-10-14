// Helper to chunk text for faster processing
function chunkText(text: string, maxChunkSize: number = 2000): string[] {
  if (text.length <= maxChunkSize) return [text];
  
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkSize) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

// Local Gemini API service for development with timeout and chunking
export async function callGeminiAPI(type: string, text: string, langModel?: string) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY environment variable");
  }

  // Limit text size for faster processing (max ~3000 chars for translations)
  const MAX_TEXT_LENGTH = type === 'translate' ? 3000 : 4000;
  let processedText = text;
  
  if (text.length > MAX_TEXT_LENGTH) {
    console.log(`Text too long (${text.length} chars), truncating to ${MAX_TEXT_LENGTH} chars`);
    processedText = text.substring(0, MAX_TEXT_LENGTH) + '...';
  }

  // Build a task-specific instruction with optimized prompts
  let taskPrompt = "";
  if (type === "summarize") {
    taskPrompt = `Summarize this text in 3-5 sentences:\n\n${processedText}`;
  } else if (type === "simplify") {
    taskPrompt = `Rewrite this in simple, clear language:\n\n${processedText}`;
  } else if (type === "translate" && langModel) {
    taskPrompt = `Translate to ${langModel}:\n\n${processedText}`;
  } else {
    taskPrompt = processedText;
  }

  // Use the stable Gemini Pro model with v1 endpoint
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  // Add timeout to prevent hanging (8 seconds for local, to stay under Netlify's limit)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: taskPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Lower temperature for faster, more focused responses
          maxOutputTokens: 1024, // Limit output for faster processing
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);
    
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!result) {
      console.error('Empty result from Gemini API. Full response:', data);
      throw new Error('Gemini returned empty response. The text may contain filtered content or be too long.');
    }

    return { result };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Try with shorter text or simplify first.');
    }
    throw error;
  }
}