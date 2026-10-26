import Link from "next/link";
import Image from "next/image";
import logo from "@/alerts-shelters-logo.png";

export function Nav() {
  return (
    <nav className="nav">
      <div className="container-main flex items-center flex-wrap justify-between">
        <Link href="/">
          <Image
            src={logo}
            className="w-10 h-10"
            alt="logo"
          />
        </Link>
        <div className="flex gap-5">
          <Link href="/">Головна</Link>
          <Link href="/stats">Статистика</Link>
          <Link href="/shelters">Укриття</Link>
        </div>
      </div>
    </nav>
  );
}
