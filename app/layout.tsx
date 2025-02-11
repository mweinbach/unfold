import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PyodidePreloader } from "@/components/pyodide-preloader";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Unfold | Document Processing",
  description: "Process and analyze your documents with AI",
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      }
    ],
    apple: '/icon.svg',
    shortcut: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <PyodidePreloader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}