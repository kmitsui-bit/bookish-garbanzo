import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/appointments/new", label: "新規登録" },
  { href: "/appointments", label: "一覧" },
  { href: "/notifications", label: "通知ログ" },
  { href: "/settings", label: "設定" }
] as const;

export function AppShell({
  children,
  currentPath
}: {
  children: React.ReactNode;
  currentPath?: string;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef4ff_45%,_#f8fafc_100%)]">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Sales Ops</p>
            <h1 className="text-lg font-semibold text-slate-900">アポイント通知システム</h1>
          </div>
          <nav className="flex items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  currentPath === link.href
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
