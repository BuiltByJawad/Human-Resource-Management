import api from '@/lib/axios'
import type {
  Asset,
  AssetsFilterParams,
  UpsertAssetPayload,
  AssignAssetPayload,
  MaintenanceLog,
} from '@/features/assets/types/assets.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

const extractData = <T>(payload: unknown): T => {
  const root = (payload as { data?: unknown })?.data ?? payload
  return root as T
}

export async function fetchAssets(params: AssetsFilterParams, token?: string): Promise<Asset[]> {
  const query: Record<string, string> = {}
  if (params.status) query.status = params.status
  if (params.search) query.search = params.search

  const response = await api.get('/assets', { params: query, ...withAuthConfig(token) })
  const root = extractData<unknown>(response.data)

  if (Array.isArray(root)) return root as Asset[]
  const assets = (root as { assets?: unknown[] })?.assets
  if (Array.isArray(assets)) return assets as Asset[]
  return []
}

export async function fetchAssetById(assetId: string, token?: string): Promise<Asset | null> {
  const response = await api.get(`/assets/${assetId}`, withAuthConfig(token))
  const root = extractData<{ asset?: Asset } | Asset>(response.data)
  if (root && typeof root === 'object' && 'asset' in root) {
    return (root as { asset?: Asset }).asset ?? null
  }
  return (root as Asset) ?? null
}

export async function createAsset(payload: UpsertAssetPayload, token?: string): Promise<Asset> {
  const response = await api.post('/assets', payload, withAuthConfig(token))
  return extractData<Asset>(response.data)
}

export async function updateAsset(
  assetId: string,
  payload: Partial<UpsertAssetPayload>,
  token?: string,
): Promise<Asset> {
  const response = await api.patch(`/assets/${assetId}`, payload, withAuthConfig(token))
  return extractData<Asset>(response.data)
}

export async function assignAsset(assetId: string, payload: AssignAssetPayload, token?: string): Promise<Asset> {
  const response = await api.post(`/assets/${assetId}/assign`, payload, withAuthConfig(token))
  return extractData<Asset>(response.data)
}

export async function returnAsset(assetId: string, token?: string): Promise<Asset> {
  const response = await api.post(`/assets/${assetId}/return`, undefined, withAuthConfig(token))
  return extractData<Asset>(response.data)
}

export async function addMaintenanceLog(
  assetId: string,
  payload: Omit<MaintenanceLog, 'id' | 'assetId'>,
  token?: string,
): Promise<Asset> {
  const response = await api.post(`/assets/${assetId}/maintenance`, payload, withAuthConfig(token))
  return extractData<Asset>(response.data)
}
