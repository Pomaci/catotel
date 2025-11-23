import "./globals.css";
import { ReactNode } from "react";
import { DM_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "@/components/providers/QueryProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "Catotel Command Center",
  description:
    "Modern dashboard for managing Catotel customers, rooms, reservations, and staff workloads.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body
        className={`${dmSans.variable} min-h-screen bg-sand-50 text-cocoa-700 antialiased`}
      >
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,214,201,0.6),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(127,218,208,0.25),transparent_55%)]" />
        <AuthProvider>
          <QueryProvider>
            <main className="relative z-10 min-h-screen">
              <div className="flex min-h-screen flex-col px-4 pb-16 pt-10 lg:px-8">{children}</div>
            </main>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
