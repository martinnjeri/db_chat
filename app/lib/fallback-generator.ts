import { DatabaseSchema } from "../types";

// Simple fallback SQL generator for when the API is unavailable
export function generateSQLWithRules(
	query: string,
	schema: DatabaseSchema
): string {
	const normalizedQuery = query.toLowerCase();

	// Extract key information from the query
	const words = normalizedQuery.split(/\s+/);

	// Handle common query patterns
	if (
		normalizedQuery.includes("all") ||
		normalizedQuery.includes("list") ||
		normalizedQuery.includes("show") ||
		normalizedQuery.includes("get")
	) {
		// Check for table names in the query
		for (const table of schema.tables) {
			const tableName = table.name.toLowerCase();
			const singularName = tableName.endsWith("s")
				? tableName.slice(0, -1)
				: tableName;

			if (
				normalizedQuery.includes(tableName) ||
				normalizedQuery.includes(singularName)
			) {
				// Check if specific columns are mentioned
				const columns = table.columns.map((col) =>
					col.name.toLowerCase()
				);
				const requestedColumns = [];

				for (const col of columns) {
					if (normalizedQuery.includes(col)) {
						requestedColumns.push(col);
					}
				}

				if (requestedColumns.length > 0) {
					return `SELECT ${requestedColumns.join(", ")} FROM ${
						table.name
					}`;
				} else {
					return `SELECT * FROM ${table.name}`;
				}
			}
		}
	}

	// Handle count queries
	if (
		normalizedQuery.includes("how many") ||
		normalizedQuery.includes("count")
	) {
		for (const table of schema.tables) {
			const tableName = table.name.toLowerCase();
			const singularName = tableName.endsWith("s")
				? tableName.slice(0, -1)
				: tableName;

			if (
				normalizedQuery.includes(tableName) ||
				normalizedQuery.includes(singularName)
			) {
				return `SELECT COUNT(*) FROM ${table.name}`;
			}
		}
	}

	// Handle queries about specific attributes
	for (const table of schema.tables) {
		const tableName = table.name.toLowerCase();

		// Look for queries about a specific record
		if (
			normalizedQuery.includes(`find ${tableName}`) ||
			normalizedQuery.includes(`get ${tableName}`) ||
			normalizedQuery.includes(`show ${tableName}`)
		) {
			// Check if there's an ID or name mentioned
			const idMatch = normalizedQuery.match(/id (\d+)|id:(\d+)|#(\d+)/);
			const nameMatch = normalizedQuery.match(
				/name (['"][\w\s]+['"])|named (['"][\w\s]+['"])/
			);

			if (idMatch) {
				const id = idMatch[1] || idMatch[2] || idMatch[3];
				return `SELECT * FROM ${tableName} WHERE id = ${id}`;
			} else if (nameMatch) {
				const name = nameMatch[1] || nameMatch[2];
				return `SELECT * FROM ${tableName} WHERE name LIKE ${name}`;
			} else {
				// Just return all records with a limit
				return `SELECT * FROM ${tableName} LIMIT 10`;
			}
		}
	}

	// Default query - select from the first table that seems relevant
	for (const word of words) {
		for (const table of schema.tables) {
			const tableName = table.name.toLowerCase();
			// Check if any word in the query matches a table name
			if (tableName.includes(word) || word.includes(tableName)) {
				return `SELECT * FROM ${table.name} LIMIT 10`;
			}
		}
	}

	// Last resort - just query the first table
	if (schema.tables.length > 0) {
		return `SELECT * FROM ${schema.tables[0].name} LIMIT 10`;
	}

	return "SELECT 1"; // Fallback if no tables exist
}
