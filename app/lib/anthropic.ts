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

		// Normalize query to improve matching
		const normalizedQuery = query.toLowerCase().trim();

		// Simple pattern matching for common hospital queries
		if (
			normalizedQuery.match(/list|show|get|all|find/) &&
			normalizedQuery.includes("hospital")
		) {
			console.log("Hospital query detected, using direct SQL");
			return "SELECT * FROM hospitals";
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
${table.description ? `Description: ${table.description}` : ""}
Sample data: ${JSON.stringify(table.sample_data || [])}`;
				})
				.join("\n\n");

			const prompt = `You are a SQL query generator. Convert the following natural language query to a valid SQL query.

Database schema:
${schemaText}

Natural language query: "${query}"

Instructions:
1. Analyze the query carefully to understand the user's intent
2. Identify the relevant tables and columns from the schema
3. If the query is ambiguous, make reasonable assumptions based on the schema
4. For simple queries like "show me all doctors" or "list all hospitals", generate a SELECT * query for the appropriate table
5. If the query mentions specific fields, only include those fields in the SELECT statement
6. If the query is unclear, default to a simple query that returns useful information

Respond with ONLY the SQL query, no explanations or markdown.`;

			const result = await model.generateContent(prompt);
			const response = result.response;
			const sqlQuery = response.text().trim();

			// Validate the SQL query
			if (!sqlQuery.toLowerCase().startsWith("select")) {
				throw new Error("Generated SQL does not start with SELECT");
			}

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

		// Create a more detailed prompt that includes the actual data
		const prompt = `Given these database query results: ${JSON.stringify(
			results
		)}
    
    For the original question: "${originalQuery}"
    
    Provide a concise, human-readable answer based on these results. Include specific data points from the results.
    If the results are empty, say "No results found for your query."
    If the results contain data, summarize the key information.
    
    Format your response in a clear, easy-to-read manner.`;

		const result = await model.generateContent(prompt);
		const response = result.response;
		return response.text().trim();
	} catch (error) {
		console.error("Error processing query results:", error);

		// Create a better fallback response that includes the actual data
		if (results && results.length > 0) {
			if (results.length === 1 && results[0].count !== undefined) {
				return `There are ${results[0].count} records matching your query.`;
			}

			const summary = `Found ${results.length} results for your query "${originalQuery}".`;

			// For small result sets, include more details
			if (results.length <= 5) {
				return `${summary} Here are the details:\n${results
					.map(
						(item, index) =>
							`Record ${index + 1}: ${Object.entries(item)
								.map(([key, value]) => `${key}: ${value}`)
								.join(", ")}`
					)
					.join("\n")}`;
			}

			return summary;
		}

		return `No results found for your query "${originalQuery}".`;
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
