"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppHeaderProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/channels", label: "チャンネル" },
    { href: "/history", label: "履歴" },
    { href: "/search", label: "検索" },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/channels"
            className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
          >
            Opinion Review
          </Link>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user.image && (
            <img
              src={user.image}
              alt=""
              className="h-7 w-7 rounded-full"
            />
          )}
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.name}
          </span>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
