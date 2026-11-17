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
      <body>
        <Navbar>{children}</Navbar>

        <Toaster position="top-right" richColors closeButton />

        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}