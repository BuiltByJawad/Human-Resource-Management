import type { Metadata } from "next";
import Script from "next/script";

import { ToastProvider } from "@/components/ui/ToastProvider";
import { FaviconManager } from "@/components/ui/FaviconManager";
import QueryProvider from "@/components/providers/QueryProvider";
import { PostLoginPrefetcher } from "@/components/providers/PostLoginPrefetcher";
import { StoreHydrator } from "@/components/providers/StoreHydrator";
import { BrandingProvider } from "@/components/providers/BrandingProvider";
import { getServerAuthContext } from "@/lib/auth/serverAuth";
import { AuthBootstrapProvider } from "@/components/providers/AuthBootstrapProvider";
import { getBackendBaseUrl } from "@/lib/config/env";
import DashboardShell from "@/components/ui/DashboardShell";

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
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return `${apiBase}${trimmed}`;
  return `${apiBase}/${trimmed}`;
}

async function fetchBranding(): Promise<BrandingData> {
  const apiBase = getBackendBaseUrl();

  try {
    const response = await fetch(`${apiBase}/api/settings/branding/public`, {
      cache: "no-store",
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

    const rawLogoUrl = data?.logoUrl || data?.logo || null;
    const rawFaviconUrl = data?.faviconUrl || data?.favicon || null;

    return {
      siteName: data?.siteName || "",
      shortName: "HR",
      tagline: data?.tagline || "",
      logoUrl: normalizeAssetUrl(rawLogoUrl, apiBase),
      faviconUrl: normalizeAssetUrl(rawFaviconUrl, apiBase),
      footerYear: typeof data?.footerYear === "number" ? data.footerYear : null,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Branding fetch failed", error);
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

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await fetchBranding();
  const auth = await getServerAuthContext();

  return (
    <>
      <Script id="sidebar-collapsed-init" strategy="beforeInteractive">
        {`
          (function() {
            try {
              const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
              if (collapsed) {
                document.documentElement.classList.add('sidebar-collapsed');
              }
            } catch (e) {}
          })();
        `}
      </Script>
      <QueryProvider>
        <BrandingProvider branding={branding}>
          <StoreHydrator branding={branding} />
          <FaviconManager />
          <ToastProvider>
            <AuthBootstrapProvider auth={auth}>
              <DashboardShell>{children}</DashboardShell>
              <PostLoginPrefetcher />
            </AuthBootstrapProvider>
          </ToastProvider>
        </BrandingProvider>
      </QueryProvider>
    </>
  );
}
