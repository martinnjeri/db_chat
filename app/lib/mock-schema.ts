import { DatabaseSchema } from "../types";

export function getMockSchema(): DatabaseSchema {
	return {
		tables: [
			{
				name: "doctors",
				description: "Medical professionals working at the hospital",
				columns: [
					{
						name: "id",
						type: "integer",
						description: "Unique identifier",
					},
					{
						name: "name",
						type: "text",
						description: "Doctor's full name",
					},
					{
						name: "specialty",
						type: "text",
						description: "Medical specialty",
					},
					{
						name: "hospital_id",
						type: "integer",
						description: "Hospital where the doctor works",
					},
					{
						name: "years_experience",
						type: "integer",
						description: "Years of professional experience",
					},
				],
				sample_data: [
					{
						id: 1,
						name: "Dr. Smith",
						specialty: "Cardiology",
						hospital_id: 1,
						years_experience: 15,
					},
					{
						id: 2,
						name: "Dr. Johnson",
						specialty: "Neurology",
						hospital_id: 2,
						years_experience: 8,
					},
				],
			},
			{
				name: "hospitals",
				description: "Medical facilities",
				columns: [
					{
						name: "id",
						type: "integer",
						description: "Unique identifier",
					},
					{
						name: "name",
						type: "text",
						description: "Hospital name",
					},
					{
						name: "location",
						type: "text",
						description: "City or address",
					},
					{
						name: "beds",
						type: "integer",
						description: "Number of beds available",
					},
					{
						name: "rating",
						type: "numeric",
						description: "Hospital rating (1-5)",
					},
				],
				sample_data: [
					{
						id: 1,
						name: "General Hospital",
						location: "Downtown",
						beds: 500,
						rating: 4.2,
					},
					{
						id: 2,
						name: "Community Medical Center",
						location: "Westside",
						beds: 200,
						rating: 3.8,
					},
				],
			},
			{
				name: "patients",
				description: "People receiving medical care",
				columns: [
					{
						name: "id",
						type: "integer",
						description: "Unique identifier",
					},
					{
						name: "name",
						type: "text",
						description: "Patient's full name",
					},
					{
						name: "age",
						type: "integer",
						description: "Patient's age",
					},
					{
						name: "condition",
						type: "text",
						description: "Medical condition",
					},
					{
						name: "doctor_id",
						type: "integer",
						description: "Primary doctor's ID",
					},
					{
						name: "admitted_date",
						type: "date",
						description: "Date of admission",
					},
				],
				sample_data: [
					{
						id: 1,
						name: "Jane Doe",
						age: 45,
						condition: "Hypertension",
						doctor_id: 1,
						admitted_date: "2023-05-15",
					},
					{
						id: 2,
						name: "John Smith",
						age: 62,
						condition: "Stroke",
						doctor_id: 2,
						admitted_date: "2023-06-02",
					},
				],
			},
		],
	};
}
