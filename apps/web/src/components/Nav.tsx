import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav py-3 px-4">
      <div className="container-main flex gap-4 items-center flex-wrap">
        <Link href="/" className="nav__brand">
          Тривоги та укриття
        </Link>
        <Link href="/shelters">Укриття</Link>
        <Link href="/stats">Статистика</Link>
        <Link href="/sources">Джерела</Link>
      </div>
    </nav>
  );
}
