import { getToken } from "@/lib/auth";

function getApiBaseUrl() {
  const fromEnv = import.meta.env["VITE_API_URL"];
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, "");
  }

  // In the browser during `vite dev`, call same-origin `/api` and let Vite proxy it.
  // That avoids CORS preflight for PATCH/PUT/DELETE.
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return "";
  }

  return "http://localhost:5000";
}

const API_BASE_URL = getApiBaseUrl();

type ApiError = {
  message?: string;
  error?: string;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = typeof window !== "undefined" ? getToken() : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let data: T | ApiError | null = null;

  if (raw) {
    try {
      data = JSON.parse(raw) as T | ApiError;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object"
        ? ("message" in data && data.message) || ("error" in data && data.error) || "Request failed"
        : response.statusText || "Request failed";
    throw new ApiRequestError(String(message), response.status);
  }

  if (data === null) {
    throw new ApiRequestError("Empty response from server", response.status);
  }

  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: authHeaders(),
  });

  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method: "DELETE",
    headers: authHeaders(),
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);

  return parseResponse<T>(response);
}

/** Multipart upload — do not set Content-Type (browser sets boundary). */
export async function apiUploadFormData<T>(path: string, formData: FormData): Promise<T> {
  const headers = new Headers();
  const token = typeof window !== "undefined" ? getToken() : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  return parseResponse<T>(response);
}

export function getApiOrigin() {
  if (API_BASE_URL) return API_BASE_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:5000";
}
