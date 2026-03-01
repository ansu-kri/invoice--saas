import "../app/globals.css";
import Navbar from "@/components/Navbar";

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
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}