"use client";

import { useState } from "react";
import QueryInput from "./components/QueryInput";
import ResponseDisplay from "./components/ResponseDisplay";
import { QueryResponse } from "./types";

export default function Home() {
	const [response, setResponse] = useState<QueryResponse | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [apiStatus, setApiStatus] = useState<string | null>(null);
	const [sql, setSql] = useState<string | null>(null);
	const [data, setData] = useState<any[] | null>(null);

	const handleQuery = async (query: string) => {
		setLoading(true);
		setError(null);
		setResponse(null);
		setApiStatus(null);
		setSql(null);
		setData(null);

		try {
			console.log("Sending query:", query);

			const res = await fetch("/api/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query }),
			});

			const data = await res.json();

			if (data.apiStatus && data.apiStatus !== "ok") {
				setApiStatus(data.apiStatus);
			}

			if (data.response) {
				setResponse(data.response);
			}

			if (data.sql && data.sql !== "Error") {
				setSql(data.sql);
			}

			if (data.data) {
				setData(data.data);
			}

			if (data.error) {
				setError(data.error);
			}
		} catch (err) {
			setError("Failed to send query. Please try again.");
			console.error("Error sending query:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="flex min-h-screen flex-col items-center p-8">
			<h1 className="text-3xl font-bold mb-8">
				Database Query Assistant
			</h1>
			<QueryInput onSubmit={handleQuery} disabled={loading} />

			{loading && <div className="mt-4">Processing your query...</div>}
			{error && <div className="mt-4 text-red-500">{error}</div>}
			{apiStatus && (
				<div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
					<h3 className="text-sm font-medium text-yellow-800">
						API Status Warning
					</h3>
					<p className="mt-1 text-sm text-yellow-700">{apiStatus}</p>
					<p className="mt-1 text-xs text-yellow-600">
						Using fallback mechanisms. Results may be limited.
					</p>
				</div>
			)}
			{response && (
				<ResponseDisplay response={response} sql={sql} data={data} />
			)}
		</main>
	);
}
