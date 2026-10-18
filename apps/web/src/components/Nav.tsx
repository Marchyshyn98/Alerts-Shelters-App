import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav">
      <Link href="/" className="nav__brand">
        Тривоги та укриття
      </Link>
      <Link href="/shelters">Укриття</Link>
      <Link href="/stats">Статистика</Link>
      <Link href="/sources">Джерела</Link>
    </nav>
  );
}
