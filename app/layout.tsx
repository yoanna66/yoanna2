import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "揪時間｜把時間留給相聚", template: "%s｜揪時間" },
  description: "不用註冊，分享連結就能找到大家都有空的時間。",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <header>
          <Link href="/" className="logo">
            <span className="logo-icon">
              <CalendarDays size={23} />
            </span>
            揪時間<span className="logo-en">TIME TOGETHER</span>
          </Link>
          <nav>
            <Link href="/#how" className="nav-how">
              使用方式
            </Link>
            <Link href="/create" className="nav-create">
              建立活動 <ArrowUpRight size={16} />
            </Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <Link href="/" className="logo">
            <CalendarDays size={20} /> 揪時間
          </Link>
          <span>少一點來回，多一點相聚。</span>
          <small>以 Asia/Taipei（UTC+8）協調每一次見面</small>
        </footer>
      </body>
    </html>
  );
}
