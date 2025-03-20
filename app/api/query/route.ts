import { NextRequest, NextResponse } from "next/server";
import {
	processNaturalLanguageQuery,
	processQueryResults,
	checkAnthropicAPIStatus as checkGoogleAPIStatus,
} from "../../lib/anthropic";
import { executeQuery, getTableSchema } from "../../lib/supabase";
import { getMockSchema } from "../../lib/mock-schema";

export async function POST(req: NextRequest) {
	try {
		const { query } = await req.json();

		if (!query) {
			return NextResponse.json(
				{
					error: "Query is required",
					response: "Please provide a query to search the database.",
					sql: null,
					data: null,
					apiStatus: "error",
				},
				{ status: 400 }
			);
		}

		console.log("API route called with query:", query);

		// Check API status first
		const apiStatus = await checkGoogleAPIStatus();
		if (!apiStatus.isValid) {
			console.warn(
				"Google AI API status check failed:",
				apiStatus.message
			);
		}

		// Get database schema - will be used for both SQL generation and results processing
		let schema;
		try {
			schema = await getTableSchema();
			console.log("Retrieved database schema with tables:", schema.tables.map(t => t.name).join(", "));
		} catch (error) {
			console.error("Error retrieving schema, using mock schema:", error);
			schema = getMockSchema();
		}

		// Try to generate SQL
		let sql;
		try {
			sql = await processNaturalLanguageQuery(query, schema);
			console.log("Generated SQL:", sql);
		} catch (error: any) {
			console.error("Error generating SQL:", error);
			return NextResponse.json({
				error: `Failed to generate SQL query: ${error.message}`,
				response:
					"I couldn't understand how to query the database for that request. Could you try rephrasing it?",
				sql: null,
				data: null,
				apiStatus: apiStatus.isValid ? "ok" : apiStatus.message,
			});
		}

		// Try to execute query
		let data;
		try {
			data = await executeQuery(sql);
		} catch (error: any) {
			console.error("Error executing query:", error);
			return NextResponse.json({
				error: `Failed to execute query: ${error.message}`,
				response:
					"There was an error running your query. The database might be unavailable or the query was invalid.",
				sql,
				data: null,
				apiStatus: apiStatus.isValid ? "ok" : apiStatus.message,
			});
		}

		// Try to process results
		let response;
		try {
			if (apiStatus.isValid) {
				response = await processQueryResults(data, query, sql, schema);
			} else {
				// Enhanced fallback for result processing
				if (!data || data.length === 0) {
					response = "No results found for your query.";
				} else {
					response = `Found ${data.length} ${
						data.length === 1 ? "result" : "results"
					} for your query "${query}".`;
					if (data.length > 0) {
						const sampleProperties = Object.keys(data[0]).join(
							", "
						);
						response += ` Each record contains the following information: ${sampleProperties}.`;
					}
				}
			}
		} catch (error: any) {
			console.error("Error processing results:", error);
			response =
				data && data.length > 0
					? `Found ${data.length} ${
							data.length === 1 ? "result" : "results"
					  } matching your query.`
					: "No results found for your query.";
		}

		// Determine which tables are being queried
		const queriedTables: string[] = [];
		if (sql) {
			const sqlLower = sql.toLowerCase();
			
			// Extract table names from FROM clauses
			const fromMatches = sqlLower.match(/from\s+([a-z0-9_]+)/g);
			if (fromMatches) {
				fromMatches.forEach(match => {
					const tableName = match.replace('from', '').trim();
					if (tableName && !queriedTables.includes(tableName)) {
						queriedTables.push(tableName);
					}
				});
			}
			
			// Extract table names from JOIN clauses
			const joinMatches = sqlLower.match(/join\s+([a-z0-9_]+)/g);
			if (joinMatches) {
				joinMatches.forEach(match => {
					const tableName = match.replace('join', '').trim();
					if (tableName && !queriedTables.includes(tableName)) {
						queriedTables.push(tableName);
					}
				});
			}

			// Extract table aliases
			const aliasMatches = sqlLower.match(/from\s+([a-z0-9_]+)\s+as\s+([a-z0-9_]+)/g) || 
								 sqlLower.match(/from\s+([a-z0-9_]+)\s+([a-z0-9_]+)/g);
			
			if (aliasMatches) {
				aliasMatches.forEach(match => {
					const parts = match.replace('from', '').trim().split(/\s+/);
					if (parts.length >= 1) {
						const tableName = parts[0].trim();
						if (tableName && !queriedTables.includes(tableName)) {
							queriedTables.push(tableName);
						}
					}
				});
			}

			// Extract tables from EXISTS clauses
			const existsPattern = /exists\s*\(\s*select.*?from\s+([a-z0-9_]+)(?:\s+[a-z0-9_]+)?/gi;
			let existsMatch;
			while ((existsMatch = existsPattern.exec(sqlLower)) !== null) {
				if (existsMatch[1]) {
					const tableName = existsMatch[1].trim();
					if (tableName && !queriedTables.includes(tableName)) {
						queriedTables.push(tableName);
					}
				}
			}
			
			// Check for table aliases in the main query
			const mainQueryAliases = sqlLower.match(/from\s+([a-z0-9_]+)\s+([a-z0-9_]+)(?:\s|,|$)/g);
			if (mainQueryAliases) {
				mainQueryAliases.forEach(match => {
					const parts = match.replace('from', '').trim().split(/\s+/);
					if (parts.length >= 1) {
						const tableName = parts[0].trim();
						if (tableName && !queriedTables.includes(tableName)) {
							queriedTables.push(tableName);
						}
					}
				});
			}
		}

		return NextResponse.json({
			response,
			sql,
			data,
			schema: schema.tables.map(table => ({
				name: table.name,
				columns: table.columns.map(col => col.name),
				queried: queriedTables.includes(table.name)
			})),
			apiStatus: apiStatus.isValid ? "ok" : apiStatus.message,
		});
	} catch (error: any) {
		console.error("Error in API route:", error);
		return NextResponse.json(
			{
				error: error.message || "An unexpected error occurred",
				response:
					"Sorry, something went wrong while processing your request. Please try again.",
				sql: null,
				data: null,
				apiStatus: "error",
			},
			{ status: 500 }
		);
	}
}
