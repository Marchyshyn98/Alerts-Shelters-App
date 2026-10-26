"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/alerts-shelters-logo.png";

const links = [
  { href: "/", label: "Головна" },
  { href: "/stats", label: "Статистика" },
  { href: "/shelters", label: "Укриття" },
];

// при відкритті — зверху вниз, при закритті — знизу вгору
const staggerDelay = (i: number, open: boolean) =>
  (open ? i : links.length - 1 - i) * 60;

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav">
      <div className="container-main flex items-center flex-wrap justify-between">
        <Link href="/" onClick={() => setOpen(false)}>
          <Image
            src={logo}
            className="w-10 h-10"
            alt="logo"
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden gap-5 min-[577px]:flex">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </div>

        {/* Burger button (≤576px) */}
        <button
          type="button"
          className="flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-1.5 border-0 bg-transparent p-0 min-[577px]:hidden"
          aria-label={open ? "Закрити меню" : "Відкрити меню"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <div className={`h-0.5 w-6 rounded bg-(--white) transition-transform duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
          <div className={`h-0.5 w-6 rounded bg-(--white) transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
          <div className={`h-0.5 w-6 rounded bg-(--white) transition-transform duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>

        {/* Mobile menu (≤576px) */}
        <div
          id="mobile-menu"
          className={`grid w-full transition-[grid-template-rows] duration-300 ease-out min-[577px]:hidden ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-4 pt-4">
              {links.map(({ href, label }, i) => (
                <Link
                  key={href}
                  href={href}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  style={{
                    // inline, бо `.nav a { transition }` з globals.css перебиває tailwind-утиліти
                    transition: "opacity 300ms ease-out, transform 300ms ease-out, color 150ms ease-out",
                    transitionDelay: `${staggerDelay(i, open)}ms, ${staggerDelay(i, open)}ms, 0ms`,
                  }}
                  className={`${
                    open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
