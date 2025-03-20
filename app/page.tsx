"use client";

import { useState } from "react";
import QueryInput from "./components/QueryInput";
import ResponseDisplay from "./components/ResponseDisplay";

interface SchemaTable {
	name: string;
	columns: string[];
	queried: boolean;
}

export default function Home() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [response, setResponse] = useState<string | null>(null);
	const [sql, setSql] = useState<string | null>(null);
	const [data, setData] = useState<any[] | null>(null);
	const [schema, setSchema] = useState<SchemaTable[] | null>(null);

	const handleSubmit = async (query: string) => {
		setIsLoading(true);
		setError(null);
		setResponse(null);
		setSql(null);
		setData(null);
		setSchema(null);

		try {
			const res = await fetch("/api/query", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ query }),
			});

			const result = await res.json();

			if (!res.ok) {
				throw new Error(result.error || "Failed to process query");
			}

			if (result.error) {
				setError(result.error);
			}

			setResponse(result.response);
			setSql(result.sql);
			setData(result.data);
			setSchema(result.schema);

			// Log API status issues if any
			if (result.apiStatus && result.apiStatus !== "ok") {
				console.warn("API Status Issue:", result.apiStatus);
			}
		} catch (error: any) {
			setError(error.message || "An unexpected error occurred");
			setResponse("Sorry, something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="flex min-h-screen flex-col items-center p-8 bg-[var(--background)]">
			<h1 className="text-3xl font-bold mb-8 text-[var(--foreground)]">
				Database Query Assistant
			</h1>

			<div className="w-full max-w-lg">
				<QueryInput onSubmit={handleSubmit} disabled={isLoading} />

				{(isLoading || error || response || sql || data || schema) && (
					<ResponseDisplay
						response={response || ""}
						sql={sql}
						data={data}
						schema={schema}
						isLoading={isLoading}
						error={error}
					/>
				)}
			</div>
		</main>
	);
}
