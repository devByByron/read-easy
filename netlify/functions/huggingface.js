// netlify/functions/huggingface.js
export async function handler(event, context) {
  try {
    const HF_API_KEY = process.env.HF_API_KEY;
    const { type, text, selectedLanguage } = JSON.parse(event.body);

    // Use lightweight T5-small model for all tasks
    const url =
      "https://api-inference.huggingface.co/models/t5-small?wait_for_model=true";

    // Build prefixed input depending on task
    let inputText = text;
    if (type === "summarize") {
      inputText = `summarize: ${text}`;
    } else if (type === "simplify") {
      inputText = `simplify: ${text}`;
    } else if (type === "translate" && selectedLanguage) {
      // Example: "translate English to French: Hello"
      inputText = `translate English to ${selectedLanguage}: ${text}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: inputText,
        parameters: {
          max_length: 120,
          min_length: 20,
          do_sample: false,
        },
      }),
    });

    const data = await response.json();

    let result = "";
    if (Array.isArray(data) && data[0]?.generated_text) {
      result = data[0].generated_text;
    } else if (Array.isArray(data) && data[0]?.summary_text) {
      result = data[0].summary_text;
    } else {
      result = JSON.stringify(data);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
