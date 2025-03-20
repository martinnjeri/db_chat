"use client";

interface ResponseDisplayProps {
	response: string;
	sql?: string | null;
	data?: any[] | null;
	isLoading?: boolean;
	error?: string | null;
}

export default function ResponseDisplay({
	response,
	sql,
	data,
	isLoading,
	error,
}: ResponseDisplayProps) {
	return (
		<div className="w-full max-w-lg mt-8">
			<div className="bg-[var(--card-bg)] shadow-lg rounded-lg px-6 py-5 mb-4 border border-[var(--border)]">
				{/* Loading State */}
				{isLoading && (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
					</div>
				)}

				{/* Error State */}
				{error && (
					<div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
						<h4 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">
							Error
						</h4>
						<div className="text-red-700 dark:text-red-300">
							{error}
						</div>
					</div>
				)}

				{/* SQL Query Section */}
				{sql && (
					<div className="mb-6 border-b border-[var(--border)] pb-4">
						<h4 className="text-lg font-semibold mb-2 text-[var(--primary)]">
							SQL Query
						</h4>
						<div className="bg-[var(--background)] p-3 rounded-md overflow-auto border border-[var(--border)]">
							<pre className="text-sm font-mono whitespace-pre-wrap">
								{sql}
							</pre>
						</div>
					</div>
				)}

				{/* Response Section */}
				{!isLoading && !error && (
					<div className="mb-6">
						<h4 className="text-lg font-semibold mb-2 text-[var(--primary)]">
							Answer
						</h4>
						<div className="text-[var(--foreground)]">
							{response}
						</div>
					</div>
				)}

				{/* Data Table Section */}
				{data && data.length > 0 && !isLoading && !error && (
					<div>
						<h4 className="text-lg font-semibold mb-2 text-[var(--primary)]">
							Data
						</h4>
						<div className="overflow-x-auto rounded-lg border border-[var(--border)]">
							<table className="min-w-full divide-y divide-[var(--border)]">
								<thead className="bg-[var(--background)]">
									<tr>
										{Object.keys(data[0]).map((key) => (
											<th
												key={key}
												className="px-4 py-3 text-left text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">
												{key}
											</th>
										))}
									</tr>
								</thead>
								<tbody className="bg-[var(--card-bg)] divide-y divide-[var(--border)]">
									{data.map((row, i) => (
										<tr
											key={i}
											className="hover:bg-[var(--background)] transition-colors">
											{Object.values(row).map(
												(value, j) => (
													<td
														key={j}
														className="px-4 py-3 whitespace-nowrap text-sm">
														{value !== null ? (
															String(value)
														) : (
															<span className="text-[var(--secondary)]">
																NULL
															</span>
														)}
													</td>
												)
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="mt-2 text-sm text-[var(--secondary)]">
							Showing {data.length}{" "}
							{data.length === 1 ? "result" : "results"}
						</div>
					</div>
				)}

				{/* No Results State */}
				{!isLoading && !error && (!data || data.length === 0) && (
					<div className="text-center py-8">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--background)] mb-4">
							<svg
								className="w-8 h-8 text-[var(--secondary)]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M20 12H4"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-medium text-[var(--foreground)] mb-1">
							No Results Found
						</h3>
						<p className="text-[var(--secondary)] mb-4">
							{sql?.toLowerCase().includes("email") ? (
								<>
									No records found with this email address.
									Try:
									<ul className="mt-2 list-disc list-inside">
										<li>
											Checking for typos in the email
											address
										</li>
										<li>
											Using just the domain part (e.g.,
											"@hospital.com")
										</li>
										<li>Using a partial email match</li>
									</ul>
								</>
							) : (
								"Try adjusting your query or check if the table exists in the database."
							)}
						</p>
						{sql?.toLowerCase().includes("email") && (
							<div className="text-sm text-[var(--secondary)] bg-[var(--background)] p-4 rounded-md">
								<p className="font-medium mb-2">
									Available email domains in the system:
								</p>
								<code className="text-[var(--primary)]">
									@hospital.com
								</code>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
