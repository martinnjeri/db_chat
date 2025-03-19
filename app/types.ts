// Response from the API
export interface QueryResponse {
  response: string;
  data: any[];
  sql?: string;
}

// Database schema types
export interface TableColumn {
  name: string;
  type: string;
  description?: string;
}

export interface TableSchema {
  name: string;
  columns: TableColumn[];
  description?: string;
}

export interface DatabaseSchema {
  tables: TableSchema[];
}