import { DatabaseSchema } from "../types";
import { getTableSchema } from "./supabase";
import { getMockSchema } from "./mock-schema";
import { generateSQLWithRules } from "./fallback-generator";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google AI
let genAI;
try {
	genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
} catch (error) {
	console.error("Failed to initialize Google AI client:", error);
}

export async function processNaturalLanguageQuery(
	query: string
): Promise<string> {
	try {
		let schema: DatabaseSchema;

		try {
			schema = await getTableSchema();
			if (!schema.tables || schema.tables.length === 0) {
				console.log("No tables found in database, using mock schema");
				schema = getMockSchema();
			}
		} catch (error) {
			console.error("Error getting schema, using mock schema:", error);
			schema = getMockSchema();
		}

		// Debug: Check if schema is being retrieved correctly
		console.log(
			"Database schema retrieved, tables:",
			schema.tables.map((t) => t.name).join(", ")
		);

		// Use Google Gemma as primary option
		try {
			if (!genAI) throw new Error("Google AI client not initialized");

			const model = genAI.getGenerativeModel({
				model: "gemini-1.5-flash",
			});

			const schemaText = schema.tables
				.map((table) => {
					return `Table: ${table.name}
Columns: ${table.columns.map((col) => `${col.name} (${col.type})`).join(", ")}
${table.description ? `Description: ${table.description}` : ""}`;
				})
				.join("\n\n");

			const prompt = `You are a SQL query generator. Convert the following natural language query to a valid SQL query.

Database schema:
${schemaText}

Natural language query: "${query}"

Respond with ONLY the SQL query, no explanations or markdown.`;

			const result = await model.generateContent(prompt);
			const response = result.response;
			const sqlQuery = response.text().trim();

			console.log("Generated SQL with Google Gemma:", sqlQuery);
			return sqlQuery;
		} catch (error) {
			console.error("Google AI error, using rule-based fallback:", error);

			// Use rule-based fallback as last resort
			const sqlQuery = generateSQLWithRules(query, schema);
			console.log("Generated SQL with rule-based fallback:", sqlQuery);
			return sqlQuery;
		}
	} catch (error) {
		console.error("Error in processNaturalLanguageQuery:", error);
		throw new Error(
			`Failed to convert natural language to SQL: ${
				error.message || "Unknown error"
			}`
		);
	}
}

export async function processQueryResults(
	results: any[],
	originalQuery: string
): Promise<string> {
	try {
		if (!genAI) throw new Error("Google AI client not initialized");

		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

		const prompt = `Given these database query results: ${JSON.stringify(
			results
		)}
    
    For the original question: "${originalQuery}"
    
    Provide a concise, human-readable answer based on these results.`;

		const result = await model.generateContent(prompt);
		const response = result.response;
		return response.text().trim();
	} catch (error) {
		console.error("Error processing query results:", error);
		return `Results for query "${originalQuery}": Found ${results.length} records.`;
	}
}

// Add this function to check API key status
export async function checkAnthropicAPIStatus(): Promise<{
	isValid: boolean;
	message: string;
}> {
	if (!process.env.GOOGLE_API_KEY) {
		return {
			isValid: false,
			message:
				"Google API key is not configured. Please add GOOGLE_API_KEY to your environment variables.",
		};
	}

	try {
		if (!genAI) throw new Error("Google AI client not initialized");

		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
		await model.generateContent("Test");

		return {
			isValid: true,
			message: "Google AI API connection successful",
		};
	} catch (error) {
		console.error("Google AI API check failed:", error);
		return {
			isValid: false,
			message: `Google AI API check failed: ${
				error.message || "Unknown error"
			}`,
		};
	}
}

// For compatibility with existing code
export async function testAnthropicConnection(): Promise<string> {
	try {
		if (!genAI) throw new Error("Google AI client not initialized");

		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
		const result = await model.generateContent("Say hello");
		const response = result.response;
		return response.text();
	} catch (error) {
		console.error("Google AI connection test failed:", error);
		throw error;
	}
}
