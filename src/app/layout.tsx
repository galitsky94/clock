import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "43,200 Broken Clocks",
  description:
    "A collection of 43,200 unique broken clocks, each permanently fixed at a different second within a 12-hour clock cycle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
          {children}
        </div>
        <footer className="py-6 text-center text-sm text-gray-500 border-t">
          <p>43,200 Broken Clocks - Every second of a 12-hour cycle represented</p>
        </footer>
      </body>
    </html>
  );
}
