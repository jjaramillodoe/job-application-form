import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from './components/Header';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NYC District 79 Alternative Schools - Job Application",
  description: "Apply for positions at NYC District 79 Alternative Schools programs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-600 sm:px-6 lg:px-8">
            For questions, email Javier Jaramillo at{' '}
            <a
              href="mailto:jjaramillo7@schools.nyc.gov"
              className="font-semibold text-blue-600 underline-offset-4 hover:text-blue-800 hover:underline"
            >
              jjaramillo7@schools.nyc.gov
            </a>
            .
          </div>
        </footer>
      </body>
    </html>
  );
}
