// Create this file if it doesn't exist
export const mockData = {
  hospitals: [
    { id: 1, name: "General Hospital", location: "Downtown", beds: 500, established: 1985 },
    { id: 2, name: "Community Medical Center", location: "Westside", beds: 200, established: 1998 },
    { id: 3, name: "Children's Hospital", location: "Eastside", beds: 300, established: 1975 }
  ],
  doctors: [
    { id: 1, name: "Dr. Smith", specialty: "Cardiology", hospital_id: 1, years_experience: 15 },
    { id: 2, name: "Dr. Johnson", specialty: "Pediatrics", hospital_id: 3, years_experience: 10 },
    { id: 3, name: "Dr. Williams", specialty: "Neurology", hospital_id: 1, years_experience: 20 },
    { id: 4, name: "Dr. Brown", specialty: "Oncology", hospital_id: 2, years_experience: 12 }
  ],
  patients: [
    { id: 1, name: "John Doe", age: 45, condition: "Hypertension", doctor_id: 1 },
    { id: 2, name: "Jane Smith", age: 8, condition: "Asthma", doctor_id: 2 },
    { id: 3, name: "Robert Johnson", age: 62, condition: "Stroke", doctor_id: 3 },
    { id: 4, name: "Emily Davis", age: 35, condition: "Breast Cancer", doctor_id: 4 },
    { id: 5, name: "Michael Wilson", age: 50, condition: "Diabetes", doctor_id: 1 }
  ]
};

export default mockData;