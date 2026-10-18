import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Тривоги та укриття",
  description: "Активні повітряні тривоги та найближчі укриття",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <Nav />
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
