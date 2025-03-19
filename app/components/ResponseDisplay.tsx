"use client";

import { QueryResponse } from "../types";

interface ResponseDisplayProps {
	response: QueryResponse;
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
			<div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
				{/* SQL Query Section */}
				{sql && (
					<div className="mb-6 border-b pb-4">
						<h4 className="text-lg font-semibold mb-2">
							SQL Query
						</h4>
						<div className="bg-gray-100 p-3 rounded overflow-auto">
							<pre className="text-sm font-mono">{sql}</pre>
						</div>
					</div>
				)}

				{/* Response Section */}
				<div className="mb-6">
					<h4 className="text-lg font-semibold mb-2">Answer</h4>
					<div className="text-gray-700">
						{typeof response === "string"
							? response
							: JSON.stringify(response)}
					</div>
				</div>

				{/* Data Results Section */}
				{data && data.length > 0 && (
					<div className="mb-6">
						<h4 className="text-lg font-semibold mb-2">
							Data Results
						</h4>
						<div className="overflow-x-auto">
							<table className="min-w-full bg-white">
								<thead>
									<tr>
										{Object.keys(data[0]).map((key) => (
											<th
												key={key}
												className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
												{key}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{data.map((row, i) => (
										<tr key={i}>
											{Object.values(row).map(
												(value: any, j) => (
													<td
														key={j}
														className="py-2 px-4 border-b border-gray-200 text-sm">
														{typeof value ===
														"object"
															? JSON.stringify(
																	value
															  )
															: String(value)}
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
