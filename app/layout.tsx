import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pavilion Admin",
  description: "Pavilion Admin Dashboard",
  icons: {
    icon: '/icon.png',
  },
};

import { OrganizationProvider } from "@/components/providers/OrganizationProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <OrganizationProvider>
            <Sidebar />
            <main className="flex-1 overflow-x-hidden min-h-screen">
              {children}
            </main>
          </OrganizationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
