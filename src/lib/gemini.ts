// Local Gemini API service for development
export async function callGeminiAPI(type: string, text: string, langModel?: string) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY environment variable");
  }

  // Build a task-specific instruction
  let taskPrompt = "";
  if (type === "summarize") {
    taskPrompt = `Summarize the following text clearly and concisely:\n\n${text}`;
  } else if (type === "simplify") {
    taskPrompt = `Simplify the following text so it's easy to understand:\n\n${text}`;
  } else if (type === "translate" && langModel) {
    taskPrompt = `Translate the following text into ${langModel}:\n\n${text}`;
  } else {
    taskPrompt = text;
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const data = await response.json();
  const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return { result };
}