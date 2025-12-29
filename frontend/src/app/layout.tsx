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
import { StoreHydrator } from "@/components/providers/StoreHydrator";
import { BrandingProvider } from "@/components/providers/BrandingProvider";
import { getServerAuthContext } from '@/lib/auth/serverAuth'
import { AuthBootstrapProvider } from '@/components/providers/AuthBootstrapProvider'

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

interface BrandingData {
  siteName: string;
  shortName: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

async function fetchBranding(): Promise<BrandingData> {
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
    const response = await fetch(`${apiBase}/api/org/branding/public`, {
      headers: {
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error("Failed to fetch branding");
    }

    const payload = await response.json();
    const data = payload?.data ?? payload;

    return {
      siteName: data?.siteName || "",
      shortName: data?.shortName || "HR",
      tagline: data?.tagline || "",
      logoUrl: data?.logoUrl || null,
      faviconUrl: data?.faviconUrl || null,
    };
  } catch (error) {
    console.error("Branding fetch failed:", error);
    return {
      siteName: "",
      shortName: "HR",
      tagline: "",
      logoUrl: null,
      faviconUrl: null,
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchBranding();
  const title = branding.siteName || DEFAULT_TITLE;

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
    icons: {
      icon: branding.faviconUrl || '/favicon.ico',
      apple: branding.logoUrl || '/apple-icon.png',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await fetchBranding();
  const auth = await getServerAuthContext();

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
          <BrandingProvider branding={branding}>
            <StoreHydrator branding={branding} />
            <FaviconManager />
            <ToastProvider>
              <AuthBootstrapProvider auth={auth}>
                <div className="min-h-screen">
                  {children}
                  <PostLoginPrefetcher />
                  <AuthTransitionOverlay />
                </div>
              </AuthBootstrapProvider>
            </ToastProvider>
          </BrandingProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
