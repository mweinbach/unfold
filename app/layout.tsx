import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PyodidePreloader } from "@/components/pyodide-preloader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Unfold | Document Processing",
  description: "Process and analyze your documents with AI",
  openGraph: {
    title: "Unfold | Document Processing",
    description: "Process and analyze your documents with AI",
    url: "https://yourdomain.com",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Unfold Document Processing",
      },
    ],
    siteName: "Unfold",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unfold | Document Processing",
    description: "Process and analyze your documents with AI",
    images: ["/og-image.svg"],
  },
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