import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Benchline — The operating system for solo trades",
    template: "%s · Benchline",
  },
  description:
    "Scripts, estimates, job checklists, review asks, and weekly money SOPs for solo home-service operators. Digital kits that install in a day.",
  openGraph: {
    title: "Benchline — The operating system for solo trades",
    description:
      "Paperwork OS for cleaners, handymen, lawn care, pressure washing, and more.",
    type: "website",
    siteName: "Benchline",
  },
  twitter: {
    card: "summary_large_image",
    title: "Benchline",
    description: "The operating system for solo trades.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CartProvider>
          <Header />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
