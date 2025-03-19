import { DatabaseSchema } from "../types";

export function getMockSchema(): DatabaseSchema {
	console.log("Using mock schema as fallback");

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
