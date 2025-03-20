import { NextRequest, NextResponse } from "next/server";
import {
	processNaturalLanguageQuery,
	processQueryResults,
	checkAnthropicAPIStatus as checkGoogleAPIStatus,
} from "../../lib/anthropic";
import { executeQuery } from "../../lib/supabase";

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

		// Try to generate SQL
		let sql;
		try {
			sql = await processNaturalLanguageQuery(query);
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
				response = await processQueryResults(data, query);
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

		return NextResponse.json({
			response,
			sql,
			data,
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
