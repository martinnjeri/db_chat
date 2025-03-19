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
		<main className="flex min-h-screen flex-col items-center p-8 bg-[var(--background)]">
			<h1 className="text-3xl font-bold mb-8 text-[var(--foreground)]">
				Database Query Assistant
			</h1>
			<QueryInput onSubmit={handleQuery} disabled={loading} />

			{loading && (
				<div className="mt-6 p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-sm">
					<div className="flex items-center">
						<svg
							className="animate-spin -ml-1 mr-3 h-5 w-5 text-[var(--primary)]"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24">
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"></circle>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span>Processing your query...</span>
					</div>
				</div>
			)}

			{error && (
				<div className="mt-6 p-4 bg-[var(--danger)] bg-opacity-10 border border-[var(--danger)] text-[var(--danger)] rounded-lg">
					{error}
				</div>
			)}

			{apiStatus && (
				<div className="mt-6 p-4 bg-[var(--warning)] bg-opacity-10 border border-[var(--warning)] rounded-lg">
					<h3 className="text-sm font-medium text-[var(--dark)]">
						API Status Warning
					</h3>
					<p className="mt-1 text-sm">{apiStatus}</p>
					<p className="mt-1 text-xs text-[var(--secondary)]">
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
