import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
	try {
		// Check if API key is set
		if (!process.env.GOOGLE_API_KEY) {
			return NextResponse.json(
				{ success: false, error: "GOOGLE_API_KEY is not set" },
				{ status: 500 }
			);
		}

		// Test basic API connection
		const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

		const result = await model.generateContent("Say hello");
		const response = result.response;

		return NextResponse.json({
			success: true,
			message: response.text(),
			apiKeyConfigured: !!process.env.GOOGLE_API_KEY,
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: `Google AI API error: ${
					error.message || "Unknown error"
				}`,
			},
			{ status: 500 }
		);
	}
}
