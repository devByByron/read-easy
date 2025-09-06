export async function handler(event, context) {
  try {
    const HF_API_KEY = process.env.HF_API_KEY;
    const { type, text, langModel } = JSON.parse(event.body);

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
        parameters: type === "summarize" || type === "simplify"
          ? { max_length: 120, min_length: 40, do_sample: false }
          : {},
      }),
    });

    const data = await response.json();

    let result = "";
    if (Array.isArray(data)) {
      if (data[0]?.summary_text) result = data[0].summary_text;
      if (data[0]?.translation_text) result = data[0].translation_text;
    } else if (data.generated_text) {
      result = data.generated_text;
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
