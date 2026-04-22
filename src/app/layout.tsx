import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/components/layout/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visitor Management System",
  description: "Professional visitor management for your company",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="h-full font-sans antialiased">
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
