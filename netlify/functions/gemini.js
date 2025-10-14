export async function handler(event, context) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }

    const { type, text, langModel } = JSON.parse(event.body);

    // Limit text size for faster processing to avoid Netlify timeouts
    const MAX_TEXT_LENGTH = type === 'translate' ? 3000 : 4000;
    let processedText = text;
    
    if (text.length > MAX_TEXT_LENGTH) {
      console.log(`Text too long (${text.length} chars), truncating to ${MAX_TEXT_LENGTH} chars`);
      processedText = text.substring(0, MAX_TEXT_LENGTH) + '...';
    }

    // Build a task-specific instruction with optimized prompts for faster processing
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

    // Add timeout to stay within Netlify limits (8 seconds)
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
      console.log('Gemini API response:', JSON.stringify(data, null, 2));
      
      const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!result) {
        console.error('Empty result from Gemini API. Full response:', data);
        throw new Error('Gemini returned empty response. The text may contain filtered content or be too long.');
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ result }),
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout. Text is too long. Try with shorter text or use summarize first.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Gemini function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'An error occurred processing your request' }),
    };
  }
}
