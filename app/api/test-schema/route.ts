import { NextResponse } from "next/server";
import { getTableSchema } from "../../lib/supabase";

export async function GET() {
  try {
    const schema = await getTableSchema();
    return NextResponse.json({ 
      success: true, 
      schema,
      tableCount: schema.tables.length,
      tables: schema.tables.map(t => t.name)
    });
  } catch (error) {
    console.error("Error fetching schema:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}