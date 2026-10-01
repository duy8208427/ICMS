import type { Metadata } from "next";
import { Be_Vietnam_Pro, Fraunces } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hệ thống thanh toán",
  description: "Tạm ứng, hoàn ứng nội bộ và thanh toán cho nhà thầu",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${fraunces.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-cream text-ink antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
