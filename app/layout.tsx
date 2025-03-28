import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import "./globals.css";

export const metadata = {
  title: "Helius Indexer",
  description: "Blockchain indexing platform using Helius and Solana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-black">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
