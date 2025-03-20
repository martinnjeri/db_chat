import { DatabaseSchema } from "../types";

// Mock schema with sample data for testing
export function getMockSchema(): DatabaseSchema {
  return {
    tables: [
      {
        name: "hospitals",
        description: "Healthcare facilities",
        columns: [
          { name: "id", type: "integer", description: "Primary key" },
          { name: "name", type: "text", description: "Hospital name" },
          { name: "city", type: "text", description: "City location" },
          { name: "beds", type: "integer", description: "Number of beds" },
        ],
        sample_data: [
          { id: 1, name: "General Hospital", city: "New York", beds: 500 },
          { id: 2, name: "Community Medical", city: "Boston", beds: 200 },
          { id: 3, name: "Central Hospital", city: "Chicago", beds: 350 },
        ],
      },
      {
        name: "doctors",
        description: "Medical professionals who treat patients",
        columns: [
          { name: "id", type: "integer", description: "Primary key" },
          { name: "name", type: "text", description: "Doctor name" },
          { name: "phone_number", type: "text", description: "Contact phone number" },
          { name: "email", type: "text", description: "Email address" },
          { name: "hospital_id", type: "integer", description: "Foreign key to hospitals table, links doctor to their hospital" },
        ],
        sample_data: [
          {
            id: 1,
            name: "Dr. Smith",
            phone_number: "555-123-4567",
            email: "smith@hospital.com",
            hospital_id: 1,
          },
          {
            id: 2,
            name: "Dr. Johnson",
            phone_number: "555-234-5678",
            email: "johnson@hospital.com",
            hospital_id: 2,
          },
          {
            id: 3,
            name: "Dr. Williams",
            phone_number: "555-345-6789",
            email: "williams@hospital.com",
            hospital_id: 3,
          },
        ],
      },
      {
        name: "patients",
        description: "People receiving medical care, each assigned to a doctor",
        columns: [
          { name: "id", type: "integer", description: "Primary key" },
          { name: "name", type: "text", description: "Patient name" },
          { name: "age", type: "integer", description: "Patient age" },
          { 
            name: "doctor_id", 
            type: "integer", 
            description: "Foreign key to doctors table, links patient to their assigned doctor" 
          },
        ],
        sample_data: [
          { id: 1, name: "John Doe", age: 45, doctor_id: 1 },
          { id: 2, name: "Jane Smith", age: 38, doctor_id: 2 },
          { id: 3, name: "Bob Johnson", age: 67, doctor_id: 1 },
          { id: 4, name: "Alice Brown", age: 52, doctor_id: 3 },
          { id: 5, name: "Tom Wilson", age: 29, doctor_id: 2 },
          { id: 6, name: "Sarah Lee", age: 41, doctor_id: 3 },
        ],
      },
    ],
  };
}
