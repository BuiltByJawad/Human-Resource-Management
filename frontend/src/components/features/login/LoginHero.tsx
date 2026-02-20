import Image from 'next/image'

import type { LoginBranding } from '@/services/login/types'

interface LoginHeroProps {
  branding: LoginBranding
  monogram: string
}

export function LoginHero({ branding, monogram }: LoginHeroProps) {
  return (
    <div className="relative flex-1 flex items-center justify-center overflow-hidden px-8 py-12 bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_55%)]" />

      <div className="relative z-10 max-w-xl space-y-8 text-white">
        <div className="flex items-center gap-4">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={`${branding.siteName} logo`}
              width={72}
              height={72}
              className="h-16 w-16 rounded-2xl bg-white/95 object-contain shadow-md"
              priority
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-md">
              <span className="text-2xl font-semibold tracking-tight">{monogram}</span>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-blue-100/70">
              {branding.siteName || 'HR Portal'}
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white">
              {branding.heroTitle || 'Workforce intelligence, unified.'}
            </h1>
          </div>
        </div>

        <p className="text-lg text-blue-100/80">
          {branding.heroSubtitle || branding.tagline || 'Sign in to keep teams aligned and compliant.'}
        </p>

        {branding.highlights?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {branding.highlights.map((highlight) => (
              <div key={highlight.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-blue-100/70">{highlight.title}</p>
                <p className="text-base font-medium text-white">{highlight.description}</p>
              </div>
            ))}
          </div>
        ) : null}

        {branding.companyName ? (
          <div className="text-sm text-blue-100/60">
            <p className="font-semibold text-blue-100/80">{branding.companyName}</p>
            <p>{branding.companyAddress}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
