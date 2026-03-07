import "../app/globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import Script from "next/script";

export const metadata = {
  title: "Invoice SaaS",
  description: "Invoice Management Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        {/* Navbar */}
        <Navbar />

        {/* Toaster */}
        <Toaster position="top-right" richColors closeButton />

        {/* Razorpay Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />

        {/* Page content */}
        {children}
      </body>
    </html>
  );
}