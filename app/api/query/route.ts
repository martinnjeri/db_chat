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
				{ error: "Query is required" },
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
			// Continue anyway, as we have fallback mechanisms
		}

		// Try to generate SQL
		let sql;
		try {
			sql = await processNaturalLanguageQuery(query);
		} catch (error) {
			console.error("Error generating SQL:", error);
			return NextResponse.json({
				response: `Error generating SQL: ${error.message}`,
				sql: "Error",
				data: [],
				apiStatus: apiStatus.isValid ? "ok" : apiStatus.message,
			});
		}

		// Try to execute query
		let data;
		try {
			data = await executeQuery(sql);
		} catch (error) {
			console.error("Error executing query:", error);
			return NextResponse.json({
				response: `Error executing query: ${error.message}`,
				sql,
				data: [],
				apiStatus: apiStatus.isValid ? "ok" : apiStatus.message,
			});
		}

		// Try to process results
		let response;
		try {
			if (apiStatus.isValid) {
				response = await processQueryResults(data, query);
			} else {
				// Simple fallback for result processing
				response = `Found ${data.length} results for your query "${query}".`;
				if (data.length > 0) {
					response += ` The first result has the following properties: ${Object.keys(
						data[0]
					).join(", ")}.`;
				}
			}
		} catch (error) {
			console.error("Error processing results:", error);
			response = `Found ${data.length} results for your query.`;
		}

		return NextResponse.json({
			response,
			sql,
			data,
			apiStatus: apiStatus.isValid ? "ok" : apiStatus.message,
		});
	} catch (error) {
		console.error("Error in API route:", error);
		return NextResponse.json(
			{
				response: `Error: ${error.message || "Unknown error"}`,
				sql: "Error occurred",
				data: [],
				apiStatus: "error",
			},
			{ status: 200 }
		); // Return 200 to see the error in the UI
	}
}
