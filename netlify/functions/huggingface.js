export async function handler(event, context) {
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

    // Use smaller/faster models to avoid Netlify 504
    let url = "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6"; // fast summarizer
    if (type === "simplify") {
      url = "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6";
    } else if (type === "translate" && langModel) {
      url = `https://api-inference.huggingface.co/models/${langModel}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: type === "summarize" || type === "simplify"
          ? { max_length: 120, min_length: 40, do_sample: false }
          : {},
      }),
    });

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

    if (data.error) {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: "Model loading, retry later", details: data.error }),
      };
    }

    // ✅ Normalize result so frontend always gets { result: "..." }
    let result = "";
    if (Array.isArray(data)) {
      if (data[0]?.summary_text) result = data[0].summary_text;
      else if (data[0]?.translation_text) result = data[0].translation_text;
    } else if (typeof data === "object" && data.generated_text) {
      result = data.generated_text;
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal server error" }),
    };
  }
}
