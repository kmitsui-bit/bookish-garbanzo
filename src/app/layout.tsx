import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "アポイント通知システム",
  description: "営業向けアポイント登録・一覧管理・LINE通知Webアプリ"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
