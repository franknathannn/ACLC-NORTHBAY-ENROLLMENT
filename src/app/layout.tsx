import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AMA ACLC Northbay | Enrollment System",
  description: "Official Enrollment Portal for AMA ACLC Northbay",
};

// src/app/layout.tsx

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en" 
      className="light" 
      style={{ colorScheme: 'light' }} 
      // This covers the html tag
      suppressHydrationWarning
    >
      <body 
        className={inter.className} 
        // Add this to cover the body tag where extensions inject code
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false} // Ensure it stays light as per your request
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}