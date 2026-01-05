"use server"

import { cookies } from "next/headers"

import { SettingsPageClient } from "./SettingsPageClient"
import { getOrgSettings } from "@/features/settings"

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value ?? null

  const initialOrgSettings = token ? await getOrgSettings(token ?? undefined) : {}

  return <SettingsPageClient initialOrgSettings={initialOrgSettings} />
}
