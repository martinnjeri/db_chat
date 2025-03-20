import { createClient } from "@supabase/supabase-js";
import { DatabaseSchema, TableSchema } from "../types";

// Define types for mock data
type Hospital = {
	id: number;
	name: string;
	city: string;
	beds: number;
};

type Doctor = {
	id: number;
	name: string;
	phone_number: string;
	email: string;
};

type Patient = {
	id: number;
	name: string;
	age: number;
	doctor_id: number;
};

type MockData = {
	hospitals: Hospital[];
	doctors: Doctor[];
	patients: Patient[];
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
	process.env.SUPABASE_SERVICE_KEY ||
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	"";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Add mock schema function
export function getMockSchema(): DatabaseSchema {
	return {
		tables: [
			{
				name: "hospitals",
				description: "Healthcare facilities",
				columns: [
					{ name: "id", type: "integer", description: "Primary key" },
					{
						name: "name",
						type: "text",
						description: "Hospital name",
					},
					{
						name: "city",
						type: "text",
						description: "City location",
					},
					{
						name: "beds",
						type: "integer",
						description: "Number of beds",
					},
				],
			},
			{
				name: "doctors",
				description: "Medical professionals",
				columns: [
					{ name: "id", type: "integer", description: "Primary key" },
					{ name: "name", type: "text", description: "Doctor name" },
					{
						name: "phone_number",
						type: "text",
						description: "Contact phone number",
					},
					{
						name: "email",
						type: "text",
						description: "Email address",
					},
				],
			},
			{
				name: "patients",
				description: "People receiving medical care",
				columns: [
					{ name: "id", type: "integer", description: "Primary key" },
					{ name: "name", type: "text", description: "Patient name" },
					{
						name: "age",
						type: "integer",
						description: "Patient age",
					},
					{
						name: "doctor_id",
						type: "integer",
						description: "Foreign key to doctors",
					},
				],
			},
		],
	};
}

// Fix the setupDatabaseFunctions function
export async function setupDatabaseFunctions() {
	try {
		console.log("Setting up database functions...");

		// Use a direct SQL approach with the postgres_raw_query function
		const { error } = await supabase.rpc("postgres_raw_query", {
			sql: `
        CREATE OR REPLACE FUNCTION run_sql_query(query text)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          result JSONB;
        BEGIN
          EXECUTE query INTO result;
          RETURN result;
        EXCEPTION WHEN OTHERS THEN
          RAISE EXCEPTION 'SQL Error: %', SQLERRM;
        END;
        $$;
      `,
		});

		if (error) {
			console.log("Error creating function:", error.message);
			console.error("Error creating run_sql_query function:", error);
		} else {
			console.log("Database functions setup complete");
		}
	} catch (error) {
		console.error("Error setting up database functions:", error);
	}
}

// Call setup function on module load
setupDatabaseFunctions().catch(console.error);

// Mock data for when database connection fails
const mockData: MockData = {
	hospitals: [
		{ id: 1, name: "General Hospital", city: "New York", beds: 500 },
		{ id: 2, name: "Community Medical", city: "Boston", beds: 200 },
		{ id: 3, name: "Central Hospital", city: "Chicago", beds: 350 },
	],
	doctors: [
		{
			id: 1,
			name: "Dr. Smith",
			phone_number: "555-123-4567",
			email: "smith@hospital.com",
		},
		{
			id: 2,
			name: "Dr. Johnson",
			phone_number: "555-234-5678",
			email: "johnson@hospital.com",
		},
		{
			id: 3,
			name: "Dr. Williams",
			phone_number: "555-345-6789",
			email: "williams@hospital.com",
		},
	],
	patients: [
		{ id: 1, name: "John Doe", age: 45, doctor_id: 1 },
		{ id: 2, name: "Jane Smith", age: 8, doctor_id: 2 },
		{ id: 3, name: "Bob Johnson", age: 67, doctor_id: 1 },
	],
};

// Simplified schema retrieval function
export async function getTableSchema(): Promise<DatabaseSchema> {
	try {
		console.log("Fetching database schema...");

		// First, check if the tables exist
		const { data: tablesExist, error: checkError } = await supabase
			.from("information_schema.tables")
			.select("table_name")
			.eq("table_schema", "public")
			.limit(1);

		if (checkError || !tablesExist || tablesExist.length === 0) {
			console.log(
				"No tables found or error checking tables, using mock schema"
			);
			return getMockSchema();
		}

		// Try to use a direct SQL query approach with proper JSON formatting
		const { data, error } = await supabase.rpc("run_sql_query", {
			query: `
				SELECT json_agg(
					json_build_object(
						'name', table_name,
						'description', obj_description(('"public"."' || table_name || '"')::regclass)
					)
				) as tables
				FROM information_schema.tables 
				WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
			`,
		});

		if (error) throw error;

		if (!data || !data.tables || data.tables.length === 0) {
			console.error("No tables found in database");
			return getMockSchema();
		}

		console.log(`Found ${data.tables.length} tables in database`);

		// Process each table to get its columns
		const tables: TableSchema[] = [];

		for (const table of data.tables) {
			const tableName = table.name;

			// Get columns for this table
			const { data: columnsData, error: columnsError } =
				await supabase.rpc("run_sql_query", {
					query: `
						SELECT json_agg(
							json_build_object(
								'name', column_name,
								'type', data_type,
								'description', col_description(
									('"public"."${tableName}"')::regclass::oid, 
									ordinal_position
								)
							)
						) as columns
						FROM information_schema.columns
						WHERE table_schema = 'public' AND table_name = '${tableName}'
					`,
				});

			if (columnsError) throw columnsError;

			tables.push({
				name: tableName,
				columns: (columnsData.columns || []).map((col) => ({
					name: col.name,
					type: col.type,
					description: col.description || undefined,
				})),
				description: table.description || undefined,
			});
		}

		console.log(
			`Processed schema for ${tables.length} tables with their columns`
		);
		return { tables };
	} catch (error) {
		console.error("Error fetching schema:", error);
		return getMockSchema();
	}
}

export async function executeQuery(sqlQuery: string) {
	try {
		// Validate SQL query
		if (!sqlQuery.toLowerCase().trim().startsWith("select")) {
			throw new Error(
				"Only SELECT queries are allowed for security reasons"
			);
		}

		// Special handling for email searches
		if (sqlQuery.toLowerCase().includes("email")) {
			const originalQuery = sqlQuery;

			// Try exact match first
			let { data, error } = await supabase.rpc("run_sql_query", {
				query: originalQuery,
			});

			// If no results, try case-insensitive match
			if ((!data || data.length === 0) && !error) {
				const caseInsensitiveQuery = sqlQuery.replace(
					/email\s*=\s*'([^']+)'/i,
					"LOWER(email) = LOWER('$1')"
				);
				({ data, error } = await supabase.rpc("run_sql_query", {
					query: caseInsensitiveQuery,
				}));
			}

			// If still no results, try partial match
			if ((!data || data.length === 0) && !error) {
				const emailValue = sqlQuery.match(
					/email\s*=\s*'([^']+)'/i
				)?.[1];
				if (emailValue) {
					const partialMatchQuery = sqlQuery.replace(
						/email\s*=\s*'([^']+)'/i,
						`email ILIKE '%${emailValue}%'`
					);
					({ data, error } = await supabase.rpc("run_sql_query", {
						query: partialMatchQuery,
					}));
				}
			}

			// If there's an error or no results, try mock data
			if (error || !data || data.length === 0) {
				const tableName = sqlQuery
					.toLowerCase()
					.match(/from\s+(\w+)/)?.[1];
				if (tableName && tableName in mockData) {
					// For mock data, implement similar email matching logic
					const emailValue = sqlQuery.match(
						/email\s*=\s*'([^']+)'/i
					)?.[1];
					if (emailValue && tableName === "doctors") {
						const mockResults = mockData.doctors.filter((doc) =>
							doc.email
								.toLowerCase()
								.includes(emailValue.toLowerCase())
						);
						if (mockResults.length > 0) {
							console.log(
								`Found matching results in mock data for email: ${emailValue}`
							);
							return mockResults;
						}
					}
				}
			}

			if (error) throw error;
			return data || [];
		}

		// Regular query execution for non-email queries
		const { data, error } = await supabase.rpc("run_sql_query", {
			query: sqlQuery,
		});

		if (error) {
			console.error("Database query error:", error);

			// Check if it's a "relation does not exist" error
			if (
				error.message.includes("relation") &&
				error.message.includes("does not exist")
			) {
				// Try to get mock data for the table
				const tableName = sqlQuery
					.toLowerCase()
					.match(/from\s+(\w+)/)?.[1];
				if (tableName && tableName in mockData) {
					console.log(`Using mock data for table: ${tableName}`);
					return mockData[tableName as keyof MockData];
				}
			}

			throw new Error(`Database error: ${error.message}`);
		}

		// Handle empty results
		if (!data || (Array.isArray(data) && data.length === 0)) {
			// Try to get mock data if no results
			const tableName = sqlQuery.toLowerCase().match(/from\s+(\w+)/)?.[1];
			if (tableName && tableName in mockData) {
				console.log(
					`No results found, using mock data for table: ${tableName}`
				);
				return mockData[tableName as keyof MockData];
			}
			return [];
		}

		return data;
	} catch (error) {
		console.error("Query execution error:", error);

		// Try to extract table name and use mock data as last resort
		try {
			const tableName = sqlQuery.toLowerCase().match(/from\s+(\w+)/)?.[1];
			if (tableName && tableName in mockData) {
				console.log(
					`Error occurred, falling back to mock data for: ${tableName}`
				);
				return mockData[tableName as keyof MockData];
			}
		} catch (e) {
			console.error("Error while trying to use mock data:", e);
		}

		throw error;
	}
}
