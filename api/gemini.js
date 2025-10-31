export default async function handler(req, res) {
	// Set CORS headers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	// Handle OPTIONS request for CORS
	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	// Only allow POST requests
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	// Log environment for debugging (only in production)
	console.log("Environment check:", {
		hasGeminiKey: !!process.env.GEMINI_API_KEY,
		keyLength: process.env.GEMINI_API_KEY?.length,
		nodeEnv: process.env.NODE_ENV,
	});

	try {
		const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
		if (!GEMINI_API_KEY) {
			console.error("Missing GEMINI_API_KEY environment variable");
			return res.status(500).json({
				error: "Server configuration error: Missing API key. Please contact administrator.",
			});
		}

		const { type, text, langModel } = req.body;

		console.log("Request received:", {
			type,
			textLength: text?.length,
			langModel,
			bodyKeys: Object.keys(req.body || {}),
		});

		if (!type || !text) {
			console.error("Missing required parameters:", {
				type,
				textLength: text?.length,
			});
			return res.status(400).json({
				error: `Missing required parameters: ${!type ? "type" : ""} ${
					!text ? "text" : ""
				}`.trim(),
			});
		}

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

		// Use Gemini Pro (free tier) - reliable for text processing
		const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

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
				console.error("Request timeout occurred");
				throw new Error(
					"Request timeout. Text is too long. Try with shorter text or use summarize first."
				);
			}
			console.error("Fetch error:", fetchError);
			throw fetchError;
		}
	} catch (error) {
		console.error("Gemini function error:", {
			message: error.message,
			name: error.name,
			stack: error.stack,
		});

		// Return detailed error for debugging
		return res.status(500).json({
			error: error.message || "An error occurred processing your request",
			details:
				process.env.NODE_ENV === "development"
					? error.stack
					: undefined,
		});
	}
}
