import Image from 'next/image'
import type { LoginBranding } from '@/services/login/types'

interface LoginHeroProps {
  branding: LoginBranding
  monogram: string
}

export function LoginHero({ branding, monogram }: LoginHeroProps) {
  return (
    <div className="relative flex-1 flex items-center justify-center overflow-hidden px-8 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 opacity-70"></div>
      <div className="absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-10 h-48 w-48 rounded-full bg-indigo-300/30 blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-xl space-y-8">
        <div className="flex items-center space-x-3">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={`${branding.siteName} logo`}
              width={72}
              height={72}
              className="h-16 w-16 rounded-2xl bg-white/10 object-contain shadow-2xl ring-2 ring-white/30"
              priority
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-white/15 flex items-center justify-center shadow-2xl ring-2 ring-white/30">
              <span className="text-2xl font-semibold tracking-tight">{monogram}</span>
            </div>
          )}
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/70">{branding.siteName || 'HR Portal'}</p>
            <h1 className="text-4xl font-semibold leading-tight">{branding.heroTitle}</h1>
          </div>
        </div>

        <p className="text-lg text-white/80">{branding.heroSubtitle || branding.tagline}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {branding.highlights?.map((highlight) => (
            <div
              key={highlight.title}
              className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-lg hover:bg-white/15 transition-colors"
            >
              <p className="text-sm uppercase tracking-wide text-white/70">{highlight.title}</p>
              <p className="text-base font-medium">{highlight.description}</p>
            </div>
          ))}
        </div>

        {branding.companyName && (
          <div className="text-sm text-white/50">
            <p className="font-semibold text-white/70">{branding.companyName}</p>
            <p>{branding.companyAddress}</p>
          </div>
        )}
      </div>
    </div>
  )
}
