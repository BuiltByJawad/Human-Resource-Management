import Link from "next/link";
import { getBackendBaseUrl } from '@/lib/config/env'

const sections = [
  {
    title: "Overview",
    body: [
      "This Privacy Policy explains how the HRM Platform collects, uses, and protects personal data for employees, applicants, and administrators.",
      "We process data to provide HR operations, payroll, and workforce analytics services.",
    ],
  },
  {
    title: "Data We Collect",
    body: [
      "Identity and contact details (name, email, phone, address).",
      "Employment records (role, department, compensation, attendance, leave, performance).",
      "System usage data (login activity, audit logs, device metadata).",
      "Documents uploaded for HR and payroll purposes.",
    ],
  },
  {
    title: "Security",
    body: [
      "We employ access controls, encryption at rest and in transit, and audit logging to protect data.",
      "Security incidents are handled per the incident response process and reported as required by law.",
    ],
  },
  {
    title: "Contact",
    body: [
      "For privacy inquiries, contact your organization administrator or our security contact.",
    ],
  },
];

type PublicPoliciesResponse = {
  success?: boolean
  data?: {
    privacyPolicyText?: string | null
  }
}

async function fetchPolicyText(): Promise<string | null> {
  const apiBase = getBackendBaseUrl()

  try {
    const response = await fetch(`${apiBase}/api/org/policies/public`, {
      cache: 'no-store',
    })
    if (!response.ok) return null
    const payload = (await response.json().catch(() => null)) as PublicPoliciesResponse | null
    return payload?.data?.privacyPolicyText ?? null
  } catch {
    return null
  }
}

export default async function PrivacyPolicyPage() {
  const policyText = await fetchPolicyText()
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">HRM Platform</p>
          <h1 className="text-3xl font-semibold text-slate-900">Privacy Policy</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Effective date: {new Date().getFullYear()}-01-01. This policy is intended to be adapted to your
            organization’s legal requirements.
          </p>
        </header>

        <div className="space-y-8">
          {policyText ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Policy</h2>
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
          Review our <Link href="/terms" className="font-medium text-slate-900 underline">Terms of Service</Link>.
        </footer>
      </div>
    </div>
  );
}
