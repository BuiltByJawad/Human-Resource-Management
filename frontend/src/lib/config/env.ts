const DEFAULT_BACKEND_URL = "http://localhost:5000";

const isAbsoluteHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);
const isLikelyNextOrigin = (value: string): boolean => /localhost:3000/i.test(value);
const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export interface ApiEnvConfig {
  backendUrl: string;
  apiBaseUrl: string;
}

let cachedConfig: ApiEnvConfig | null = null;

export const getApiEnvConfig = (): ApiEnvConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const backendUrlEnv = process.env.BACKEND_URL;

  let backendUrl: string;
  let apiBaseUrl: string;

  if (envApiUrl && isAbsoluteHttpUrl(envApiUrl) && !isLikelyNextOrigin(envApiUrl)) {
    const normalized = trimTrailingSlash(envApiUrl);
    const normalizedWithApi = /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
    apiBaseUrl = normalizedWithApi;
    const withoutApi = normalizedWithApi.replace(/\/?api\/?$/i, "");
    backendUrl = withoutApi ? withoutApi : DEFAULT_BACKEND_URL;
  } else if (backendUrlEnv && isAbsoluteHttpUrl(backendUrlEnv)) {
    const normalizedBackend = trimTrailingSlash(backendUrlEnv);
    backendUrl = normalizedBackend;
    apiBaseUrl = `${normalizedBackend}/api`;
  } else {
    backendUrl = DEFAULT_BACKEND_URL;
    apiBaseUrl = `${backendUrl}/api`;
  }

  cachedConfig = { backendUrl, apiBaseUrl };
  return cachedConfig;
};

export const getBackendBaseUrl = (): string => getApiEnvConfig().backendUrl;

export const getApiBaseUrl = (): string => getApiEnvConfig().apiBaseUrl;
