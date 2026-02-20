import api from '@/lib/axios'
import type {
  Asset,
  AssetsFilterParams,
  AssignAssetPayload,
  MaintenancePayload,
  UpsertAssetPayload,
} from '@/services/assets/types'

const buildApiBase = () =>
  process.env.BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : null) ||
  'http://localhost:5000'

const fetchWithToken = async <T>(path: string, token: string | null): Promise<T | null> => {
  if (!token) return null
  try {
    const response = await fetch(`${buildApiBase()}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) return null
    const payload = (await response.json().catch(() => null)) as { data?: T } | T | null
    if (!payload) return null
    return (payload as { data?: T }).data ?? (payload as T)
  } catch {
    return null
  }
}

const withAuthConfig = (token?: string) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : undefined

const normalizeAssets = (payload: unknown): Asset[] => {
  if (Array.isArray(payload)) return payload as Asset[]
  const root = (payload as { assets?: unknown[] })?.assets
  return Array.isArray(root) ? (root as Asset[]) : []
}

const normalizeUpsertPayload = (payload: UpsertAssetPayload): UpsertAssetPayload => {
  const base: UpsertAssetPayload = {
    name: payload.name,
    serialNumber: payload.serialNumber,
    type: payload.type,
    purchaseDate: payload.purchaseDate,
  }

  if (typeof payload.purchasePrice === 'number' && Number.isFinite(payload.purchasePrice)) {
    base.purchasePrice = payload.purchasePrice
  }

  if (typeof payload.vendor === 'string' && payload.vendor.trim()) {
    base.vendor = payload.vendor.trim()
  }

  if (typeof payload.description === 'string' && payload.description.trim()) {
    base.description = payload.description.trim()
  }

  return base
}

const normalizePartialUpsertPayload = (payload: Partial<UpsertAssetPayload>): Partial<UpsertAssetPayload> => {
  const result: Partial<UpsertAssetPayload> = {}

  if (typeof payload.name === 'string') result.name = payload.name
  if (typeof payload.serialNumber === 'string') result.serialNumber = payload.serialNumber
  if (typeof payload.type === 'string') result.type = payload.type
  if (typeof payload.purchaseDate === 'string') result.purchaseDate = payload.purchaseDate

  if (payload.purchasePrice === null || payload.purchasePrice === undefined) {
    // omit
  } else if (typeof payload.purchasePrice === 'number' && Number.isFinite(payload.purchasePrice)) {
    result.purchasePrice = payload.purchasePrice
  }

  if (payload.vendor === undefined || payload.vendor === null) {
    // omit
  } else if (typeof payload.vendor === 'string' && payload.vendor.trim()) {
    result.vendor = payload.vendor.trim()
  }

  if (payload.description === undefined || payload.description === null) {
    // omit
  } else if (typeof payload.description === 'string' && payload.description.trim()) {
    result.description = payload.description.trim()
  }

  return result
}

export const fetchAssets = async (params: AssetsFilterParams, token?: string): Promise<Asset[]> => {
  const query: Record<string, string> = {}
  if (params.status) query.status = params.status
  if (params.search) query.search = params.search

  const response = await api.get('/assets', {
    params: query,
    ...withAuthConfig(token),
  })
  const payload = response.data?.data ?? response.data
  return normalizeAssets(payload)
}

export const fetchAssetById = async (assetId: string, token?: string): Promise<Asset | null> => {
  const response = await api.get(`/assets/${assetId}`, withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  const asset = (payload as { asset?: Asset })?.asset ?? payload
  return asset ? (asset as Asset) : null
}

export const createAsset = async (payload: UpsertAssetPayload, token?: string): Promise<Asset> => {
  const response = await api.post('/assets', normalizeUpsertPayload(payload), withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Asset
}

export const updateAsset = async (
  assetId: string,
  payload: Partial<UpsertAssetPayload>,
  token?: string
): Promise<Asset> => {
  const response = await api.patch(
    `/assets/${assetId}`,
    normalizePartialUpsertPayload(payload),
    withAuthConfig(token)
  )
  const data = response.data?.data ?? response.data
  return data as Asset
}

export const assignAsset = async (
  assetId: string,
  payload: AssignAssetPayload,
  token?: string
): Promise<Asset> => {
  const response = await api.post(`/assets/${assetId}/assign`, payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Asset
}

export const returnAsset = async (assetId: string, token?: string): Promise<Asset> => {
  const response = await api.post(`/assets/${assetId}/return`, undefined, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Asset
}

export const addMaintenanceLog = async (
  assetId: string,
  payload: MaintenancePayload,
  token?: string
): Promise<Asset> => {
  const response = await api.post(`/assets/${assetId}/maintenance`, payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as Asset
}

export const fetchAssetsServer = async (token: string | null, params: AssetsFilterParams): Promise<Asset[]> => {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.search) query.set('search', params.search)
  const path = query.toString() ? `/api/assets?${query}` : '/api/assets'
  const payload = await fetchWithToken<Asset[] | { assets?: Asset[] }>(path, token)
  if (!payload) return []
  return normalizeAssets(payload)
}

export const fetchAssetByIdServer = async (token: string | null, assetId: string): Promise<Asset | null> => {
  const payload = await fetchWithToken<Asset | { asset?: Asset }>(`/api/assets/${assetId}`, token)
  if (!payload) return null
  if (typeof payload === 'object' && payload !== null && 'asset' in payload) {
    return (payload as { asset?: Asset }).asset ?? null
  }
  return payload as Asset
}
