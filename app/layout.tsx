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
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV = { SUPABASE_URL: ${JSON.stringify(supabaseUrl)}, SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)}, APP_URL: ${JSON.stringify(appUrl)} };`,
          }}
        />
      </head>
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
