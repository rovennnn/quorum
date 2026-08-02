import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Quorum · Proposals",
  description:
    "Quorum — decentralized governance where token holders propose and vote on community decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-parchment text-ink antialiased font-body dark:bg-ink dark:text-[#EDE9E0]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
