// Option 1: Using Anthropic Claude
import Anthropic from "@anthropic-ai/sdk";

export async function processWithClaude(
	query: string,
	schema: any
): Promise<string> {
	const anthropic = new Anthropic({
		apiKey: process.env.ANTHROPIC_API_KEY,
	});

	const response = await anthropic.messages.create({
		model: "claude-3-sonnet-20240229",
		max_tokens: 1000,
		messages: [
			{
				role: "user",
				content: `Convert this natural language query to SQL. Database schema: ${JSON.stringify(
					schema
				)}
        
        Query: ${query}`,
			},
		],
		temperature: 0,
	});

	return response.content[0].text;
}

// Option 2: Using Hugging Face Inference API
export async function processWithHuggingFace(
	query: string,
	schema: any
): Promise<string> {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/microsoft/phi-2",
		{
			headers: {
				Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify({
				inputs: `Convert this natural language query to SQL. Database schema: ${JSON.stringify(
					schema
				)}
        
        Query: ${query}`,
				parameters: { temperature: 0.1, max_new_tokens: 500 },
			}),
		}
	);
	const result = await response.json();
	return result[0].generated_text;
}

// Option 3: Using Cohere
export async function processWithCohere(
	query: string,
	schema: any
): Promise<string> {
	const response = await fetch("https://api.cohere.ai/v1/generate", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "command",
			prompt: `Convert this natural language query to SQL. Database schema: ${JSON.stringify(
				schema
			)}
      
      Query: ${query}`,
			max_tokens: 300,
			temperature: 0.1,
		}),
	});

	const data = await response.json();
	return data.generations[0].text;
}

// Option 4: Using local LLM with Ollama
export async function processWithOllama(
	query: string,
	schema: any
): Promise<string> {
	const response = await fetch("http://localhost:11434/api/generate", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "llama3",
			prompt: `Convert this natural language query to SQL. Database schema: ${JSON.stringify(
				schema
			)}
      
      Query: ${query}`,
			stream: false,
		}),
	});

	const data = await response.json();
	return data.response;
}

// Option 5: Using Google Gemma API
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function processWithGemma(
	query: string,
	schema: any
): Promise<string> {
	try {
		// Initialize the Google Generative AI SDK
		const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

		// For Gemma models, use "gemini-1.5-pro" or "gemini-1.5-flash"
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

		const prompt = `Convert this natural language query to SQL. Database schema: ${JSON.stringify(
			schema
		)}
      
      Query: ${query}
      
      Return ONLY the SQL query without any explanation or markdown formatting.`;

		const result = await model.generateContent(prompt);
		const response = result.response;
		const text = response.text();

		// Clean up the response to extract just the SQL
		return text.trim();
	} catch (error) {
		console.error("Error using Google Gemma API:", error);
		throw error;
	}
}
