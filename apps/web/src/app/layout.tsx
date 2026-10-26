import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import "./globals.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Тривоги та укриття",
  description: "Активні повітряні тривоги та найближчі укриття",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <Nav />
        <main className="main py-0 sm:py-5">
          <div className="container-main">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
