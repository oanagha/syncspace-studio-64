const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

type ApiError = {
  message?: string;
  error?: string;
};

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T | ApiError;

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null
        ? ("message" in data && data.message) ||
          ("error" in data && data.error) ||
          "Request failed"
        : "Request failed";
    throw new Error(message);
  }

  return data as T;
}
