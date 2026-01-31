import LoginClient from './LoginClient'
import { fetchLoginBranding } from '@/services/login/api'

export default async function LoginPage() {
  const branding = await fetchLoginBranding()
  return <LoginClient branding={branding} />
}
