import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "@/components/sw-registration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "FinFlow - Loan Management System",
    description: "Micro-finance loan management system for field staff and administrators",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "FinFlow",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#3b82f6",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/icons/icon-192x192.png" />
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
            </head>
            <body className={inter.className}>
                {children}
                <Toaster position="top-center" richColors />
                <ServiceWorkerRegistration />
            </body>
        </html>
    );
}
