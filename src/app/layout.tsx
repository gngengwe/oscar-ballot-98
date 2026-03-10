import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Oscar Ballot 2026 – 98th Academy Awards",
  description:
    "Pick your 98th Academy Award winners across 17 categories, earn guild sweep bonuses, and compete on the live leaderboard. 200 points maximum.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-cinema-950 text-cinema-100 font-body film-grain">
        <Providers>
          <Navbar />
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
