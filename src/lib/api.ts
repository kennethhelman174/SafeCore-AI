/**
 * Shared API Client Helper
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: any;
}

export async function apiRequest(url: string, options: ApiRequestOptions = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Handle credentials
  const credentials = options.credentials || "include";

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials,
    body,
  });

  if (!res.ok) {
    let errorMsg = "Request failed";
    try {
      const errorData = await res.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    }

    // Handle 401 or 403 cleanly in non-bypass environments
    if ((res.status === 401 || res.status === 403) && import.meta.env.VITE_AUTH_BYPASS !== "true") {
      console.warn(`Auth session error (${res.status}): Redirecting to login`);
      localStorage.removeItem("token");
      // Prevent infinite redirect loops if we are already on /login
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?expired=true";
      }
    }

    throw new ApiError(errorMsg, res.status);
  }

  // Parse JSON safely
  const contentType = res.headers.get("content-type");
  const responseText = await res.text();
  if (!responseText) {
    return null;
  }

  if (contentType?.includes("text/html") || responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<!doctype") || responseText.trim().startsWith("<html")) {
    throw new ApiError("Server returned HTML instead of JSON. The route may have failed, thrown an error, or triggered spa fallback.", res.status);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

