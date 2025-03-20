"use client";

import { useState, FormEvent, useEffect } from "react";
import VoiceInput from "./VoiceInput";

interface QueryInputProps {
	onSubmit: (query: string) => void;
	disabled: boolean;
}

export default function QueryInput({ onSubmit, disabled }: QueryInputProps) {
	const [query, setQuery] = useState<string>("");

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (query.trim()) {
			onSubmit(query);
			setQuery(""); // Clear input after submission
		}
	};

	const handleVoiceTranscript = (transcript: string) => {
		console.log("Received voice transcript:", transcript);
		// Set the transcript in the input field
		setQuery(transcript);
	};

	// For debugging
	useEffect(() => {
		console.log("Current query value:", query);
	}, [query]);

	return (
		<form onSubmit={handleSubmit} className="w-full max-w-lg">
			<div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card-bg)] shadow-sm">
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Ask a question about your data..."
					disabled={disabled}
					className="appearance-none bg-transparent w-full text-[var(--foreground)] py-3 px-4 leading-tight focus:outline-none"
				/>
				<div className="flex items-center">
					<VoiceInput
						onTranscript={handleVoiceTranscript}
						disabled={disabled}
					/>
					<button
						type="submit"
						disabled={disabled || !query.trim()}
						className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold py-3 px-4 rounded-r focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed">
						Search
					</button>
				</div>
			</div>
		</form>
	);
}
