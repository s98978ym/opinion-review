import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Opinion Review",
  description:
    "Slackの発言を振り返り、LLMフィードバックで表現力を磨くツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
