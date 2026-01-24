import Link from "next/link";
import { headers } from 'next/headers'
import { extractTenantSlug } from '@/lib/tenant'
import { getBackendBaseUrl } from '@/lib/config/env'

const sections = [
  {
    title: "Agreement",
    body: [
      "These Terms of Service govern access to the HRM Platform provided by your organization.",
      "By using the platform, you agree to comply with organizational policies and applicable laws.",
    ],
  },
  {
    title: "Acceptable Use",
    body: [
      "Use the platform only for authorized HR activities.",
      "Do not attempt to access data outside of your permissions.",
      "Do not upload malicious or unlawful content.",
    ],
  },
  {
    title: "Data & Privacy",
    body: [
      "Personal data is processed according to the Privacy Policy and organizational instructions.",
      "Users are responsible for safeguarding credentials and reporting suspicious activity.",
    ],
  },
  {
    title: "Availability",
    body: [
      "Service availability targets are defined in customer agreements and the published SLA.",
      "Planned maintenance windows will be communicated in advance when possible.",
    ],
  },
  {
    title: "Security Responsibilities",
    body: [
      "Users must follow security policies, including MFA where enabled.",
      "Administrators must ensure that access permissions are kept current.",
    ],
  },
  {
    title: "Termination",
    body: [
      "Access may be suspended for policy violations or security risk mitigation.",
      "Account termination does not remove legal retention obligations for records.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions about these terms should be directed to your organization’s HR or compliance lead.",
    ],
  },
];

type PublicPoliciesResponse = {
  success?: boolean
  data?: {
    termsOfServiceText?: string | null
  }
}

async function fetchPolicyText(): Promise<string | null> {
  const apiBase = getBackendBaseUrl()
  const headerList = await headers()
  const tenantSlug = extractTenantSlug({
    headerSlug: headerList.get('x-tenant-slug'),
    hostname: headerList.get('host'),
  })

  try {
    const response = await fetch(`${apiBase}/api/org/policies/public`, {
      cache: 'no-store',
      headers: {
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
      },
    })
    if (!response.ok) return null
    const payload = (await response.json().catch(() => null)) as PublicPoliciesResponse | null
    return payload?.data?.termsOfServiceText ?? null
  } catch {
    return null
  }
}

export default async function TermsPage() {
  const policyText = await fetchPolicyText()
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">HRM Platform</p>
          <h1 className="text-3xl font-semibold text-slate-900">Terms of Service</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            These terms outline platform usage expectations. Customize for your organization’s legal counsel.
          </p>
        </header>

        <div className="space-y-8">
          {policyText ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Terms</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{policyText}</p>
            </section>
          ) : (
            sections.map((section) => (
              <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {section.body.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <footer className="text-sm text-slate-600">
          Review our <Link href="/privacy" className="font-medium text-slate-900 underline">Privacy Policy</Link>.
        </footer>
      </div>
    </div>
  );
}
