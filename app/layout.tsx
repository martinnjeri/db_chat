import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Database Query Assistant",
	description: "Query your database using natural language",
	// manifest: '/manifest.json',
	themeColor: "#3b82f6",
	viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				<link rel="icon" href="/favicon.ico" />
				{/* <link rel="apple-touch-icon" href="/icons/icon-192x192.png" /> */}
			</head>
			<body>{children}</body>
		</html>
	);
}
