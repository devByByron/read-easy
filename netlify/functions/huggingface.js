export async function handler(event, context) {
  // Set timeout for Netlify function
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    const HF_API_KEY = process.env.HF_API_KEY;

    if (!HF_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "HF_API_KEY not configured" }),
      };
    }

    const { type, text, langModel } = JSON.parse(event.body || '{}');

    if (!text || !type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameters: text and type" }),
      };
    }

    // Use faster, more reliable models
    let url = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn-samsum"; // Faster summarization
    
    if (type === "simplify") {
      // Use the same summarization model but with different parameters
      url = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn-samsum";
    } else if (type === "translate" && langModel) {
      url = `https://api-inference.huggingface.co/models/${langModel}`;
    }

    // Create timeout for HuggingFace API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: type === "summarize" || type === "simplify"
          ? { max_length: 130, min_length: 30, do_sample: false, temperature: 0.7 }
          : {},
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: `HuggingFace API error: ${response.statusText}`,
          details: errorText
        }),
      };
    }

    const data = await response.json();

    // Handle various error responses from HuggingFace
    if (data.error) {
      return {
        statusCode: 503,
        body: JSON.stringify({ 
          error: "Model is loading, please try again in a few moments",
          details: data.error
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Function error:', error);
    
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      errorMessage = "Request timeout - please try again with shorter text";
      statusCode = 408;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      statusCode: statusCode,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
}
