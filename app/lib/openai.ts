import { DatabaseSchema } from "../types";
import { getTableSchema } from "./supabase";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function processNaturalLanguageQuery(
	query: string
): Promise<string> {
	const schema: DatabaseSchema = await getTableSchema();

	try {
		const response = await anthropic.messages.create({
			model: "claude-3-sonnet-20240229",
			max_tokens: 1000,
			messages: [
				{
					role: "user",
					content: `Convert this natural language query to SQL. Database schema: ${JSON.stringify(
						schema
					)}
          
          Query: ${query}
          
          Return ONLY the SQL query without any explanation or markdown formatting.`,
				},
			],
			temperature: 0,
		});

		// Extract just the SQL query from the response
		const sqlQuery = response.content[0].text.trim();
		return sqlQuery;
	} catch (error) {
		console.error("Error calling Anthropic API:", error);
		throw new Error("Failed to convert natural language to SQL");
	}
}

export async function processQueryResults(
	results: any[],
	originalQuery: string
): Promise<string> {
	try {
		const response = await anthropic.messages.create({
			model: "claude-3-haiku-20240307",
			max_tokens: 1000,
			messages: [
				{
					role: "user",
					content: `Given these database query results: ${JSON.stringify(
						results
					)}
          
          For the original question: "${originalQuery}"
          
          Provide a concise, human-readable answer based on these results.`,
				},
			],
			temperature: 0.7,
		});

		return response.content[0].text.trim();
	} catch (error) {
		console.error(
			"Error calling Anthropic API for results processing:",
			error
		);
		return `Results for query "${originalQuery}": Found ${results.length} records.`;
	}
}

// Add a simple test function
export async function testAnthropicConnection(): Promise<string> {
	try {
		const response = await anthropic.messages.create({
			model: "claude-3-haiku-20240307",
			max_tokens: 100,
			messages: [
				{
					role: "user",
					content: "Say hello",
				},
			],
		});
		return response.content[0].text;
	} catch (error) {
		console.error("Anthropic connection test failed:", error);
		throw error;
	}
}
