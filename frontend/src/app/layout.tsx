import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRM Platform",
  description:
    "A modern Human Resource Management platform with attendance, payroll, performance, and document workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
                  if (collapsed) {
                    document.documentElement.classList.add('sidebar-collapsed');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${robotoMono.variable} bg-[var(--background)] text-[var(--foreground)] antialiased`}
      >
        <ToastProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
