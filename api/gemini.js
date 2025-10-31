export default async function handler(req, res) {
	// Only allow POST requests
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
		if (!GEMINI_API_KEY) {
			throw new Error("Missing GEMINI_API_KEY environment variable");
		}

		const { type, text, langModel } = req.body;

		// Limit text size for faster processing to avoid Vercel timeouts
		const MAX_TEXT_LENGTH = type === "translate" ? 3000 : 4000;
		let processedText = text;

		if (text.length > MAX_TEXT_LENGTH) {
			console.log(
				`Text too long (${text.length} chars), truncating to ${MAX_TEXT_LENGTH} chars`
			);
			processedText = text.substring(0, MAX_TEXT_LENGTH) + "...";
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

		// Use Gemini 1.5 Flash (latest stable) - best balance of speed and reliability
		const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

		// Add timeout to stay within Vercel limits (10 seconds for Hobby plan)
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 9000);

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
				console.error("Gemini API error response:", errorText);
				throw new Error(
					`Gemini API error: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();
			console.log("Gemini API response:", JSON.stringify(data, null, 2));

			const result =
				data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

			if (!result) {
				console.error(
					"Empty result from Gemini API. Full response:",
					data
				);
				throw new Error(
					"Gemini returned empty response. The text may contain filtered content or be too long."
				);
			}

			return res.status(200).json({ result });
		} catch (fetchError) {
			clearTimeout(timeoutId);

			if (fetchError.name === "AbortError") {
				throw new Error(
					"Request timeout. Text is too long. Try with shorter text or use summarize first."
				);
			}
			throw fetchError;
		}
	} catch (error) {
		console.error("Gemini function error:", error);
		return res.status(500).json({
			error: error.message || "An error occurred processing your request",
		});
	}
}
