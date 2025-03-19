"use client";

import { useState, FormEvent } from "react";

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
		}
	};

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
				<button
					type="submit"
					disabled={disabled || !query.trim()}
					className="flex-shrink-0 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white py-3 px-4 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
					Ask
				</button>
			</div>
		</form>
	);
}
