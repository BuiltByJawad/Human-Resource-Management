import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { FaviconManager } from "@/components/ui/FaviconManager";
import QueryProvider from "@/components/providers/QueryProvider";
import { AuthTransitionOverlay } from "@/components/ui/AuthTransitionOverlay";
import { PostLoginPrefetcher } from "@/components/providers/PostLoginPrefetcher";
import { StoreHydrator } from "@/components/providers/StoreHydrator";
import { BrandingProvider } from "@/components/providers/BrandingProvider";
import { getServerAuthContext } from '@/lib/auth/serverAuth'
import { AuthBootstrapProvider } from '@/components/providers/AuthBootstrapProvider'
import { getBackendBaseUrl } from '@/lib/config/env'

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
const DEFAULT_FAVICON = "/favicon.ico";

interface BrandingData {
  siteName: string;
  shortName: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  footerYear?: number | null;
}

function normalizeAssetUrl(url: unknown, apiBase: string): string | null {
  if (typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('/')) return `${apiBase}${trimmed}`
  // If backend returns a relative path without leading slash, treat as relative to apiBase.
  return `${apiBase}/${trimmed}`
}

async function fetchBranding(): Promise<BrandingData> {
  const apiBase = getBackendBaseUrl()

  try {
    const response = await fetch(`${apiBase}/api/settings/branding/public`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        siteName: "",
        shortName: "HR",
        tagline: "",
        logoUrl: null,
        faviconUrl: null,
      };
    }

    const payload = await response.json();
    const data = payload?.data ?? payload;

    const rawLogoUrl = data?.logoUrl || data?.logo || null
    const rawFaviconUrl = data?.faviconUrl || data?.favicon || null

    return {
      siteName: data?.siteName || "",
      shortName: "HR",
      tagline: data?.tagline || "",
      logoUrl: normalizeAssetUrl(rawLogoUrl, apiBase),
      faviconUrl: normalizeAssetUrl(rawFaviconUrl, apiBase),
      footerYear: typeof data?.footerYear === 'number' ? data.footerYear : null,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Branding fetch failed', error)
    }
    return {
      siteName: "",
      shortName: "HR",
      tagline: "",
      logoUrl: null,
      faviconUrl: null,
      footerYear: null,
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
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await fetchBranding();
  const auth = await getServerAuthContext();
  const faviconHref = branding.faviconUrl ?? DEFAULT_FAVICON;
  const footerYear = branding.footerYear || new Date().getFullYear();
  const footerSiteName = branding.siteName || DEFAULT_TITLE;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={faviconHref} />
        <link rel="shortcut icon" href={faviconHref} />
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
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">{children}</div>
                  <footer className="border-t border-slate-200/80 bg-white/80 px-6 py-4 text-xs text-slate-500 md:ml-64 md:w-[calc(100%-16rem)] md:pl-6 [.sidebar-collapsed_&]:md:ml-20 [.sidebar-collapsed_&]:md:w-[calc(100%-5rem)]">
                    <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
                      <span className="tracking-tight text-slate-500">© {footerYear} {footerSiteName}</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <Link href="/privacy" className="text-slate-400 hover:text-slate-500 transition-colors">
                          Privacy Policy
                        </Link>
                        <span className="text-slate-300">•</span>
                        <Link href="/terms" className="text-slate-400 hover:text-slate-500 transition-colors">
                          Terms of Service
                        </Link>
                      </div>
                    </div>
                  </footer>
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
