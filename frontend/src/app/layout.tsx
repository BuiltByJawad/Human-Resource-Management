import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { FaviconManager } from "@/components/ui/FaviconManager";
import QueryProvider from "@/components/providers/QueryProvider";
import { AuthTransitionOverlay } from "@/components/ui/AuthTransitionOverlay";
import { PostLoginPrefetcher } from "@/components/providers/PostLoginPrefetcher";
import { headers } from 'next/headers'
import { extractTenantSlug } from '@/lib/tenant'

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

const DEFAULT_TITLE = "HRM Platform";

async function fetchPublicSiteName(): Promise<string> {
  const apiBase =
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") : null) ||
    "http://localhost:5000";

  const headerList = await headers()
  const tenantSlug = extractTenantSlug({
    headerSlug: headerList.get('x-tenant-slug'),
    hostname: headerList.get('host'),
  })

  try {
    const response = await fetch(`${apiBase}/api/organization/branding/public`, {
      next: { revalidate: 3600 },
      headers: {
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
      },
    });

    if (!response.ok) {
      return "";
    }

    const payload = await response.json().catch(() => null);
    const data = payload?.data ?? payload;
    const siteName = typeof data?.siteName === 'string' ? data.siteName : '';
    return siteName;
  } catch {
    return "";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const siteName = (await fetchPublicSiteName()).trim();
  const title = siteName || DEFAULT_TITLE;

  return {
    title,
    description:
      "A modern Human Resource Management platform with attendance, payroll, performance, and document workflows.",
    openGraph: {
      title,
      description: "A modern Human Resource Management platform.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: "A modern Human Resource Management platform.",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        <QueryProvider>
          <FaviconManager />
          <ToastProvider>
            <div className="min-h-screen">
              {children}
              {/* Warm up core dashboard/employee queries right after login so sidebar navigation feels instant */}
              <PostLoginPrefetcher />
              <AuthTransitionOverlay />
            </div>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
