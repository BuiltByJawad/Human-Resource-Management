import { LoginHero } from '@/components/features/login'
import LoginFormClient from './LoginFormClient'
import type { LoginBranding } from '@/services/login/types'

interface LoginClientProps {
  branding: LoginBranding
}

export default function LoginClient({ branding }: LoginClientProps) {
  const words = branding.siteName?.split(' ').filter(Boolean) ?? []
  const monogram = words.length > 0 ? words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') : 'HR'

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row overflow-hidden">
      {/* Left hero */}
      <LoginHero branding={branding} monogram={monogram || 'HR'} />

      {/* Right panel */}
      <LoginFormClient branding={branding} />
    </div>
  )
}
