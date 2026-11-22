export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
export const TOKEN_KEY = "dms_token";
export const USER_KEY = "dms_user";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function requireBrowser() {
  if (typeof window === "undefined")
    throw new Error("This request is only available in the browser");
}

function unauthorized(path: string) {
  if (typeof window === "undefined" || path.startsWith("/auth/login")) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.location.assign("/login");
}

async function errorMessage(response: Response): Promise<string> {
  const fallback = response.statusText || `Request failed (${response.status})`;
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "detail" in body) {
      const detail = body.detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) {
        const first = detail[0];
        if (first && typeof first === "object" && "msg" in first && typeof first.msg === "string")
          return first.msg;
      }
    }
  } catch {
    // Keep the HTTP status message when the response is not JSON.
  }
  return fallback;
}

function authHeaders(): Record<string, string> {
  requireBrowser();
  const token = window.localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  requireBrowser();
  const hasFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const headers = new Headers(init.headers);
  if (!hasFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  for (const [key, value] of Object.entries(authHeaders())) headers.set(key, value);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    if (response.status === 401) unauthorized(path);
    throw new ApiError(await errorMessage(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function httpBlob(path: string): Promise<Blob> {
  requireBrowser();
  const response = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  if (!response.ok) {
    if (response.status === 401) unauthorized(path);
    throw new ApiError(await errorMessage(response), response.status);
  }
  return response.blob();
}

export function uploadWithProgress<T>(
  path: string,
  form: FormData,
  onProgress: (percent: number) => void,
): Promise<T> {
  requireBrowser();
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API_URL}${path}`);
    for (const [key, value] of Object.entries(authHeaders())) request.setRequestHeader(key, value);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new ApiError("Network request failed", 0));
    request.onload = () => {
      let body: unknown;
      try {
        body = request.responseText ? JSON.parse(request.responseText) : undefined;
      } catch {
        body = undefined;
      }
      if (request.status < 200 || request.status >= 300) {
        if (request.status === 401) unauthorized(path);
        let message = request.statusText || `Request failed (${request.status})`;
        if (body && typeof body === "object" && "detail" in body) {
          const detail = body.detail;
          if (typeof detail === "string") message = detail;
          else if (Array.isArray(detail)) {
            const first = detail[0];
            if (
              first &&
              typeof first === "object" &&
              "msg" in first &&
              typeof first.msg === "string"
            )
              message = first.msg;
          }
        }
        reject(new ApiError(message, request.status));
        return;
      }
      onProgress(100);
      resolve(body as T);
    };
    request.send(form);
  });
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  const blob = await httpBlob(path);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function queryString(values: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}
