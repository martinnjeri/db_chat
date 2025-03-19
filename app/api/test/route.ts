import { NextResponse } from "next/server";
import { testAnthropicConnection } from "../../lib/anthropic";

export async function GET() {
	try {
		const result = await testAnthropicConnection();
		return NextResponse.json({ success: true, message: result });
	} catch (error) {
		console.error("Test API error:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
