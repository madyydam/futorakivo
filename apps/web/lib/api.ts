import { DEMO_MODE, getMockApiResponse } from "./demo-mode";

function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:4001").replace(/\/$/, "");
  return `${backendUrl}/api/v1`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public issues?: unknown,
    public code?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const apiBase = getApiBase();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // When DEMO_MODE is active, immediately serve pre-filled mock data
  if (DEMO_MODE) {
    const mock = getMockApiResponse(normalizedPath, options);
    if (mock !== undefined) {
      return Promise.resolve(mock as T);
    }
  }

  try {
    const res = await fetch(`${apiBase}${normalizedPath}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });

    if (!res.ok) {
      if (DEMO_MODE) {
        const mock = getMockApiResponse(normalizedPath, options);
        if (mock !== undefined) return mock as T;
      }
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(body.message ?? "Request failed", res.status, body.issues, body.code);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (err) {
    if (DEMO_MODE) {
      const mock = getMockApiResponse(normalizedPath, options);
      if (mock !== undefined) return mock as T;
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: "POST", body: form }),
  upload: <T>(path: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<T>(path, { method: "POST", body: formData });
  },
};
