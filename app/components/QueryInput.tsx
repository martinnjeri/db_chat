'use client';

import { useState, FormEvent } from 'react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  disabled: boolean;
}

export default function QueryInput({ onSubmit, disabled }: QueryInputProps) {
  const [query, setQuery] = useState<string>('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <div className="flex items-center border-b border-gray-300 py-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your data..."
          disabled={disabled}
          className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
        />
        <button 
          type="submit" 
          disabled={disabled || !query.trim()}
          className="flex-shrink-0 bg-blue-500 hover:bg-blue-700 border-blue-500 hover:border-blue-700 text-sm border-4 text-white py-1 px-2 rounded disabled:opacity-50"
        >
          Ask
        </button>
      </div>
    </form>
  );
}