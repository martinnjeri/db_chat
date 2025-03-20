import { DatabaseSchema } from "../types";
import { getTableSchema } from "./supabase";
import { getMockSchema } from "./mock-schema";
import { generateSQLWithRules } from "./fallback-generator";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Initialize Google AI
let genAI: GoogleGenerativeAI | undefined;
try {
	genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
} catch (error) {
	console.error("Failed to initialize Google AI client:", error);
}

export async function processNaturalLanguageQuery(
	query: string,
	schema?: DatabaseSchema
): Promise<string> {
	try {
		// If schema is not provided, try to get it
		if (!schema) {
			try {
				schema = await getTableSchema();
				if (!schema.tables || schema.tables.length === 0) {
					console.log("No tables found in database, using mock schema");
					schema = getMockSchema();
				}
			} catch (error: unknown) {
				console.error("Error getting schema, using mock schema:", error);
				schema = getMockSchema();
			}
		}

		// Normalize query to improve matching
		const normalizedQuery = query.toLowerCase().trim();

		// Direct pattern matching for common queries
		if (
			normalizedQuery.match(/list|show|get|all|find/) &&
			normalizedQuery.includes("hospital")
		) {
			console.log("Hospital query detected, using direct SQL");
			return "SELECT * FROM hospitals";
		}
		
		// Handle common doctor-patient relationship queries
		if (
			normalizedQuery.match(/doctors? (with|who have) patients/) ||
			normalizedQuery.includes("doctors that have patients") ||
			normalizedQuery.includes("doctors with at least one patient")
		) {
			console.log("Doctor-patient relationship query detected, using optimized SQL");
			return "SELECT d.name FROM doctors d WHERE EXISTS (SELECT 1 FROM patients p WHERE p.doctor_id = d.id)";
		}

		// Debug: Check if schema is being retrieved correctly
		console.log(
			"Database schema retrieved, tables:",
			schema.tables.map((t) => t.name).join(", ")
		);

		// Use Google Gemma as primary option
		try {
			if (!genAI) throw new Error("Google AI client not initialized");

			const model: GenerativeModel = genAI.getGenerativeModel({
				model: "gemini-1.5-flash",
			});

			const schemaText = schema.tables
				.map((table) => {
					const sampleDataStr = table.sample_data ? 
						`Sample data: ${JSON.stringify(table.sample_data || [])}` : 
						"";
					
					return `Table: ${table.name}
Columns: ${table.columns.map((col) => `${col.name} (${col.type})`).join(", ")}
${table.description ? `Description: ${table.description}` : ""}
${sampleDataStr}`;
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
7. Be aware of relationships between tables (like doctors and patients) and use appropriate JOINs or EXISTS clauses
8. Always consider ALL tables in the schema when generating queries
9. For queries about "doctors with patients" or "doctors who have patients", use:
   SELECT d.name FROM doctors d WHERE EXISTS (SELECT 1 FROM patients p WHERE p.doctor_id = d.id)
10. Make sure to use table aliases (like 'd' for doctors) in complex queries

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
		} catch (error: unknown) {
			console.error("Google AI error, using rule-based fallback:", error);

			// Use rule-based fallback as last resort
			const sqlQuery = generateSQLWithRules(query, schema);
			console.log("Generated SQL with rule-based fallback:", sqlQuery);
			return sqlQuery;
		}
	} catch (error: unknown) {
		console.error("Error in processNaturalLanguageQuery:", error);
		throw new Error(
			`Failed to convert natural language to SQL: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

export async function processQueryResults(
	results: any[],
	originalQuery: string,
	sqlQuery: string,
	schema?: DatabaseSchema
): Promise<string> {
	try {
		// If schema is not provided, try to get it
		if (!schema) {
			try {
				schema = await getTableSchema();
				if (!schema.tables || schema.tables.length === 0) {
					console.log("No tables found in database, using mock schema");
					schema = getMockSchema();
				}
			} catch (error: unknown) {
				console.error("Error getting schema, using mock schema:", error);
				schema = getMockSchema();
			}
		}

		// Generate a human-readable summary of the results
		let summary = "";

		// Handle empty results
		if (!results || results.length === 0) {
			// Check if it's a doctor-patient relationship query
			if (
				sqlQuery.toLowerCase().includes("exists") &&
				sqlQuery.toLowerCase().includes("doctors") &&
				sqlQuery.toLowerCase().includes("patients")
			) {
				return "No doctors were found who have patients assigned to them. This could mean either all doctors don't have any patients assigned, or there might be no matching records based on your specific criteria.";
			}
			
			return "No results were found for your query. This could mean there are no records matching your criteria in the database.";
		}

		// Start with a basic summary
		summary = `Found ${results.length} ${
			results.length === 1 ? "result" : "results"
		} for your query.`;

		// Add more context based on the SQL query structure
		const sqlLower = sqlQuery.toLowerCase();
		
		// Detect doctor-patient relationship queries with EXISTS
		if (
			sqlLower.includes("doctors") && 
			sqlLower.includes("patients") && 
			sqlLower.includes("exists")
		) {
			summary = `Found ${results.length} ${
				results.length === 1 ? "doctor who has" : "doctors who have"
			} at least one patient assigned to them. `;
			
			if (results.length > 0) {
				const doctorNames = results.map((r) => r.name || "Unknown").join(", ");
				summary += `These doctors are: ${doctorNames}. Each of these doctors has at least one patient record in the database.`;
			}
			
			return summary;
		}

		// Handle EXISTS clauses in general
		if (sqlLower.includes("exists")) {
			summary += " This query is finding records in one table that have related records in another table.";
			
			// Identify the main table and related table
			const mainTableMatch = sqlLower.match(/from\s+([a-z0-9_]+)/i);
			const subqueryTableMatch = sqlLower.match(/exists\s*\(\s*select.*?from\s+([a-z0-9_]+)/i);
			
			if (mainTableMatch && subqueryTableMatch) {
				const mainTable = mainTableMatch[1];
				const relatedTable = subqueryTableMatch[1];
				
				summary += ` Specifically, it's showing ${mainTable} that have at least one related ${relatedTable}.`;
			}
		}

		// Add information about the returned columns
		if (results.length > 0) {
			const sampleResult = results[0];
			const columns = Object.keys(sampleResult);
			
			if (columns.length === 1) {
				summary += ` The query returned the "${columns[0]}" field.`;
			} else if (columns.length > 1) {
				const lastColumn = columns.pop();
				summary += ` The query returned these fields: ${columns.join(", ")} and ${lastColumn}.`;
			}
		}

		// Try to use Google Gemma for a more natural explanation
		try {
			if (!genAI) throw new Error("Google AI client not initialized");

			const model: GenerativeModel = genAI.getGenerativeModel({
				model: "gemini-1.5-flash",
			});

			// Create a prompt that includes the query, SQL, results, and schema
			const schemaText = schema.tables
				.map((table) => {
					return `Table: ${table.name}
Columns: ${table.columns.map((col) => `${col.name} (${col.type})`).join(", ")}
${table.description ? `Description: ${table.description}` : ""}`;
				})
				.join("\n\n");

			const resultsText = JSON.stringify(results, null, 2);

			const prompt = `You are an AI assistant that explains SQL query results in natural language. 
Explain the following query results to a user who is not familiar with SQL.

Original user query: "${originalQuery}"
SQL query: ${sqlQuery}
Database schema:
${schemaText}

Query results:
${resultsText}

Instructions:
1. Provide a clear, concise explanation of what the results mean
2. If the query uses EXISTS, explain that it finds records in one table that have related records in another table
3. For doctor-patient queries, clearly explain the relationship (e.g., "doctors who have patients")
4. Mention specific values from the results if relevant
5. Keep your explanation under 3-4 sentences
6. Do not include technical SQL details unless necessary for understanding
7. Focus on answering the user's original question in plain language

Your explanation:`;

			const result = await model.generateContent(prompt);
			const response = result.response;
			const explanation = response.text().trim();

			console.log("Generated explanation with Google Gemma:", explanation);
			return explanation;
		} catch (error: unknown) {
			console.error("Google AI error, using rule-based fallback:", error);
			return summary;
		}
	} catch (error: unknown) {
		console.error("Error in processQueryResults:", error);
		return `Found ${results.length} ${
			results.length === 1 ? "result" : "results"
		} for your query.`;
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
	} catch (error: unknown) {
		console.error("Google AI API check failed:", error);
		return {
			isValid: false,
			message: `Google AI API check failed: ${
				error instanceof Error ? error.message : "Unknown error"
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
	} catch (error: unknown) {
		console.error("Google AI connection test failed:", error);
		throw error;
	}
}
