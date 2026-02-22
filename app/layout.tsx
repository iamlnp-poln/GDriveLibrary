
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/Providers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GDrive Library",
  description: "A minimalist Google Drive gallery library.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white selection:bg-slate-900 dark:selection:bg-white selection:text-white dark:selection:text-black`}>
        <Providers>
          <Navbar />
          <main className="pt-16 min-h-[calc(100vh-64px)]">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
