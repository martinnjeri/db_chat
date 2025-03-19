"use client";

interface ResponseDisplayProps {
	response: string;
	sql?: string | null;
	data?: any[] | null;
}

export default function ResponseDisplay({
	response,
	sql,
	data,
}: ResponseDisplayProps) {
	return (
		<div className="w-full max-w-lg mt-8">
			<div className="bg-[var(--card-bg)] shadow-lg rounded-lg px-6 py-5 mb-4 border border-[var(--border)]">
				{/* SQL Query Section */}
				{sql && (
					<div className="mb-6 border-b border-[var(--border)] pb-4">
						<h4 className="text-lg font-semibold mb-2 text-[var(--primary)]">
							SQL Query
						</h4>
						<div className="bg-[var(--background)] p-3 rounded-md overflow-auto border border-[var(--border)]">
							<pre className="text-sm font-mono">{sql}</pre>
						</div>
					</div>
				)}

				{/* Response Section */}
				<div className="mb-6">
					<h4 className="text-lg font-semibold mb-2 text-[var(--primary)]">
						Answer
					</h4>
					<div className="text-[var(--foreground)]">{response}</div>
				</div>

				{/* Data Table Section */}
				{data && data.length > 0 && (
					<div>
						<h4 className="text-lg font-semibold mb-2 text-[var(--primary)]">
							Data
						</h4>
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-[var(--border)]">
								<thead className="bg-[var(--background)]">
									<tr>
										{Object.keys(data[0]).map((key) => (
											<th
												key={key}
												className="px-4 py-2 text-left text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">
												{key}
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-[var(--border)]">
									{data.map((row, i) => (
										<tr key={i}>
											{Object.values(row).map(
												(value, j) => (
													<td
														key={j}
														className="px-4 py-2 whitespace-nowrap text-sm">
														{value !== null
															? String(value)
															: "NULL"}
													</td>
												)
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
