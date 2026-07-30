import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wakamono - Community & News",
  description: "Community + news + resource-hub website",
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex flex-col min-h-screen bg-white text-ink font-sans antialiased tracking-normal">
        <Providers>
          <Header />
          
        {/* Main Content Area */}
        <main role="main" className="max-w-[1200px] mx-auto w-full px-4 md:px-8 pt-32 pb-16 flex-grow">
          


          <div className="w-full">
            {children}
          </div>
        </main>
        
        <Footer />
        </Providers>
      </body>
    </html>
  );
}
