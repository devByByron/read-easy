// netlify/functions/huggingface.js
export async function handler(event, context) {
  try {
    const HF_API_KEY = process.env.HF_API_KEY; // stored in Netlify env vars

    const { type, text, langModel } = JSON.parse(event.body);

    let url = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

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
        parameters: type === "summarize" || type === "simplify"
          ? { max_length: 150, min_length: 50, do_sample: false }
          : {},
      }),
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
