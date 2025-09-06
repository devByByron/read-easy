export async function handler(event, context) {
  try {
    const HF_API_KEY = process.env.HF_API_KEY;
    if (!HF_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "HF_API_KEY not configured" }) };
    }

    const { type, text, langModel } = JSON.parse(event.body || "{}");
    if (!text || !type) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required parameters" }) };
    }

    // ⚡ Use lighter summarization model to stay under 10s Netlify limit
    let url = "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6";
    if (type === "translate" && langModel) {
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
        parameters:
          type === "summarize" || type === "simplify"
            ? { max_length: 120, min_length: 40, do_sample: false }
            : {},
      }),
    });

    const data = await response.json();

    // If Hugging Face says "loading", bubble it up for frontend retry
    if (data.error && data.error.includes("loading")) {
      return { statusCode: 503, body: JSON.stringify({ loading: true }) };
    }

    // ✅ Normalize response → always return { result }
    let result = "";
    if (Array.isArray(data)) {
      if (data[0]?.summary_text) result = data[0].summary_text;
      else if (data[0]?.translation_text) result = data[0].translation_text;
    } else if (data.generated_text) {
      result = data.generated_text;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
