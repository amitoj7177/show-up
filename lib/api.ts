const TOKEN_KEY = "show-up-token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Private browsing can block this. The app still works until the page is closed.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, options: { body?: object; token?: string | null; post?: boolean } = {}): Promise<T> {
  const isPost = options.post || options.body !== undefined;
  let response: Response;
  try {
    response = await fetch(path, {
      method: isPost ? "POST" : "GET",
      headers: {
        ...(isPost ? { "Content-Type": "application/json" } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: isPost ? JSON.stringify(options.body ?? {}) : undefined,
    });
  } catch {
    throw new ApiError(0, "We can't reach Promise Pals right now. Check your connection and try again.");
  }

  const json = await response.json().catch(() => null);
  if (!response.ok || !json) {
    throw new ApiError(response.status, json?.error?.message ?? "Something went wrong on our side. Please try again.");
  }
  return json.data as T;
}
